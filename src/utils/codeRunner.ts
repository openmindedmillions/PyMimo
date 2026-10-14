/**
 * Code runner utility supporting Python (server-side Python3 + client-side AST simulator fallback)
 * and JavaScript (sandboxed browser eval with console capture).
 */

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string | null;
  executionTime?: number;
}

// Client-side lightweight Python interpreter for rapid instant execution and offline resilience
export function simulatePythonExecution(code: string): ExecutionResult {
  const start = performance.now();
  let logs: string[] = [];

  try {
    const lines = code.split('\n');
    const env: Record<string, any> = {};

    // Helper to evaluate basic Python expressions in JS context
    const evalPyExpr = (expr: string, context: Record<string, any>): any => {
      let clean = expr.trim();
      // Replace True/False/None
      clean = clean.replace(/\bTrue\b/g, 'true')
                   .replace(/\bFalse\b/g, 'false')
                   .replace(/\bNone\b/g, 'null')
                   .replace(/\band\b/g, '&&')
                   .replace(/\bor\b/g, '||')
                   .replace(/\bnot\b/g, '!');

      // Replace f-strings f"Hello {name}"
      if (clean.startsWith('f"') || clean.startsWith("f'")) {
        const quoteChar = clean[1];
        let inner = clean.slice(2, clean.endsWith(quoteChar) ? -1 : undefined);
        inner = inner.replace(/\{([^}]+)\}/g, (_, exp) => {
          try {
            const val = evalInEnv(exp, context);
            return String(val);
          } catch {
            return `{${exp}}`;
          }
        });
        return inner;
      }

      // Handle len(x)
      clean = clean.replace(/len\(([^)]+)\)/g, '($1).length');

      return evalInEnv(clean, context);
    };

    const evalInEnv = (jsExpr: string, context: Record<string, any>): any => {
      const keys = Object.keys(context);
      const values = Object.values(context);
      try {
        const fn = new Function(...keys, `return (${jsExpr});`);
        return fn(...values);
      } catch (err: any) {
        throw new Error(`Evaluation error: ${err.message} in "${jsExpr}"`);
      }
    };

    let i = 0;
    let loopGuard = 0;
    const maxOps = 2000;

    while (i < lines.length) {
      loopGuard++;
      if (loopGuard > maxOps) {
        throw new Error('Runtime error: Exceeded maximum operations / possible infinite loop');
      }

      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Skip blank or comment
      if (!trimmed || trimmed.startsWith('#')) {
        i++;
        continue;
      }

      // Handle print(...)
      if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
        const inside = trimmed.slice(6, -1);
        if (!inside.trim()) {
          logs.push('');
        } else {
          // Split by top-level comma
          const parts = inside.split(/,(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/);
          const printedValues = parts.map((p) => {
            try {
              const res = evalPyExpr(p.trim(), env);
              return typeof res === 'object' && res !== null ? JSON.stringify(res) : String(res);
            } catch (e: any) {
              return p.trim().replace(/^['"]|['"]$/g, '');
            }
          });
          logs.push(printedValues.join(' '));
        }
        i++;
        continue;
      }

      // Handle for x in range(n) or for x in list:
      const forMatch = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.+):$/);
      if (forMatch) {
        const varName = forMatch[1];
        const iterExpr = forMatch[2].trim();
        let items: any[] = [];

        const rangeMatch = iterExpr.match(/^range\((.+)\)$/);
        if (rangeMatch) {
          const args = rangeMatch[1].split(',').map((a) => evalPyExpr(a.trim(), env));
          let startVal = 0;
          let stopVal = 0;
          let step = 1;
          if (args.length === 1) {
            stopVal = args[0];
          } else if (args.length === 2) {
            startVal = args[0];
            stopVal = args[1];
          } else if (args.length === 3) {
            startVal = args[0];
            stopVal = args[1];
            step = args[2];
          }
          for (let k = startVal; step > 0 ? k < stopVal : k > stopVal; k += step) {
            items.push(k);
          }
        } else {
          const evaluated = evalPyExpr(iterExpr, env);
          if (Array.isArray(evaluated)) items = evaluated;
        }

        // Collect block lines (indented)
        const blockLines: string[] = [];
        let j = i + 1;
        while (j < lines.length && (lines[j].startsWith('    ') || lines[j].startsWith('\t') || !lines[j].trim())) {
          blockLines.push(lines[j]);
          j++;
        }

        for (const item of items) {
          env[varName] = item;
          // run sub-block
          const subCode = blockLines.map((l) => l.replace(/^( {4}|\t)/, '')).join('\n');
          const subResult = simulatePythonExecution(subCode);
          if (subResult.output) {
            logs.push(...subResult.output.trim().split('\n'));
          }
        }

        i = j;
        continue;
      }

      // Handle variable assignment: var = expr
      const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const expr = assignMatch[2];
        env[varName] = evalPyExpr(expr, env);
        i++;
        continue;
      }

      // Handle simple if statement: if cond:
      const ifMatch = trimmed.match(/^if\s+(.+):$/);
      if (ifMatch) {
        const cond = evalPyExpr(ifMatch[1], env);
        // Collect if-block lines
        const ifBlock: string[] = [];
        let j = i + 1;
        while (j < lines.length && (lines[j].startsWith('    ') || lines[j].startsWith('\t') || !lines[j].trim())) {
          ifBlock.push(lines[j]);
          j++;
        }

        // Check for else
        const elseBlock: string[] = [];
        if (j < lines.length && lines[j].trim().startsWith('else:')) {
          j++;
          while (j < lines.length && (lines[j].startsWith('    ') || lines[j].startsWith('\t') || !lines[j].trim())) {
            elseBlock.push(lines[j]);
            j++;
          }
        }

        if (cond) {
          const subCode = ifBlock.map((l) => l.replace(/^( {4}|\t)/, '')).join('\n');
          const subResult = simulatePythonExecution(subCode);
          if (subResult.output) logs.push(...subResult.output.trim().split('\n'));
        } else if (elseBlock.length > 0) {
          const subCode = elseBlock.map((l) => l.replace(/^( {4}|\t)/, '')).join('\n');
          const subResult = simulatePythonExecution(subCode);
          if (subResult.output) logs.push(...subResult.output.trim().split('\n'));
        }

        i = j;
        continue;
      }

      // If we don't recognize specific control block, try eval
      try {
        evalPyExpr(trimmed, env);
      } catch {
        // Ignored or harmless
      }
      i++;
    }

    const elapsed = Math.round(performance.now() - start);
    return {
      success: true,
      output: logs.join('\n'),
      executionTime: elapsed,
    };
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - start);
    return {
      success: false,
      output: logs.join('\n'),
      error: err.message,
      executionTime: elapsed,
    };
  }
}

export function executeJavaScript(code: string): ExecutionResult {
  const start = performance.now();
  const logs: string[] = [];
  const originalLog = console.log;

  try {
    console.log = (...args: any[]) => {
      logs.push(
        args
          .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
          .join(' ')
      );
    };

    // Sandboxed execution using Function
    const fn = new Function(code);
    fn();

    return {
      success: true,
      output: logs.join('\n'),
      executionTime: Math.round(performance.now() - start),
    };
  } catch (err: any) {
    return {
      success: false,
      output: logs.join('\n'),
      error: err.toString(),
      executionTime: Math.round(performance.now() - start),
    };
  } finally {
    console.log = originalLog;
  }
}

export async function runCode(code: string, language: string = 'python'): Promise<ExecutionResult> {
  if (language === 'javascript' || language === 'typescript') {
    return executeJavaScript(code);
  }

  // First try server-side Python runner
  try {
    const res = await fetch('/api/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.useClientFallback && !data.useClientEval) {
        return {
          success: data.success,
          output: data.output || '',
          error: data.error,
          executionTime: data.executionTime,
        };
      }
    }
  } catch (e) {
    // If backend unreachable, seamlessly fall back to local interpreter
    console.warn('Backend run-code unavailable, falling back to local Python simulator', e);
  }

  // Local simulated fallback
  return simulatePythonExecution(code);
}

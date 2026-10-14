import React, { useState } from 'react';
import { Play, Sparkles, RefreshCw, RotateCcw, Copy, Check, Terminal, BookOpen } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { runCode, ExecutionResult } from '../utils/codeRunner';
import { AITutorDrawer } from './AITutorDrawer';
import { playSound } from '../utils/audio';

const PLAYGROUND_PRESETS = [
  {
    name: 'Python: Fibonacci Sequence',
    lang: 'python',
    code: `# Fibonacci generator in Python\ndef fibonacci(n):\n    sequence = [0, 1]\n    while len(sequence) < n:\n        sequence.append(sequence[-1] + sequence[-2])\n    return sequence\n\nterms = 8\nprint(f"First {terms} Fibonacci numbers:")\nprint(fibonacci(terms))`,
  },
  {
    name: 'Python: Random Password Generator',
    lang: 'python',
    code: `# Simple Password Generator\nimport random\n\nchars = "abcdefghijklmnopqrstuvwxyz1234567890!@#$%"\nlength = 12\npassword = "".join(random.choice(chars) for _ in range(length))\n\nprint("Generated Secure Password:")\nprint(password)`,
  },
  {
    name: 'JavaScript: Data Pipeline',
    lang: 'javascript',
    code: `// Modern JS Array Operations\nconst numbers = [12, 5, 8, 130, 44, 9, 21];\n\nconst processed = numbers\n  .filter(n => n > 10)\n  .map(n => n * 2)\n  .sort((a, b) => b - a);\n\nconsole.log("Filtered, doubled & sorted:");\nconsole.log(processed);`,
  },
];

export const CodePlayground: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript'>('python');
  const [code, setCode] = useState(PLAYGROUND_PRESETS[0].code);
  const [output, setOutput] = useState('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res: ExecutionResult = await runCode(code, selectedLanguage);
      setOutput(res.output || res.error || 'Execution finished with no output.');
      setExecutionTime(res.executionTime || null);
      playSound('click');
    } catch (e: any) {
      setOutput(e?.message || 'Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSelectPreset = (preset: typeof PLAYGROUND_PRESETS[0]) => {
    setSelectedLanguage(preset.lang as any);
    setCode(preset.code);
    setOutput('');
    setExecutionTime(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-6 select-none">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              <span>Free-form Sandbox</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Coding Playground</h1>
          <p className="text-xs text-slate-400 mt-1">
            Experiment freely with algorithms, test new libraries, and invite Prof. Nova to inspect your logic.
          </p>
        </div>

        {/* Preset Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          {PLAYGROUND_PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => handleSelectPreset(preset)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium border border-slate-700 transition cursor-pointer"
            >
              {preset.name.split(':')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Code Editor Column */}
        <div className="lg:col-span-7 space-y-3">
          <CodeEditor
            code={code}
            onChange={setCode}
            language={selectedLanguage}
            minHeight="340px"
            onAskAI={() => setAiDrawerOpen(true)}
            onReset={() => setCode('')}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (ES6)</option>
              </select>

              <button
                onClick={() => setAiDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ask Prof. Nova</span>
              </button>
            </div>

            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
        </div>

        {/* Output Console Column */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Interactive Output</span>
            </div>
            {executionTime !== null && (
              <span className="text-[11px] font-mono text-slate-500">{executionTime}ms</span>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 min-h-[300px] font-mono text-xs text-emerald-300 whitespace-pre-wrap overflow-y-auto">
            {output ? output : <span className="text-slate-600 italic">Click "Run Code" to view execution results.</span>}
          </div>

          <button
            onClick={() => setOutput('')}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition cursor-pointer"
          >
            Clear Console
          </button>
        </div>
      </div>

      {/* AI Tutor Drawer */}
      <AITutorDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        currentCode={code}
        language={selectedLanguage}
        exerciseGoal="Playground exploration"
        userOutput={output}
        onApplyCode={(fixed) => setCode(fixed)}
      />
    </div>
  );
};

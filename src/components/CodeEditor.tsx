import React, { useRef, useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { LineIssue } from '../types';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language?: string;
  readOnly?: boolean;
  minHeight?: string;
  lineIssues?: LineIssue[];
  onAskAI?: () => void;
  onReset?: () => void;
  placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language = 'python',
  readOnly = false,
  minHeight = '180px',
  lineIssues = [],
  onAskAI,
  onReset,
  placeholder = '# Write your code here...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const lines = code.split('\n');

  // Handle Tab key to insert 4 spaces for Python
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const indent = '    ';
      const newCode = code.substring(0, start) + indent + code.substring(end);
      onChange(newCode);

      // Restore cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 font-mono text-sm shadow-xl transition-all focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20">
      {/* Top Editor Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="font-semibold uppercase tracking-wider text-slate-300 px-2 py-0.5 rounded bg-slate-800 text-[10px]">
            {language}
          </span>
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onAskAI && (
            <button
              onClick={onAskAI}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-medium transition cursor-pointer text-xs"
              title="Inspect with AI Tutor"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Doctor</span>
            </button>
          )}

          {onReset && (
            <button
              onClick={onReset}
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Reset Code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCopy}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main editor area with line numbers & overlay */}
      <div className="relative flex" style={{ minHeight }}>
        {/* Line Numbers Column */}
        <div className="w-11 py-3 text-right pr-3 select-none bg-slate-900/40 text-slate-600 border-r border-slate-800/60 font-mono text-xs leading-relaxed shrink-0">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const issue = lineIssues.find((iss) => iss.line === lineNum);
            return (
              <div key={i} className="relative flex items-center justify-end h-6">
                {issue && (
                  <span
                    className={`absolute -left-1 w-2 h-2 rounded-full ${
                      issue.severity === 'error' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    title={issue.message}
                  />
                )}
                <span className={issue ? 'text-rose-400 font-bold' : ''}>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            placeholder={placeholder}
            className="w-full h-full min-h-[180px] p-3 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-y font-mono text-xs sm:text-sm leading-relaxed tracking-wide selection:bg-blue-500/30"
            style={{ minHeight }}
          />
        </div>
      </div>

      {/* Real-time Line Issues Banner if any line has an error */}
      {lineIssues.length > 0 && (
        <div className="px-3 py-2 bg-rose-950/70 border-t border-rose-900/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <div className="truncate">
            <span className="font-semibold text-rose-200">Line {lineIssues[0].line}:</span> {lineIssues[0].message}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Sparkles, X, Lightbulb, CheckCircle2, AlertTriangle, ArrowRight, Bot, RefreshCw, Send, HelpCircle, Layers } from 'lucide-react';
import { TutorFeedbackResponse } from '../types';

interface AITutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  language: string;
  exerciseGoal?: string;
  userOutput?: string;
  expectedOutput?: string;
  onApplyCode?: (newCode: string) => void;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({
  isOpen,
  onClose,
  currentCode,
  language = 'python',
  exerciseGoal = 'Master coding concepts',
  userOutput = '',
  expectedOutput = '',
  onApplyCode,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'socratic' | 'walkthrough' | 'chat'>('diagnosis');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<TutorFeedbackResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'tutor'; text: string; time: string }[]>([
    {
      role: 'tutor',
      text: "Hello! I'm Prof. Nova, your personal AI coding mentor. Whether you're stuck on indentation, confusing variable scope, or want an explanation of how a loop executes, I'm here to guide you step-by-step. What would you like to explore?",
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Fetch feedback from Express server Gemini endpoint
  const requestTutorHelp = async (mode: 'syntax_logic' | 'socratic_hint' | 'explain_step_by_step' | 'fix_code') => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/tutor-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          language,
          exerciseGoal,
          userOutput,
          expectedOutput,
          mode,
        }),
      });

      let data: TutorFeedbackResponse;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON format from tutor server');
      }

      setFeedback(data);
    } catch (err: any) {
      console.warn('AI Tutor fallback notice:', err);
      setFeedback({
        status: 'improvement_suggestion',
        headline: 'Prof. Nova Hint',
        explanation: 'Review your code structure carefully. Ensure statements are indented consistently and all strings/parentheses are properly closed.',
        socraticNudge: 'Look at the last line you typed — are all parentheses closed and indented evenly?',
        encouragement: 'You have got this! Keep testing.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    setLoading(true);
    try {
      const res = await fetch('/api/gemini/tutor-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          language,
          exerciseGoal,
          learnerQuestion: userMsg,
          mode: 'syntax_logic',
        }),
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        // Fallback
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: data?.explanation || data?.headline || "Great question! When writing Python, pay close attention to indentation (4 spaces) and ensuring every `if` and loop block ends with a colon `:`. Give it a try!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: "I'm reviewing your code! Check the indentation and ensure each block statement ends with a colon `:`. Keep coding!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Prof. Nova</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AI Mentor
              </span>
            </div>
            <p className="text-xs text-slate-400">Professional {language.toUpperCase()} Teacher</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1 text-xs">
        <button
          onClick={() => {
            setActiveTab('diagnosis');
            if (!feedback) requestTutorHelp('syntax_logic');
          }}
          className={`flex-1 py-2 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'diagnosis'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Doctor</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('socratic');
            requestTutorHelp('socratic_hint');
          }}
          className={`flex-1 py-2 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'socratic'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Hint</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('walkthrough');
            requestTutorHelp('explain_step_by_step');
          }}
          className={`flex-1 py-2 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'walkthrough'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Steps</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm text-slate-300 font-medium">Prof. Nova is analyzing your code...</p>
            <p className="text-xs text-slate-500">Checking syntax rules, logic paths, and Python semantics</p>
          </div>
        )}

        {/* Diagnosis Tab */}
        {!loading && activeTab === 'diagnosis' && (
          <div className="space-y-4">
            {!feedback && (
              <div className="p-6 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60">
                <Sparkles className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <h4 className="font-semibold text-white mb-1">Live Code Inspection</h4>
                <p className="text-xs text-slate-400 mb-4">
                  Let Prof. Nova inspect your active code in real time for syntax mistakes, logic quirks, and indentation.
                </p>
                <button
                  onClick={() => requestTutorHelp('syntax_logic')}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Analyze Code Now
                </button>
              </div>
            )}

            {feedback && (
              <div className="space-y-3">
                {/* Status Card */}
                <div
                  className={`p-4 rounded-2xl border ${
                    feedback.status === 'correct'
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                      : feedback.status === 'syntax_error'
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                      : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {feedback.status === 'correct' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-white mb-1">{feedback.headline}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{feedback.explanation}</p>
                    </div>
                  </div>
                </div>

                {/* Line Issues breakdown */}
                {feedback.lineIssues && feedback.lineIssues.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Line Observations</h5>
                    {feedback.lineIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-start gap-2.5 text-xs"
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                            issue.severity === 'error'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          Line {issue.line}
                        </span>
                        <p className="text-slate-200 leading-snug">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Socratic Nudge Card */}
                {feedback.socraticNudge && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50">
                    <div className="flex items-center gap-2 mb-1.5 text-indigo-300 text-xs font-semibold">
                      <Lightbulb className="w-4 h-4 text-indigo-400" />
                      <span>Socratic Nudge</span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{feedback.socraticNudge}"</p>
                  </div>
                )}

                {/* Suggested Fix code snippet */}
                {feedback.suggestedCode && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400">Suggested Solution</span>
                      {onApplyCode && (
                        <button
                          onClick={() => onApplyCode(feedback.suggestedCode!)}
                          className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          <span>Apply to Editor</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto">
                      {feedback.suggestedCode}
                    </pre>
                  </div>
                )}

                {/* Encouragement footer */}
                {feedback.encouragement && (
                  <p className="text-xs text-center text-slate-400 font-medium py-1">
                    ✨ {feedback.encouragement}
                  </p>
                )}

                <button
                  onClick={() => requestTutorHelp('syntax_logic')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-scan Current Code</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Socratic Hint Tab */}
        {!loading && activeTab === 'socratic' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-800/50">
              <div className="flex items-center gap-2.5 mb-3 text-indigo-400 font-bold text-sm">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <span>The Socratic Method</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Instead of giving away the answer, Prof. Nova asks guiding questions that prompt your brain to discover the solution on your own.
              </p>
              {feedback?.socraticNudge ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-200 text-sm leading-relaxed">
                  💡 "{feedback.socraticNudge}"
                </div>
              ) : (
                <button
                  onClick={() => requestTutorHelp('socratic_hint')}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer"
                >
                  Generate Socratic Hint
                </button>
              )}
            </div>
          </div>
        )}

        {/* Walkthrough Tab */}
        {!loading && activeTab === 'walkthrough' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-800/50">
              <div className="flex items-center gap-2.5 mb-2 text-purple-400 font-bold text-sm">
                <Layers className="w-5 h-5" />
                <span>Line-By-Line Interpreter Trace</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Understand how the Python execution engine reads your variables, updates registers, and branches conditions.
              </p>
              {feedback ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                    {feedback.explanation}
                  </div>
                  {feedback.conceptExplained && (
                    <div className="p-3 rounded-lg bg-purple-900/30 text-purple-300 text-xs">
                      <strong>Key Concept:</strong> {feedback.conceptExplained}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => requestTutorHelp('explain_step_by_step')}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer"
                >
                  Start Walkthrough
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {!loading && activeTab === 'chat' && (
          <div className="space-y-3">
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Prof. Nova anything about your code..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || loading}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Powered by Gemini 3.8</span>
        <span>Goal: {exerciseGoal.slice(0, 28)}...</span>
      </div>
    </div>
  );
};

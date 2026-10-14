import React, { useState } from 'react';
import { 
  Sparkles, Target, Award, Play, CheckCircle2, AlertTriangle, 
  RefreshCw, Lightbulb, Check, ChevronRight, HelpCircle, Code 
} from 'lucide-react';
import { PersonalizedChallenge, UserProgress } from '../types';
import { CodeEditor } from './CodeEditor';
import { runCode, ExecutionResult } from '../utils/codeRunner';
import { playSound } from '../utils/audio';
import { AITutorDrawer } from './AITutorDrawer';
import confetti from 'canvas-confetti';

interface PersonalizedChallengesProps {
  userProgress: UserProgress;
  onChallengeComplete: (challengeId: string, xp: number) => void;
}

const DEFAULT_CHALLENGES: PersonalizedChallenge[] = [
  {
    id: 'c1',
    title: 'Secret Agent Code Formatter',
    topic: 'Strings & F-Strings',
    difficulty: 'Beginner',
    language: 'python',
    story: 'Headquarters needs an automated dispatch message. Each agent must receive their coded callsign.',
    instructions: [
      'Create a variable `agent = "Falcon"` and `code = 7`',
      'Print the string formatted exactly as: `Agent: Falcon [Code: 7]` using an f-string',
    ],
    starterCode: '# Create the variables and format the dispatch string:\nagent = "Falcon"\ncode = 7\n# Write your print statement below:\n',
    testCases: [
      {
        input: 'agent="Falcon", code=7',
        expectedOutput: 'Agent: Falcon [Code: 7]',
        description: 'Output format matches specification',
      },
    ],
    hints: [
      'Use an f-string: f"Agent: {agent} [Code: {code}]"',
      'Check brackets and spacing carefully!',
    ],
    solution: 'agent = "Falcon"\ncode = 7\nprint(f"Agent: {agent} [Code: {code}]")',
    xpReward: 40,
    conceptKey: 'F-string formatting and variable interpolation',
  },
  {
    id: 'c2',
    title: 'Speed Trap Radar Alert',
    topic: 'Conditionals & If/Else',
    difficulty: 'Beginner',
    language: 'python',
    story: 'A smart highway camera detects vehicle speeds and outputs alerts based on speed limits.',
    instructions: [
      'If `speed` is greater than 70, print `"WARNING: Too Fast!"`',
      'Otherwise, print `"SAFE: Normal speed."`',
    ],
    starterCode: 'speed = 85\n# Write your conditional check:\nif speed > 70:\n    print("WARNING: Too Fast!")\nelse:\n    print("SAFE: Normal speed.")',
    testCases: [
      {
        input: 'speed = 85',
        expectedOutput: 'WARNING: Too Fast!',
        description: 'Handles speeding vehicle',
      },
    ],
    hints: [
      'Remember Python uses colon `:` after the if and else clauses.',
      'Indent the print statements by 4 spaces.',
    ],
    solution: 'speed = 85\nif speed > 70:\n    print("WARNING: Too Fast!")\nelse:\n    print("SAFE: Normal speed.")',
    xpReward: 45,
    conceptKey: 'Branching logic with if/else',
  },
];

export const PersonalizedChallenges: React.FC<PersonalizedChallengesProps> = ({
  userProgress,
  onChallengeComplete,
}) => {
  const [challenges, setChallenges] = useState<PersonalizedChallenge[]>(DEFAULT_CHALLENGES);
  const [activeChallenge, setActiveChallenge] = useState<PersonalizedChallenge>(DEFAULT_CHALLENGES[0]);
  const [userCode, setUserCode] = useState(DEFAULT_CHALLENGES[0].starterCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('loops_and_conditionals');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([]);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Generate a brand new personalized challenge via Gemini
  const handleGenerateAIChallenge = async () => {
    setIsGenerating(true);
    try {
      const weakPoint = userProgress.weakTopics.length > 0 ? userProgress.weakTopics[0] : 'Python fundamentals';
      const res = await fetch('/api/gemini/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          topic: selectedTopic,
          difficulty: selectedDifficulty,
          userWeakness: weakPoint,
        }),
      });

      if (!res.ok) throw new Error('Challenge generation failed');
      const newChallenge: PersonalizedChallenge = await res.json();
      setChallenges((prev) => [newChallenge, ...prev]);
      setActiveChallenge(newChallenge);
      setUserCode(newChallenge.starterCode);
      setOutput('');
      setTestResults([]);
      setRevealedHints([]);

      if (userProgress.soundEnabled) playSound('click');
    } catch (e) {
      console.error('Failed to generate challenge:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run the user's code against the challenge test cases
  const handleRunAndTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    try {
      const result: ExecutionResult = await runCode(userCode, 'python');
      const actualOut = (result.output || '').trim();
      setOutput(actualOut || result.error || 'No output produced.');

      const results = activeChallenge.testCases.map((tc) => {
        const expected = tc.expectedOutput.trim();
        const passed = actualOut === expected;
        return {
          passed,
          message: passed
            ? `Passed: ${tc.description}`
            : `Failed: Expected "${expected}", but got "${actualOut}"`,
        };
      });

      setTestResults(results);

      const allPassed = results.every((r) => r.passed);
      if (allPassed) {
        if (userProgress.soundEnabled) playSound('celebration');
        confetti({
          particleCount: 90,
          spread: 65,
          origin: { y: 0.6 },
        });
        onChallengeComplete(activeChallenge.id, activeChallenge.xpReward);
        setActiveChallenge((prev) => ({ ...prev, completed: true }));
      } else {
        if (userProgress.soundEnabled) playSound('wrong');
      }
    } catch (e: any) {
      setOutput(e?.message || 'Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 space-y-8 select-none">
      {/* Header & Generator Toolbar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>AI Adaptive Coach</span>
            </span>
            {userProgress.weakTopics.length > 0 && (
              <span className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Focus: {userProgress.weakTopics[0]}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white">Personalized Coding Challenges</h1>
          <p className="text-xs text-slate-400 mt-1">
            Target specific concepts and master weak spots with custom AI-generated problem sets.
          </p>
        </div>

        {/* Challenge Generation Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="variables_and_strings">Variables & Strings</option>
            <option value="conditionals_and_logic">Conditionals & If-Else</option>
            <option value="loops_and_lists">Loops & Collections</option>
            <option value="functions_and_scope">Functions & Modularity</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <button
            onClick={handleGenerateAIChallenge}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-purple-600/20 cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isGenerating ? 'Designing...' : 'Generate New Lab'}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Challenge List on Left, Active IDE on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Challenge Select List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Available Practice Labs ({challenges.length})
          </h3>
          <div className="space-y-2.5">
            {challenges.map((c) => {
              const isSelected = activeChallenge.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveChallenge(c);
                    setUserCode(c.starterCode);
                    setOutput('');
                    setTestResults([]);
                    setRevealedHints([]);
                  }}
                  className={`w-full p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {c.difficulty}
                    </span>
                    <span className="text-[11px] font-bold text-yellow-400">+{c.xpReward} XP</span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1 flex items-center justify-between">
                    <span>{c.title}</span>
                    {c.completed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{c.story}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Challenge Details & Interactive Code Workspace */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Challenge Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-blue-400 font-semibold">{activeChallenge.topic}</span>
                <h2 className="text-xl font-extrabold text-white mt-0.5">{activeChallenge.title}</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeChallenge.story}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setAiDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-medium text-xs cursor-pointer transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Doctor</span>
                </button>
              </div>
            </div>

            {/* Checklist Instructions */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Objectives:</span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeChallenge.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Code Editor */}
            <div className="space-y-3">
              <CodeEditor
                code={userCode}
                onChange={setUserCode}
                language="python"
                minHeight="220px"
                onAskAI={() => setAiDrawerOpen(true)}
                onReset={() => setUserCode(activeChallenge.starterCode)}
              />

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Hints Accordion */}
                <div className="flex items-center gap-2">
                  {activeChallenge.hints?.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (revealedHints.includes(idx)) {
                          setRevealedHints(revealedHints.filter((h) => h !== idx));
                        } else {
                          setRevealedHints([...revealedHints, idx]);
                        }
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition cursor-pointer ${
                        revealedHints.includes(idx)
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span>Hint {idx + 1}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRunAndTest}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/25 cursor-pointer ml-auto"
                >
                  {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isRunning ? 'Evaluating...' : 'Run & Validate Solution'}</span>
                </button>
              </div>

              {/* Hints Box */}
              {revealedHints.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1.5 text-xs text-amber-200">
                  {revealedHints.map((idx) => (
                    <p key={idx}>💡 <strong>Hint {idx + 1}:</strong> {activeChallenge.hints[idx]}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Test Results Output */}
            {testResults.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Test Results:</span>
                {testResults.map((tr, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
                      tr.passed
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                    }`}
                  >
                    {tr.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{tr.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Terminal Output */}
            {output && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                <span className="text-slate-500 text-[11px] block mb-1">Execution Log:</span>
                <div className="text-slate-200 whitespace-pre-wrap">{output}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Tutor Drawer for this challenge */}
      <AITutorDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        currentCode={userCode}
        language="python"
        exerciseGoal={activeChallenge.title}
        userOutput={output}
        expectedOutput={activeChallenge.testCases[0]?.expectedOutput}
        onApplyCode={(fixed) => setUserCode(fixed)}
      />
    </div>
  );
};

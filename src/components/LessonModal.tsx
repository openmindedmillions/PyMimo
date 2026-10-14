import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, Heart, Sparkles, CheckCircle2, AlertCircle, ArrowRight, 
  Play, RefreshCw, Trophy, Flame, HelpCircle 
} from 'lucide-react';
import { Lesson, LessonStep, UserProgress } from '../types';
import { CodeEditor } from './CodeEditor';
import { runCode, ExecutionResult } from '../utils/codeRunner';
import { playSound } from '../utils/audio';
import { AITutorDrawer } from './AITutorDrawer';

interface LessonModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  userProgress: UserProgress;
  onLessonComplete: (lessonId: string, earnedXp: number) => void;
  onHeartLoss: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  lesson,
  isOpen,
  onClose,
  userProgress,
  onLessonComplete,
  onHeartLoss,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // State for step types
  // 1. Fill in blank
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  // 2. Code typing
  const [editorCode, setEditorCode] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  // 3. Quiz
  const [selectedQuizOptionId, setSelectedQuizOptionId] = useState<string | null>(null);
  // 4. Bug hunt
  const [buggyCodeInput, setBuggyCodeInput] = useState('');
  const [showHint, setShowHint] = useState(false);

  const step: LessonStep = lesson.steps[currentStepIndex] || lesson.steps[0];
  const totalSteps = lesson.steps.length;
  const progressPercent = ((currentStepIndex) / totalSteps) * 100;

  // Initialize step state when index changes
  useEffect(() => {
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setSelectedTokens([]);
    setSelectedQuizOptionId(null);
    setShowHint(false);
    setCodeOutput('');
    setRunError(null);

    if (step.type === 'code_typing') {
      setEditorCode(step.starterCode || '');
    } else if (step.type === 'bug_hunt') {
      setBuggyCodeInput(step.buggyCode || '');
    }
  }, [currentStepIndex, lesson]);

  if (!isOpen) return null;

  // Handle running code in the interactive mini-IDE
  const handleRunCode = async (codeToRun: string) => {
    setIsRunning(true);
    setRunError(null);
    try {
      const result: ExecutionResult = await runCode(codeToRun, 'python');
      setCodeOutput(result.output);
      if (result.error) {
        setRunError(result.error);
      }
      return result;
    } catch (err: any) {
      setRunError(err?.message || 'Execution error');
      return null;
    } finally {
      setIsRunning(false);
    }
  };

  // Evaluate answer when clicking "Check"
  const handleCheckAnswer = async () => {
    if (step.type === 'concept') {
      // Concept cards are always successful
      setIsCorrect(true);
      setIsAnswerChecked(true);
      if (userProgress.soundEnabled) playSound('correct');
      return;
    }

    let correct = false;

    if (step.type === 'fill_blank') {
      const expected = step.blankCorrectAnswers || [];
      correct = selectedTokens.length === expected.length &&
        selectedTokens.every((token, idx) => token.trim() === expected[idx].trim());
    } else if (step.type === 'quiz') {
      const chosen = step.quizOptions?.find((o) => o.id === selectedQuizOptionId);
      correct = !!chosen?.isCorrect;
    } else if (step.type === 'code_typing') {
      const result = await handleRunCode(editorCode);
      const expected = (step.expectedOutput || '').trim();
      const actual = (result?.output || '').trim();
      correct = actual === expected || (expected.length === 0 && result?.success === true);
    } else if (step.type === 'bug_hunt') {
      const result = await handleRunCode(buggyCodeInput);
      const expectedSol = (step.solutionCode || '').trim();
      const currentClean = buggyCodeInput.trim();
      correct = (result?.success === true && !result.error) && (
        currentClean === expectedSol || result.output.length > 0
      );
    }

    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      if (userProgress.soundEnabled) playSound('correct');
    } else {
      if (userProgress.soundEnabled) {
        playSound('wrong');
        playSound('heartLoss');
      }
      onHeartLoss();
    }
  };

  // Advance to next step or finish lesson
  const handleContinue = () => {
    if (currentStepIndex + 1 < totalSteps) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Finished all steps in lesson!
      setIsLessonFinished(true);
      if (userProgress.soundEnabled) playSound('celebration');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      onLessonComplete(lesson.id, lesson.xp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100 select-none">
      {/* Top Header Bar */}
      <div className="h-16 px-4 sm:px-8 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4 shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Exit Lesson"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xl mx-auto flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden relative border border-slate-700/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 shrink-0">
            {currentStepIndex + 1}/{totalSteps}
          </span>
        </div>

        {/* Hearts and AI Tutor Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
            <span>{userProgress.hearts}</span>
          </div>

          <button
            onClick={() => setAiDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Ask Prof. Nova</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col justify-center items-center">
        {!isLessonFinished ? (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Step Title & Instructions */}
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                {step.type.replace('_', ' ')}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{step.title}</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{step.instructions}</p>
            </div>

            {/* Step Type 1: CONCEPT */}
            {step.type === 'concept' && (
              <div className="space-y-4">
                {step.codeSnippet && (
                  <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-xl">
                    <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 font-mono flex items-center justify-between">
                      <span>Python Preview</span>
                      <button
                        onClick={() => handleRunCode(step.codeSnippet!)}
                        disabled={isRunning}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition text-xs font-semibold cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isRunning ? 'Running...' : 'Run Preview'}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-emerald-300 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
                      {step.codeSnippet}
                    </pre>
                  </div>
                )}

                {codeOutput && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200">
                    <span className="text-slate-500 text-[11px] block mb-1">Console Output:</span>
                    {codeOutput}
                  </div>
                )}

                {step.explanation && (
                  <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-900/40 text-blue-200 text-xs sm:text-sm leading-relaxed">
                    💡 <strong>Pro-Tip:</strong> {step.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Step Type 2: FILL IN THE BLANK */}
            {step.type === 'fill_blank' && (
              <div className="space-y-6">
                {/* Code Template Box with Slot */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl font-mono text-base sm:text-lg text-slate-100 flex flex-wrap items-center gap-2">
                  {step.codeTemplate?.split('__BLANK__').map((part, idx, arr) => (
                    <React.Fragment key={idx}>
                      <span className="text-slate-200">{part}</span>
                      {idx < arr.length - 1 && (
                        <div
                          className={`min-w-[90px] h-10 px-3 rounded-xl border-2 flex items-center justify-center font-bold text-sm transition-all ${
                            selectedTokens[idx]
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-inner'
                              : 'border-dashed border-slate-600 bg-slate-950/60 text-slate-500'
                          }`}
                        >
                          {selectedTokens[idx] || '___'}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Tokens Options to Tap/Click */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Tap a token to fill the blank:</span>
                  <div className="flex flex-wrap gap-2.5">
                    {step.blankOptions?.map((opt, i) => {
                      const isSelected = selectedTokens.includes(opt);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTokens(selectedTokens.filter((t) => t !== opt));
                            } else {
                              setSelectedTokens([...selectedTokens, opt]);
                            }
                            if (userProgress.soundEnabled) playSound('click');
                          }}
                          className={`px-4 py-2.5 rounded-xl font-mono font-semibold text-sm transition-all cursor-pointer shadow-md ${
                            isSelected
                              ? 'bg-blue-600 text-white scale-95 ring-2 ring-blue-400'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step Type 3: CODE TYPING (MINI-IDE) */}
            {step.type === 'code_typing' && (
              <div className="space-y-4">
                <CodeEditor
                  code={editorCode}
                  onChange={setEditorCode}
                  language="python"
                  minHeight="170px"
                  onAskAI={() => setAiDrawerOpen(true)}
                  onReset={() => setEditorCode(step.starterCode || '')}
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleRunCode(editorCode)}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isRunning ? 'Executing Python...' : 'Run & Test Code'}</span>
                  </button>

                  {step.expectedOutput && (
                    <span className="text-xs text-slate-400">
                      Expected Output: <code className="text-emerald-400 font-mono">{step.expectedOutput}</code>
                    </span>
                  )}
                </div>

                {/* Console Output */}
                {(codeOutput || runError) && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                    <span className="text-slate-500 text-[11px] block mb-1">Terminal Output:</span>
                    {codeOutput && <div className="text-slate-200 whitespace-pre-wrap">{codeOutput}</div>}
                    {runError && <div className="text-rose-400 mt-1 whitespace-pre-wrap">{runError}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Step Type 4: PREDICTION QUIZ */}
            {step.type === 'quiz' && (
              <div className="space-y-4">
                {step.codeSnippet && (
                  <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-blue-300 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
                    {step.codeSnippet}
                  </pre>
                )}

                <div className="space-y-2.5">
                  {step.quizOptions?.map((opt) => {
                    const isSelected = selectedQuizOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSelectedQuizOptionId(opt.id);
                          if (userProgress.soundEnabled) playSound('click');
                        }}
                        className={`w-full p-4 rounded-2xl text-left border text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/30'
                            : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-mono whitespace-pre-wrap">{opt.text}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                            isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step Type 5: BUG HUNT */}
            {step.type === 'bug_hunt' && (
              <div className="space-y-4">
                <CodeEditor
                  code={buggyCodeInput}
                  onChange={setBuggyCodeInput}
                  language="python"
                  minHeight="150px"
                  onAskAI={() => setAiDrawerOpen(true)}
                  onReset={() => setBuggyCodeInput(step.buggyCode || '')}
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                  </button>

                  <button
                    onClick={() => handleRunCode(buggyCodeInput)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test Fix</span>
                  </button>
                </div>

                {showHint && step.bugHint && (
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs">
                    💡 {step.bugHint}
                  </div>
                )}

                {/* Terminal Output */}
                {(codeOutput || runError) && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                    <span className="text-slate-500 text-[11px] block mb-1">Terminal Output:</span>
                    {codeOutput && <div className="text-slate-200 whitespace-pre-wrap">{codeOutput}</div>}
                    {runError && <div className="text-rose-400 mt-1 whitespace-pre-wrap">{runError}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Lesson Completed Celebration View */
          <div className="w-full max-w-md mx-auto text-center space-y-6 p-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center text-5xl mx-auto shadow-2xl shadow-yellow-500/30 animate-bounce">
                🏆
              </div>
              <div className="absolute -top-1 -right-1 p-1.5 bg-blue-500 rounded-full text-white">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-white">Lesson Complete!</h2>
              <p className="text-sm text-slate-300">You mastered another bite-sized Python step.</p>
            </div>

            {/* Rewards Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-lg">
                  ⚡
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">XP Earned</span>
                  <span className="text-lg font-extrabold text-yellow-400">+{lesson.xp} XP</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Flame className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Streak</span>
                  <span className="text-lg font-extrabold text-rose-400">{userProgress.streakDays} Days</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-500/25 transition cursor-pointer"
            >
              Back to Learning Trail
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action / Validation Sheet (Mimo / Duolingo Style) */}
      {!isLessonFinished && (
        <div
          className={`border-t px-4 sm:px-8 py-4 transition-colors duration-200 shrink-0 ${
            !isAnswerChecked
              ? 'bg-slate-900 border-slate-800'
              : isCorrect
              ? 'bg-emerald-950/80 border-emerald-800/80'
              : 'bg-rose-950/80 border-rose-800/80'
          }`}
        >
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {!isAnswerChecked ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                  <span>Take your time • Need assistance?</span>
                  <button
                    onClick={() => setAiDrawerOpen(true)}
                    className="text-blue-400 hover:underline cursor-pointer font-medium"
                  >
                    Ask Prof. Nova
                  </button>
                </div>

                <button
                  onClick={handleCheckAnswer}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition shadow-lg shadow-blue-600/30 cursor-pointer ml-auto"
                >
                  {step.type === 'concept' ? 'Continue' : 'Check Answer'}
                </button>
              </>
            ) : isCorrect ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-emerald-300">Spot on! Excellent job.</h4>
                    <p className="text-xs text-emerald-400/90">
                      {step.explanation || 'You executed the logic flawlessly.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm tracking-wide transition shadow-lg shadow-emerald-500/25 cursor-pointer ml-auto flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-rose-300">Not quite right!</h4>
                    <p className="text-xs text-rose-400/90">
                      Take another look or ask Prof. Nova for a tailored hint.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto ml-auto">
                  <button
                    onClick={() => setAiDrawerOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                    <span>Explain with AI</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAnswerChecked(false);
                      setIsCorrect(false);
                    }}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Embedded AI Tutor Drawer */}
      <AITutorDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        currentCode={step.type === 'code_typing' ? editorCode : step.type === 'bug_hunt' ? buggyCodeInput : step.codeSnippet || ''}
        language="python"
        exerciseGoal={step.title}
        userOutput={codeOutput}
        expectedOutput={step.expectedOutput}
        onApplyCode={(fixed) => {
          if (step.type === 'code_typing') setEditorCode(fixed);
          if (step.type === 'bug_hunt') setBuggyCodeInput(fixed);
        }}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { Check, Lock, Star, Sparkles, Play, Gift, Award, ArrowDown } from 'lucide-react';
import { Course, Lesson, Section, UserProgress } from '../types';
import { playSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface LessonTrailProps {
  course: Course;
  userProgress: UserProgress;
  onSelectLesson: (lesson: Lesson) => void;
  onClaimChest: (sectionId: string, xp: number, badge?: string) => void;
}

export const LessonTrail: React.FC<LessonTrailProps> = ({
  course,
  userProgress,
  onSelectLesson,
  onClaimChest,
}) => {
  const [openedChests, setOpenedChests] = useState<string[]>([]);

  const handleOpenChest = (section: Section) => {
    if (openedChests.includes(section.id)) return;
    setOpenedChests((prev) => [...prev, section.id]);
    if (userProgress.soundEnabled) playSound('celebration');
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });
    if (section.chestReward) {
      onClaimChest(section.id, section.chestReward.xp, section.chestReward.badge);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 space-y-12 select-none">
      {/* Course Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-4xl shadow-lg">
            {course.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                {course.badge}
              </span>
              <span className="text-xs text-slate-400">Section 1 of {course.sections.length}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">{course.title}</h1>
            <p className="text-xs text-slate-300 mt-0.5">{course.description}</p>
          </div>
        </div>
      </div>

      {/* Sections & Trail Nodes */}
      {course.sections.map((section, secIdx) => {
        const isSectionUnlocked =
          secIdx === 0 || userProgress.unlockedSections.includes(section.id);
        const totalLessonsInSection = section.lessons.length;
        const completedInSection = section.lessons.filter((l) =>
          userProgress.completedLessons.includes(l.id)
        ).length;
        const sectionPercent = Math.round((completedInSection / totalLessonsInSection) * 100);
        const isSectionDone = completedInSection === totalLessonsInSection;

        return (
          <div key={section.id} className="space-y-6">
            {/* Section Header Card */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isSectionUnlocked
                ? 'bg-slate-900/90 border-slate-800 shadow-lg'
                : 'bg-slate-950/60 border-slate-900 opacity-60'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${section.color} flex items-center justify-center text-xl text-white shadow-md`}>
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{section.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{section.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {completedInSection}/{totalLessonsInSection}
                  </span>
                  <div className="w-20 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${sectionPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Winding Trail Nodes */}
            <div className="relative flex flex-col items-center gap-8 py-4">
              {section.lessons.map((lesson, lessonIdx) => {
                const isCompleted = userProgress.completedLessons.includes(lesson.id);
                // First uncompleted lesson is active
                const isActive =
                  isSectionUnlocked &&
                  !isCompleted &&
                  (lessonIdx === 0 ||
                    userProgress.completedLessons.includes(section.lessons[lessonIdx - 1]?.id));
                const isLocked = !isCompleted && !isActive;

                // Subtle offset left/right for serpentine path like Mimo
                const offsetClass =
                  lessonIdx % 3 === 0
                    ? 'translate-x-0'
                    : lessonIdx % 3 === 1
                    ? 'translate-x-12 sm:translate-x-16'
                    : '-translate-x-12 sm:-translate-x-16';

                return (
                  <div key={lesson.id} className={`flex flex-col items-center relative transition-transform ${offsetClass}`}>
                    {/* Node Button */}
                    <div className="relative group">
                      <button
                        onClick={() => {
                          if (!isLocked) {
                            if (userProgress.soundEnabled) playSound('click');
                            onSelectLesson(lesson);
                          }
                        }}
                        disabled={isLocked}
                        className={`w-20 h-20 rounded-full flex flex-col items-center justify-center font-bold transition-all duration-200 cursor-pointer shadow-xl relative ${
                          isCompleted
                            ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-slate-950 border-4 border-yellow-300 hover:scale-105 shadow-yellow-500/20'
                            : isActive
                            ? 'bg-gradient-to-b from-blue-500 to-indigo-600 text-white border-4 border-blue-400 ring-8 ring-blue-500/20 hover:scale-110 animate-pulse shadow-blue-500/30'
                            : 'bg-slate-800 text-slate-500 border-4 border-slate-700 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="w-8 h-8 stroke-[3]" />
                            <div className="flex gap-0.5 -mt-1">
                              <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                              <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                              <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                            </div>
                          </>
                        ) : isActive ? (
                          <>
                            <Play className="w-7 h-7 fill-white ml-0.5" />
                            <span className="text-[10px] font-black uppercase tracking-tight mt-0.5">Start</span>
                          </>
                        ) : (
                          <Lock className="w-6 h-6" />
                        )}
                      </button>

                      {/* Tooltip / Label Card */}
                      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] font-medium text-slate-300 shadow-md pointer-events-none group-hover:border-slate-500">
                        {lesson.title}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Section Milestone Chest */}
              {section.chestReward && (
                <div className="mt-4 flex flex-col items-center">
                  <button
                    onClick={() => handleOpenChest(section)}
                    disabled={!isSectionDone || openedChests.includes(section.id)}
                    className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-1.5 transition-all shadow-xl ${
                      openedChests.includes(section.id)
                        ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-default'
                        : isSectionDone
                        ? 'bg-gradient-to-b from-amber-500/20 to-yellow-600/20 border-yellow-500 text-yellow-300 animate-bounce cursor-pointer'
                        : 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Gift className={`w-8 h-8 ${isSectionDone && !openedChests.includes(section.id) ? 'text-yellow-400' : ''}`} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {openedChests.includes(section.id)
                        ? 'Chest Claimed'
                        : isSectionDone
                        ? `Claim +${section.chestReward.xp} XP!`
                        : 'Section Milestone'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Flame, Heart, Trophy, Sparkles, Volume2, VolumeX, 
  ChevronDown, Terminal, BookOpen, MessageSquare, BarChart3, Shield 
} from 'lucide-react';
import { Course, UserProgress } from '../types';
import { COURSES } from '../data/coursesData';

interface NavbarProps {
  currentTab: 'trail' | 'challenges' | 'playground' | 'community' | 'dashboard';
  onTabChange: (tab: 'trail' | 'challenges' | 'playground' | 'community' | 'dashboard') => void;
  selectedCourse: Course;
  onSelectCourse: (course: Course) => void;
  userProgress: UserProgress;
  onToggleSound: () => void;
  onOpenAITutor: () => void;
  onRefillHearts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  selectedCourse,
  onSelectCourse,
  userProgress,
  onToggleSound,
  onOpenAITutor,
  onRefillHearts,
}) => {
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [heartModalOpen, setHeartModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 select-none">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Course Selector */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => onTabChange('trail')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              🐍
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-lg text-white tracking-tight flex items-center gap-1">
                PyMimo <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">AI</span>
              </span>
            </div>
          </div>

          {/* Course Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 font-semibold transition cursor-pointer shadow-sm"
            >
              <span>{selectedCourse.icon}</span>
              <span className="max-w-[120px] sm:max-w-none truncate">{selectedCourse.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {courseDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[10px] font-bold uppercase text-slate-500 px-3 py-1.5 block">
                  Switch Curriculum
                </span>
                {COURSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCourse(c);
                      setCourseDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                      selectedCourse.id === c.id
                        ? 'bg-blue-600/20 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-semibold">{c.title}</div>
                      <div className="text-[10px] text-slate-400">{c.badge}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Main Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => onTabChange('trail')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'trail'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Learn</span>
          </button>

          <button
            onClick={() => onTabChange('challenges')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'challenges'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Challenges</span>
          </button>

          <button
            onClick={() => onTabChange('playground')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'playground'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sandbox</span>
          </button>

          <button
            onClick={() => onTabChange('community')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'community'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community</span>
          </button>

          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </nav>

        {/* Right Gamification Stats: Streak, Energy, XP, Audio & AI */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Daily Streak Flame */}
          <div className="relative">
            <button
              onClick={() => setStreakModalOpen(!streakModalOpen)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-extrabold text-xs transition cursor-pointer"
              title="Daily Streak"
            >
              <Flame className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
              <span>{userProgress.streakDays}</span>
            </button>

            {/* Streak Popover */}
            {streakModalOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Flame className="w-5 h-5 fill-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">{userProgress.streakDays}-Day Coding Streak!</h4>
                    <p className="text-[10px] text-slate-400">Code today to extend your flame</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    {userProgress.hasStreakFreeze
                      ? 'Streak Freeze is active!'
                      : 'No freeze equipped. Maintain your streak!'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Hearts / Energy Counter */}
          <div className="relative">
            <button
              onClick={() => setHeartModalOpen(!heartModalOpen)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-400 font-extrabold text-xs transition cursor-pointer"
              title="Energy / Hearts"
            >
              <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
              <span>{userProgress.hearts}</span>
            </button>

            {/* Hearts Popover */}
            {heartModalOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 fill-pink-500 text-pink-500" />
                  <div>
                    <h4 className="font-extrabold text-xs text-white">Energy System</h4>
                    <p className="text-[10px] text-slate-400">
                      {userProgress.hearts} of {userProgress.maxHearts} hearts available
                    </p>
                  </div>
                </div>
                {userProgress.hearts < userProgress.maxHearts && (
                  <button
                    onClick={() => {
                      onRefillHearts();
                      setHeartModalOpen(false);
                    }}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Instant Energy Refill (+5 Hearts)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* XP & Level Badge */}
          <div
            onClick={() => onTabChange('dashboard')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-extrabold text-xs cursor-pointer hover:bg-yellow-500/20 transition"
          >
            <span className="text-yellow-400">⚡</span>
            <span>{userProgress.xp} XP</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={userProgress.soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {userProgress.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* AI Teacher Shortcut */}
          <button
            onClick={onOpenAITutor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Prof. Nova</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 text-xs font-semibold">
        <button
          onClick={() => onTabChange('trail')}
          className={`flex flex-col items-center gap-1 py-1 ${
            currentTab === 'trail' ? 'text-blue-400 font-bold' : 'text-slate-500'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px]">Learn</span>
        </button>
        <button
          onClick={() => onTabChange('challenges')}
          className={`flex flex-col items-center gap-1 py-1 ${
            currentTab === 'challenges' ? 'text-purple-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">AI Labs</span>
        </button>
        <button
          onClick={() => onTabChange('playground')}
          className={`flex flex-col items-center gap-1 py-1 ${
            currentTab === 'playground' ? 'text-emerald-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span className="text-[10px]">Sandbox</span>
        </button>
        <button
          onClick={() => onTabChange('community')}
          className={`flex flex-col items-center gap-1 py-1 ${
            currentTab === 'community' ? 'text-blue-400 font-bold' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px]">Forum</span>
        </button>
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 ${
            currentTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px]">Stats</span>
        </button>
      </div>
    </header>
  );
};

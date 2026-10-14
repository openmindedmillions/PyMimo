import React, { useState } from 'react';
import { 
  Flame, Trophy, Zap, Shield, Heart, Award, Calendar, 
  TrendingUp, CheckCircle, Clock, Sparkles, User, ChevronRight, BarChart3 
} from 'lucide-react';
import { UserProgress } from '../types';
import { INITIAL_LEADERBOARD } from '../data/coursesData';
import { playSound } from '../utils/audio';

interface GamifiedDashboardProps {
  userProgress: UserProgress;
  onRefillHearts: () => void;
  onToggleFreeze: () => void;
}

export const GamifiedDashboard: React.FC<GamifiedDashboardProps> = ({
  userProgress,
  onRefillHearts,
  onToggleFreeze,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'badges'>('overview');

  // Days of week for streak calendar
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  // Calculate XP needed for next level
  const currentLevel = userProgress.level;
  const xpForNextLevel = currentLevel * 200;
  const xpCurrentLevelProgress = userProgress.xp % 200;
  const levelProgressPercent = Math.min(100, Math.round((xpCurrentLevelProgress / 200) * 100));

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-8 select-none">
      {/* Top Hero Stats Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-1 shadow-xl shadow-indigo-500/20">
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-3xl">
                🚀
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Active Learner
                </span>
                <span className="text-xs text-slate-400">Level {currentLevel}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Ahtsham's Mastery Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Keep the momentum going! Next reward unlocks at Level {currentLevel + 1}.
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Daily Streak */}
            <div className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Flame className="w-6 h-6 fill-rose-500 text-rose-500 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Streak</span>
                <span className="text-base font-extrabold text-white">{userProgress.streakDays} Days</span>
              </div>
            </div>

            {/* Total XP */}
            <div className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xl">
                ⚡
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total XP</span>
                <span className="text-base font-extrabold text-white">{userProgress.xp} XP</span>
              </div>
            </div>

            {/* Hearts / Energy */}
            <div className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Energy</span>
                <span className="text-base font-extrabold text-white">
                  {userProgress.hearts}/{userProgress.maxHearts}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Level {currentLevel} • Python Apprentice</span>
            <span>{xpCurrentLevelProgress} / 200 XP to Level {currentLevel + 1}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden relative border border-slate-700/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Growth & Streaks</span>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-1 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span>Weekly League</span>
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`pb-3 px-1 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'badges'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-purple-400" />
          <span>Badges ({userProgress.earnedBadges.length})</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Daily Streak Tracker Card */}
          <div className="md:col-span-7 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Daily Streak Calendar</h3>
                  <p className="text-xs text-slate-400">Code every day to keep your flame blazing!</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>{userProgress.streakDays} Day Flame</span>
              </div>
            </div>

            {/* 7-Day Visual Circles */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {weekDays.map((day, idx) => {
                const isPast = idx < todayIndex;
                const isToday = idx === todayIndex;
                const isActive = idx <= todayIndex; // simulated streak active up to today

                return (
                  <div
                    key={day}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                      isToday
                        ? 'bg-rose-500/20 border-rose-500/40 text-white shadow-lg shadow-rose-500/10'
                        : isActive
                        ? 'bg-slate-800/80 border-slate-700/80 text-slate-200'
                        : 'bg-slate-950/60 border-slate-900 text-slate-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">{day}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        isActive
                          ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {isActive ? <Flame className="w-4 h-4 fill-white" /> : '•'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Streak Freeze & Shield Status */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Streak Freeze Protection</h4>
                  <p className="text-[11px] text-slate-400">
                    {userProgress.hasStreakFreeze
                      ? 'Equipped! Protects your streak if you miss a day.'
                      : 'Streak freeze consumed. Equip a new one below.'}
                  </p>
                </div>
              </div>

              <button
                onClick={onToggleFreeze}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  userProgress.hasStreakFreeze
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                }`}
              >
                {userProgress.hasStreakFreeze ? 'Active Shield' : 'Equip Freeze'}
              </button>
            </div>
          </div>

          {/* Skill Radar / Strengths & Weaknesses */}
          <div className="md:col-span-5 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Concept Mastery Radar</h3>
                <p className="text-xs text-slate-400">Tracked by AI from your code runs</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {/* Metric 1 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Syntax Accuracy</span>
                  <span className="text-emerald-400 font-bold">92%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>

              {/* Metric 2 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Logical Problem Solving</span>
                  <span className="text-blue-400 font-bold">85%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              {/* Metric 3 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Daily Consistency</span>
                  <span className="text-amber-400 font-bold">98%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '98%' }} />
                </div>
              </div>

              {/* Metric 4 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Code Cleanliness (PEP 8)</span>
                  <span className="text-indigo-400 font-bold">88%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
            </div>

            {/* AI Identified Weak Spots */}
            {userProgress.weakTopics.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  AI Recommended Focus:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {userProgress.weakTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20">
                  Gold League
                </span>
                <span className="text-xs text-slate-400">Ends in 2 days</span>
              </div>
              <h3 className="font-extrabold text-xl text-white mt-1">Weekly Peer Leaderboard</h3>
              <p className="text-xs text-slate-400">Top 3 learners promote to the Diamond League!</p>
            </div>
          </div>

          <div className="space-y-2">
            {INITIAL_LEADERBOARD.map((user) => (
              <div
                key={user.rank}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  user.isUser
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md ring-2 ring-blue-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs ${
                      user.rank === 1
                        ? 'bg-yellow-500 text-slate-950'
                        : user.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : user.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {user.rank}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                    {user.avatar}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{user.name}</span>
                      {user.isUser && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500 text-white">
                          YOU
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-slate-400">{user.badge}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                    <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>{user.streak}d</span>
                  </div>
                  <span className="font-mono font-extrabold text-sm text-yellow-400">
                    {user.xp} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BADGES TAB */}
      {activeTab === 'badges' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h3 className="font-extrabold text-xl text-white">Achievement Hall</h3>
            <p className="text-xs text-slate-400">Earn badges through consistency, problem solving, and community reviews.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userProgress.earnedBadges.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex items-start gap-4 shadow-lg"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0 shadow-md">
                  {b.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{b.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{b.description}</p>
                  <span className="text-[10px] text-purple-400 font-mono mt-2 block">
                    Unlocked on {b.unlockedAt}
                  </span>
                </div>
              </div>
            ))}

            {/* Locked badge previews */}
            <div className="p-5 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 flex items-start gap-4 opacity-50">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                🔒
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-400">Algorithm Alchemist</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Solve 10 AI-generated adaptive coding challenges.
                </p>
                <span className="text-[10px] text-slate-600 font-mono mt-2 block">In Progress</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 flex items-start gap-4 opacity-50">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                🔒
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-400">Community Beacon</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Provide 3 peer code reviews in the forum.
                </p>
                <span className="text-[10px] text-slate-600 font-mono mt-2 block">In Progress</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

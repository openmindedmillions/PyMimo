import React, { useState, useEffect } from 'react';
import { Course, Lesson, UserProgress } from './types';
import { COURSES } from './data/coursesData';
import { loadUserProgress, saveUserProgress, updateStreakOnActivity } from './utils/userStore';
import { Navbar } from './components/Navbar';
import { LessonTrail } from './components/LessonTrail';
import { LessonModal } from './components/LessonModal';
import { PersonalizedChallenges } from './components/PersonalizedChallenges';
import { GamifiedDashboard } from './components/GamifiedDashboard';
import { CommunityForum } from './components/CommunityForum';
import { CodePlayground } from './components/CodePlayground';
import { AITutorDrawer } from './components/AITutorDrawer';
import { playSound } from './utils/audio';

export default function App() {
  const [userProgress, setUserProgress] = useState<UserProgress>(loadUserProgress());
  const [selectedCourse, setSelectedCourse] = useState<Course>(COURSES[0]);
  const [currentTab, setCurrentTab] = useState<'trail' | 'challenges' | 'playground' | 'community' | 'dashboard'>('trail');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [globalAITutorOpen, setGlobalAITutorOpen] = useState(false);

  // Sync progress changes to localStorage
  useEffect(() => {
    saveUserProgress(userProgress);
  }, [userProgress]);

  // Handle lesson completion
  const handleLessonComplete = (lessonId: string, earnedXp: number) => {
    setUserProgress((prev) => {
      const alreadyCompleted = prev.completedLessons.includes(lessonId);
      const newCompleted = alreadyCompleted ? prev.completedLessons : [...prev.completedLessons, lessonId];
      const newXp = prev.xp + earnedXp;
      const newLevel = Math.floor(newXp / 200) + 1;

      // Check section unlock logic
      const updatedUnlocked = [...prev.unlockedSections];
      if (!updatedUnlocked.includes('sec-py-2')) updatedUnlocked.push('sec-py-2');
      if (!updatedUnlocked.includes('sec-py-3') && newCompleted.length >= 3) updatedUnlocked.push('sec-py-3');
      if (!updatedUnlocked.includes('sec-py-4') && newCompleted.length >= 5) updatedUnlocked.push('sec-py-4');
      if (!updatedUnlocked.includes('sec-py-5') && newCompleted.length >= 7) updatedUnlocked.push('sec-py-5');

      const updatedProgress: UserProgress = {
        ...prev,
        completedLessons: newCompleted,
        unlockedSections: updatedUnlocked,
        xp: newXp,
        level: newLevel,
      };

      const { updated } = updateStreakOnActivity(updatedProgress);
      return updated;
    });
  };

  // Handle heart loss
  const handleHeartLoss = () => {
    setUserProgress((prev) => ({
      ...prev,
      hearts: Math.max(0, prev.hearts - 1),
    }));
  };

  // Refill hearts to max
  const handleRefillHearts = () => {
    setUserProgress((prev) => ({
      ...prev,
      hearts: prev.maxHearts,
    }));
    if (userProgress.soundEnabled) playSound('celebration');
  };

  // Claim section chest reward
  const handleClaimChest = (sectionId: string, xp: number, badgeName?: string) => {
    setUserProgress((prev) => {
      const newBadges = [...prev.earnedBadges];
      if (badgeName && !newBadges.some((b) => b.name === badgeName)) {
        newBadges.push({
          id: `chest_${sectionId}`,
          name: badgeName,
          icon: '🎁',
          description: `Mastered all lessons in ${sectionId}`,
          unlockedAt: 'Just now',
        });
      }
      return {
        ...prev,
        xp: prev.xp + xp,
        earnedBadges: newBadges,
      };
    });
  };

  // Toggle streak freeze
  const handleToggleFreeze = () => {
    setUserProgress((prev) => ({
      ...prev,
      hasStreakFreeze: !prev.hasStreakFreeze,
    }));
    if (userProgress.soundEnabled) playSound('click');
  };

  // Toggle sound
  const handleToggleSound = () => {
    setUserProgress((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  // Handle challenge completion
  const handleChallengeComplete = (challengeId: string, xpReward: number) => {
    setUserProgress((prev) => {
      const newXp = prev.xp + xpReward;
      const newLevel = Math.floor(newXp / 200) + 1;
      const { updated } = updateStreakOnActivity({
        ...prev,
        xp: newXp,
        level: newLevel,
      });
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedCourse={selectedCourse}
        onSelectCourse={setSelectedCourse}
        userProgress={userProgress}
        onToggleSound={handleToggleSound}
        onOpenAITutor={() => setGlobalAITutorOpen(true)}
        onRefillHearts={handleRefillHearts}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'trail' && (
          <LessonTrail
            course={selectedCourse}
            userProgress={userProgress}
            onSelectLesson={(lesson) => setActiveLesson(lesson)}
            onClaimChest={handleClaimChest}
          />
        )}

        {currentTab === 'challenges' && (
          <PersonalizedChallenges
            userProgress={userProgress}
            onChallengeComplete={handleChallengeComplete}
          />
        )}

        {currentTab === 'playground' && <CodePlayground />}

        {currentTab === 'community' && <CommunityForum userProgress={userProgress} />}

        {currentTab === 'dashboard' && (
          <GamifiedDashboard
            userProgress={userProgress}
            onRefillHearts={handleRefillHearts}
            onToggleFreeze={handleToggleFreeze}
          />
        )}
      </main>

      {/* Interactive Lesson Modal (When learning node is opened) */}
      {activeLesson && (
        <LessonModal
          lesson={activeLesson}
          isOpen={true}
          onClose={() => setActiveLesson(null)}
          userProgress={userProgress}
          onLessonComplete={handleLessonComplete}
          onHeartLoss={handleHeartLoss}
        />
      )}

      {/* Global AI Tutor Drawer (When Prof. Nova is opened anywhere in the app) */}
      <AITutorDrawer
        isOpen={globalAITutorOpen}
        onClose={() => setGlobalAITutorOpen(false)}
        currentCode="# Python workspace\nprint('Hello, Prof. Nova!')"
        language="python"
        exerciseGoal="Mastering Python syntax & logic"
      />
    </div>
  );
}

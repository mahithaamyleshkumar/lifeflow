import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { TodayView } from './views/TodayView';
import { TimelineView } from './views/TimelineView';
import { HabitsView } from './views/HabitsView';
import { InsightsView } from './views/InsightsView';
import { CalendarView } from './views/CalendarView';
import { JourneyView } from './views/JourneyView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';

import { QuickAddModal } from './components/QuickAddModal';
import { ScoreFormulaModal } from './components/ScoreFormulaModal';
import { MorningPlanModal } from './components/MorningPlanModal';
import { EveningReviewModal } from './components/EveningReviewModal';
import { StreakCelebrationModal } from './components/StreakCelebrationModal';

import { DashboardSummary, Activity, Habit, StreakAchievement } from './types';
import { api } from './api';
import { Calendar, Compass, History, Settings, X } from 'lucide-react';

function AppContent() {
  const { user, token, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('today');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | undefined>();
  const [showScoreFormula, setShowScoreFormula] = useState(false);
  const [showMorningPlan, setShowMorningPlan] = useState(false);
  const [showEveningReview, setShowEveningReview] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<StreakAchievement | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [sum, acts, habsRes, streakRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getActivities({ date: todayStr }),
        api.getHabits(),
        api.getStreaks().catch(() => null)
      ]);
      setSummary(sum);
      setActivities(acts);
      setHabits(habsRes.habits);

      // Check if any milestone was newly reached or needs celebration
      if (streakRes && streakRes.allMilestones) {
        const storageKey = `lifeflow_seen_milestones_${user?.id || 'default'}`;
        const seenRaw = localStorage.getItem(storageKey);
        const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];

        // Check if there are newly unlocked milestones that haven't been shown in a celebration yet
        const newlyUnlocked = streakRes.allMilestones.find(
          (m) => m.unlocked && !seen.includes(m.id)
        );

        if (newlyUnlocked) {
          seen.push(newlyUnlocked.id);
          localStorage.setItem(storageKey, JSON.stringify(seen));
          setCelebrationMilestone(newlyUnlocked);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (!authLoading && token) {
      loadDashboardData();
    }
  }, [authLoading, token, loadDashboardData]);

  const handleOpenQuickAdd = (date?: string) => {
    setQuickAddDate(date);
    setShowQuickAdd(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#10131a] flex flex-col items-center justify-center text-white space-y-4">
        <div className="relative w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center glow-cyan">
          <span className="text-2xl font-bold text-cyan-400">∞</span>
        </div>
        <div className="text-sm font-headline font-semibold text-white tracking-wide">
          LifeFlow Intelligence Engine
        </div>
        <div className="text-xs font-mono text-cyan-400/70 animate-pulse">
          Initializing PostgreSQL Bio-Telemetry...
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <AuthView />;
  }

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-[#10131a] flex flex-col items-center justify-center text-white space-y-4">
        <div className="relative w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center glow-cyan">
          <span className="text-2xl font-bold text-cyan-400">∞</span>
        </div>
        <div className="text-sm font-headline font-semibold text-white tracking-wide">
          LifeFlow Intelligence Engine
        </div>
        <div className="text-xs font-mono text-cyan-400/70 animate-pulse">
          Synchronizing Your Personal Flow Records...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#10131a] text-[#e1e2ec] flex antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Desktop Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenQuickAdd={() => handleOpenQuickAdd()}
        onOpenMorningPlan={() => setShowMorningPlan(true)}
        onOpenEveningReview={() => setShowEveningReview(true)}
        streak={summary?.currentStreak || 0}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Navbar */}
        <Navbar
          onOpenMorningPlan={() => setShowMorningPlan(true)}
          onOpenEveningReview={() => setShowEveningReview(true)}
          onRefreshData={loadDashboardData}
          hasData={summary?.hasData ?? false}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'today' && (
            <TodayView
              summary={summary}
              activities={activities}
              habits={habits}
              onRefresh={loadDashboardData}
              onOpenQuickAdd={() => handleOpenQuickAdd()}
              onOpenScoreFormula={() => setShowScoreFormula(true)}
              onOpenMorningPlan={() => setShowMorningPlan(true)}
              onOpenEveningReview={() => setShowEveningReview(true)}
            />
          )}

          {currentView === 'timeline' && (
            <TimelineView
              onOpenQuickAdd={() => handleOpenQuickAdd()}
              onRefresh={loadDashboardData}
            />
          )}

          {currentView === 'habits' && (
            <HabitsView
              onOpenQuickAdd={() => handleOpenQuickAdd()}
              onRefresh={loadDashboardData}
            />
          )}

          {currentView === 'insights' && (
            <InsightsView
              summary={summary}
              onOpenScoreFormula={() => setShowScoreFormula(true)}
              onRefresh={loadDashboardData}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView onOpenQuickAdd={handleOpenQuickAdd} />
          )}

          {currentView === 'journey' && <JourneyView summary={summary} />}

          {currentView === 'history' && <HistoryView />}

          {currentView === 'settings' && (
            <SettingsView onRefresh={loadDashboardData} />
          )}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenQuickAdd={() => handleOpenQuickAdd()}
        onToggleMoreMenu={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
      />

      {/* Mobile "More" Sheet */}
      {showMobileMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/80 backdrop-blur-md flex flex-col justify-end p-4 animate-in fade-in">
          <div className="bg-[#191b23] border border-white/10 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-headline font-bold text-sm text-white">More Navigation</span>
              <button
                onClick={() => setShowMobileMoreMenu(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setCurrentView('calendar');
                  setShowMobileMoreMenu(false);
                }}
                className="p-3.5 rounded-2xl bg-[#10131a] border border-white/5 flex items-center gap-2.5 text-xs text-white"
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Calendar</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('journey');
                  setShowMobileMoreMenu(false);
                }}
                className="p-3.5 rounded-2xl bg-[#10131a] border border-white/5 flex items-center gap-2.5 text-xs text-white"
              >
                <Compass className="w-4 h-4 text-purple-400" />
                <span>Journey</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('history');
                  setShowMobileMoreMenu(false);
                }}
                className="p-3.5 rounded-2xl bg-[#10131a] border border-white/5 flex items-center gap-2.5 text-xs text-white"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>History Logs</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('settings');
                  setShowMobileMoreMenu(false);
                }}
                className="p-3.5 rounded-2xl bg-[#10131a] border border-white/5 flex items-center gap-2.5 text-xs text-white"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Global Modals */}
      {showQuickAdd && (
        <QuickAddModal
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={loadDashboardData}
          defaultDate={quickAddDate}
        />
      )}

      {showScoreFormula && (
        <ScoreFormulaModal
          isOpen={showScoreFormula}
          onClose={() => setShowScoreFormula(false)}
          breakdown={summary?.scoreBreakdown}
          totalScore={summary?.productivityScore || 0}
        />
      )}

      {showMorningPlan && (
        <MorningPlanModal
          isOpen={showMorningPlan}
          onClose={() => setShowMorningPlan(false)}
          activities={activities}
          habits={habits}
          currentStreak={summary?.currentStreak || 0}
        />
      )}

      {showEveningReview && (
        <EveningReviewModal
          isOpen={showEveningReview}
          onClose={() => setShowEveningReview(false)}
          onSaved={loadDashboardData}
          completedTasksCount={summary?.tasks.completed || 0}
          totalTasksCount={summary?.tasks.total || 0}
          focusMinutes={summary?.focus.minutes || 0}
        />
      )}

      {/* Streak Milestone Celebration Modal */}
      {celebrationMilestone && (
        <StreakCelebrationModal
          milestone={celebrationMilestone}
          onClose={() => setCelebrationMilestone(null)}
          onViewJourney={() => {
            setCelebrationMilestone(null);
            setCurrentView('journey');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  Check,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Plus,
  Calendar,
  AlertCircle,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DashboardSummary, Activity, Habit } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface TodayViewProps {
  summary: DashboardSummary | null;
  activities: Activity[];
  habits: Habit[];
  onRefresh: () => void;
  onOpenQuickAdd: () => void;
  onOpenScoreFormula: () => void;
  onOpenMorningPlan: () => void;
  onOpenEveningReview: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  summary,
  activities,
  habits,
  onRefresh,
  onOpenQuickAdd,
  onOpenScoreFormula,
  onOpenMorningPlan,
  onOpenEveningReview
}) => {
  const { user } = useAuth();
  const [activeTimerRunning, setActiveTimerRunning] = useState(true);
  const [activeSecondsElapsed, setActiveSecondsElapsed] = useState(38 * 60 + 14); // 38m 14s default
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Active activity (first one with in_progress status, or first planned)
  const activeTask = activities.find((a) => a.status === 'in_progress') || activities.find((a) => a.status === 'planned');

  // Timer loop for active session
  useEffect(() => {
    let interval: any = null;
    if (activeTimerRunning && activeTask) {
      interval = setInterval(() => {
        setActiveSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimerRunning, activeTask]);

  const handleToggleHabit = async (habitId: string) => {
    try {
      await api.toggleHabit(habitId);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    setCompletingId(activityId);
    try {
      await api.updateActivityStatus(activityId, 'completed');
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#4cd7f6', '#d0bcff', '#ffb95f']
        });
      } catch (e) {}
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingId(null);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const score = summary?.productivityScore ?? 0;
  const hasData = summary?.hasData ?? false;
  const circumference = 2 * Math.PI * 54; // radius 54
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 lg:pb-8">
      {/* 1. Header Greeting & Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {user?.name ? `${user.name}'s Flow` : 'Active Bio-Telemetry'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight">
            {user?.name ? `Welcome back, ${user.name}` : "Today's Cockpit"}
          </h1>
          <p className="text-xs text-white/50 mt-1 max-w-xl leading-relaxed">
            {summary?.motivationalMessage || "Your LIFEFlow journey starts here. Create your first activity and start building your story."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="today-morning-plan-cta"
            onClick={onOpenMorningPlan}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            Morning Briefing
          </button>
          <button
            id="today-evening-review-cta"
            onClick={onOpenEveningReview}
            className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            Evening Reflection
          </button>
        </div>
      </div>

      {/* 2. Hero Metric: "YOUR LIFE IN FLOW" Concentric Ring */}
      <div className="relative overflow-hidden p-6 lg:p-8 rounded-3xl bg-gradient-to-b from-[#191b23] to-[#12141c] border border-white/10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* SVG Progress Ring */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                {/* Background Ring */}
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  className="stroke-white/10"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress Ring with Gradient */}
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  className="transition-all duration-1000 ease-out"
                  stroke="url(#flowGradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4cd7f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Central Score Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl lg:text-5xl font-headline font-bold text-white tracking-tight">
                  {score}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-semibold mt-0.5">
                  Flow Index
                </span>
              </div>
            </div>

            <button
              id="how-score-calculated-btn"
              onClick={onOpenScoreFormula}
              className="mt-3 text-[11px] font-mono text-cyan-300/80 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" /> How is my score calculated?
            </button>
          </div>

          {/* Telemetry Bento Grid */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-white/40">
                DAILY SYSTEM VITALS
              </span>
              <h2 className="text-xl font-headline font-bold text-white mt-0.5">
                {hasData ? 'High Cognitive Alignment' : 'Fresh Session Canvas'}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Card 1: Tasks Completion */}
              <div className="p-3.5 rounded-2xl bg-[#10131a]/80 border border-white/5">
                <div className="flex items-center justify-between text-white/50 mb-1">
                  <span className="text-[11px] font-mono">Tasks</span>
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xl font-headline font-bold text-white">
                  {summary?.tasks.completed ?? 0}
                  <span className="text-xs text-white/40 font-normal"> / {summary?.tasks.total ?? 0}</span>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                  {summary?.tasks.completionPercentage ?? 0}% completed
                </div>
              </div>

              {/* Card 2: Deep Focus */}
              <div className="p-3.5 rounded-2xl bg-[#10131a]/80 border border-white/5">
                <div className="flex items-center justify-between text-white/50 mb-1">
                  <span className="text-[11px] font-mono">Focus</span>
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-headline font-bold text-white">
                  {summary?.focus.formatted || '0h 0m'}
                </div>
                <div className="text-[10px] text-purple-400 font-mono mt-0.5">
                  Goal: 4h deep work
                </div>
              </div>

              {/* Card 3: Anchor Habits */}
              <div className="p-3.5 rounded-2xl bg-[#10131a]/80 border border-white/5">
                <div className="flex items-center justify-between text-white/50 mb-1">
                  <span className="text-[11px] font-mono">Habits</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-headline font-bold text-white">
                  {summary?.habits.ratio || '0/0'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  Anchors checked in
                </div>
              </div>

              {/* Card 4: Active Streak */}
              <div className="p-3.5 rounded-2xl bg-[#10131a]/80 border border-white/5">
                <div className="flex items-center justify-between text-white/50 mb-1">
                  <span className="text-[11px] font-mono">Streak</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-headline font-bold text-white">
                  {summary?.currentStreak ?? 0}
                  <span className="text-xs text-white/40 font-normal"> days</span>
                </div>
                <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                  Record: {summary?.longestStreak ?? 0} days
                </div>
              </div>
            </div>

            {/* Micro component bars */}
            <div className="p-3 rounded-xl bg-[#10131a]/50 border border-white/5 grid grid-cols-4 gap-2 text-[11px] font-mono text-white/60">
              <div>
                <div className="text-white/40">Tasks (40%)</div>
                <div className="font-semibold text-white mt-0.5">
                  {summary?.scoreBreakdown?.completion?.score ?? 0} pts
                </div>
              </div>
              <div>
                <div className="text-white/40">Streak (30%)</div>
                <div className="font-semibold text-white mt-0.5">
                  {summary?.scoreBreakdown?.consistency?.score ?? 0} pts
                </div>
              </div>
              <div>
                <div className="text-white/40">Focus (20%)</div>
                <div className="font-semibold text-white mt-0.5">
                  {summary?.scoreBreakdown?.focusTime?.score ?? 0} pts
                </div>
              </div>
              <div>
                <div className="text-white/40">Habits (10%)</div>
                <div className="font-semibold text-white mt-0.5">
                  {summary?.scoreBreakdown?.routines?.score ?? 0} pts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Active Focus Session (matching Screenshot 5) */}
      {activeTask && activeTask.status !== 'completed' && (
        <div
          id="active-focus-card"
          className="p-5 lg:p-6 rounded-3xl bg-gradient-to-r from-[#191b23] via-[#1c1a29] to-[#191b23] border border-cyan-500/30 shadow-xl shadow-cyan-950/20 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center flex-shrink-0 glow-cyan">
                <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    LIVE FOCUS BLOCK
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    {activeTask.start_time || 'In Progress'} • {activeTask.duration_minutes}m target
                  </span>
                </div>
                <h3 className="text-lg font-headline font-bold text-white mt-0.5">
                  {activeTask.title}
                </h3>
                {activeTask.description && (
                  <p className="text-xs text-white/60 line-clamp-1">{activeTask.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="text-right font-mono pr-2">
                <div className="text-xs text-white/50">Elapsed Time</div>
                <div className="text-2xl font-bold text-cyan-400 tracking-tight">
                  {formatTimer(activeSecondsElapsed)}
                </div>
              </div>

              <button
                id="toggle-timer-running-btn"
                onClick={() => setActiveTimerRunning(!activeTimerRunning)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
                title={activeTimerRunning ? 'Pause Timer' : 'Resume Timer'}
              >
                {activeTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                id="complete-active-session-btn"
                disabled={completingId === activeTask.id}
                onClick={() => handleCompleteActivity(activeTask.id)}
                className="px-4 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-400/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Complete Block</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Anchor Routine Habits (Interactive Check-In Row) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline font-semibold text-base text-white">
              Anchor Routine Habits
            </h3>
            <p className="text-xs text-white/50">Non-negotiable daily behavioral baseline</p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            {summary?.habits.completed ?? 0} of {habits.length} Locked
          </span>
        </div>

        {habits.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#191b23] border border-white/5 text-center text-xs text-white/40">
            No anchor habits configured yet. Add habits using the Quick-Add (+) button.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {habits.map((habit) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isChecked = habit.week_status?.[todayStr] ?? false;

              return (
                <button
                  key={habit.id}
                  id={`habit-card-${habit.id}`}
                  onClick={() => handleToggleHabit(habit.id)}
                  className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between group ${
                    isChecked
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'bg-[#191b23] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: habit.category_color || '#06B6D4' }}
                    />
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-cyan-400 border-cyan-400 text-black'
                          : 'border-white/20 text-transparent group-hover:border-white/40'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold line-clamp-1 transition-colors ${
                        isChecked ? 'text-white' : 'text-white/80'
                      }`}
                    >
                      {habit.name}
                    </div>
                    <div className="text-[10px] font-mono text-white/40 mt-1 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{habit.current_streak}d streak</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Today's Scheduled Focus Activities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline font-semibold text-base text-white">
              Today's Schedule & Focus
            </h3>
            <p className="text-xs text-white/50">Chronological execution stream</p>
          </div>
          <button
            id="today-add-activity-btn"
            onClick={onOpenQuickAdd}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Focus Block
          </button>
        </div>

        {activities.length === 0 ? (
          /* Empty state matching strictly Section 1 / Section 4 */
          <div
            id="today-empty-state"
            className="p-12 rounded-3xl bg-[#191b23] border border-white/5 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto glow-cyan">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-lg font-headline font-bold text-white">
                Your LIFEFlow journey starts here.
              </h4>
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
                No activities planned for today yet. Every metric in LifeFlow is calculated exclusively from your real logged actions.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenQuickAdd}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-400/20"
              >
                Plan First Activity
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.map((act) => {
              const isDone = act.status === 'completed';
              const isInProgress = act.status === 'in_progress';

              return (
                <div
                  key={act.id}
                  id={`today-activity-${act.id}`}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-[#10131a]/60 border-white/5 opacity-75'
                      : isInProgress
                      ? 'bg-[#191b23] border-cyan-500/40 shadow-md shadow-cyan-950/30'
                      : 'bg-[#191b23] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      id={`toggle-activity-status-${act.id}`}
                      onClick={() => handleCompleteActivity(act.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                        isDone
                          ? 'bg-cyan-400 border-cyan-400 text-black'
                          : 'border-white/20 text-transparent hover:border-cyan-400'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isDone ? 'line-through text-white/50' : 'text-white'
                          }`}
                        >
                          {act.title}
                        </span>
                        {isInProgress && (
                          <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40 font-mono mt-0.5">
                        <span>{act.start_time || 'Flexible'} - {act.end_time || `${act.duration_minutes}m`}</span>
                        <span>•</span>
                        <span style={{ color: act.category_color || '#06B6D4' }}>
                          {act.category_name || 'General'}
                        </span>
                        {act.mood && (
                          <>
                            <span>•</span>
                            <span className="text-white/50">{act.mood}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-white/60">
                      {act.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

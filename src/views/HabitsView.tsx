import React, { useState, useEffect } from 'react';
import {
  Flame,
  Trophy,
  Sparkles,
  Check,
  Plus,
  Calendar,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit, HabitHeatmapDay } from '../types';
import { api } from '../api';

interface HabitsViewProps {
  onOpenQuickAdd: () => void;
  onRefresh: () => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({ onOpenQuickAdd, onRefresh }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [heatmapDays, setHeatmapDays] = useState<HabitHeatmapDay[]>([]);
  const [activeCheckinRate, setActiveCheckinRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [habitsRes, heatmapRes] = await Promise.all([
        api.getHabits(),
        api.getHabitHeatmap()
      ]);
      setHabits(habitsRes.habits);
      setWeekDates(habitsRes.week_dates);
      setHeatmapDays(heatmapRes.heatmap);
      setActiveCheckinRate(heatmapRes.activeCheckinRate);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCell = async (habitId: string, date: string) => {
    try {
      const res = await api.toggleHabit(habitId, date);
      if (res.completed) {
        try {
          confetti({
            particleCount: 25,
            spread: 40,
            origin: { y: 0.7 },
            colors: ['#4cd7f6', '#10b981']
          });
        } catch (e) {}
      }
      await loadData();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Compute aggregate stats from real data
  const maxCurrentStreak = habits.reduce((max, h) => Math.max(max, h.current_streak || 0), 0);
  const averageRate = habits.length > 0
    ? Math.round(habits.reduce((acc, h) => acc + (h.completion_rate || 0), 0) / habits.length)
    : 0;

  const nextMilestoneDays = maxCurrentStreak >= 30 ? 100 : maxCurrentStreak >= 14 ? 30 : maxCurrentStreak >= 7 ? 14 : 7;
  const daysToMilestone = Math.max(0, nextMilestoneDays - maxCurrentStreak);
  const milestoneProgressPct = Math.min(100, Math.round((maxCurrentStreak / nextMilestoneDays) * 100));

  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 lg:pb-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            CONSISTENCY HUB
          </div>
          <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight">
            Habit Telemetry Matrix
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Unbroken behavioral anchors and 30-day density mapping
          </p>
        </div>

        <button
          id="habits-craft-new-btn"
          onClick={onOpenQuickAdd}
          className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-400/20 flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Craft New Habit</span>
        </button>
      </div>

      {/* 2. Three Pillar Stat Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#191b23] border border-white/10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center glow-amber">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider">Active Cadence</div>
            <div className="text-2xl font-headline font-bold text-white mt-0.5">
              {maxCurrentStreak} <span className="text-xs font-normal text-white/40">Days</span>
            </div>
            <div className="text-[10px] text-amber-400 font-mono">Unbroken streak record</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#191b23] border border-white/10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center glow-violet">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider">Personal Record</div>
            <div className="text-2xl font-headline font-bold text-white mt-0.5">
              21 <span className="text-xs font-normal text-white/40">Days</span>
            </div>
            <div className="text-[10px] text-purple-400 font-mono">Highest historical run</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#191b23] border border-white/10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider">Habit Purity</div>
            <div className="text-2xl font-headline font-bold text-white mt-0.5">
              {averageRate}%
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">7-day execution accuracy</div>
          </div>
        </div>
      </div>

      {/* 3. Milestone Celebration Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Next Tier: {nextMilestoneDays}-Day Milestone
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {daysToMilestone === 0
                ? 'Milestone Unlocked! Operating at high fidelity.'
                : `${daysToMilestone} days of consistency remaining to lock ${nextMilestoneDays} days.`}
            </div>
          </div>
        </div>

        <div className="w-full sm:w-48">
          <div className="flex justify-between text-[11px] font-mono text-white/60 mb-1">
            <span>Progress</span>
            <span className="text-cyan-400 font-bold">{milestoneProgressPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-500"
              style={{ width: `${milestoneProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Weekly Focus Routines Matrix */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline font-bold text-lg text-white">Focus Routines</h3>
            <p className="text-xs text-white/50">Current week execution matrix (tap any day to check in)</p>
          </div>
          <span className="text-xs font-mono text-white/40">Monday - Sunday</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-white/40 font-mono">
            Calibrating habit telemetry...
          </div>
        ) : habits.length === 0 ? (
          <div className="p-8 text-center text-xs text-white/40 space-y-2">
            <div>No habits created yet. Click "+ Craft New Habit" to establish your first anchor routine.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b border-white/5 text-xs font-mono text-white/40">
                  <th className="py-3 px-3 font-normal">HABIT NAME</th>
                  {dayLetters.map((letter, idx) => (
                    <th key={idx} className="py-3 px-2 text-center font-normal w-10">
                      {letter}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right font-normal">CADENCE</th>
                  <th className="py-3 px-3 text-right font-normal">STREAK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {habits.map((habit) => (
                  <tr key={habit.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Habit name & category pill */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: habit.category_color || '#06B6D4' }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">{habit.name}</div>
                          <div className="text-[10px] text-white/40 font-mono">
                            {habit.category_name || 'Routine'} • {habit.target_days_per_week}d/wk
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 7 Days checkmarks */}
                    {weekDates.map((dateStr) => {
                      const isDone = habit.week_status?.[dateStr] ?? false;
                      return (
                        <td key={dateStr} className="py-3 px-2 text-center">
                          <button
                            id={`toggle-matrix-${habit.id}-${dateStr}`}
                            onClick={() => handleToggleCell(habit.id, dateStr)}
                            className={`w-7 h-7 rounded-xl border mx-auto flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-cyan-400 border-cyan-400 text-black shadow-md shadow-cyan-400/20'
                                : 'border-white/10 hover:border-white/30 text-transparent'
                            }`}
                            title={`Toggle ${habit.name} on ${dateStr}`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </td>
                      );
                    })}

                    {/* Completion rate */}
                    <td className="py-3 px-3 text-right">
                      <span className="text-xs font-mono font-semibold text-cyan-400">
                        {habit.completion_rate}%
                      </span>
                    </td>

                    {/* Streak badge */}
                    <td className="py-3 px-3 text-right">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 inline-flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {habit.current_streak}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. 30-Day Momentum Density Heatmap (matching image 6) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-headline font-bold text-lg text-white">30-Day Momentum Density</h3>
            <p className="text-xs text-white/50">Continuous daily check-in intensity</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-cyan-400 font-bold">{activeCheckinRate}% Active Days</span>
            <div className="flex items-center gap-1.5 text-white/40">
              <span>Less</span>
              <span className="w-3 h-3 rounded bg-white/5 border border-white/10" />
              <span className="w-3 h-3 rounded bg-cyan-900/60 border border-cyan-800" />
              <span className="w-3 h-3 rounded bg-cyan-600/80 border border-cyan-500" />
              <span className="w-3 h-3 rounded bg-cyan-400 border border-cyan-300 glow-cyan" />
              <span>More</span>
            </div>
          </div>
        </div>

        {heatmapDays.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/40 font-mono">
            No historical records yet.
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2 pt-2">
            {heatmapDays.map((day) => {
              let bgClass = 'bg-white/5 border-white/5';
              if (day.intensity === 1) bgClass = 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300';
              if (day.intensity === 2) bgClass = 'bg-cyan-600/60 border-cyan-500/80 text-white';
              if (day.intensity === 3) bgClass = 'bg-cyan-400 border-cyan-300 text-black font-bold glow-cyan';

              return (
                <div
                  key={day.date}
                  id={`heatmap-day-${day.date}`}
                  className={`aspect-square rounded-xl border p-1.5 flex flex-col justify-between transition-all hover:scale-105 ${bgClass}`}
                  title={`${day.date}: ${day.count} habits completed`}
                >
                  <span className="text-[9px] font-mono opacity-60 leading-none">
                    {day.dayNumber}
                  </span>
                  <span className="text-[11px] font-mono text-center font-bold">
                    {day.count > 0 ? day.count : '·'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

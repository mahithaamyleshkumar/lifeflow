import React from 'react';
import { X, Sun, CheckCircle2, Flame, Target, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Activity, Habit } from '../types';

interface MorningPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  habits: Habit[];
  currentStreak: number;
}

export const MorningPlanModal: React.FC<MorningPlanModalProps> = ({
  isOpen,
  onClose,
  activities,
  habits,
  currentStreak
}) => {
  if (!isOpen) return null;

  const handleStartMyDay = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4cd7f6', '#06b6d4', '#d0bcff', '#ffb95f']
      });
    } catch (e) {}
    onClose();
  };

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="morning-plan-modal"
        className="relative w-full max-w-xl bg-[#191b23] border border-white/10 rounded-3xl p-7 shadow-2xl text-[#e1e2ec]"
      >
        <button
          id="close-morning-plan-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center glow-amber">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Morning Protocol — {todayDateFormatted}
            </div>
            <h2 className="text-xl font-headline font-bold text-white">Daily Activation Briefing</h2>
          </div>
        </div>

        {/* Streak banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-cyan-500/10 border border-amber-500/20 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-white/60 font-mono">Continuous Cadence</div>
              <div className="text-sm font-bold text-white">
                {currentStreak > 0 ? `${currentStreak}-Day Active Streak` : 'Day 1: Momentum Ignited'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50 font-mono">Today's Target</div>
            <div className="text-sm font-bold text-cyan-400">4h Deep Focus</div>
          </div>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {/* Today's scheduled focus tasks */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-2">
              <span className="uppercase tracking-wider">Scheduled Focus Blocks ({activities.length})</span>
            </div>
            {activities.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#10131a] border border-white/5 text-center text-xs text-white/40">
                No focus blocks scheduled for today yet. Use Quick-Add to plan your primary focus.
              </div>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 4).map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-[#10131a] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: act.category_color || '#06B6D4' }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">{act.title}</div>
                        <div className="text-[11px] text-white/50">
                          {act.start_time || 'Flexible'} • {act.duration_minutes}m • {act.category_name || 'Focus'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-white/60">
                      {act.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anchor habits */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-2">
              <span className="uppercase tracking-wider">Anchor Routine Habits ({habits.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {habits.slice(0, 4).map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-xl bg-[#10131a] border border-white/5 flex items-center gap-2 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan-400/60" />
                  <span className="truncate text-white/80 font-medium">{h.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-white/50 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Intentionality is the antidote to drift.
          </p>
          <button
            id="start-my-day-btn"
            onClick={handleStartMyDay}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-black font-semibold text-xs tracking-wide transition-all shadow-lg shadow-cyan-400/25 flex items-center gap-2"
          >
            Start My Day <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

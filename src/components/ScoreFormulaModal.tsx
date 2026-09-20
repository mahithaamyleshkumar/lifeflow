import React from 'react';
import { X, HelpCircle, CheckCircle2, Flame, Timer, CheckSquare, Sparkles } from 'lucide-react';
import { ProductivityScoreBreakdown } from '../types';

interface ScoreFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown?: ProductivityScoreBreakdown['components'];
  totalScore: number;
}

export const ScoreFormulaModal: React.FC<ScoreFormulaModalProps> = ({
  isOpen,
  onClose,
  breakdown,
  totalScore
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="score-formula-modal"
        className="relative w-full max-w-xl bg-[#191b23] border border-white/10 rounded-2xl p-6 shadow-2xl text-[#e1e2ec] overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-semibold text-lg text-white">Productivity Index Telemetry</h3>
              <p className="text-xs text-white/50">Mathematical calibration & weight distribution</p>
            </div>
          </div>
          <button
            id="close-formula-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 p-4 rounded-xl bg-[#10131a] border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50 font-mono">Current Live Score</div>
            <div className="text-3xl font-headline font-bold text-cyan-400 mt-0.5">{totalScore}<span className="text-sm font-normal text-white/40"> / 100</span></div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60">Formula Transparency</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" /> 100% Calculated From Your Real Actions
            </div>
          </div>
        </div>

        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {/* 1. Completion */}
          <div className="p-3.5 rounded-xl bg-[#1d1f27] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-sm text-cyan-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Completion Depth (40% Weight)
              </div>
              <span className="font-mono text-sm font-semibold text-white">
                {breakdown?.completion.score ?? 0} / 40 pts
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Calculated as <code className="text-cyan-300 font-mono text-[11px]">(completed_activities / total_planned_activities) * 40</code>.
              Reflects task execution closure.
            </p>
            <div className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/30 px-2.5 py-1 rounded-md border border-cyan-800/30">
              Live status: {breakdown?.completion.detail || '0/0 tasks completed'}
            </div>
          </div>

          {/* 2. Consistency */}
          <div className="p-3.5 rounded-xl bg-[#1d1f27] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-sm text-amber-300">
                <Flame className="w-4 h-4 text-amber-400" />
                Consistency Habit Index (30% Weight)
              </div>
              <span className="font-mono text-sm font-semibold text-white">
                {breakdown?.consistency.score ?? 0} / 30 pts
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Calculated as <code className="text-amber-300 font-mono text-[11px]">min(30, (current_streak / 7) * 30)</code>.
              Rewards continuous daily momentum without breaks.
            </p>
            <div className="text-[11px] font-mono text-amber-400/80 bg-amber-950/30 px-2.5 py-1 rounded-md border border-amber-800/30">
              Live status: {breakdown?.consistency.detail || '0-day streak'}
            </div>
          </div>

          {/* 3. Focus Time */}
          <div className="p-3.5 rounded-xl bg-[#1d1f27] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-sm text-violet-300">
                <Timer className="w-4 h-4 text-violet-400" />
                Focus Density Engine (20% Weight)
              </div>
              <span className="font-mono text-sm font-semibold text-white">
                {breakdown?.focusTime.score ?? 0} / 20 pts
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Calculated as <code className="text-violet-300 font-mono text-[11px]">min(20, (focus_minutes / 240) * 20)</code>.
              Measures high-immersion deep cognitive output against 4-hour daily target.
            </p>
            <div className="text-[11px] font-mono text-violet-400/80 bg-violet-950/30 px-2.5 py-1 rounded-md border border-violet-800/30">
              Live status: {breakdown?.focusTime.detail || '0m / 240m logged'}
            </div>
          </div>

          {/* 4. Routines */}
          <div className="p-3.5 rounded-xl bg-[#1d1f27] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-sm text-emerald-300">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Routine Adherence (10% Weight)
              </div>
              <span className="font-mono text-sm font-semibold text-white">
                {breakdown?.routines.score ?? 0} / 10 pts
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Calculated as <code className="text-emerald-300 font-mono text-[11px]">(completed_habits / total_active_habits) * 10</code>.
              Rewards completing your daily anchor habits.
            </p>
            <div className="text-[11px] font-mono text-emerald-400/80 bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-800/30">
              Live status: {breakdown?.routines.detail || '0 active routines'}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
          <button
            id="dismiss-formula-modal-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-colors shadow-lg shadow-cyan-500/20"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

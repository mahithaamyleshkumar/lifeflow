import React, { useState, useEffect } from 'react';
import { X, Moon, Sparkles, CheckCircle2, Heart, Award, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { DailyReflection } from '../types';

interface EveningReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  completedTasksCount: number;
  totalTasksCount: number;
  focusMinutes: number;
}

export const EveningReviewModal: React.FC<EveningReviewModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  completedTasksCount,
  totalTasksCount,
  focusMinutes
}) => {
  const [wentWell, setWentWell] = useState('');
  const [wasDifficult, setWasDifficult] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [gratefulFor, setGratefulFor] = useState('');
  const [tomorrowPriority, setTomorrowPriority] = useState('');
  const [moodRating, setMoodRating] = useState(8);
  const [energyRating, setEnergyRating] = useState(7);
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      api.getReflection(todayStr).then((refl) => {
        if (refl) {
          setWentWell(refl.went_well || '');
          setWasDifficult(refl.was_difficult || '');
          setToImprove(refl.to_improve || '');
          setGratefulFor(refl.grateful_for || '');
          setTomorrowPriority(refl.tomorrow_priority || '');
          if (refl.mood_rating) setMoodRating(refl.mood_rating);
          if (refl.energy_rating) setEnergyRating(refl.energy_rating);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveReflection({
        date: todayStr,
        went_well: wentWell,
        was_difficult: wasDifficult,
        to_improve: toImprove,
        grateful_for: gratefulFor,
        tomorrow_priority: tomorrowPriority,
        mood_rating: moodRating,
        energy_rating: energyRating
      });

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d0bcff', '#8b5cf6', '#4cd7f6']
        });
      } catch (e) {}

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save reflection');
    } finally {
      setSaving(false);
    }
  };

  const focusHours = Math.floor(focusMinutes / 60);
  const focusRem = focusMinutes % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="evening-review-modal"
        className="relative w-full max-w-xl bg-[#191b23] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-[#e1e2ec]"
      >
        <button
          id="close-evening-review-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center glow-violet">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-purple-400 font-semibold">
              Evening Decompression & Synthesis
            </div>
            <h2 className="text-xl font-headline font-bold text-white">Reflect & Ground</h2>
          </div>
        </div>

        {/* Daily closure stats */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#10131a] border border-white/5 mb-5 text-center">
          <div>
            <div className="text-[11px] font-mono text-white/50">Tasks Completed</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">
              {completedTasksCount}/{totalTasksCount}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-white/50">Focus Logged</div>
            <div className="text-base font-bold text-purple-400 mt-0.5">
              {focusHours}h {focusRem}m
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-white/50">Introspection</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              Daily Debrief
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-mono text-white/70 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              1. What went exceptionally well today?
            </label>
            <textarea
              id="reflection-went-well"
              rows={2}
              placeholder="e.g. Protected deep morning block, zero notifications during architecture sprint..."
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-white/70 mb-1 flex items-center gap-1.5">
              <span className="text-amber-400">2.</span> What was difficult or where was attention lost?
            </label>
            <textarea
              id="reflection-was-difficult"
              rows={2}
              placeholder="e.g. Afternoon context switching between Slack messages and paper review..."
              value={wasDifficult}
              onChange={(e) => setWasDifficult(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-white/70 mb-1 flex items-center gap-1.5">
              <span className="text-purple-400">3.</span> What will you calibrate or improve tomorrow?
            </label>
            <textarea
              id="reflection-to-improve"
              rows={2}
              placeholder="e.g. Put phone in another room during the 15:00 study interval..."
              value={toImprove}
              onChange={(e) => setToImprove(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-pink-400" /> 4. Grateful For
              </label>
              <input
                id="reflection-grateful"
                type="text"
                placeholder="Clean mind, supportive team..."
                value={gratefulFor}
                onChange={(e) => setGratefulFor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" /> 5. Tomorrow's #1 Priority
              </label>
              <input
                id="reflection-tomorrow-priority"
                type="text"
                placeholder="Finalize latency schema test..."
                value={tomorrowPriority}
                onChange={(e) => setTomorrowPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex justify-between text-xs text-white/60 mb-1 font-mono">
                <span>Subjective Mood:</span>
                <span className="text-cyan-400 font-bold">{moodRating}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={moodRating}
                onChange={(e) => setMoodRating(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-white/60 mb-1 font-mono">
                <span>Vital Energy:</span>
                <span className="text-purple-400 font-bold">{energyRating}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energyRating}
                onChange={(e) => setEnergyRating(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white"
            >
              Skip For Now
            </button>
            <button
              id="save-evening-reflection-btn"
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-500/25 flex items-center gap-1.5"
            >
              {saving ? 'Recording...' : 'Lock In Daily Reflection'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

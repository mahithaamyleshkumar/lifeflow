import React, { useEffect, useRef } from 'react';
import {
  Flame,
  Shield,
  Crown,
  Sparkles,
  Award,
  Trophy,
  X,
  Compass,
  ArrowRight
} from 'lucide-react';
import { StreakAchievement } from '../types';

interface StreakCelebrationModalProps {
  milestone: StreakAchievement | null;
  onClose: () => void;
  onViewJourney: () => void;
}

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  milestone,
  onClose,
  onViewJourney
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!milestone) return;

    // Subtle particle burst on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
      shape: 'circle' | 'star';
    }

    const colors = ['#06B6D4', '#38BDF8', '#818CF8', '#F59E0B', '#F43F5E', '#10B981'];
    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 40;

    for (let i = 0; i < 65; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.01,
        shape: Math.random() > 0.5 ? 'star' : 'circle'
      });
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      for (const p of particles) {
        if (p.alpha <= 0) continue;
        aliveCount++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // subtle gravity
        p.vx *= 0.98;
        p.alpha = Math.max(0, p.alpha - p.decay);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'star') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (aliveCount > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    // Synthesize subtle soft triumphant chord with Web Audio API (graceful fallback if blocked)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 major chord
        frequencies.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.04, audioCtx.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + idx * 0.06);
          osc.stop(audioCtx.currentTime + 1.3);
        });
      }
    } catch {
      // Audio context might be restricted before gesture
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [milestone]);

  if (!milestone) return null;

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'flame':
        return Flame;
      case 'shield':
        return Shield;
      case 'crown':
        return Crown;
      case 'sparkles':
        return Sparkles;
      case 'award':
        return Award;
      case 'trophy':
      default:
        return Trophy;
    }
  };

  const Icon = getBadgeIcon(milestone.badge);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background celebration particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      <div className="relative z-20 w-full max-w-md rounded-3xl bg-[#191b23] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-6 overflow-hidden">
        {/* Glowing backdrop halo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-30"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Emblem */}
        <div className="relative inline-flex items-center justify-center mt-2">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 blur-md opacity-75 animate-ping duration-1000" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-xl glow-cyan flex items-center justify-center">
            <div className="w-full h-full bg-[#10131a] rounded-[14px] flex items-center justify-center text-cyan-300">
              <Icon className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Achievement Tag */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Streak Milestone Achieved</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-headline font-bold text-white tracking-tight pt-1">
            {milestone.title}
          </h3>

          <div className="text-xs font-mono text-cyan-400 font-semibold">
            {milestone.entityName} • {milestone.targetDays} Days Unbroken
          </div>

          <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed pt-1">
            {milestone.description}
          </p>
        </div>

        {/* Real Data Guarantee Proof Pill */}
        <div className="p-3 rounded-xl bg-[#10131a] border border-white/5 flex items-center justify-between text-xs font-mono">
          <span className="text-white/40">Verified Record</span>
          <span className="text-emerald-400 font-semibold">
            {milestone.unlockedDate ? `Unlocked on ${milestone.unlockedDate}` : 'Active & Verified'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-semibold transition-all"
          >
            Continue Flowing
          </button>
          <button
            onClick={() => {
              onClose();
              onViewJourney();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-400/20"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>View in Journey</span>
          </button>
        </div>
      </div>
    </div>
  );
};

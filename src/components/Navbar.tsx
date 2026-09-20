import React from 'react';
import { Sun, Moon, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenMorningPlan: () => void;
  onOpenEveningReview: () => void;
  onRefreshData: () => void;
  hasData: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMorningPlan,
  onOpenEveningReview,
  onRefreshData
}) => {
  const { user } = useAuth();

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header
      id="top-navbar"
      className="sticky top-0 z-30 w-full bg-[#10131a]/85 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-3.5 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        {/* Mobile Brand indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            ∞
          </div>
          <span className="font-headline font-bold text-white tracking-tight">LifeFlow</span>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400/80 bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-800/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            TELEMETRY ACTIVE
          </span>
          <span className="text-xs text-white/40 font-mono">•</span>
          <span className="text-xs text-white/60 font-mono">{todayFormatted}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Action buttons for mobile / tablet */}
        <button
          id="nav-morning-plan-btn"
          onClick={onOpenMorningPlan}
          className="lg:hidden p-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20"
          title="Morning Plan"
        >
          <Sun className="w-4 h-4" />
        </button>

        <button
          id="nav-evening-review-btn"
          onClick={onOpenEveningReview}
          className="lg:hidden p-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20"
          title="Evening Review"
        >
          <Moon className="w-4 h-4" />
        </button>

        <button
          id="nav-refresh-btn"
          onClick={onRefreshData}
          className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          title="Sync Telemetry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

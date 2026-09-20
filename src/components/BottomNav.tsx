import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Plus,
  CheckSquare,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenQuickAdd: () => void;
  onToggleMoreMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenQuickAdd,
  onToggleMoreMenu
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#10131a]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          id="mobile-nav-today"
          onClick={() => onSelectView('today')}
          className={`flex flex-col items-center gap-1 p-1 transition-all ${
            currentView === 'today' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Today</span>
        </button>

        <button
          id="mobile-nav-timeline"
          onClick={() => onSelectView('timeline')}
          className={`flex flex-col items-center gap-1 p-1 transition-all ${
            currentView === 'timeline' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-medium">Flow</span>
        </button>

        {/* Center Glowing Action Button */}
        <div className="relative -top-3">
          <button
            id="mobile-nav-quick-add"
            onClick={onOpenQuickAdd}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-cyan-300 text-black flex items-center justify-center shadow-lg shadow-cyan-400/40 hover:scale-105 active:scale-95 transition-all"
            aria-label="Quick Add"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button
          id="mobile-nav-habits"
          onClick={() => onSelectView('habits')}
          className={`flex flex-col items-center gap-1 p-1 transition-all ${
            currentView === 'habits' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Habits</span>
        </button>

        <button
          id="mobile-nav-insights"
          onClick={() => onSelectView('insights')}
          className={`flex flex-col items-center gap-1 p-1 transition-all ${
            currentView === 'insights' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-medium">Improving</span>
        </button>

        <button
          id="mobile-nav-more"
          onClick={onToggleMoreMenu}
          className="flex flex-col items-center gap-1 p-1 text-white/40 hover:text-white/70 transition-all"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
};

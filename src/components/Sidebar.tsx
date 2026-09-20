import React from 'react';
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  TrendingUp,
  Calendar,
  Compass,
  History,
  Settings,
  Plus,
  Flame,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenQuickAdd: () => void;
  onOpenMorningPlan: () => void;
  onOpenEveningReview: () => void;
  streak: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenQuickAdd,
  onOpenMorningPlan,
  onOpenEveningReview,
  streak
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'today', label: 'Today Cockpit', icon: LayoutDashboard },
    { id: 'timeline', label: "Today's Flow", icon: Clock },
    { id: 'habits', label: 'Habit Matrix', icon: CheckSquare },
    { id: 'insights', label: 'Am I Improving?', icon: TrendingUp, badge: 'AI' },
    { id: 'calendar', label: 'Calendar Planner', icon: Calendar },
    { id: 'journey', label: 'LifeFlow Journey', icon: Compass },
    { id: 'history', label: 'Activity Logs', icon: History },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#10131a] border-r border-white/5 p-4 z-40 select-none"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-4">
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 p-[1px] glow-cyan">
          <div className="w-full h-full bg-[#10131a] rounded-[11px] flex items-center justify-center">
            {/* Custom Infinity Mark */}
            <span className="text-cyan-400 font-bold text-xl leading-none">∞</span>
          </div>
        </div>
        <div>
          <div className="font-headline font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
            LifeFlow
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              v2.6
            </span>
          </div>
          <div className="text-[11px] text-white/40 font-mono tracking-wider">INTELLIGENCE ENGINE</div>
        </div>
      </div>

      {/* Streak Badge pill */}
      <button
        onClick={() => onSelectView('journey')}
        className="mx-2 mb-5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-cyan-500/10 border border-amber-500/20 hover:border-cyan-400/40 transition-all flex items-center justify-between group text-left"
        title="View LifeFlow Journey & Streak Milestones"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-white/50 group-hover:text-cyan-300 transition-colors">Active Cadence</div>
            <div className="text-xs font-bold text-white font-mono">{streak}-Day Streak</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">Journey →</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </button>

      {/* Quick Add CTA */}
      <div className="px-2 mb-4">
        <button
          id="sidebar-quick-add-btn"
          onClick={onOpenQuickAdd}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-400/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Quick Log / Task</span>
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 px-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-white/40'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Routine Triggers */}
      <div className="pt-3 border-t border-white/5 space-y-2 px-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            id="sidebar-morning-plan-btn"
            onClick={onOpenMorningPlan}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[11px] font-medium transition-all"
            title="Morning Activation Briefing"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Morning</span>
          </button>
          <button
            id="sidebar-evening-review-btn"
            onClick={onOpenEveningReview}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[11px] font-medium transition-all"
            title="Evening Reflection Debrief"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Evening</span>
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#191b23] border border-white/5 mt-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs uppercase flex-shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name || 'My Account'}</div>
              <div className="text-[10px] text-white/40 truncate font-mono">{user?.email || 'Logged In'}</div>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to log out of LifeFlow?')) {
                logout();
              }
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

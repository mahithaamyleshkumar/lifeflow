import React, { useState } from 'react';
import {
  Settings,
  Trash2,
  CheckCircle2,
  User,
  Shield,
  LogOut,
  Sparkles,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsViewProps {
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefresh }) => {
  const { user, logout, resetToEmptyData } = useAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleResetToEmpty = async () => {
    if (!confirm('Clear your activities, habits, and reflections to start with a completely fresh canvas?')) return;
    setLoadingAction('reset');
    try {
      await resetToEmptyData();
      setStatusMsg('Your account canvas has been cleared. Fresh start initialized.');
      onRefresh();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 lg:pb-8">
      {/* 1. Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
          <Settings className="w-4 h-4" />
          SYSTEM CONFIGURATION
        </div>
        <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight">
          Settings & Account
        </h1>
        <p className="text-xs text-white/50 mt-1">
          Manage your authenticated session, data integrity, and telemetry preferences
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 2. User Account */}
      <div className="p-6 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-base text-white">Your Account</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Authenticated Session Active
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#10131a] border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 p-[1px]">
              <div className="w-full h-full bg-[#10131a] rounded-[15px] flex items-center justify-center text-cyan-300 font-bold text-lg uppercase">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-white font-headline">{user?.name || 'User'}</div>
              <div className="text-xs text-white/50 font-mono">{user?.email || 'Logged in'}</div>
              <div className="text-[10px] text-cyan-400 font-mono mt-1">
                Database: PostgreSQL Cloud • Timezone: {user?.timezone || 'America/Los_Angeles'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* 3. Streak & Cadence Engine Integrity */}
      <div className="p-6 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-base text-white">
              Data Integrity & Real Records Guarantee
            </h3>
            <p className="text-xs text-white/50">
              LIFEFlow calculates 100% of daily, habit, and category streaks from persistent database completions
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#10131a] border border-white/5 space-y-3">
          <p className="text-xs text-white/70 leading-relaxed">
            Every streak number, milestone celebration, and velocity graph is dynamically computed from actual database records. If you ever wish to restart your journey with a clean slate:
          </p>
          <div className="pt-1">
            <button
              onClick={handleResetToEmpty}
              disabled={loadingAction !== null}
              className="p-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>{loadingAction === 'reset' ? 'Wiping...' : 'Reset My Activities & Start Fresh'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

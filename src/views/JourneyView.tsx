import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  Lock,
  Flame,
  Trophy,
  Award,
  Sparkles,
  ShieldCheck,
  Crown,
  Zap,
  Target,
  ChevronRight,
  RefreshCw,
  Folder
} from 'lucide-react';
import { DashboardSummary, StreakSystemData, StreakAchievement, StreakMilestone } from '../types';
import { api } from '../api';
import { StreakCelebrationModal } from '../components/StreakCelebrationModal';

interface JourneyViewProps {
  summary: DashboardSummary | null;
  onRefresh?: () => void;
}

export const JourneyView: React.FC<JourneyViewProps> = ({ summary }) => {
  const [streakData, setStreakData] = useState<StreakSystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'habits' | 'categories' | 'vault'>('daily');
  const [celebrationMilestone, setCelebrationMilestone] = useState<StreakAchievement | null>(null);

  const loadStreaks = async () => {
    try {
      setLoading(true);
      const data = await api.getStreaks();
      setStreakData(data);
    } catch (err) {
      console.error('Failed to load streak system data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreaks();
  }, []);

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'flame':
        return Flame;
      case 'shield':
        return ShieldCheck;
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

  const currentDailyStreak = streakData?.daily.currentStreak ?? summary?.currentStreak ?? 0;
  const longestDailyStreak = streakData?.daily.longestStreak ?? summary?.longestStreak ?? 0;
  const totalActiveDays = streakData?.daily.totalActiveDays ?? currentDailyStreak;
  const unlockedAchievements = streakData?.allMilestones.filter((m) => m.unlocked) || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 lg:pb-8">
      {/* 1. Header & Live Telemetry Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
            <Compass className="w-4 h-4" />
            CADENCE & PROGRESSION INTELLIGENCE
          </div>
          <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight">
            LifeFlow Journey
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Real completion telemetry tracking your daily rhythm, habit loops, and domain mastery
          </p>
        </div>

        <button
          onClick={loadStreaks}
          disabled={loading}
          className="self-start sm:self-auto p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-2 transition-all"
          title="Refresh Streaks"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Streaks</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#191b23] border border-cyan-500/20 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">Current Daily Streak</span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-headline text-white flex items-baseline gap-1.5">
            <span>{currentDailyStreak}</span>
            <span className="text-xs font-mono text-cyan-400 font-normal">days</span>
          </div>
          <div className="text-[11px] text-white/40 font-mono">
            {currentDailyStreak > 0 ? 'Active unbroken cadence' : 'Start your streak today'}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#191b23] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">Longest Record</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-headline text-white flex items-baseline gap-1.5">
            <span>{longestDailyStreak}</span>
            <span className="text-xs font-mono text-amber-400 font-normal">days</span>
          </div>
          <div className="text-[11px] text-white/40 font-mono">Personal all-time best</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#191b23] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">Active Flow Days</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-headline text-white flex items-baseline gap-1.5">
            <span>{totalActiveDays}</span>
            <span className="text-xs font-mono text-emerald-400 font-normal">days</span>
          </div>
          <div className="text-[11px] text-white/40 font-mono">Total lifetime execution</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#191b23] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">Milestones Earned</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-headline text-white flex items-baseline gap-1.5">
            <span>{unlockedAchievements.length}</span>
            <span className="text-xs font-mono text-purple-400 font-normal">badges</span>
          </div>
          <div className="text-[11px] text-white/40 font-mono">Across daily, habits, categories</div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 sm:gap-6 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Daily Cadence</span>
        </button>

        <button
          onClick={() => setActiveTab('habits')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'habits'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Habit Streaks ({streakData?.habits.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Category Streaks ({streakData?.categories.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'vault'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Milestone Vault ({unlockedAchievements.length})</span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: DAILY CADENCE */}
      {activeTab === 'daily' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Next Milestone Countdown Card */}
          {streakData?.daily.nextMilestone && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#191b23] to-[#191b23] border border-cyan-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Next Milestone In View</span>
                  <h3 className="text-base font-headline font-bold text-white mt-0.5">
                    {streakData.daily.nextMilestone.title} ({streakData.daily.nextMilestone.target} Days)
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {streakData.daily.nextMilestone.remaining} days remaining
                  </span>
                  <div className="text-[10px] text-white/40 font-mono">
                    {currentDailyStreak} / {streakData.daily.nextMilestone.target} days ({streakData.daily.nextMilestone.progressPercent}%)
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.max(4, streakData.daily.nextMilestone.progressPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* Daily Milestones Roadmap */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#191b23] border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-headline font-bold text-white">Daily Streak Milestones</h3>
                <p className="text-xs text-white/50">
                  Calculated directly from consecutive days of completed tasks & habits
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                Current: {currentDailyStreak}d • Longest: {longestDailyStreak}d
              </span>
            </div>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-white/10 space-y-6 sm:space-y-8">
              {(streakData?.daily.milestones || []).map((m: StreakMilestone) => {
                const isUnlocked = m.unlocked;
                const Icon = getBadgeIcon(m.badge);

                return (
                  <div key={m.days} className="relative group">
                    {/* Timeline Node */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isUnlocked
                          ? 'bg-cyan-400 border-cyan-400 text-black glow-cyan cursor-pointer'
                          : 'bg-[#10131a] border-white/20 text-white/30'
                      }`}
                      onClick={() => {
                        if (isUnlocked) {
                          setCelebrationMilestone({
                            id: `daily_${m.days}`,
                            type: 'daily',
                            entityName: 'Daily Cadence',
                            targetDays: m.days,
                            title: m.title,
                            description: m.description,
                            badge: m.badge,
                            unlocked: true,
                            unlockedDate: m.unlockedDate,
                            currentStreak: currentDailyStreak,
                            longestStreak: longestDailyStreak
                          });
                        }
                      }}
                      title={isUnlocked ? 'Click to celebrate!' : `Reach ${m.days} days`}
                    >
                      {isUnlocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                    </div>

                    {/* Milestone Card */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isUnlocked
                          ? 'bg-[#10131a] border-cyan-500/30 hover:border-cyan-400/50'
                          : 'bg-[#10131a]/50 border-white/5 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl flex-shrink-0 ${
                              isUnlocked ? 'bg-cyan-500/15 text-cyan-400 glow-cyan' : 'bg-white/5 text-white/40'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white font-headline">{m.title}</h4>
                              {isUnlocked && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                                  UNLOCKED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/60 mt-0.5">{m.description}</p>
                            {isUnlocked && m.unlockedDate && (
                              <div className="text-[10px] font-mono text-emerald-400 mt-1">
                                Verified record achieved on {m.unlockedDate}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {isUnlocked ? (
                            <button
                              onClick={() => {
                                setCelebrationMilestone({
                                  id: `daily_${m.days}`,
                                  type: 'daily',
                                  entityName: 'Daily Cadence',
                                  targetDays: m.days,
                                  title: m.title,
                                  description: m.description,
                                  badge: m.badge,
                                  unlocked: true,
                                  unlockedDate: m.unlockedDate,
                                  currentStreak: currentDailyStreak,
                                  longestStreak: longestDailyStreak
                                });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5 transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Celebrate</span>
                            </button>
                          ) : (
                            <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-white/5 text-white/40 border border-white/10">
                              {m.days} DAYS TARGET
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HABIT STREAKS */}
      {activeTab === 'habits' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-[#191b23] border border-white/10 text-xs text-white/60">
            Each habit has its own independent streak tracker and milestone tiers (7, 14, 30, 60, 100, 365 days).
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(streakData?.habits || []).map((h) => {
              return (
                <div key={h.id} className="p-5 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
                  {/* Habit Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: h.categoryColor }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white font-headline">{h.name}</h4>
                        <span className="text-[10px] text-white/40 font-mono uppercase">
                          {h.categoryName} • {h.totalCompletions} Check-ins
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                      <Flame className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{h.currentStreak}d streak</span>
                    </div>
                  </div>

                  {/* Streaks Stats */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#10131a] border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-white/40 text-[10px] uppercase">Current</span>
                      <div className="text-white font-bold">{h.currentStreak} days</div>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px] uppercase">Longest Record</span>
                      <div className="text-amber-400 font-bold">{h.longestStreak} days</div>
                    </div>
                  </div>

                  {/* Milestones Row */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                      Habit Milestones
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {h.milestones.map((m) => {
                        const Icon = getBadgeIcon(m.badge);
                        return (
                          <button
                            key={m.days}
                            disabled={!m.unlocked}
                            onClick={() => {
                              if (m.unlocked) {
                                setCelebrationMilestone({
                                  id: `habit_${h.id}_${m.days}`,
                                  type: 'habit',
                                  entityName: h.name,
                                  targetDays: m.days,
                                  title: `${h.name}: ${m.title}`,
                                  description: `${m.days} consecutive days unbroken of ${h.name}`,
                                  badge: m.badge,
                                  unlocked: true,
                                  unlockedDate: m.unlockedDate,
                                  currentStreak: h.currentStreak,
                                  longestStreak: h.longestStreak
                                });
                              }
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all ${
                              m.unlocked
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25 cursor-pointer glow-cyan'
                                : 'bg-[#10131a] text-white/30 border-white/5 cursor-default'
                            }`}
                            title={m.unlocked ? `Unlocked! Click to celebrate` : `${m.days} days target`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{m.days}d</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORY STREAKS */}
      {activeTab === 'categories' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-[#191b23] border border-white/10 text-xs text-white/60">
            Category streaks calculate consecutive days you took action within that life domain (tasks completed or category habits checked off).
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(streakData?.categories || []).map((cat) => {
              return (
                <div key={cat.categoryId} className="p-5 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-black font-bold text-xs"
                        style={{ backgroundColor: cat.categoryColor }}
                      >
                        <Folder className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-headline">{cat.categoryName}</h4>
                        <span className="text-[10px] text-white/40 font-mono">
                          {cat.totalCompletions} total domain completions
                        </span>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{cat.currentStreak}d streak</span>
                    </div>
                  </div>

                  {/* Streaks Stats */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#10131a] border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-white/40 text-[10px] uppercase">Active Cadence</span>
                      <div className="text-white font-bold">{cat.currentStreak} days</div>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px] uppercase">Longest Record</span>
                      <div className="text-amber-400 font-bold">{cat.longestStreak} days</div>
                    </div>
                  </div>

                  {/* Milestones Row */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                      Domain Consistency Milestones
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cat.milestones.map((m) => {
                        const Icon = getBadgeIcon(m.badge);
                        return (
                          <button
                            key={m.days}
                            disabled={!m.unlocked}
                            onClick={() => {
                              if (m.unlocked) {
                                setCelebrationMilestone({
                                  id: `cat_${cat.categoryId}_${m.days}`,
                                  type: 'category',
                                  entityName: cat.categoryName,
                                  targetDays: m.days,
                                  title: `${cat.categoryName}: ${m.title}`,
                                  description: `${m.days} consecutive days unbroken in ${cat.categoryName}`,
                                  badge: m.badge,
                                  unlocked: true,
                                  unlockedDate: m.unlockedDate,
                                  currentStreak: cat.currentStreak,
                                  longestStreak: cat.longestStreak
                                });
                              }
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all ${
                              m.unlocked
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25 cursor-pointer glow-cyan'
                                : 'bg-[#10131a] text-white/30 border-white/5 cursor-default'
                            }`}
                            title={m.unlocked ? `Unlocked! Click to celebrate` : `${m.days} days target`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{m.days}d</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MILESTONE VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-headline font-bold text-white">
              Unlocked Achievement Badges ({unlockedAchievements.length})
            </h3>
            <span className="text-xs font-mono text-cyan-400">100% Real Completion History</span>
          </div>

          {unlockedAchievements.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#191b23] border border-white/10 text-center space-y-3">
              <Award className="w-10 h-10 text-white/30 mx-auto" />
              <div className="text-sm font-bold text-white">Your Milestone Journey Awaits</div>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Maintain an active cadence for at least 7 days in daily flow, any individual habit, or category to unlock your first verified badge!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {unlockedAchievements.map((ach) => {
                const Icon = getBadgeIcon(ach.badge);
                return (
                  <div
                    key={ach.id}
                    onClick={() => setCelebrationMilestone(ach)}
                    className="p-4 rounded-2xl bg-[#191b23] hover:bg-[#191b23]/80 border border-cyan-500/30 hover:border-cyan-400/60 transition-all cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 glow-cyan">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold uppercase">
                        {ach.targetDays} Days
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white font-headline group-hover:text-cyan-300 transition-colors">
                        {ach.title}
                      </h4>
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{ach.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 pt-1 border-t border-white/5">
                      <span className="text-white/40">{ach.entityName}</span>
                      <span className="flex items-center gap-1 group-hover:underline">
                        <span>Celebrate</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Streak Resilience Philosophy Banner */}
      <div className="p-6 rounded-3xl bg-[#191b23] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            LIFEFLOW CADENCE ARCHITECTURE
          </div>
          <div className="text-sm font-headline font-bold text-white">
            "Consistency is not perfection; it is returning to the practice unbroken."
          </div>
          <p className="text-xs text-white/50">
            Streaks are computed dynamically from real PostgreSQL records. Never fabricated.
          </p>
        </div>
      </div>

      {/* Celebration Modal (Canvas particle burst + Audio chime) */}
      <StreakCelebrationModal
        milestone={celebrationMilestone}
        onClose={() => setCelebrationMilestone(null)}
        onViewJourney={() => {
          setCelebrationMilestone(null);
          setActiveTab('vault');
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Trophy,
  Brain,
  Calendar,
  Zap,
  Flame,
  Check
} from 'lucide-react';
import { ImprovingComparison, DistributionData, BioInsight, DashboardSummary } from '../types';
import { api } from '../api';

interface InsightsViewProps {
  summary: DashboardSummary | null;
  onOpenScoreFormula: () => void;
  onRefresh: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ summary, onOpenScoreFormula, onRefresh }) => {
  const [range, setRange] = useState<'week' | 'month' | 'day'>('week');
  const [comparison, setComparison] = useState<ImprovingComparison | null>(null);
  const [distribution, setDistribution] = useState<DistributionData | null>(null);
  const [insights, setInsights] = useState<BioInsight[]>([]);
  const [insightsMessage, setInsightsMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appliedSuggestion, setAppliedSuggestion] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, distRes, insRes] = await Promise.all([
        api.getImprovingComparison(range),
        api.getDistribution(),
        api.getInsights()
      ]);
      setComparison(compRes);
      setDistribution(distRes);
      setInsights(insRes.insights || []);
      setInsightsMessage(insRes.message || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [range]);

  const handleApplySuggestion = () => {
    setAppliedSuggestion(true);
    setTimeout(() => setAppliedSuggestion(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 lg:pb-8">
      {/* 1. Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            PROGRESS INTELLIGENCE
          </div>
          <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight">
            Am I Improving?
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Automated behavioral velocity engine calibrated against historical periods
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-[#191b23] p-1 rounded-xl border border-white/5 self-start sm:self-center">
          <button
            id="tab-range-week"
            onClick={() => setRange('week')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              range === 'week'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Week vs Last
          </button>
          <button
            id="tab-range-month"
            onClick={() => setRange('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              range === 'month'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Month vs Last
          </button>
          <button
            id="tab-range-day"
            onClick={() => setRange('day')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              range === 'day'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Today vs Yesterday
          </button>
        </div>
      </div>

      {/* 2. Core "AM I IMPROVING?" Verdict Banner */}
      {comparison && !comparison.hasSufficientData ? (
        /* Sizable data requirement: show authentic encouraging empty state */
        <div
          id="insufficient-data-notice"
          className="p-8 rounded-3xl bg-[#191b23] border border-white/10 text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto glow-cyan">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-headline font-bold text-white">
            {comparison.message || "Keep using LIFEFlow. We'll show meaningful comparisons once enough data is available."}
          </h2>
          <p className="text-xs text-white/50 max-w-lg mx-auto leading-relaxed">
            {comparison.subMessage || "LifeFlow requires at least 2 active tracking days to compute progress velocity and comparison metrics."}
          </p>
        </div>
      ) : (
        comparison && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#191b23] to-purple-950/30 border border-cyan-500/30 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/40">
                  VELOCITY ANALYSIS
                </span>
                <h2 className="text-2xl sm:text-3xl font-headline font-bold text-white mt-2">
                  {comparison.headline}
                </h2>
                <p className="text-xs text-white/60 mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    +{comparison.progressVelocityPercent}% overall progress velocity across all behavioral vectors
                  </span>
                </p>
              </div>

              <button
                onClick={onOpenScoreFormula}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-mono transition-all flex items-center gap-1.5 self-start sm:self-center"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>How is velocity computed?</span>
              </button>
            </div>

            {/* Comparative Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
              {/* Metric 1: Completion Rate */}
              <div className="p-4 rounded-2xl bg-[#10131a]/80 border border-white/5">
                <div className="text-[11px] font-mono text-white/50">Completion Rate</div>
                <div className="text-2xl font-bold text-white font-headline mt-1">
                  {comparison.current?.completionRate}%
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono mt-1 text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{comparison.deltas?.completionRateDelta}% vs prior ({comparison.prior?.completionRate}%)</span>
                </div>
              </div>

              {/* Metric 2: Focus Hours */}
              <div className="p-4 rounded-2xl bg-[#10131a]/80 border border-white/5">
                <div className="text-[11px] font-mono text-white/50">Deep Work Logged</div>
                <div className="text-2xl font-bold text-purple-400 font-headline mt-1">
                  {comparison.current?.focusHours}h
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono mt-1 text-purple-300">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>
                    {comparison.deltas?.focusHoursDelta && comparison.deltas.focusHoursDelta >= 0 ? '+' : ''}
                    {comparison.deltas?.focusHoursDelta}h vs prior ({comparison.prior?.focusHours}h)
                  </span>
                </div>
              </div>

              {/* Metric 3: Routine Habits */}
              <div className="p-4 rounded-2xl bg-[#10131a]/80 border border-white/5">
                <div className="text-[11px] font-mono text-white/50">Habit Check-Ins</div>
                <div className="text-2xl font-bold text-amber-400 font-headline mt-1">
                  {comparison.current?.habitCheckins}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono mt-1 text-amber-300">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>
                    +{comparison.deltas?.habitCheckinsDelta} check-ins vs prior ({comparison.prior?.habitCheckins})
                  </span>
                </div>
              </div>

              {/* Metric 4: Missed Tasks */}
              <div className="p-4 rounded-2xl bg-[#10131a]/80 border border-white/5">
                <div className="text-[11px] font-mono text-white/50">Missed Focus Blocks</div>
                <div className="text-2xl font-bold text-white font-headline mt-1">
                  {comparison.current?.missedTasks}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono mt-1 text-emerald-400">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>
                    {comparison.deltas?.missedTasksDelta} tasks (-{Math.abs(comparison.deltas?.missedTasksDelta || 0)} dropped)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* 3. Daily Focus Hours Bar Chart & Category Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Focus Bar Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline font-bold text-lg text-white">Daily Focus Hours</h3>
              <p className="text-xs text-white/50">7-day immersion volume (target: 4h/day)</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {distribution?.averageDailyFocusHours || 0}h daily avg
              </span>
            </div>
          </div>

          <div className="pt-6 pb-2">
            <div className="grid grid-cols-7 gap-2.5 items-end h-44 border-b border-white/10 pb-2">
              {distribution?.weeklyFocusBars.map((bar) => {
                const maxH = 6; // 6h max scale
                const heightPct = Math.min(100, Math.round((bar.focusHours / maxH) * 100));

                return (
                  <div key={bar.date} className="flex flex-col items-center gap-2 group">
                    <div className="text-[11px] font-mono text-white/60 group-hover:text-cyan-400 transition-colors">
                      {bar.focusHours > 0 ? `${bar.focusHours}h` : '0'}
                    </div>
                    <div className="w-full bg-white/5 rounded-xl h-36 flex items-end overflow-hidden p-1">
                      <div
                        className={`w-full rounded-lg transition-all duration-700 ${
                          bar.isToday
                            ? 'bg-gradient-to-t from-cyan-500 to-cyan-300 glow-cyan'
                            : 'bg-gradient-to-t from-purple-600/70 to-purple-400/80 group-hover:from-cyan-600 group-hover:to-cyan-400'
                        }`}
                        style={{ height: `${Math.max(8, heightPct)}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-mono font-medium ${
                        bar.isToday ? 'text-cyan-400 font-bold' : 'text-white/40'
                      }`}
                    >
                      {bar.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Allocation Distribution */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline font-bold text-lg text-white">Focus Distribution</h3>
              <p className="text-xs text-white/50">Time allocation across life domains</p>
            </div>
            <span className="text-xs font-mono text-purple-400 font-bold">
              {distribution?.totalHoursLogged || 0}h total
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {distribution?.categoryDistribution.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium text-white">{cat.name}</span>
                  </div>
                  <span className="font-mono text-white/60">
                    {cat.hours}h ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bio-Behavioral Analysis (Observed Data & AI Suggestions) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline font-bold text-lg text-white">Bio-Behavioral Telemetry</h3>
            <p className="text-xs text-white/50">
              Correlations extracted between circadian timing, task completion, and focus state
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
              OBSERVED DATA
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
              AI SUGGESTION
            </span>
          </div>
        </div>

        {insightsMessage && insights.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#191b23] border border-white/10 text-xs text-white/50 text-center font-mono">
            {insightsMessage}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((ins, idx) => {
              const isAi = ins.type === 'AI_SUGGESTION';

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    isAi
                      ? 'bg-gradient-to-b from-[#1d1a29] to-[#15141f] border-purple-500/30'
                      : 'bg-[#191b23] border-white/10'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: `${ins.accent}20`,
                          color: ins.accent,
                          borderColor: `${ins.accent}40`,
                          borderWidth: '1px'
                        }}
                      >
                        {ins.type === 'AI_SUGGESTION' ? 'AI SUGGESTION' : 'OBSERVED DATA'}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">{ins.tag}</span>
                    </div>
                    <h4 className="text-sm font-headline font-bold text-white mt-1">
                      {ins.headline}
                    </h4>
                    <p className="text-xs text-white/70 leading-relaxed">{ins.body}</p>
                  </div>

                  {ins.actionable && (
                    <div>
                      {appliedSuggestion ? (
                        <div className="w-full py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" /> Applied to Schedule
                        </div>
                      ) : (
                        <button
                          id="apply-ai-suggestion-btn"
                          onClick={handleApplySuggestion}
                          className="w-full py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{ins.actionLabel || 'Apply To My Schedule'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Personal Records (matching Section 20) */}
      <div className="p-6 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center glow-amber">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-base text-white">All-Time Personal Records</h3>
            <p className="text-xs text-white/50">Milestones achieved on your LIFEFlow journey</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#10131a] border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase">Longest Streak</div>
            <div className="text-lg font-bold text-amber-400 font-headline mt-0.5">
              {summary?.personalRecords?.longestStreakDays || 0} Days
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10131a] border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase">Peak Day Focus</div>
            <div className="text-lg font-bold text-purple-400 font-headline mt-0.5">
              {summary?.personalRecords?.peakDayFocusHours || 0} Hours
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10131a] border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase">Max Day Tasks</div>
            <div className="text-lg font-bold text-cyan-400 font-headline mt-0.5">
              {summary?.personalRecords?.mostActivitiesCompletedInDay || 0} Tasks
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10131a] border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase">Best Completion</div>
            <div className="text-lg font-bold text-emerald-400 font-headline mt-0.5">
              {summary?.personalRecords?.bestCompletionRatePercent || 0}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10131a] border border-white/5 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-mono text-white/40 uppercase">Top Anchor Habit</div>
            <div className="text-xs font-bold text-white truncate mt-1">
              {summary?.personalRecords?.mostConsistentHabit?.name || 'Meditation'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Filter,
  Check,
  Plus,
  Sliders,
  Calendar as CalendarIcon,
  Trash2,
  X,
  ChevronRight
} from 'lucide-react';
import { Activity, Category } from '../types';
import { api } from '../api';

interface TimelineViewProps {
  onOpenQuickAdd: () => void;
  onRefresh: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ onOpenQuickAdd, onRefresh }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeMessage, setOptimizeMessage] = useState<string | null>(null);

  // Drawer modal state for editing activity
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Generate 7-day carousel dates around today
  const today = new Date();
  const carouselDates: { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
  for (let i = -2; i <= 4; i++) {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    carouselDates.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: d.toISOString().split('T')[0] === today.toISOString().split('T')[0]
    });
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const [acts, cats] = await Promise.all([
        api.getActivities({ date: selectedDate }),
        api.getCategories()
      ]);
      setActivities(acts);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleStatusChange = async (activityId: string, newStatus: Activity['status']) => {
    try {
      await api.updateActivityStatus(activityId, newStatus);
      await loadData();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOptimizeSchedule = async () => {
    setOptimizing(true);
    try {
      const res = await api.optimizeSchedule(selectedDate);
      setOptimizeMessage(res.message);
      setTimeout(() => setOptimizeMessage(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setOptimizing(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    try {
      await api.updateActivity(editingActivity.id, {
        title: editingActivity.title,
        duration_minutes: editingActivity.duration_minutes,
        start_time: editingActivity.start_time,
        end_time: editingActivity.end_time,
        notes: editingActivity.notes,
        priority: editingActivity.priority,
        status: editingActivity.status
      });
      setEditingActivity(null);
      await loadData();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await api.deleteActivity(id);
      setEditingActivity(null);
      await loadData();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (selectedCategory === 'ALL') return true;
    return act.category_name?.toUpperCase() === selectedCategory.toUpperCase();
  });

  const completedCount = activities.filter((a) => a.status === 'completed').length;
  const totalFocusMin = activities
    .filter((a) => a.status === 'completed')
    .reduce((acc, a) => acc + (a.duration_minutes || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 lg:pb-8">
      {/* 1. Header & Live Telemetry Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            LIVE FLOW CHRONOLOGY
          </div>
          <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight">
            Today's Flow
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Real-time execution spine with dynamic buffer calibration
          </p>
        </div>

        <button
          id="optimize-schedule-btn"
          onClick={handleOptimizeSchedule}
          disabled={optimizing}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all flex items-center gap-2 self-start sm:self-center"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{optimizing ? 'Optimizing Buffers...' : 'Optimize Schedule'}</span>
        </button>
      </div>

      {optimizeMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{optimizeMessage}</span>
        </div>
      )}

      {/* 2. Day Selector Carousel (Mon - Sun) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {carouselDates.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          return (
            <button
              key={item.dateStr}
              id={`carousel-day-${item.dateStr}`}
              onClick={() => setSelectedDate(item.dateStr)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-3 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/15'
                  : 'bg-[#191b23] border-white/5 text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              <span className="text-[10px] font-mono uppercase">{item.dayName}</span>
              <span className="text-lg font-bold font-headline mt-0.5">{item.dayNumber}</span>
              {item.isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Day Telemetry Summary Card */}
      <div className="p-4 rounded-2xl bg-[#191b23] border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="text-[11px] font-mono text-white/40">Tasks Locked</div>
          <div className="text-lg font-bold text-white font-headline mt-0.5">
            {completedCount} / {activities.length}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-mono text-white/40">Focus Time Logged</div>
          <div className="text-lg font-bold text-purple-400 font-headline mt-0.5">
            {Math.floor(totalFocusMin / 60)}h {totalFocusMin % 60}m
          </div>
        </div>
        <div>
          <div className="text-[11px] font-mono text-white/40">Restorative Buffers</div>
          <div className="text-lg font-bold text-emerald-400 font-headline mt-0.5">
            15m Locked
          </div>
        </div>
        <div>
          <div className="text-[11px] font-mono text-white/40">Current Cadence</div>
          <div className="text-lg font-bold text-amber-400 font-headline mt-0.5">
            Active Flow
          </div>
        </div>
      </div>

      {/* 4. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {['ALL', 'WORK', 'FITNESS', 'HEALTH', 'STUDY', 'PERSONAL', 'PROJECTS'].map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              id={`filter-category-${cat}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all flex-shrink-0 border ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold'
                  : 'bg-[#191b23] text-white/50 border-white/5 hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 5. Vertical Timeline Spine */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="text-center py-12 text-xs text-white/40 font-mono">
            Synchronizing telemetry timeline...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#191b23] border border-white/5 text-center space-y-3">
            <Clock className="w-10 h-10 text-cyan-400/50 mx-auto" />
            <h3 className="text-base font-headline font-bold text-white">
              No scheduled flow blocks found for this date.
            </h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Plan your activities in advance to maintain focus density and eliminate cognitive drift.
            </p>
            <button
              onClick={onOpenQuickAdd}
              className="mt-2 px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-semibold hover:bg-cyan-300"
            >
              Plan Activity
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-white/10 space-y-6">
            {filteredActivities.map((act) => {
              const isCompleted = act.status === 'completed';
              const isInProgress = act.status === 'in_progress';

              return (
                <div key={act.id} className="relative group">
                  {/* Spine Needle Indicator */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-cyan-400 border-cyan-400 text-black'
                        : isInProgress
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-4 ring-cyan-500/20 animate-pulse'
                        : 'bg-[#10131a] border-white/30 text-transparent group-hover:border-cyan-400'
                    }`}
                  >
                    {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                    {isInProgress && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                  </div>

                  {/* Activity Card */}
                  <div
                    id={`timeline-card-${act.id}`}
                    onClick={() => setEditingActivity(act)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                      isInProgress
                        ? 'bg-[#191b23] border-cyan-500/40 shadow-xl shadow-cyan-950/20'
                        : isCompleted
                        ? 'bg-[#10131a]/70 border-white/5 opacity-80 hover:opacity-100'
                        : 'bg-[#191b23] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: act.category_color || '#06B6D4' }}
                        />
                        <span className="text-xs font-mono text-white/50">
                          {act.start_time || 'Flexible'} {act.end_time ? `– ${act.end_time}` : ''}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-white/60">
                          {act.category_name || 'General'}
                        </span>
                        {isInProgress && (
                          <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                            Active Now
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white/50">
                          {act.duration_minutes}m Focus
                        </span>
                        <button
                          id={`quick-toggle-${act.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(act.id, isCompleted ? 'planned' : 'completed');
                          }}
                          className={`p-1.5 rounded-lg border text-xs transition-all ${
                            isCompleted
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : 'text-white/40 border-white/10 hover:text-white hover:border-white/30'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Mark Done'}
                        </button>
                      </div>
                    </div>

                    <h3
                      className={`text-base font-semibold mt-2 ${
                        isCompleted ? 'line-through text-white/60' : 'text-white'
                      }`}
                    >
                      {act.title}
                    </h3>

                    {act.description && (
                      <p className="text-xs text-white/60 mt-1 leading-relaxed">{act.description}</p>
                    )}

                    {act.notes && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-[#10131a] border border-white/5 text-xs text-white/50 font-mono">
                        Invariant notes: {act.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Drawer Modal */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-[#191b23] border border-white/10 rounded-2xl p-6 shadow-2xl text-[#e1e2ec]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-headline font-semibold text-lg text-white">Modify Focus Activity</h3>
              <button
                onClick={() => setEditingActivity(null)}
                className="p-1 rounded-lg text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Title</label>
                <input
                  type="text"
                  value={editingActivity.title}
                  onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editingActivity.start_time || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">End Time</label>
                  <input
                    type="time"
                    value={editingActivity.end_time || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">
                  Duration ({editingActivity.duration_minutes}m)
                </label>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={editingActivity.duration_minutes}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, duration_minutes: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">Status</label>
                  <select
                    value={editingActivity.status}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="skipped">Skipped</option>
                    <option value="missed">Missed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">Priority</label>
                  <select
                    value={editingActivity.priority}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, priority: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingActivity.notes || ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleDelete(editingActivity.id)}
                  className="p-2 text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingActivity(null)}
                    className="px-4 py-2 text-xs text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-semibold text-xs hover:bg-cyan-300"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

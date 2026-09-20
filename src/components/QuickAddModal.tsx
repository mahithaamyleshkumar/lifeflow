import React, { useState, useEffect } from 'react';
import { X, Plus, AlertTriangle, Calendar, Clock, Tag, Sparkles, CheckCircle } from 'lucide-react';
import { Category } from '../types';
import { api } from '../api';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'habit'>('activity');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Activity form
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [notes, setNotes] = useState('');

  // Habit form
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('');
  const [targetDays, setTargetDays] = useState(7);
  const [reminderTime, setReminderTime] = useState('08:00');

  useEffect(() => {
    if (isOpen) {
      api.getCategories().then((cats) => {
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
          setHabitCategory(cats[0].id);
        }
      }).catch(console.error);
      setConflictWarning(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDurationClick = (mins: number) => {
    setDurationMinutes(mins);
    if (startTime) {
      const [h, m] = startTime.split(':').map(Number);
      const totalM = h * 60 + m + mins;
      const endH = Math.floor(totalM / 60) % 24;
      const endM = totalM % 60;
      setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setConflictWarning(null);

    try {
      if (activeTab === 'activity') {
        if (!title.trim()) return;
        const res = await api.createActivity({
          title: title.trim(),
          category_id: categoryId || undefined,
          date,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          duration_minutes: durationMinutes,
          priority,
          notes: notes.trim(),
          status: 'planned'
        });

        if (res.warning) {
          setConflictWarning(res.warning);
        }
        onSuccess();
        if (!res.warning) {
          onClose();
          resetForm();
        }
      } else {
        if (!habitName.trim()) return;
        await api.createHabit({
          name: habitName.trim(),
          category_id: habitCategory || undefined,
          target_days_per_week: targetDays,
          reminder_time: reminderTime || undefined
        });
        onSuccess();
        onClose();
        resetForm();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setHabitName('');
    setConflictWarning(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="quick-add-modal"
        className="relative w-full max-w-lg bg-[#191b23] border border-white/10 rounded-2xl p-6 shadow-2xl text-[#e1e2ec]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex bg-[#10131a] p-1 rounded-xl border border-white/5">
              <button
                type="button"
                id="tab-select-activity"
                onClick={() => setActiveTab('activity')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'activity'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Log Activity / Task
              </button>
              <button
                type="button"
                id="tab-select-habit"
                onClick={() => setActiveTab('habit')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'habit'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Anchor Habit
              </button>
            </div>
          </div>
          <button
            id="close-quick-add-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {conflictWarning && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Schedule Overlap Alert</div>
              <div>{conflictWarning}</div>
              <div className="text-[11px] text-amber-300/70 mt-1">Saved successfully, but please review your schedule buffers.</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {activeTab === 'activity' ? (
            <>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Activity Title *
                </label>
                <input
                  id="activity-title-input"
                  type="text"
                  required
                  placeholder="e.g. Deep System Architecture Design"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                    Category
                  </label>
                  <select
                    id="activity-category-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                    Priority
                  </label>
                  <select
                    id="activity-priority-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                    Date
                  </label>
                  <input
                    id="activity-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                    Start Time
                  </label>
                  <input
                    id="activity-start-time-input"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                    End Time
                  </label>
                  <input
                    id="activity-end-time-input"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-white/60">
                    Duration: {durationMinutes} minutes
                  </label>
                  <div className="flex gap-1.5">
                    {[15, 30, 45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleDurationClick(mins)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                          durationMinutes === mins
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : 'bg-[#10131a] text-white/50 border-white/5 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => handleDurationClick(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Notes & Invariant Intentions
                </label>
                <textarea
                  id="activity-notes-input"
                  rows={2}
                  placeholder="Focus context, required files, energy state..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Habit Name *
                </label>
                <input
                  id="habit-name-input"
                  type="text"
                  required
                  placeholder="e.g. Morning Sunlight & Hydration Protocol"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                    Category
                  </label>
                  <select
                    id="habit-category-select"
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                    Target Days / Week
                  </label>
                  <select
                    id="habit-target-days-select"
                    value={targetDays}
                    onChange={(e) => setTargetDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {[7, 6, 5, 4, 3, 2, 1].map((d) => (
                      <option key={d} value={d}>
                        {d} days / week
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Reminder Time
                </label>
                <input
                  id="habit-reminder-time-input"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </>
          )}

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-quick-add-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-400/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Saving...' : activeTab === 'activity' ? 'Create Activity' : 'Anchor Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

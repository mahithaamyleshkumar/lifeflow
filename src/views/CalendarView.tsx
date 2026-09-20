import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Activity } from '../types';
import { api } from '../api';

interface CalendarViewProps {
  onOpenQuickAdd: (date?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenQuickAdd }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const loadActivitiesForDate = async (dStr: string) => {
    setLoading(true);
    try {
      const acts = await api.getActivities({ date: dStr });
      setActivities(acts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivitiesForDate(selectedDate);
  }, [selectedDate]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar grid days
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ day, dateStr: dStr });
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 lg:pb-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
            <CalendarIcon className="w-4 h-4" />
            TEMPORAL CALENDAR PLANNER
          </div>
          <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight">
            LifeFlow Calendar
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Chronological mapping of past, present, and scheduled focus intervals
          </p>
        </div>

        <button
          onClick={() => onOpenQuickAdd(selectedDate)}
          className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs flex items-center gap-1.5 self-start sm:self-center shadow-lg shadow-cyan-400/20"
        >
          <Plus className="w-4 h-4" /> Schedule on Date
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h2 className="text-lg font-headline font-bold text-white">{monthName}</h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white/80"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs text-white/40 pb-2">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="aspect-square rounded-2xl bg-white/[0.01]" />;
              }

              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`aspect-square rounded-2xl p-2 border flex flex-col justify-between items-center transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 font-bold'
                      : isToday
                      ? 'bg-white/5 border-cyan-500/50 text-cyan-300'
                      : 'bg-[#10131a]/60 border-white/5 text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-mono">{cell.day}</span>
                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Focus Activities Drawer */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#191b23] border border-white/10 space-y-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              {new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <h3 className="text-lg font-headline font-bold text-white mt-1">
              Focus Activities ({activities.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-white/40">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/40 space-y-2">
              <div>No activities scheduled for this date.</div>
              <button
                onClick={() => onOpenQuickAdd(selectedDate)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                + Plan Focus Block
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-[#10131a] border border-white/5 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{act.title}</div>
                    <div className="text-[11px] font-mono text-white/50 mt-0.5">
                      {act.start_time || 'Flexible'} • {act.duration_minutes}m
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      act.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/5 text-white/60'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

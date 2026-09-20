import React, { useState, useEffect } from 'react';
import { History, Search, Filter, CheckCircle2, Clock } from 'lucide-react';
import { Activity } from '../types';
import { api } from '../api';

export const HistoryView: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await api.getActivities({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setActivities(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadActivities();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 lg:pb-8">
      {/* 1. Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
          <History className="w-4 h-4" />
          IMMUTABLE CHRONOLOGY
        </div>
        <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight">
          Activity Logs & History
        </h1>
        <p className="text-xs text-white/50 mt-1">
          Historical record of completed, missed, and planned focus sessions
        </p>
      </div>

      {/* 2. Filters & Search */}
      <div className="p-4 rounded-2xl bg-[#191b23] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search activities, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#10131a] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'completed', 'in_progress', 'planned', 'missed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                  : 'bg-[#10131a] text-white/50 border-white/5 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3. List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-white/40">Loading activity logs...</div>
        ) : activities.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#191b23] border border-white/5 text-center text-xs text-white/40">
            No activity records matching your search.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="p-4 rounded-2xl bg-[#191b23] border border-white/5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: act.category_color || '#06B6D4' }}
                />
                <div>
                  <div className="text-xs font-semibold text-white">{act.title}</div>
                  <div className="text-[11px] font-mono text-white/40 mt-0.5">
                    {act.date} • {act.start_time || 'Flexible'} • {act.duration_minutes}m • {act.category_name || 'General'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full ${
                    act.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : act.status === 'in_progress'
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'bg-white/5 text-white/50'
                  }`}
                >
                  {act.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

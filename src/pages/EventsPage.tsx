import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, getDaysRemaining } from '../services/storageService';
import { EventStatus } from '../types';
import { CreateEventModal } from '../components/CreateEventModal';

export const EventsPage: React.FC = () => {
  const { events, bookings } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [createOpen, setCreateOpen] = useState(false);

  // Calendar month state (defaults to Dec 2026 where seeded events live)
  const [calMonth, setCalMonth] = useState(() => new Date(2026, 11, 1));

  const filteredEvents = useMemo(() => {
    if (statusFilter === 'all') return events;
    return events.filter((e) => e.status === statusFilter);
  }, [events, statusFilter]);

  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ day: number | null; dateStr?: string }> = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, dateStr: `${year}-${mm}-${dd}` });
    }
    return cells;
  }, [calMonth]);

  const monthLabel = calMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Events & Schedule Calendar
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage event timelines, statuses, and monthly schedule coverage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
        {(['all', 'Planning', 'Confirmed', 'Completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap ${
              statusFilter === status
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {viewMode === 'list' ? (
        filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No events match the selected filter.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((ev) => {
              const evBookings = bookings.filter(
                (b) => b.eventId === ev.id && b.status !== 'Rejected'
              );
              const spent = evBookings.reduce((sum, b) => sum + b.quotedPrice, 0);
              const pct = ev.budget > 0 ? Math.min(100, Math.round((spent / ev.budget) * 100)) : 0;
              const daysLeft = getDaysRemaining(ev.date);

              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-indigo-500 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">
                        {ev.type} · {ev.status}
                      </span>
                      <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-medium">
                        {daysLeft >= 0 ? `T-${daysLeft} days` : 'Completed'}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                      {ev.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
                      {ev.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {ev.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {ev.location}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Users className="w-3.5 h-3.5" />
                        {ev.guestCount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Committed</span>
                      <span className="font-mono tabular-nums font-semibold">
                        {formatINR(spent)} / {formatINR(ev.budget)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Monthly Calendar View */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              {monthLabel}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2.5 text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {calendarDays.map((cell, idx) => {
              const dayEvents = cell.dateStr
                ? filteredEvents.filter((e) => e.date === cell.dateStr)
                : [];
              return (
                <div
                  key={idx}
                  className="min-h-[96px] p-2 bg-white dark:bg-slate-900 text-xs"
                >
                  {cell.day && (
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {cell.day}
                    </span>
                  )}
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => navigate(`/events/${ev.id}`)}
                        className="w-full text-left px-2 py-1 rounded-md bg-indigo-600 text-white text-[11px] font-medium truncate hover:bg-indigo-700 transition-colors"
                        title={`${ev.name} (${ev.location})`}
                      >
                        {ev.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => navigate(`/events/${id}`)}
      />
    </div>
  );
};

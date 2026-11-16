import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, getDaysRemaining } from '../services/storageService';
import { CreateEventModal } from '../components/CreateEventModal';

export const OrganizerDashboard: React.FC = () => {
  const { user, events, bookings } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalBudget = events.reduce((acc, e) => acc + e.budget, 0);
    const committedSpend = bookings
      .filter((b) => b.status === 'Accepted' || b.status === 'Negotiating')
      .reduce((acc, b) => acc + b.quotedPrice, 0);
    const confirmedBookings = bookings.filter((b) => b.status === 'Accepted').length;
    const pendingTasks = events.reduce(
      (acc, e) => acc + e.tasks.filter((t) => !t.completed).length,
      0
    );
    const conflictCount = bookings.filter((b) => b.hasConflict).length;

    return { totalBudget, committedSpend, confirmedBookings, pendingTasks, conflictCount };
  }, [events, bookings]);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Track upcoming event countdowns, vendor confirmations, and category budgets.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/ai-planner"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>AI Event Planner</span>
          </Link>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Events</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1.5">
            {events.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {events.filter((e) => e.status === 'Confirmed').length} confirmed ·{' '}
            {events.filter((e) => e.status === 'Planning').length} planning
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Committed / Planned Budget
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1.5">
            {formatINR(stats.committedSpend)}
          </p>
          <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-1">
            of {formatINR(stats.totalBudget)} total budget
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Confirmed Vendors
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1.5">
            {stats.confirmedBookings}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {bookings.filter((b) => b.status === 'Pending' || b.status === 'Negotiating').length}{' '}
            awaiting confirmation
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Open Checklist Tasks
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1.5">
            {stats.pendingTasks}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {stats.conflictCount > 0
              ? `${stats.conflictCount} schedule conflict warning`
              : 'Zero vendor conflicts'}
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Your Events
          </h3>
          <Link
            to="/events"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View calendar & all events
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No events created yet.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
            >
              Create First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {events.map((ev) => {
              const evBookings = bookings.filter(
                (b) => b.eventId === ev.id && b.status !== 'Rejected'
              );
              const spent = evBookings.reduce((sum, b) => sum + b.quotedPrice, 0);
              const pct = ev.budget > 0 ? Math.min(100, Math.round((spent / ev.budget) * 100)) : 0;
              const daysLeft = getDaysRemaining(ev.date);
              const doneTasks = ev.tasks.filter((t) => t.completed).length;

              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">
                        {ev.type} · {ev.status}
                      </span>
                      <span className="font-mono tabular-nums font-medium text-indigo-600 dark:text-indigo-400">
                        {daysLeft >= 0 ? `${daysLeft}d left` : 'Past'}
                      </span>
                    </div>

                    <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                      {ev.name}
                    </h4>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Calendar className="w-3.5 h-3.5" />
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

                    {/* Budget Progress */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Budget Utilized</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                          {formatINR(spent)} / {formatINR(ev.budget)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct > 95
                              ? 'bg-rose-600'
                              : pct > 80
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {doneTasks}/{ev.tasks.length} tasks
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Split: Recent Bookings & Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Recent Vendor Quotes
            </h3>
            <Link
              to="/bookings"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage all
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {b.vendorName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {b.eventName} · {b.vendorCategory}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatINR(b.quotedPrice)}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      b.status === 'Accepted'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : b.status === 'Rejected'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {b.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              AI Risk Warnings & Deadlines
            </h3>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {events.flatMap((ev) =>
              ev.riskWarnings.map((rw) => (
                <div
                  key={rw.id}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 hover:border-indigo-400 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      {rw.severity.toUpperCase()} · {ev.name}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    {rw.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {rw.mitigation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => navigate(`/events/${id}`)}
      />
    </div>
  );
};

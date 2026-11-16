import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckSquare,
  Clock,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Square,
  Trash2,
  TrendingDown,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { matchVendorsForEvent, optimizeEventBudget } from '../services/geminiService';
import { formatINR, getDaysRemaining } from '../services/storageService';
import {
  AIBudgetOptimization,
  AIVendorMatchResponse,
  EventStatus,
  Vendor,
} from '../types';
import { BookingModal } from '../components/BookingModal';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const {
    events,
    vendors,
    bookings,
    updateEventStatus,
    toggleEventTask,
    addEventTask,
    deleteEventTask,
    deleteEvent,
    showToast,
  } = useApp();

  const event = events.find((e) => e.id === eventId);
  const [activeTab, setActiveTab] = useState<'overview' | 'matching' | 'optimizer'>('overview');

  // Task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('operations');
  const [newTaskDue, setNewTaskDue] = useState(event?.date || '2027-01-01');

  // AI Vendor Matching
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<AIVendorMatchResponse | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // AI Budget Optimizer
  const [optLoading, setOptLoading] = useState(false);
  const [optResult, setOptResult] = useState<AIBudgetOptimization | null>(null);
  const [optError, setOptError] = useState<string | null>(null);

  // Booking Modal
  const [bookingVendor, setBookingVendor] = useState<Vendor | null>(null);

  const eventBookings = useMemo(
    () => bookings.filter((b) => b.eventId === eventId),
    [bookings, eventId]
  );

  if (!event) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Event not found.</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Events</span>
        </Link>
      </div>
    );
  }

  const activeSpend = eventBookings
    .filter((b) => b.status !== 'Rejected')
    .reduce((sum, b) => sum + b.quotedPrice, 0);
  const confirmedSpend = eventBookings
    .filter((b) => b.status === 'Accepted')
    .reduce((sum, b) => sum + b.quotedPrice, 0);
  const budgetPct = event.budget > 0 ? Math.min(100, Math.round((activeSpend / event.budget) * 100)) : 0;
  const daysLeft = getDaysRemaining(event.date);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addEventTask(event.id, {
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      dueDate: newTaskDue,
      priority: 'medium',
      completed: false,
    });
    setNewTaskTitle('');
  };

  const handleRunVendorMatch = async () => {
    setActiveTab('matching');
    setMatchingLoading(true);
    setMatchError(null);
    try {
      const res = await matchVendorsForEvent(event, vendors, bookings);
      setMatchResult(res);
      showToast({ type: 'success', title: 'AI vendor rankings ready' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to match vendors';
      setMatchError(msg);
      showToast({ type: 'error', title: 'Vendor matching failed', description: msg });
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleRunBudgetOptimizer = async () => {
    setActiveTab('optimizer');
    setOptLoading(true);
    setOptError(null);
    try {
      const res = await optimizeEventBudget(event, eventBookings, vendors);
      setOptResult(res);
      showToast({ type: 'success', title: 'Budget optimization analysis complete' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Budget analysis failed';
      setOptError(msg);
      showToast({ type: 'error', title: 'Budget optimizer failed', description: msg });
    } finally {
      setOptLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Events</span>
        </Link>

        <div className="flex items-center gap-2">
          <select
            value={event.status}
            onChange={(e) => updateEventStatus(event.id, e.target.value as EventStatus)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            aria-label="Event status"
          >
            <option value="Planning">Planning</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
          </select>

          <button
            onClick={() => {
              deleteEvent(event.id);
              navigate('/events');
            }}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300"
            title="Delete event"
            aria-label="Delete event"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Event Summary Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 capitalize">
              {event.type} · {event.status}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {event.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {event.description}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Calendar className="w-3.5 h-3.5" />
                {event.date}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Users className="w-3.5 h-3.5" />
                {event.guestCount} guests
              </span>
            </div>
          </div>

          {/* Countdown & Budget Box */}
          <div className="grid grid-cols-2 gap-4 lg:w-[360px] shrink-0">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Countdown</span>
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                {daysLeft >= 0 ? `${daysLeft}d` : 'Past'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {daysLeft >= 0 ? 'until event day' : 'event concluded'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Budget Used</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                {budgetPct}%
              </p>
              <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                {formatINR(activeSpend)} / {formatINR(event.budget)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetPct > 100
                  ? 'bg-rose-600'
                  : budgetPct > 85
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            <span>Confirmed spend: {formatINR(confirmedSpend)}</span>
            <span>Remaining allowance: {formatINR(event.budget - activeSpend)}</span>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Checklist, Timeline & Bookings
          </button>
          <button
            onClick={() => setActiveTab('matching')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'matching'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            AI Vendor Matching
          </button>
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'optimizer'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            AI Budget Optimizer
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunVendorMatch}
            disabled={matchingLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            {matchingLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Match Vendors with AI</span>
          </button>
          <button
            onClick={handleRunBudgetOptimizer}
            disabled={optLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap"
          >
            {optLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )}
            <span>Optimize Budget</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tasks Checklist */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
                Action Checklist ({event.tasks.filter((t) => t.completed).length}/
                {event.tasks.length})
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {event.tasks.map((task) => (
                  <div key={task.id} className="py-3 flex items-start justify-between gap-3">
                    <button
                      onClick={() => toggleEventTask(event.id, task.id)}
                      className="flex items-start gap-3 text-left flex-1 min-w-0"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            task.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="capitalize">{task.category}</span> · Due{' '}
                          <span className="font-mono tabular-nums">{task.dueDate}</span> ·{' '}
                          <span className="capitalize">{task.priority} priority</span>
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteEventTask(event.id, task.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      aria-label="Remove task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddTask}
                className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2"
              >
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add new task..."
                  className="sm:col-span-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="sm:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="operations">Operations</option>
                  <option value="catering">Catering</option>
                  <option value="venue">Venue</option>
                  <option value="sound/lighting">AV</option>
                  <option value="decoration">Decor</option>
                </select>
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="sm:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Event Bookings */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Vendor Bookings ({eventBookings.length})
                </h3>
                <Link
                  to="/vendors"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Browse Marketplace
                </Link>
              </div>
              {eventBookings.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No vendor quotes requested yet. Run AI Vendor Matching or browse the marketplace.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {eventBookings.map((b) => (
                    <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {b.vendorName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                          {b.vendorCategory} · {b.packageName || 'Custom'}
                        </p>
                        {b.hasConflict && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                            Schedule conflict flagged
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatINR(b.quotedPrice)}
                        </p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {b.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Budget Split, Timeline, Risks */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-3">
                Planned Category Budget
              </h3>
              <div className="space-y-3">
                {event.budgetSplit.map((b) => (
                  <div key={b.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                        {b.category} ({b.percentage}%)
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {formatINR(b.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-3">
                Run-of-Show Timeline
              </h3>
              <div className="space-y-3">
                {event.timeline.map((item) => (
                  <div
                    key={item.id}
                    className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                      {item.dayLabel} · {item.timeSlot}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {item.description} — Lead: {item.owner}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {event.riskWarnings.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-3">
                  Risk Mitigations
                </h3>
                <div className="space-y-3">
                  {event.riskWarnings.map((rw) => (
                    <div key={rw.id} className="text-xs space-y-1">
                      <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{rw.title}</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">{rw.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: AI Vendor Matching */}
      {activeTab === 'matching' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Gemini AI Vendor Recommendations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ranked 0–100% by budget alignment, capacity for {event.guestCount} guests, city,
                rating, and availability on {event.date}.
              </p>
            </div>
            <button
              onClick={handleRunVendorMatch}
              disabled={matchingLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold whitespace-nowrap"
            >
              {matchingLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{matchResult ? 'Re-run Matching' : 'Run AI Matching'}</span>
            </button>
          </div>

          {matchingLoading && (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Scoring vendors across all required categories...</span>
            </div>
          )}

          {matchError && (
            <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300">
              {matchError}
            </div>
          )}

          {!matchingLoading && !matchResult && !matchError && (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Click &ldquo;Run AI Matching&rdquo; to evaluate and rank marketplace vendors for this
              event.
            </div>
          )}

          {matchResult && (
            <div className="space-y-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800">
                {matchResult.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchResult.recommendations
                  .slice()
                  .sort((a, b) => b.matchScore - a.matchScore)
                  .map((rec) => {
                    const vendor = vendors.find((v) => v.id === rec.vendorId);
                    if (!vendor) return null;
                    return (
                      <div
                        key={rec.vendorId}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {vendor.category} · {vendor.location} · {rec.availabilityStatus}
                              </p>
                              <h4 className="font-display text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                {vendor.name}
                              </h4>
                            </div>
                            <span className="font-mono text-base font-bold tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
                              {rec.matchScore}% match
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                            {rec.explanation}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            Est. {formatINR(rec.estimatedCost)}
                          </span>
                          <button
                            onClick={() => setBookingVendor(vendor)}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                          >
                            Request Quote
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: AI Budget Optimizer */}
      {activeTab === 'optimizer' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Gemini AI Budget Optimizer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audits committed vendor quotes against planned budget and identifies lower-cost
                marketplace alternatives.
              </p>
            </div>
            <button
              onClick={handleRunBudgetOptimizer}
              disabled={optLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold whitespace-nowrap"
            >
              {optLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{optResult ? 'Refresh Analysis' : 'Analyze Budget'}</span>
            </button>
          </div>

          {optLoading && (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Auditing spend categories and searching cheaper vendor alternatives...</span>
            </div>
          )}

          {optError && (
            <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300">
              {optError}
            </div>
          )}

          {!optLoading && !optResult && !optError && (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Click &ldquo;Analyze Budget&rdquo; to compare actual spending with planned allocations.
            </div>
          )}

          {optResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Budget Health</p>
                  <p className="font-display text-lg font-bold capitalize text-slate-900 dark:text-white mt-1">
                    {optResult.healthStatus.replace('_', ' ')}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Planned vs Committed</p>
                  <p className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                    {formatINR(optResult.committedTotal)} / {formatINR(optResult.plannedTotal)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Remaining Variance</p>
                  <p className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                    {formatINR(optResult.variance)}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {optResult.executiveSummary}
              </p>

              {optResult.overspendingAlerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Overspending Alerts
                  </h4>
                  {optResult.overspendingAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-xs flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="font-semibold capitalize">{alert.category}:</span>{' '}
                        {alert.issue}
                      </div>
                      <span className="font-mono tabular-nums font-semibold shrink-0">
                        +{formatINR(alert.impactAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Recommended Savings Tactics
                  </h4>
                  {optResult.savingsSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                        <span className="text-slate-900 dark:text-white">{s.title}</span>
                        <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                          Save {formatINR(s.potentialSavings)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {s.actionDetail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Lower-Cost Vendor Alternatives
                  </h4>
                  {optResult.cheaperAlternatives.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Current vendor selections are already cost-optimal for your tier.
                    </p>
                  ) : (
                    optResult.cheaperAlternatives.map((alt, i) => {
                      const altVendor = vendors.find((v) => v.id === alt.suggestedVendorId);
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                            <span className="text-slate-900 dark:text-white">
                              Switch {alt.currentVendorName} → {alt.suggestedVendorName}
                            </span>
                            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                              -{formatINR(alt.estimatedSavings)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{alt.reason}</p>
                          {altVendor && (
                            <button
                              onClick={() => setBookingVendor(altVendor)}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Request Quote from {altVendor.name}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <BookingModal
        vendor={bookingVendor}
        defaultEventId={event.id}
        onClose={() => setBookingVendor(null)}
      />
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../services/storageService';
import { BookingStatus } from '../types';

export const BookingsPage: React.FC = () => {
  const { user, events, bookings, respondToBooking } = useApp();
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [quoteEdits, setQuoteEdits] = useState<Record<string, number>>({});
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});

  const scopedBookings = useMemo(() => {
    let list = bookings;
    if (user?.role === 'vendor' && user.vendorId) {
      list = list.filter((b) => b.vendorId === user.vendorId);
    }
    if (eventFilter !== 'all') {
      list = list.filter((b) => b.eventId === eventFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter);
    }
    return list;
  }, [bookings, user, eventFilter, statusFilter]);

  const summary = useMemo(() => {
    const active = scopedBookings.filter((b) => b.status !== 'Rejected');
    const totalCost = active.reduce((acc, b) => acc + b.quotedPrice, 0);
    const acceptedCost = scopedBookings
      .filter((b) => b.status === 'Accepted')
      .reduce((acc, b) => acc + b.quotedPrice, 0);
    const relevantBudget =
      eventFilter === 'all'
        ? events.reduce((acc, e) => acc + e.budget, 0)
        : events.find((e) => e.id === eventFilter)?.budget || 0;
    return { totalCost, acceptedCost, relevantBudget };
  }, [scopedBookings, events, eventFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Bookings & Quotations
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track vendor quotes, resolve negotiation counter-offers, and monitor budget vs committed
          costs.
        </p>
      </div>

      {/* Cost vs Budget Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Pipeline Cost</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
            {formatINR(summary.totalCost)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Confirmed Spend</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(summary.acceptedCost)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Planned Budget Scope</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
            {formatINR(summary.relevantBudget)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {(['all', 'Pending', 'Negotiating', 'Accepted', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {user?.role === 'organizer' && (
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100"
          >
            <option value="all">All Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Bookings List */}
      {scopedBookings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          No bookings match the current filter.
        </div>
      ) : (
        <div className="space-y-4">
          {scopedBookings.map((b) => {
            const draftPrice = quoteEdits[b.id] ?? b.quotedPrice;
            const draftNote = noteEdits[b.id] ?? b.vendorResponseNote ?? '';

            return (
              <div
                key={b.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {b.vendorCategory} · {b.eventDate} · {b.packageName || 'Custom Quote'}
                    </p>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      {b.vendorName} — <span className="font-normal">{b.eventName}</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{b.notes}</p>
                    {b.vendorResponseNote && (
                      <p className="text-xs text-indigo-700 dark:text-indigo-300 pt-1">
                        Vendor note: {b.vendorResponseNote}
                      </p>
                    )}
                    {b.hasConflict && (
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Schedule conflict detected on {b.eventDate}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 shrink-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Requested {formatINR(b.requestedPrice)}
                    </span>
                    <span className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatINR(b.quotedPrice)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        b.status === 'Accepted'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : b.status === 'Rejected'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      Status: {b.status}
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                {user?.role === 'vendor' && (b.status === 'Pending' || b.status === 'Negotiating') && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      value={draftPrice}
                      onChange={(e) =>
                        setQuoteEdits((prev) => ({ ...prev, [b.id]: Number(e.target.value) }))
                      }
                      className="w-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono tabular-nums"
                      aria-label="Counter quote price"
                    />
                    <input
                      type="text"
                      value={draftNote}
                      onChange={(e) =>
                        setNoteEdits((prev) => ({ ...prev, [b.id]: e.target.value }))
                      }
                      placeholder="Add response note..."
                      className="flex-1 min-w-[180px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
                    />
                    <button
                      onClick={() =>
                        respondToBooking(b.id, 'Accepted', draftPrice, draftNote || 'Confirmed.')
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() =>
                        respondToBooking(
                          b.id,
                          'Negotiating',
                          draftPrice,
                          draftNote || 'Proposed updated quote.'
                        )
                      }
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold"
                    >
                      Send Quote
                    </button>
                    <button
                      onClick={() =>
                        respondToBooking(b.id, 'Rejected', draftPrice, draftNote || 'Unavailable.')
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 text-xs font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}

                {user?.role === 'organizer' && b.status === 'Negotiating' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        respondToBooking(
                          b.id,
                          'Rejected',
                          b.quotedPrice,
                          'Organizer declined counter-quote.'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Decline Quote
                    </button>
                    <button
                      onClick={() =>
                        respondToBooking(
                          b.id,
                          'Accepted',
                          b.quotedPrice,
                          'Organizer accepted counter-quote.'
                        )
                      }
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                    >
                      Accept {formatINR(b.quotedPrice)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

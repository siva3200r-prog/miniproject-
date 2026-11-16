import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { detectVendorConflict, formatINR } from '../services/storageService';
import { Vendor } from '../types';

interface BookingModalProps {
  vendor: Vendor | null;
  defaultEventId?: string;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  vendor,
  defaultEventId,
  onClose,
}) => {
  const { user, events, requestBooking } = useApp();
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId || events[0]?.id || '');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [requestedPrice, setRequestedPrice] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (vendor) {
      const firstPkg = vendor.packages[0];
      setSelectedPackage(firstPkg?.name || 'Custom Quote');
      setRequestedPrice(firstPkg?.price || vendor.priceMin);
    }
    if (defaultEventId) {
      setSelectedEventId(defaultEventId);
    } else if (events[0]) {
      setSelectedEventId(events[0].id);
    }
  }, [vendor, defaultEventId, events]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId]
  );

  const conflictCheck = useMemo(() => {
    if (!vendor || !selectedEvent) return { conflict: false };
    return detectVendorConflict(vendor.id, selectedEvent.date);
  }, [vendor, selectedEvent]);

  if (!vendor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    requestBooking({
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      eventDate: selectedEvent.date,
      organizerId: user?.id || 'user-org-1',
      organizerName: user?.name || 'Organizer',
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorCategory: vendor.category,
      packageName: selectedPackage,
      requestedPrice: Number(requestedPrice),
      quotedPrice: Number(requestedPrice),
      status: 'Pending',
      notes: notes.trim() || `Booking request for ${selectedEvent.guestCount} guests.`,
    });

    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {vendor.category} · {vendor.location}
            </p>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Request Booking: {vendor.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Create an event first before sending a vendor quote request.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.date} · {ev.guestCount} guests)
                  </option>
                ))}
              </select>
            </div>

            {conflictCheck.conflict && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3.5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-semibold">Availability Conflict Detected</p>
                  <p className="mt-0.5">{conflictCheck.reason}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Package
              </label>
              <select
                value={selectedPackage}
                onChange={(e) => {
                  const pkgName = e.target.value;
                  setSelectedPackage(pkgName);
                  const found = vendor.packages.find((p) => p.name === pkgName);
                  if (found) setRequestedPrice(found.price);
                }}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                {vendor.packages.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({formatINR(p.price)})
                  </option>
                ))}
                <option value="Custom Quote">Custom Quote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Budget / Offer (INR)
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                required
                value={requestedPrice}
                onChange={(e) => setRequestedPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Scope & Requirements
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Menu preferences, stage timing, setup access hours..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                Send Quote Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

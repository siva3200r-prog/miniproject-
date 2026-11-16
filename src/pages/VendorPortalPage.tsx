import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Plus, Star, Trash2, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../services/storageService';

export const VendorPortalPage: React.FC = () => {
  const {
    user,
    vendors,
    bookings,
    updateVendorProfile,
    saveVendorPackage,
    respondToBooking,
    showToast,
  } = useApp();

  const myVendor = useMemo(() => {
    if (user?.vendorId) {
      return vendors.find((v) => v.id === user.vendorId) || vendors[0];
    }
    return vendors[0];
  }, [vendors, user]);

  const myBookings = useMemo(
    () => bookings.filter((b) => b.vendorId === myVendor?.id),
    [bookings, myVendor]
  );

  // Profile editor state
  const [tagline, setTagline] = useState(myVendor?.tagline || '');
  const [location, setLocation] = useState(myVendor?.location || '');
  const [servicesText, setServicesText] = useState(myVendor?.services.join(', ') || '');

  // New package state
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState(45000);
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgDeliverables, setPkgDeliverables] = useState('');

  // Date blocker
  const [blockDate, setBlockDate] = useState('2027-01-20');

  // Quote inputs
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, number>>({});

  if (!myVendor) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
        No vendor profile associated with this account.
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorProfile(myVendor.id, {
      tagline: tagline.trim() || myVendor.tagline,
      location: location.trim() || myVendor.location,
      services: servicesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;
    saveVendorPackage(myVendor.id, {
      id: `pkg-${Date.now()}`,
      name: pkgName.trim(),
      price: Number(pkgPrice),
      description: pkgDesc.trim() || 'Custom event service tier',
      deliverables: pkgDeliverables
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
    });
    setPkgName('');
    setPkgDesc('');
    setPkgDeliverables('');
  };

  const handleAddBlockedDate = () => {
    if (!blockDate) return;
    if (myVendor.bookedDates.includes(blockDate)) {
      showToast({ type: 'info', title: 'Date already marked unavailable' });
      return;
    }
    updateVendorProfile(myVendor.id, {
      bookedDates: [...myVendor.bookedDates, blockDate].sort(),
    });
  };

  const handleRemoveBlockedDate = (date: string) => {
    updateVendorProfile(myVendor.id, {
      bookedDates: myVendor.bookedDates.filter((d) => d !== date),
    });
  };

  return (
    <div className="space-y-6">
      {/* Vendor Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
            {myVendor.category} · {myVendor.location} · Approval status:{' '}
            <strong
              className={
                myVendor.approvalStatus === 'approved'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : myVendor.approvalStatus === 'pending'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
              }
            >
              {myVendor.approvalStatus}
            </strong>
          </p>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {myVendor.name}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{myVendor.tagline}</p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Rating</p>
            <p className="font-mono text-xl font-bold tabular-nums flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              {myVendor.rating.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Requests</p>
            <p className="font-mono text-xl font-bold tabular-nums">{myBookings.length}</p>
          </div>
        </div>
      </div>

      {/* Incoming Booking Requests */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Incoming Booking Requests
        </h3>

        {myBookings.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No booking requests received yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myBookings.map((b) => {
              const offer = quoteAmounts[b.id] ?? b.quotedPrice;
              return (
                <div
                  key={b.id}
                  className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {b.eventDate} · Organizer: {b.organizerName} · Status: {b.status}
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {b.eventName} ({b.packageName})
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{b.notes}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-semibold tabular-nums mr-2">
                      {formatINR(b.quotedPrice)}
                    </span>
                    {(b.status === 'Pending' || b.status === 'Negotiating') && (
                      <>
                        <input
                          type="number"
                          value={offer}
                          onChange={(e) =>
                            setQuoteAmounts((p) => ({ ...p, [b.id]: Number(e.target.value) }))
                          }
                          className="w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-mono tabular-nums"
                        />
                        <button
                          onClick={() => respondToBooking(b.id, 'Accepted', offer, 'Confirmed!')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() =>
                            respondToBooking(b.id, 'Negotiating', offer, 'Revised vendor quote.')
                          }
                          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold"
                        >
                          Counter-Quote
                        </button>
                        <button
                          onClick={() =>
                            respondToBooking(b.id, 'Rejected', offer, 'Date unavailable.')
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 px-3 py-1.5 text-xs font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Packages & Availability Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Packages */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Service Packages ({myVendor.packages.length})
          </h3>
          <div className="space-y-3">
            {myVendor.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{pkg.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {pkg.description}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {pkg.deliverables.join(' · ')}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
                  {formatINR(pkg.price)}
                </span>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddPackage}
            className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3"
          >
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Add New Package
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                placeholder="Package title"
                className="sm:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              />
              <input
                type="number"
                min={1000}
                step={500}
                value={pkgPrice}
                onChange={(e) => setPkgPrice(Number(e.target.value))}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono tabular-nums"
              />
            </div>
            <input
              type="text"
              value={pkgDesc}
              onChange={(e) => setPkgDesc(e.target.value)}
              placeholder="Short description..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={pkgDeliverables}
                onChange={(e) => setPkgDeliverables(e.target.value)}
                placeholder="Deliverables (comma separated)"
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>

        {/* Profile & Availability Calendar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Availability Calendar</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={handleAddBlockedDate}
                className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white text-xs font-semibold"
              >
                Block Date
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myVendor.bookedDates.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">All upcoming dates are open.</p>
              ) : (
                myVendor.bookedDates.map((d) => (
                  <div key={d} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {d} (Blocked / Booked)
                    </span>
                    <button
                      onClick={() => handleRemoveBlockedDate(d)}
                      className="text-slate-400 hover:text-rose-600"
                      aria-label={`Unblock ${d}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3"
          >
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Edit Profile & Services
            </h3>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Services (comma separated)
              </label>
              <input
                type="text"
                value={servicesText}
                onChange={(e) => setServicesText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              Save Profile Updates
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

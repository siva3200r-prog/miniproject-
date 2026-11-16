import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Check, MapPin, Search, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { detectVendorConflict, formatINR } from '../services/storageService';
import { Vendor, VendorCategory } from '../types';
import { BookingModal } from '../components/BookingModal';
import { CompareVendorsModal } from '../components/CompareVendorsModal';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { VendorDetailModal } from '../components/VendorDetailModal';

const CATEGORIES: Array<{ id: 'all' | VendorCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'catering', label: 'Catering' },
  { id: 'venue', label: 'Venue' },
  { id: 'decoration', label: 'Decoration' },
  { id: 'sound/lighting', label: 'Sound & Lighting' },
  { id: 'photography', label: 'Photography' },
  { id: 'makeup', label: 'Makeup' },
  { id: 'transport', label: 'Transport' },
];

export const VendorMarketplacePage: React.FC = () => {
  const { vendors, events, user } = useApp();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | VendorCategory>('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(300000);
  const [sortBy, setSortBy] = useState<'rating' | 'price-asc' | 'price-desc'>('rating');
  const [targetEventId, setTargetEventId] = useState<string>(events[0]?.id || '');

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [bookingVendor, setBookingVendor] = useState<Vendor | null>(null);

  const approvedVendors = useMemo(() => vendors.filter((v) => v.approved), [vendors]);

  const locations = useMemo(() => {
    const unique = Array.from(new Set(approvedVendors.map((v) => v.location))).sort();
    return ['all', ...unique];
  }, [approvedVendors]);

  const targetEvent = useMemo(
    () => events.find((e) => e.id === targetEventId),
    [events, targetEventId]
  );

  const filteredVendors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return approvedVendors
      .filter((v) => {
        if (category !== 'all' && v.category !== category) return false;
        if (locationFilter !== 'all' && v.location !== locationFilter) return false;
        if (v.rating < minRating) return false;
        if (v.priceMin > maxPrice) return false;
        if (
          q &&
          !v.name.toLowerCase().includes(q) &&
          !v.tagline.toLowerCase().includes(q) &&
          !v.services.some((s) => s.toLowerCase().includes(q)) &&
          !v.location.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.priceMin - b.priceMin;
        if (sortBy === 'price-desc') return b.priceMin - a.priceMin;
        return b.rating - a.rating;
      });
  }, [approvedVendors, category, locationFilter, minRating, maxPrice, search, sortBy]);

  const toggleCompare = (vendorId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(vendorId)) return prev.filter((id) => id !== vendorId);
      if (prev.length >= 3) return [...prev.slice(1), vendorId];
      return [...prev, vendorId];
    });
  };

  const compareVendors = useMemo(
    () => approvedVendors.filter((v) => compareIds.includes(v.id)),
    [approvedVendors, compareIds]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Vendor Marketplace
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Browse {approvedVendors.length} verified partners across 7 categories. Compare finalists
            or request event quotes.
          </p>
        </div>

        {compareIds.length >= 2 && (
          <button
            onClick={() => setCompareOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Compare {compareIds.length} Vendors with AI</span>
          </button>
        )}
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              category === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        <div className="lg:col-span-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Search vendors or services
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Catering, LED wall, Bengaluru..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            City
          </label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === 'all' ? 'All Cities' : loc}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Min Rating
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
          >
            <option value={0}>Any Rating</option>
            <option value={4.5}>4.5+ Stars</option>
            <option value={4.8}>4.8+ Stars</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Max Starting ({formatINR(maxPrice)})
          </label>
          <input
            type="range"
            min={20000}
            max={300000}
            step={10000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rating' | 'price-asc' | 'price-desc')}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
          >
            <option value="rating">Highest Rated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Availability Check Context Bar */}
      {events.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Check date availability for:</span>
            <select
              value={targetEventId}
              onChange={(e) => setTargetEventId(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.date})
                </option>
              ))}
            </select>
          </div>
          <span>
            Showing <strong className="font-mono tabular-nums">{filteredVendors.length}</strong>{' '}
            vendors · Select 2–3 to compare
          </span>
        </div>
      )}

      {/* Vendor Grid */}
      {filteredVendors.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No vendors matched your filters.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('all');
              setLocationFilter('all');
              setMinRating(0);
              setMaxPrice(300000);
            }}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => {
            const selected = compareIds.includes(vendor.id);
            const conflictInfo = targetEvent
              ? detectVendorConflict(vendor.id, targetEvent.date)
              : { conflict: false };

            return (
              <div
                key={vendor.id}
                className={`rounded-xl border bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between transition-colors ${
                  selected
                    ? 'border-indigo-600 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <ImageWithFallback
                      src={vendor.portfolioImages[0]}
                      alt={vendor.name}
                      category={vendor.category}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">
                        {vendor.category} ·{' '}
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 inline" /> {vendor.location}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {vendor.rating.toFixed(1)} ({vendor.reviewCount})
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      {vendor.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {vendor.tagline}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatINR(vendor.priceMin)} – {formatINR(vendor.priceMax)}
                      </span>
                      {targetEvent && (
                        <span
                          className={`font-medium ${
                            conflictInfo.conflict
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {conflictInfo.conflict ? 'Date Conflict' : 'Available'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCompare(vendor.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                      selected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    <span>{selected ? 'Selected' : 'Compare'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailVendor(vendor)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Details
                    </button>
                    {user?.role === 'organizer' && (
                      <button
                        type="button"
                        onClick={() => setBookingVendor(vendor)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VendorDetailModal
        vendor={detailVendor}
        onClose={() => setDetailVendor(null)}
        onBookClick={user?.role === 'organizer' ? (v) => setBookingVendor(v) : undefined}
      />

      <BookingModal
        vendor={bookingVendor}
        defaultEventId={targetEventId}
        onClose={() => setBookingVendor(null)}
      />

      <CompareVendorsModal
        vendors={compareVendors}
        event={targetEvent}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        onBookVendor={(v) => setBookingVendor(v)}
      />
    </div>
  );
};

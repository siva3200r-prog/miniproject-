import React, { useState } from 'react';
import { Calendar, Check, MapPin, Star, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../services/storageService';
import { Vendor } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

interface VendorDetailModalProps {
  vendor: Vendor | null;
  onClose: () => void;
  onBookClick?: (vendor: Vendor) => void;
}

export const VendorDetailModal: React.FC<VendorDetailModalProps> = ({
  vendor,
  onClose,
  onBookClick,
}) => {
  const { user, submitVendorReview } = useApp();
  const [rating, setRating] = useState(5);
  const [eventName, setEventName] = useState('');
  const [comment, setComment] = useState('');

  if (!vendor) return null;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    submitVendorReview(vendor.id, {
      authorName: user?.name || 'Verified Organizer',
      eventName: eventName.trim() || 'Recent Event',
      rating,
      comment: comment.trim(),
    });
    setEventName('');
    setComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {vendor.category} · {vendor.location} · Responds in ~{vendor.responseTimeHours}h
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {vendor.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <ImageWithFallback
                src={vendor.portfolioImages[0]}
                alt={vendor.name}
                category={vendor.category}
                className="w-full h-56 object-cover"
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {vendor.description}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                <div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Price Range</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatINR(vendor.priceMin)} – {formatINR(vendor.priceMax)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Rating</span>
                  <span className="inline-flex items-center gap-1 font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {vendor.rating.toFixed(1)} ({vendor.reviewCount})
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Location</span>
                  <span className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {vendor.location}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Max Capacity</span>
                  <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {vendor.capacityMax ? `${vendor.capacityMax} guests` : 'Flexible'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Core Services
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {vendor.services.join(' · ')}
                </p>
              </div>
            </div>
          </div>

          {/* Packages */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Service Packages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vendor.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-950/40"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {pkg.name}
                    </h4>
                    <span className="font-mono text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                      {formatINR(pkg.price)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {pkg.description}
                  </p>
                  <ul className="mt-2.5 space-y-1">
                    {pkg.deliverables.map((d) => (
                      <li
                        key={d}
                        className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Availability Calendar Snapshot */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Blocked / Booked Dates</span>
            </h3>
            {vendor.bookedDates.length === 0 ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Open availability across all upcoming dates.
              </p>
            ) : (
              <p className="text-sm font-mono tabular-nums text-slate-600 dark:text-slate-400">
                Unavailable on: {vendor.bookedDates.join(' · ')}
              </p>
            )}
          </div>

          {/* Reviews */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Client Reviews ({vendor.reviews.length})
            </h3>
            {vendor.reviews.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No written reviews yet.
              </p>
            ) : (
              <div className="space-y-3">
                {vendor.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {rev.authorName} · {rev.eventName}
                      </span>
                      <span className="font-mono tabular-nums">
                        {rev.rating.toFixed(1)} / 5 · {rev.date}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {user?.role === 'organizer' && (
              <form
                onSubmit={handleReviewSubmit}
                className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3"
              >
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Leave a Review
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Event name"
                    className="sm:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with turnaround, pricing, and quality..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    Post
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          >
            Close
          </button>
          {onBookClick && vendor.approved && (
            <button
              onClick={() => {
                onClose();
                onBookClick(vendor);
              }}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Request Quote / Book
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

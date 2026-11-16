import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Loader2, Sparkles, X, XCircle } from 'lucide-react';
import { compareVendorsWithAI } from '../services/geminiService';
import { formatINR } from '../services/storageService';
import { AICompareResult, EventItem, Vendor } from '../types';

interface CompareVendorsModalProps {
  vendors: Vendor[];
  event?: EventItem;
  open: boolean;
  onClose: () => void;
  onBookVendor: (vendor: Vendor) => void;
}

export const CompareVendorsModal: React.FC<CompareVendorsModalProps> = ({
  vendors,
  event,
  open,
  onClose,
  onBookVendor,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AICompareResult | null>(null);

  useEffect(() => {
    if (!open || vendors.length < 2) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    compareVendorsWithAI(vendors, event)
      .then((res) => {
        if (!cancelled) setAnalysis(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Comparison failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, vendors, event]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Side-by-Side Vendor Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {event
                ? `Evaluating fit for ${event.name} (${event.guestCount} guests · ${formatINR(event.budget)})`
                : `Comparing ${vendors.length} selected vendors`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Summary Banner */}
          {loading && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Gemini is comparing pricing, capacity, ratings, and pros/cons...</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300">
              AI comparison unavailable: {error}
            </div>
          )}

          {analysis && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-4 h-4" />
                <span>AI Comparison Verdict</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {analysis.overallSummary}
              </p>
              <p className="text-xs font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5 pt-1">
                <Award className="w-4 h-4 shrink-0" />
                <span>Recommended pick: {analysis.winnerReason}</span>
              </p>
            </div>
          )}

          {/* Side-by-Side Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400 w-36">
                    Attribute
                  </th>
                  {vendors.map((v) => {
                    const isWinner = analysis?.winnerVendorId === v.id;
                    return (
                      <th key={v.id} className="py-3 px-4 align-top min-w-[220px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                            {v.name}
                          </span>
                          {isWinner && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              Top Pick
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 capitalize">
                          {v.category} · {v.location}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                <tr>
                  <td className="py-3 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Price Range
                  </td>
                  {vendors.map((v) => (
                    <td key={v.id} className="py-3 px-4 font-mono tabular-nums font-medium">
                      {formatINR(v.priceMin)} – {formatINR(v.priceMax)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Rating & Reviews
                  </td>
                  {vendors.map((v) => (
                    <td key={v.id} className="py-3 px-4 font-mono tabular-nums">
                      {v.rating.toFixed(1)} / 5 ({v.reviewCount} reviews)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Capacity
                  </td>
                  {vendors.map((v) => (
                    <td key={v.id} className="py-3 px-4 font-mono tabular-nums">
                      {v.capacityMax ? `Up to ${v.capacityMax} guests` : 'Flexible'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Services
                  </td>
                  {vendors.map((v) => (
                    <td key={v.id} className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {v.services.join(' · ')}
                    </td>
                  ))}
                </tr>
                {analysis && (
                  <>
                    <tr>
                      <td className="py-3 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400 align-top">
                        AI Pros
                      </td>
                      {vendors.map((v) => {
                        const item = analysis.vendorAnalyses.find((a) => a.vendorId === v.id);
                        return (
                          <td key={v.id} className="py-3 px-4 align-top">
                            <ul className="space-y-1.5 text-xs">
                              {(item?.pros || []).map((pro, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400 align-top">
                        AI Cons
                      </td>
                      {vendors.map((v) => {
                        const item = analysis.vendorAnalyses.find((a) => a.vendorId === v.id);
                        return (
                          <td key={v.id} className="py-3 px-4 align-top">
                            <ul className="space-y-1.5 text-xs">
                              {(item?.cons || []).map((con, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-rose-700 dark:text-rose-400"
                                >
                                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400 align-top">
                        Value Verdict
                      </td>
                      {vendors.map((v) => {
                        const item = analysis.vendorAnalyses.find((a) => a.vendorId === v.id);
                        return (
                          <td
                            key={v.id}
                            className="py-3 px-4 align-top text-xs text-slate-700 dark:text-slate-300"
                          >
                            {item?.valueVerdict}
                          </td>
                        );
                      })}
                    </tr>
                  </>
                )}
                <tr>
                  <td className="py-4 pr-4" />
                  {vendors.map((v) => (
                    <td key={v.id} className="py-4 px-4">
                      <button
                        onClick={() => {
                          onClose();
                          onBookVendor(v);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                      >
                        Request Quote
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

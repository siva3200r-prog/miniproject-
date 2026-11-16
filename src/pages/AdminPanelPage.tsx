import React, { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../services/storageService';

export const AdminPanelPage: React.FC = () => {
  const { vendors, events, bookings, approveOrRejectVendor, resetAllData } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const pendingVendors = useMemo(
    () => vendors.filter((v) => v.approvalStatus === 'pending'),
    [vendors]
  );

  const filteredVendors = useMemo(() => {
    if (filter === 'all') return vendors;
    return vendors.filter((v) => v.approvalStatus === filter);
  }, [vendors, filter]);

  const totalGMV = bookings
    .filter((b) => b.status === 'Accepted')
    .reduce((acc, b) => acc + b.quotedPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Admin Governance Console
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Review vendor verification dossiers, monitor platform bookings, and manage marketplace
            quality.
          </p>
        </div>

        <button
          onClick={resetAllData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Seed Data</span>
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Pending Approvals</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {pendingVendors.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Approved Vendors</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">
            {vendors.filter((v) => v.approvalStatus === 'approved').length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Platform Events</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">{events.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Confirmed GMV</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">{formatINR(totalGMV)}</p>
        </div>
      </div>

      {/* Vendor Approval & Directory Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Vendor Directory & Approval Queue
            </h3>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                  filter === tab
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredVendors.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No vendors in the &ldquo;{filter}&rdquo; queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Price Band</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-900 dark:text-white">{v.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {v.tagline}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-xs text-slate-700 dark:text-slate-300">
                      {v.category}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                      {v.location}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200">
                      {formatINR(v.priceMin)} – {formatINR(v.priceMax)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold capitalize">
                      <span
                        className={
                          v.approvalStatus === 'approved'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : v.approvalStatus === 'pending'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {v.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-2">
                      {v.approvalStatus !== 'approved' && (
                        <button
                          onClick={() => approveOrRejectVendor(v.id, 'approved')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                      {v.approvalStatus !== 'rejected' && (
                        <button
                          onClick={() => approveOrRejectVendor(v.id, 'rejected')}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 text-xs font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{v.approvalStatus === 'approved' ? 'Suspend' : 'Reject'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

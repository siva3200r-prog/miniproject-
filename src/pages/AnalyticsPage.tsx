import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatINR } from '../services/storageService';

const STATUS_COLORS = ['#4f46e5', '#059669', '#64748b'];

export const AnalyticsPage: React.FC = () => {
  const { user, events, vendors, bookings } = useApp();

  // 1. Budget vs Committed by Category
  const categoryBudgetData = useMemo(() => {
    const map: Record<string, { category: string; planned: number; committed: number }> = {};
    events.forEach((ev) => {
      ev.budgetSplit.forEach((b) => {
        if (!map[b.category]) {
          map[b.category] = { category: b.category, planned: 0, committed: 0 };
        }
        map[b.category].planned += b.amount;
      });
    });

    bookings
      .filter((b) => b.status !== 'Rejected')
      .forEach((bk) => {
        if (!map[bk.vendorCategory]) {
          map[bk.vendorCategory] = { category: bk.vendorCategory, planned: 0, committed: 0 };
        }
        map[bk.vendorCategory].committed += bk.quotedPrice;
      });

    return Object.values(map);
  }, [events, bookings]);

  // 2. Bookings & Revenue Over Time (monthly buckets from bookings + baseline trend)
  const bookingsTrendData = useMemo(() => {
    const months = [
      { month: 'Aug', bookings: 4, revenue: 185000 },
      { month: 'Sep', bookings: 6, revenue: 310000 },
      { month: 'Oct', bookings: 9, revenue: 465000 },
      {
        month: 'Nov',
        bookings: bookings.filter((b) => b.status !== 'Rejected').length,
        revenue: bookings
          .filter((b) => b.status !== 'Rejected')
          .reduce((acc, b) => acc + b.quotedPrice, 0),
      },
    ];
    return months;
  }, [bookings]);

  // 3. Vendor Ratings by Category
  const vendorRatingsData = useMemo(() => {
    const groups: Record<string, { sum: number; count: number }> = {};
    vendors
      .filter((v) => v.approved)
      .forEach((v) => {
        if (!groups[v.category]) groups[v.category] = { sum: 0, count: 0 };
        groups[v.category].sum += v.rating;
        groups[v.category].count += 1;
      });
    return Object.entries(groups).map(([category, val]) => ({
      category,
      avgRating: Number((val.sum / val.count).toFixed(2)),
      count: val.count,
    }));
  }, [vendors]);

  // 4. Event Status Breakdown
  const eventStatusData = useMemo(() => {
    const counts = { Planning: 0, Confirmed: 0, Completed: 0 };
    events.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [events]);

  const totalGMV = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'Accepted')
        .reduce((acc, b) => acc + b.quotedPrice, 0),
    [bookings]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {user?.role === 'admin' ? 'Platform Analytics & Revenue' : 'Event & Spend Analytics'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Real-time breakdown of category allocations, booking volume, vendor ratings, and event
          pipeline health.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Events</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">{events.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Approved Vendors</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">
            {vendors.filter((v) => v.approved).length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Confirmed Booking Value</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">{formatINR(totalGMV)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Avg Vendor Rating</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">
            {(
              vendors.reduce((acc, v) => acc + v.rating, 0) / Math.max(1, vendors.length)
            ).toFixed(2)}{' '}
            / 5
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Budget by Category */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
            Budget Planned vs Committed by Category
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBudgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="planned" name="Planned" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="committed" name="Committed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bookings & Revenue Trend */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
            Bookings & Spend Volume Over Time
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingsTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v, name) => (name === 'Revenue' ? formatINR(Number(v ?? 0)) : String(v ?? ''))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Vendor Ratings */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
            Average Vendor Rating by Category
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorRatingsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avgRating" name="Avg Rating" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Event Status Breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
            Event Status Distribution
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eventStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={4}
                >
                  {eventStatusData.map((_, idx) => (
                    <Cell key={idx} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

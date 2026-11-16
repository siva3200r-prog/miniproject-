import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../context/AppContext';
import { generateAIEventPlan } from '../services/geminiService';
import { formatINR } from '../services/storageService';
import { AIEventPlan } from '../types';
import { PlannerSkeleton } from '../components/SkeletonLoader';

const PRESET_PROMPTS = [
  'Plan a 300-guest college tech fest on 15 Jan with a 2 lakh budget in Bengaluru',
  'Plan a 250-guest contemporary wedding sangeet in Mumbai on 20 Feb with a 5 lakh budget',
  'Plan a 150-person corporate AI leadership conference in Hyderabad on 10 Mar with a 3.5 lakh budget',
];

const CHART_COLORS = ['#4f46e5', '#7c3aed', '#0284c7', '#059669', '#d97706', '#db2777'];

function computeDueDate(eventDate: string, daysBefore: number): string {
  const d = new Date(`${eventDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  d.setDate(d.getDate() - Math.max(0, daysBefore));
  return d.toISOString().split('T')[0];
}

export const AIPlannerPage: React.FC = () => {
  const { user, createEvent } = useApp();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<AIEventPlan | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const result = await generateAIEventPlan(prompt.trim());
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlan = () => {
    if (!plan) return;
    const created = createEvent({
      organizerId: user?.id || 'user-org-1',
      name: plan.eventName,
      type: plan.eventType,
      date: plan.date,
      location: plan.location,
      guestCount: plan.guestCount,
      budget: plan.totalBudget,
      description: plan.summary,
      status: 'Planning',
      budgetSplit: plan.budgetSplit,
      requiredVendorCategories: plan.requiredVendorCategories,
      timeline: plan.timeline.map((t, i) => ({
        id: `tml-${Date.now()}-${i}`,
        ...t,
      })),
      riskWarnings: plan.riskWarnings.map((r, i) => ({
        id: `rsk-${Date.now()}-${i}`,
        ...r,
      })),
      tasks: plan.checklist.map((c, i) => ({
        id: `tsk-${Date.now()}-${i}`,
        title: c.title,
        category: c.category,
        dueDate: computeDueDate(plan.date, c.dueDaysBeforeEvent),
        priority: c.priority,
        completed: false,
      })),
    });

    navigate(`/events/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          AI Event Planner
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Describe your event in natural language. Gemini 2.5 Flash returns a structured budget,
          timeline, vendor checklist, and risk audit ready to apply in one click.
        </p>
      </div>

      {/* Prompt Form */}
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4"
      >
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Event Brief
        </label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Plan a 300-guest college tech fest on 15 Jan with a 2 lakh budget"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_PROMPTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(preset)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Preset {idx + 1}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Event Blueprint</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && <PlannerSkeleton />}

      {!loading && plan && (
        <div className="space-y-6">
          {/* Structured Plan Summary + Apply Button */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                {plan.eventType} · {plan.date} · {plan.location}
              </p>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {plan.eventName}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {plan.summary}
              </p>
              <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 pt-1">
                {plan.guestCount} guests · Total budget {formatINR(plan.totalBudget)} · Required
                categories: {plan.requiredVendorCategories.join(', ')}
              </p>
            </div>

            <button
              onClick={handleApplyPlan}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Plan & Create Event</span>
            </button>
          </div>

          {/* Budget Split + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h4 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
                Suggested Budget Split
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {plan.budgetSplit.map((b, i) => (
                  <div key={i} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
                        {b.category} ({b.percentage}%)
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {b.rationale}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
                      {formatINR(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col">
              <h4 className="font-display text-base font-bold text-slate-900 dark:text-white mb-2">
                Allocation Breakdown
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={plan.budgetSplit}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={52}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {plan.budgetSplit.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatINR(Number(value ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Timeline & Risk Warnings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h4 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
                Day-by-Day Run Sheet
              </h4>
              <div className="space-y-3">
                {plan.timeline.map((item, i) => (
                  <div
                    key={i}
                    className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                      {item.dayLabel} · {item.timeSlot}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {item.description} — Owner: {item.owner}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h4 className="font-display text-base font-bold text-slate-900 dark:text-white mb-3">
                  Risk Warnings
                </h4>
                <div className="space-y-3">
                  {plan.riskWarnings.map((rw, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>
                          {rw.severity.toUpperCase()} · {rw.title}
                        </span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">{rw.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h4 className="font-display text-base font-bold text-slate-900 dark:text-white mb-3">
                  Pre-Event Checklist ({plan.checklist.length} tasks)
                </h4>
                <ul className="space-y-2 text-xs">
                  {plan.checklist.map((task, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <span>{task.title}</span>
                      <span className="font-mono tabular-nums text-slate-500 shrink-0">
                        T-{task.dueDaysBeforeEvent}d
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

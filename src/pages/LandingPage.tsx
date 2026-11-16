import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, CheckCircle2, Layers, ShieldCheck, Sparkles, Store } from 'lucide-react';
import { HERO_IMAGE } from '../data/seedData';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const LandingPage: React.FC = () => {
  const { user, vendors } = useApp();
  const approvedCount = vendors.filter((v) => v.approved).length;

  const workspaceHref =
    user?.role === 'vendor'
      ? '/vendor-portal'
      : user?.role === 'admin'
        ? '/admin'
        : user
          ? '/dashboard'
          : '/auth';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            EventSphere AI
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#capabilities"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#workflow"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#roles"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Workspaces
            </a>
            <Link
              to={user ? '/vendors' : '/auth'}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Marketplace
            </Link>
          </nav>

          <div className="shrink-0">
            <Link
              to={workspaceHref}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span>{user ? 'Open Workspace' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Split Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-14 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              Event Operations · Vendor Procurement · Budget Control
            </p>
            <h1
              className="font-display font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08] max-w-2xl"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
            >
              Plan every event with structured timelines, vetted vendors, and live budget discipline.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              EventSphere AI turns a natural-language brief into itemized category budgets, scored
              vendor matches, conflict-checked bookings, and real-time spend guidance across
              organizers, vendors, and administrators.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to={user ? '/ai-planner' : '/auth?mode=signup'}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <span>{user ? 'Launch AI Planner' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <span>Explore Demo Roles</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <ImageWithFallback
                src={HERO_IMAGE}
                alt="Grand event venue hall prepared for keynote conference and gala banquet"
                category="venue"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Proof Strip */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-b border-slate-200 dark:border-slate-800 py-7">
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {approvedCount}+
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Approved vendors across 7 service categories
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              0–100%
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Gemini-scored vendor fit per budget & guest count
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              1-Click
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Apply structured AI plans directly into active events
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              100%
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Automatic double-booking & date conflict detection
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities Asymmetric Bento Grid */}
      <section id="capabilities" className="max-w-7xl mx-auto px-6 py-14">
        <div className="max-w-2xl mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Built for end-to-end event execution
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Every planning step connects directly to real vendor availability, quotation workflows,
            and category spend limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                <Sparkles className="w-4 h-4" />
                <span>01. Structured AI Event Planner</span>
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Turn a single prompt into a complete production blueprint
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Describe your event — for example, &ldquo;Plan a 300-guest college tech fest on 15
                Jan with a 2 lakh budget&rdquo; — and Gemini 2.5 Flash generates itemized budget
                splits, required vendor categories, a day-by-day run sheet, risk mitigations, and
                a dated task checklist ready to apply in one click.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-6 text-xs text-slate-600 dark:text-slate-400">
              <span>JSON-Schema Validated</span>
              <span>·</span>
              <span>Auto-Calculated Deadlines</span>
              <span>·</span>
              <span>Category Spend Targets</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
              <Store className="w-4 h-4" />
              <span>02. Vendor Matching</span>
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Ranked matches & side-by-side comparison
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluate caterers, venues, AV crews, decorators, photographers, stylists, and fleets
              by budget fit, guest capacity, rating, and open calendar dates.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
              <CalendarCheck2 className="w-4 h-4" />
              <span>03. Conflict-Safe Bookings</span>
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Quotes, negotiations & double-booking guards
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Send quote requests, track vendor counter-offers, and surface instant schedule
              conflicts before a deposit is locked.
            </p>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
              <Layers className="w-4 h-4" />
              <span>04. Budget Optimizer & Context-Aware Copilot</span>
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Catch overspending early and draft vendor communications fast
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              Compare committed vendor quotes against planned category allocations, discover
              lower-cost verified alternatives from the marketplace, and use the floating assistant
              to draft vendor emails, event announcements, and guest invitations.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">
            From brief to confirmed run-of-show in four steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Describe your event',
                desc: 'Enter guest count, target date, city, and budget ceiling in plain English.',
              },
              {
                step: '02',
                title: 'Apply structured plan',
                desc: 'Create the event with pre-filled timelines, risk alerts, and budget targets.',
              },
              {
                step: '03',
                title: 'Match & compare vendors',
                desc: 'Review 0–100% AI match scores and compare finalists side by side.',
              },
              {
                step: '04',
                title: 'Confirm & optimize spend',
                desc: 'Track vendor quotes, resolve date conflicts, and run budget optimization.',
              },
            ].map((item) => (
              <div key={item.step} className="space-y-2">
                <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {item.step}
                </span>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Workspaces */}
      <section id="roles" className="max-w-7xl mx-auto px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Three dedicated role workspaces
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Sign up or switch directly into any role to inspect the full operational loop.
            </p>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
          >
            <span>Open Login & Role Selector</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              role: 'Organizer',
              title: 'Event & Procurement Command',
              points: [
                'AI Event Planner with 1-click apply',
                'Interactive monthly event calendar',
                'AI Vendor Matching & Budget Optimizer',
                'Booking & conflict tracker',
              ],
            },
            {
              role: 'Vendor',
              title: 'Service Catalog & Quote Desk',
              points: [
                'Manage services, pricing & packages',
                'Block or open availability dates',
                'Accept, reject, or counter-quote requests',
                'Track verified client ratings & reviews',
              ],
            },
            {
              role: 'Admin',
              title: 'Marketplace Governance & Analytics',
              points: [
                'Approve or decline new vendor applications',
                'Audit platform-wide events & bookings',
                'Track revenue trends & category spend',
                'Monitor operational risk alerts',
              ],
            },
          ].map((card) => (
            <div
              key={card.role}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {card.role} Workspace
                </p>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {card.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {card.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to={`/auth?role=${card.role.toLowerCase()}`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 py-2.5 px-4 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors"
              >
                <span>Enter as {card.role}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>EventSphere AI · Intelligent Event & Vendor Management</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/auth" className="hover:text-slate-900 dark:hover:text-white">
              Sign In
            </Link>
            <Link to="/auth?mode=signup" className="hover:text-slate-900 dark:hover:text-white">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

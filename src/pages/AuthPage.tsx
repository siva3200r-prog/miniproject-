import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, Store, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, VendorCategory } from '../types';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const initialRole = (searchParams.get('role') as UserRole) || 'organizer';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<UserRole>(
    ['organizer', 'vendor', 'admin'].includes(initialRole) ? initialRole : 'organizer'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [vendorCategory, setVendorCategory] = useState<VendorCategory>('catering');
  const [location, setLocation] = useState('Bengaluru');
  const [error, setError] = useState<string | null>(null);

  const { login, signup } = useApp();
  const navigate = useNavigate();

  const redirectByRole = (targetRole: UserRole) => {
    if (targetRole === 'vendor') navigate('/vendor-portal');
    else if (targetRole === 'admin') navigate('/admin');
    else navigate('/dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      const target = login(email, role);
      if (!target) {
        setError('No account matched that email. Try a demo account below or sign up.');
        return;
      }
      redirectByRole(target.role);
    } else {
      if (!name.trim() || !email.trim()) {
        setError('Name and email are required.');
        return;
      }
      const created = signup({
        name,
        email,
        role,
        organization,
        vendorCategory: role === 'vendor' ? vendorCategory : undefined,
        location: role === 'vendor' ? location : undefined,
      });
      redirectByRole(created.role);
    }
  };

  const handleDemoLogin = (demoRole: UserRole, demoEmail: string) => {
    const logged = login(demoEmail, demoRole);
    if (logged) redirectByRole(logged.role);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-4xl w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to EventSphere AI</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Form Card */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {mode === 'login' ? 'Sign in to workspace' : 'Create your account'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select your role to access tailored event, vendor, or admin controls.
                </p>
              </div>
            </div>

            {/* Mode Segmented Control */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'organizer', label: 'Organizer', icon: UserCheck },
                      { id: 'vendor', label: 'Vendor', icon: Store },
                      { id: 'admin', label: 'Admin', icon: ShieldCheck },
                    ] as const
                  ).map((r) => {
                    const Icon = r.icon;
                    const active = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                          active
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Aarav Sharma"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Work or Personal Email
                </label>
                <input
                  type="email"
                  required={mode === 'signup'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com (or leave blank for demo role)"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {role === 'vendor' ? 'Business / Studio Name' : 'Organization / Campus'}
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder={
                      role === 'vendor' ? 'e.g., Solstice Decor Studio' : 'e.g., Horizon Tech Club'
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {mode === 'signup' && role === 'vendor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Service Category
                    </label>
                    <select
                      value={vendorCategory}
                      onChange={(e) => setVendorCategory(e.target.value as VendorCategory)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="catering">Catering</option>
                      <option value="decoration">Decoration</option>
                      <option value="photography">Photography</option>
                      <option value="sound/lighting">Sound / Lighting</option>
                      <option value="venue">Venue</option>
                      <option value="makeup">Makeup</option>
                      <option value="transport">Transport</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Primary City
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 text-sm font-semibold transition-colors"
              >
                <span>{mode === 'login' ? `Continue as ${role}` : 'Create Account & Enter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Instant Demo Access Panel */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Instant Demo Accounts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Pre-seeded with 3 events, 17 vendors, active bookings, and pending approvals in
                localStorage.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  {
                    role: 'organizer' as UserRole,
                    name: 'Ananya Deshmukh',
                    email: 'ananya@eventsphere.ai',
                    desc: 'Plans events, runs Gemini planner, matches vendors, tracks budgets',
                  },
                  {
                    role: 'vendor' as UserRole,
                    name: 'Vikram Oberoi · Saffron & Slate',
                    email: 'vikram@saffrontable.in',
                    desc: 'Edits packages, blocks calendar dates, accepts or quotes bookings',
                  },
                  {
                    role: 'admin' as UserRole,
                    name: 'Siddharth Nair',
                    email: 'admin@eventsphere.ai',
                    desc: 'Approves pending vendors and inspects platform revenue & analytics',
                  },
                ].map((demo) => (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleDemoLogin(demo.role, demo.email)}
                    className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 p-4 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold capitalize text-indigo-600 dark:text-indigo-400">
                        {demo.role}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {demo.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{demo.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
              All changes persist locally in your browser. You can switch roles anytime from the
              sidebar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

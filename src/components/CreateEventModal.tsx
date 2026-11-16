import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EventType } from '../types';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (eventId: string) => void;
}

const DEFAULT_SPLIT: Record<EventType, Array<{ category: string; pct: number }>> = {
  'college fest': [
    { category: 'catering', pct: 30 },
    { category: 'venue', pct: 25 },
    { category: 'sound/lighting', pct: 20 },
    { category: 'decoration', pct: 15 },
    { category: 'photography', pct: 10 },
  ],
  wedding: [
    { category: 'catering', pct: 32 },
    { category: 'venue', pct: 24 },
    { category: 'decoration', pct: 20 },
    { category: 'sound/lighting', pct: 10 },
    { category: 'photography', pct: 9 },
    { category: 'makeup', pct: 5 },
  ],
  corporate: [
    { category: 'venue', pct: 32 },
    { category: 'catering', pct: 28 },
    { category: 'sound/lighting', pct: 18 },
    { category: 'photography', pct: 12 },
    { category: 'transport', pct: 10 },
  ],
  conference: [
    { category: 'venue', pct: 35 },
    { category: 'catering', pct: 25 },
    { category: 'sound/lighting', pct: 20 },
    { category: 'photography', pct: 10 },
    { category: 'transport', pct: 10 },
  ],
  birthday: [
    { category: 'catering', pct: 35 },
    { category: 'decoration', pct: 25 },
    { category: 'venue', pct: 20 },
    { category: 'photography', pct: 12 },
    { category: 'sound/lighting', pct: 8 },
  ],
};

function offsetDate(eventDate: string, daysBefore: number): string {
  const d = new Date(`${eventDate}T00:00:00`);
  d.setDate(d.getDate() - daysBefore);
  return d.toISOString().split('T')[0];
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ open, onClose, onCreated }) => {
  const { user, createEvent } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState<EventType>('corporate');
  const [date, setDate] = useState('2027-02-10');
  const [location, setLocation] = useState('Bengaluru');
  const [guestCount, setGuestCount] = useState(200);
  const [budget, setBudget] = useState(250000);
  const [description, setDescription] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date || !location.trim()) return;

    const splitConfig = DEFAULT_SPLIT[type];
    const budgetSplit = splitConfig.map((s) => ({
      category: s.category,
      percentage: s.pct,
      amount: Math.round((budget * s.pct) / 100),
    }));

    const tasks = [
      {
        id: `tsk-${Date.now()}-1`,
        title: `Shortlist and confirm ${splitConfig[0].category} vendor`,
        category: splitConfig[0].category,
        dueDate: offsetDate(date, 21),
        priority: 'high' as const,
        completed: false,
      },
      {
        id: `tsk-${Date.now()}-2`,
        title: 'Lock venue layout, power backup & guest check-in desk',
        category: 'venue',
        dueDate: offsetDate(date, 14),
        priority: 'high' as const,
        completed: false,
      },
      {
        id: `tsk-${Date.now()}-3`,
        title: 'Finalize run-of-show cue sheet & AV check',
        category: 'sound/lighting',
        dueDate: offsetDate(date, 5),
        priority: 'medium' as const,
        completed: false,
      },
      {
        id: `tsk-${Date.now()}-4`,
        title: 'Send final guest arrival & transport brief',
        category: 'operations',
        dueDate: offsetDate(date, 2),
        priority: 'low' as const,
        completed: false,
      },
    ];

    const timeline = [
      {
        id: `tml-${Date.now()}-1`,
        dayLabel: 'Morning Setup',
        timeSlot: '08:00 AM – 09:30 AM',
        title: 'Vendor Load-in & Sound Check',
        description: 'Stage rigging, lighting focus, and catering station inspection.',
        owner: 'Operations Lead',
      },
      {
        id: `tml-${Date.now()}-2`,
        dayLabel: 'Main Program',
        timeSlot: '10:00 AM – 04:00 PM',
        title: `${name.trim()} Core Sessions`,
        description: `Main agenda execution for ${guestCount} guests.`,
        owner: user?.name || 'Organizer',
      },
    ];

    const created = createEvent({
      organizerId: user?.id || 'user-org-1',
      name: name.trim(),
      type,
      date,
      location: location.trim(),
      guestCount: Number(guestCount) || 100,
      budget: Number(budget) || 100000,
      description:
        description.trim() || `${type} event in ${location.trim()} for ${guestCount} guests.`,
      status: 'Planning',
      tasks,
      timeline,
      budgetSplit,
      riskWarnings: [],
      requiredVendorCategories: splitConfig.map((s) => s.category),
    });

    setName('');
    setDescription('');
    onClose();
    if (onCreated) onCreated(created.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Create New Event
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Auto-generates baseline budget split, checklist deadlines, and run-of-show timeline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Event Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spring Product Conclave 2027"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Event Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="corporate">Corporate</option>
                <option value="college fest">College Fest</option>
                <option value="wedding">Wedding</option>
                <option value="conference">Conference</option>
                <option value="birthday">Birthday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Event Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location / City
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bengaluru"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Guest Count
              </label>
              <input
                type="number"
                min={10}
                required
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Total Budget (INR)
              </label>
              <input
                type="number"
                min={10000}
                step={5000}
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline key tracks, dining format, stage requirements..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

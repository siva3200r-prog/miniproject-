import {
  CATEGORY_IMAGES,
  SEED_BOOKINGS,
  SEED_EVENTS,
  SEED_NOTIFICATIONS,
  SEED_USERS,
  SEED_VENDORS,
} from '../data/seedData';
import {
  Booking,
  BookingStatus,
  EventItem,
  NotificationItem,
  User,
  UserRole,
  Vendor,
  VendorCategory,
  VendorPackage,
  VendorReview,
} from '../types';

const KEYS = {
  USERS: 'eventsphere_users_v1',
  CURRENT_USER: 'eventsphere_current_user_v1',
  EVENTS: 'eventsphere_events_v1',
  VENDORS: 'eventsphere_vendors_v1',
  BOOKINGS: 'eventsphere_bookings_v1',
  NOTIFICATIONS: 'eventsphere_notifications_v1',
  THEME: 'eventsphere_theme_v1',
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to persist to localStorage:', err);
  }
}

export function initializeStorage(): void {
  if (!localStorage.getItem(KEYS.USERS)) {
    safeWrite(KEYS.USERS, SEED_USERS);
  }
  if (!localStorage.getItem(KEYS.EVENTS)) {
    safeWrite(KEYS.EVENTS, SEED_EVENTS);
  }
  if (!localStorage.getItem(KEYS.VENDORS)) {
    safeWrite(KEYS.VENDORS, SEED_VENDORS);
  }
  if (!localStorage.getItem(KEYS.BOOKINGS)) {
    safeWrite(KEYS.BOOKINGS, SEED_BOOKINGS);
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    safeWrite(KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  }
}

export function getTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(KEYS.THEME);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(KEYS.THEME, theme);
}

// Auth
export function getUsers(): User[] {
  return safeRead<User[]>(KEYS.USERS, SEED_USERS);
}

export function getCurrentUser(): User | null {
  return safeRead<User | null>(KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    safeWrite(KEYS.CURRENT_USER, user);
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
}

export function loginWithRoleOrEmail(email: string, role?: UserRole): User | null {
  const users = getUsers();
  const normalized = email.trim().toLowerCase();
  const found = users.find(
    (u) => u.email.toLowerCase() === normalized && (!role || u.role === role)
  );
  if (found) {
    setCurrentUser(found);
    return found;
  }
  if (role) {
    const demo = users.find((u) => u.role === role);
    if (demo) {
      setCurrentUser(demo);
      return demo;
    }
  }
  return null;
}

export function signupUser(payload: {
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  vendorCategory?: VendorCategory;
  location?: string;
}): User {
  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase());
  if (existing) {
    setCurrentUser(existing);
    return existing;
  }

  const userId = `user-${Date.now()}`;
  let vendorId: string | undefined;

  if (payload.role === 'vendor') {
    vendorId = `ven-${Date.now()}`;
    const category = payload.vendorCategory || 'catering';
    const newVendor: Vendor = {
      id: vendorId,
      ownerUserId: userId,
      name: payload.organization?.trim() || `${payload.name} Studio`,
      category,
      location: payload.location?.trim() || 'Bengaluru',
      tagline: `Professional ${category} partner for modern events`,
      description: `Newly registered ${category} provider awaiting platform verification.`,
      services: ['Custom Event Package', 'On-site Crew'],
      packages: [
        {
          id: `pkg-${Date.now()}`,
          name: 'Standard Event Package',
          price: 45000,
          description: 'Full-day service coverage for up to 250 guests',
          deliverables: ['Dedicated Team', 'Setup & Teardown'],
        },
      ],
      priceMin: 30000,
      priceMax: 120000,
      rating: 4.5,
      reviewCount: 0,
      reviews: [],
      portfolioImages: [CATEGORY_IMAGES[category] || CATEGORY_IMAGES.catering],
      bookedDates: [],
      approved: false,
      approvalStatus: 'pending',
      capacityMax: 500,
      responseTimeHours: 4,
    };
    const vendors = getVendors();
    saveVendors([newVendor, ...vendors]);

    addNotification({
      roleTarget: 'admin',
      type: 'approval',
      title: `New Vendor Application: ${newVendor.name}`,
      message: `${newVendor.category} in ${newVendor.location} is awaiting admin verification.`,
      linkTo: '/admin',
    });
  }

  const newUser: User = {
    id: userId,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    role: payload.role,
    organization: payload.organization?.trim(),
    vendorId,
  };
  safeWrite(KEYS.USERS, [newUser, ...users]);
  setCurrentUser(newUser);
  return newUser;
}

// Events
export function getEvents(): EventItem[] {
  return safeRead<EventItem[]>(KEYS.EVENTS, SEED_EVENTS);
}

export function saveEvents(events: EventItem[]): void {
  safeWrite(KEYS.EVENTS, events);
}

// Vendors
export function getVendors(): Vendor[] {
  return safeRead<Vendor[]>(KEYS.VENDORS, SEED_VENDORS);
}

export function saveVendors(vendors: Vendor[]): void {
  safeWrite(KEYS.VENDORS, vendors);
}

export function addVendorReview(vendorId: string, review: Omit<VendorReview, 'id' | 'date'>): Vendor[] {
  const vendors = getVendors();
  const updated = vendors.map((v) => {
    if (v.id !== vendorId) return v;
    const newReview: VendorReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    const nextReviews = [newReview, ...v.reviews];
    const totalScore = v.rating * v.reviewCount + review.rating;
    const nextCount = v.reviewCount + 1;
    const nextRating = Math.round((totalScore / nextCount) * 10) / 10;
    return {
      ...v,
      reviews: nextReviews,
      reviewCount: nextCount,
      rating: nextRating,
    };
  });
  saveVendors(updated);
  return updated;
}

export function updateVendorPackages(
  vendorId: string,
  updates: Partial<Pick<Vendor, 'name' | 'tagline' | 'description' | 'location' | 'services' | 'packages' | 'priceMin' | 'priceMax' | 'bookedDates'>>
): Vendor[] {
  const vendors = getVendors();
  const updated = vendors.map((v) => (v.id === vendorId ? { ...v, ...updates } : v));
  saveVendors(updated);
  return updated;
}

export function upsertVendorPackage(vendorId: string, pkg: VendorPackage): Vendor[] {
  const vendors = getVendors();
  const updated = vendors.map((v) => {
    if (v.id !== vendorId) return v;
    const exists = v.packages.some((p) => p.id === pkg.id);
    const nextPackages = exists
      ? v.packages.map((p) => (p.id === pkg.id ? pkg : p))
      : [...v.packages, pkg];
    const prices = nextPackages.map((p) => p.price);
    return {
      ...v,
      packages: nextPackages,
      priceMin: prices.length ? Math.min(v.priceMin, ...prices) : v.priceMin,
      priceMax: prices.length ? Math.max(v.priceMax, ...prices) : v.priceMax,
    };
  });
  saveVendors(updated);
  return updated;
}

// Bookings & Conflict Detection
export function getBookings(): Booking[] {
  return safeRead<Booking[]>(KEYS.BOOKINGS, SEED_BOOKINGS);
}

export function saveBookings(bookings: Booking[]): void {
  safeWrite(KEYS.BOOKINGS, bookings);
}

export function detectVendorConflict(
  vendorId: string,
  eventDate: string,
  excludeBookingId?: string
): { conflict: boolean; reason?: string } {
  const vendors = getVendors();
  const bookings = getBookings();
  const vendor = vendors.find((v) => v.id === vendorId);

  const overlappingBooking = bookings.find(
    (b) =>
      b.id !== excludeBookingId &&
      b.vendorId === vendorId &&
      b.eventDate === eventDate &&
      (b.status === 'Accepted' || b.status === 'Pending' || b.status === 'Negotiating')
  );

  if (overlappingBooking) {
    return {
      conflict: true,
      reason: `Already booked/in-progress for "${overlappingBooking.eventName}" on ${eventDate}.`,
    };
  }

  if (vendor && vendor.bookedDates.includes(eventDate)) {
    return {
      conflict: true,
      reason: `${vendor.name} has marked ${eventDate} as unavailable on their calendar.`,
    };
  }

  return { conflict: false };
}

export function createBookingWithConflictCheck(
  bookingInput: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'hasConflict'>
): { booking: Booking; conflictReason?: string } {
  const { conflict, reason } = detectVendorConflict(bookingInput.vendorId, bookingInput.eventDate);
  const now = new Date().toISOString();
  const booking: Booking = {
    ...bookingInput,
    id: `bkg-${Date.now()}`,
    hasConflict: conflict,
    createdAt: now,
    updatedAt: now,
  };
  const bookings = getBookings();
  saveBookings([booking, ...bookings]);

  addNotification({
    roleTarget: 'vendor',
    type: 'booking',
    title: `New Booking Request: ${booking.eventName}`,
    message: `${booking.organizerName} requested ${booking.vendorName} on ${booking.eventDate} for ${formatINR(booking.requestedPrice)}.`,
    linkTo: '/vendor-portal',
  });

  if (conflict && reason) {
    addNotification({
      roleTarget: 'organizer',
      type: 'risk',
      title: `Availability Conflict Detected: ${booking.vendorName}`,
      message: reason,
      linkTo: '/bookings',
    });
  }

  return { booking, conflictReason: reason };
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  quotedPrice?: number,
  vendorResponseNote?: string
): Booking[] {
  const bookings = getBookings();
  let target: Booking | undefined;
  const updated = bookings.map((b) => {
    if (b.id !== bookingId) return b;
    target = {
      ...b,
      status,
      quotedPrice: quotedPrice ?? b.quotedPrice,
      vendorResponseNote: vendorResponseNote ?? b.vendorResponseNote,
      updatedAt: new Date().toISOString(),
    };
    return target;
  });
  saveBookings(updated);

  if (target) {
    // Sync bookedDates if Accepted
    if (status === 'Accepted') {
      const vendors = getVendors();
      const updatedVendors = vendors.map((v) => {
        if (v.id !== target!.vendorId) return v;
        if (v.bookedDates.includes(target!.eventDate)) return v;
        return { ...v, bookedDates: [...v.bookedDates, target!.eventDate] };
      });
      saveVendors(updatedVendors);
    }

    addNotification({
      roleTarget: 'organizer',
      type: 'booking',
      title: `${target.vendorName} ${status} booking`,
      message: `${target.eventName}: ${status} at ${formatINR(target.quotedPrice)}.`,
      linkTo: '/bookings',
    });
  }

  return updated;
}

// Notifications
export function getNotifications(): NotificationItem[] {
  return safeRead<NotificationItem[]>(KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
}

export function saveNotifications(notifications: NotificationItem[]): void {
  safeWrite(KEYS.NOTIFICATIONS, notifications);
}

export function addNotification(
  input: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>
): NotificationItem[] {
  const list = getNotifications();
  const next: NotificationItem = {
    ...input,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const updated = [next, ...list].slice(0, 40);
  saveNotifications(updated);
  return updated;
}

// Formatting Helpers
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
}

export function getDaysRemaining(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function resetDemoData(): void {
  safeWrite(KEYS.USERS, SEED_USERS);
  safeWrite(KEYS.EVENTS, SEED_EVENTS);
  safeWrite(KEYS.VENDORS, SEED_VENDORS);
  safeWrite(KEYS.BOOKINGS, SEED_BOOKINGS);
  safeWrite(KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
}

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  addNotification,
  addVendorReview,
  createBookingWithConflictCheck,
  getBookings,
  getCurrentUser,
  getEvents,
  getNotifications,
  getTheme,
  getVendors,
  initializeStorage,
  loginWithRoleOrEmail,
  resetDemoData,
  saveEvents,
  saveNotifications,
  saveTheme,
  saveVendors,
  setCurrentUser as persistCurrentUser,
  signupUser,
  updateBookingStatus,
  updateVendorPackages,
  upsertVendorPackage,
} from '../services/storageService';
import {
  Booking,
  BookingStatus,
  EventItem,
  EventStatus,
  EventTask,
  NotificationItem,
  ToastMessage,
  User,
  UserRole,
  Vendor,
  VendorCategory,
  VendorPackage,
  VendorReview,
} from '../types';

interface AppContextValue {
  user: User | null;
  events: EventItem[];
  vendors: Vendor[];
  bookings: Booking[];
  notifications: NotificationItem[];
  toasts: ToastMessage[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  login: (email: string, role?: UserRole) => User | null;
  signup: (payload: {
    name: string;
    email: string;
    role: UserRole;
    organization?: string;
    vendorCategory?: VendorCategory;
    location?: string;
  }) => User;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => void;
  createEvent: (event: Omit<EventItem, 'id' | 'createdAt'>) => EventItem;
  updateEvent: (eventId: string, patch: Partial<EventItem>) => void;
  deleteEvent: (eventId: string) => void;
  updateEventStatus: (eventId: string, status: EventStatus) => void;
  toggleEventTask: (eventId: string, taskId: string) => void;
  addEventTask: (eventId: string, task: Omit<EventTask, 'id'>) => void;
  deleteEventTask: (eventId: string, taskId: string) => void;
  requestBooking: (
    input: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'hasConflict'>
  ) => { booking: Booking; conflictReason?: string };
  respondToBooking: (
    bookingId: string,
    status: BookingStatus,
    quotedPrice?: number,
    vendorResponseNote?: string
  ) => void;
  approveOrRejectVendor: (vendorId: string, decision: 'approved' | 'rejected') => void;
  updateVendorProfile: (
    vendorId: string,
    updates: Partial<
      Pick<
        Vendor,
        'name' | 'tagline' | 'description' | 'location' | 'services' | 'packages' | 'priceMin' | 'priceMax' | 'bookedDates'
      >
    >
  ) => void;
  saveVendorPackage: (vendorId: string, pkg: VendorPackage) => void;
  submitVendorReview: (vendorId: string, review: Omit<VendorReview, 'id' | 'date'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getTheme());

  useEffect(() => {
    initializeStorage();
    setUser(getCurrentUser());
    setEvents(getEvents());
    setVendors(getVendors());
    setBookings(getBookings());
    setNotifications(getNotifications());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const login = useCallback(
    (email: string, role?: UserRole) => {
      const loggedIn = loginWithRoleOrEmail(email, role);
      if (loggedIn) {
        setUser(loggedIn);
        showToast({ type: 'success', title: `Signed in as ${loggedIn.name}` });
      }
      return loggedIn;
    },
    [showToast]
  );

  const signup = useCallback(
    (payload: {
      name: string;
      email: string;
      role: UserRole;
      organization?: string;
      vendorCategory?: VendorCategory;
      location?: string;
    }) => {
      const created = signupUser(payload);
      setUser(created);
      setVendors(getVendors());
      setNotifications(getNotifications());
      showToast({
        type: 'success',
        title: `Welcome to EventSphere AI, ${created.name}`,
        description:
          created.role === 'vendor'
            ? 'Your vendor profile has been submitted for admin approval.'
            : undefined,
      });
      return created;
    },
    [showToast]
  );

  const logout = useCallback(() => {
    persistCurrentUser(null);
    setUser(null);
    showToast({ type: 'info', title: 'Signed out' });
  }, [showToast]);

  const switchRoleQuick = useCallback(
    (role: UserRole) => {
      const found = loginWithRoleOrEmail('', role);
      if (found) {
        setUser(found);
        showToast({ type: 'info', title: `Switched workspace to ${found.role.toUpperCase()}` });
      }
    },
    [showToast]
  );

  const createEvent = useCallback(
    (eventInput: Omit<EventItem, 'id' | 'createdAt'>) => {
      const newEvent: EventItem = {
        ...eventInput,
        id: `evt-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const next = [newEvent, ...events];
      setEvents(next);
      saveEvents(next);
      const nextNotifs = addNotification({
        roleTarget: 'organizer',
        type: 'deadline',
        title: `Event Created: ${newEvent.name}`,
        message: `Scheduled for ${newEvent.date} in ${newEvent.location} (${newEvent.guestCount} guests).`,
        linkTo: `/events/${newEvent.id}`,
      });
      setNotifications(nextNotifs);
      showToast({ type: 'success', title: `Event "${newEvent.name}" created` });
      return newEvent;
    },
    [events, showToast]
  );

  const updateEvent = useCallback(
    (eventId: string, patch: Partial<EventItem>) => {
      const next = events.map((e) => (e.id === eventId ? { ...e, ...patch } : e));
      setEvents(next);
      saveEvents(next);
    },
    [events]
  );

  const deleteEvent = useCallback(
    (eventId: string) => {
      const next = events.filter((e) => e.id !== eventId);
      setEvents(next);
      saveEvents(next);
      showToast({ type: 'info', title: 'Event deleted' });
    },
    [events, showToast]
  );

  const updateEventStatus = useCallback(
    (eventId: string, status: EventStatus) => {
      const next = events.map((e) => (e.id === eventId ? { ...e, status } : e));
      setEvents(next);
      saveEvents(next);
      showToast({ type: 'success', title: `Event marked as ${status}` });
    },
    [events, showToast]
  );

  const toggleEventTask = useCallback(
    (eventId: string, taskId: string) => {
      const next = events.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          tasks: e.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        };
      });
      setEvents(next);
      saveEvents(next);
    },
    [events]
  );

  const addEventTask = useCallback(
    (eventId: string, task: Omit<EventTask, 'id'>) => {
      const next = events.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          tasks: [...e.tasks, { ...task, id: `tsk-${Date.now()}` }],
        };
      });
      setEvents(next);
      saveEvents(next);
      showToast({ type: 'success', title: 'Task added to checklist' });
    },
    [events, showToast]
  );

  const deleteEventTask = useCallback(
    (eventId: string, taskId: string) => {
      const next = events.map((e) => {
        if (e.id !== eventId) return e;
        return { ...e, tasks: e.tasks.filter((t) => t.id !== taskId) };
      });
      setEvents(next);
      saveEvents(next);
    },
    [events]
  );

  const requestBooking = useCallback(
    (input: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'hasConflict'>) => {
      const result = createBookingWithConflictCheck(input);
      setBookings(getBookings());
      setNotifications(getNotifications());
      if (result.conflictReason) {
        showToast({
          type: 'warning',
          title: 'Booking sent with conflict warning',
          description: result.conflictReason,
        });
      } else {
        showToast({
          type: 'success',
          title: `Quote request sent to ${input.vendorName}`,
        });
      }
      return result;
    },
    [showToast]
  );

  const respondToBooking = useCallback(
    (bookingId: string, status: BookingStatus, quotedPrice?: number, vendorResponseNote?: string) => {
      const updated = updateBookingStatus(bookingId, status, quotedPrice, vendorResponseNote);
      setBookings(updated);
      setVendors(getVendors());
      setNotifications(getNotifications());
      showToast({
        type: status === 'Rejected' ? 'info' : 'success',
        title: `Booking updated to ${status}`,
      });
    },
    [showToast]
  );

  const approveOrRejectVendor = useCallback(
    (vendorId: string, decision: 'approved' | 'rejected') => {
      const next = vendors.map((v) =>
        v.id === vendorId
          ? { ...v, approved: decision === 'approved', approvalStatus: decision }
          : v
      );
      setVendors(next);
      saveVendors(next);
      const target = vendors.find((v) => v.id === vendorId);
      if (target) {
        const nextNotifs = addNotification({
          roleTarget: 'vendor',
          type: 'approval',
          title: `Vendor Application ${decision === 'approved' ? 'Approved' : 'Declined'}`,
          message: `${target.name} has been ${decision} by platform administration.`,
          linkTo: '/vendor-portal',
        });
        setNotifications(nextNotifs);
      }
      showToast({
        type: decision === 'approved' ? 'success' : 'info',
        title: `Vendor ${decision}`,
      });
    },
    [vendors, showToast]
  );

  const updateVendorProfile = useCallback(
    (
      vendorId: string,
      updates: Partial<
        Pick<
          Vendor,
          'name' | 'tagline' | 'description' | 'location' | 'services' | 'packages' | 'priceMin' | 'priceMax' | 'bookedDates'
        >
      >
    ) => {
      const updated = updateVendorPackages(vendorId, updates);
      setVendors(updated);
      showToast({ type: 'success', title: 'Vendor profile updated' });
    },
    [showToast]
  );

  const saveVendorPackage = useCallback(
    (vendorId: string, pkg: VendorPackage) => {
      const updated = upsertVendorPackage(vendorId, pkg);
      setVendors(updated);
      showToast({ type: 'success', title: `Package "${pkg.name}" saved` });
    },
    [showToast]
  );

  const submitVendorReview = useCallback(
    (vendorId: string, review: Omit<VendorReview, 'id' | 'date'>) => {
      const updated = addVendorReview(vendorId, review);
      setVendors(updated);
      showToast({ type: 'success', title: 'Review published' });
    },
    [showToast]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      setNotifications(next);
      saveNotifications(next);
    },
    [notifications]
  );

  const markAllNotificationsRead = useCallback(() => {
    const next = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(next);
    saveNotifications(next);
  }, [notifications]);

  const resetAllData = useCallback(() => {
    resetDemoData();
    setEvents(getEvents());
    setVendors(getVendors());
    setBookings(getBookings());
    setNotifications(getNotifications());
    showToast({ type: 'info', title: 'Workspace restored to default seed data' });
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        user,
        events,
        vendors,
        bookings,
        notifications,
        toasts,
        theme,
        toggleTheme,
        showToast,
        dismissToast,
        login,
        signup,
        logout,
        switchRoleQuick,
        createEvent,
        updateEvent,
        deleteEvent,
        updateEventStatus,
        toggleEventTask,
        addEventTask,
        deleteEventTask,
        requestBooking,
        respondToBooking,
        approveOrRejectVendor,
        updateVendorProfile,
        saveVendorPackage,
        submitVendorReview,
        markNotificationRead,
        markAllNotificationsRead,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

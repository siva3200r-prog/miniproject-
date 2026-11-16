import {
  AIBudgetOptimization,
  AICompareResult,
  AIEventPlan,
  AIVendorMatchResponse,
  Booking,
  EventItem,
  User,
  Vendor,
} from '../types';

async function postAI<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `AI request failed (${response.status})`);
  }
  return data as T;
}

export async function generateAIEventPlan(prompt: string): Promise<AIEventPlan> {
  return postAI<AIEventPlan>('/api/ai/plan-event', { prompt });
}

export async function matchVendorsForEvent(
  event: EventItem,
  vendors: Vendor[],
  existingBookings: Booking[]
): Promise<AIVendorMatchResponse> {
  return postAI<AIVendorMatchResponse>('/api/ai/match-vendors', {
    event,
    vendors: vendors.filter((v) => v.approved),
    existingBookings,
  });
}

export async function compareVendorsWithAI(
  vendors: Vendor[],
  event?: EventItem
): Promise<AICompareResult> {
  return postAI<AICompareResult>('/api/ai/compare-vendors', {
    event,
    vendors,
  });
}

export async function optimizeEventBudget(
  event: EventItem,
  bookings: Booking[],
  vendors: Vendor[]
): Promise<AIBudgetOptimization> {
  return postAI<AIBudgetOptimization>('/api/ai/optimize-budget', {
    event,
    bookings,
    vendors: vendors.filter((v) => v.approved),
  });
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'model'; text: string }>,
  context: {
    user: User | null;
    events: EventItem[];
    bookings: Booking[];
    vendors: Vendor[];
  }
): Promise<{ reply: string }> {
  return postAI<{ reply: string }>('/api/ai/chat', {
    message,
    history,
    context: {
      currentUser: context.user
        ? { name: context.user.name, role: context.user.role, organization: context.user.organization }
        : null,
      events: context.events.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        date: e.date,
        location: e.location,
        guestCount: e.guestCount,
        budget: e.budget,
        status: e.status,
      })),
      bookings: context.bookings.map((b) => ({
        id: b.id,
        eventName: b.eventName,
        eventDate: b.eventDate,
        vendorName: b.vendorName,
        vendorCategory: b.vendorCategory,
        requestedPrice: b.requestedPrice,
        quotedPrice: b.quotedPrice,
        status: b.status,
        hasConflict: b.hasConflict,
      })),
      approvedVendorsCount: context.vendors.filter((v) => v.approved).length,
    },
  });
}

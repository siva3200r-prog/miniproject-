export type UserRole = 'organizer' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  vendorId?: string;
}

export type EventType = 'wedding' | 'college fest' | 'corporate' | 'birthday' | 'conference';
export type EventStatus = 'Planning' | 'Confirmed' | 'Completed';

export interface EventTask {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface TimelineItem {
  id: string;
  dayLabel: string;
  timeSlot: string;
  title: string;
  description: string;
  owner: string;
}

export interface BudgetAllocation {
  category: string;
  percentage: number;
  amount: number;
  rationale?: string;
}

export interface RiskWarning {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  mitigation: string;
}

export interface EventItem {
  id: string;
  organizerId: string;
  name: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  location: string;
  guestCount: number;
  budget: number;
  description: string;
  status: EventStatus;
  tasks: EventTask[];
  timeline: TimelineItem[];
  budgetSplit: BudgetAllocation[];
  riskWarnings: RiskWarning[];
  requiredVendorCategories: string[];
  createdAt: string;
}

export type VendorCategory =
  | 'catering'
  | 'decoration'
  | 'photography'
  | 'sound/lighting'
  | 'venue'
  | 'makeup'
  | 'transport';

export interface VendorPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  deliverables: string[];
}

export interface VendorReview {
  id: string;
  authorName: string;
  eventName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Vendor {
  id: string;
  ownerUserId?: string;
  name: string;
  category: VendorCategory;
  location: string;
  tagline: string;
  description: string;
  services: string[];
  packages: VendorPackage[];
  priceMin: number;
  priceMax: number;
  rating: number;
  reviewCount: number;
  reviews: VendorReview[];
  portfolioImages: string[];
  bookedDates: string[]; // YYYY-MM-DD
  approved: boolean;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  capacityMax?: number;
  responseTimeHours: number;
}

export type BookingStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating';

export interface Booking {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  organizerId: string;
  organizerName: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: VendorCategory;
  packageName?: string;
  requestedPrice: number;
  quotedPrice: number;
  status: BookingStatus;
  notes: string;
  vendorResponseNote?: string;
  hasConflict?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string; // undefined = broadcast/current view
  roleTarget?: UserRole | 'all';
  type: 'booking' | 'deadline' | 'risk' | 'approval';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  linkTo?: string;
}

export interface AIEventPlan {
  eventName: string;
  eventType: EventType;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  summary: string;
  budgetSplit: BudgetAllocation[];
  requiredVendorCategories: string[];
  timeline: Array<{
    dayLabel: string;
    timeSlot: string;
    title: string;
    description: string;
    owner: string;
  }>;
  riskWarnings: Array<{
    severity: 'high' | 'medium' | 'low';
    title: string;
    mitigation: string;
  }>;
  checklist: Array<{
    title: string;
    category: string;
    dueDaysBeforeEvent: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface AIVendorRecommendation {
  vendorId: string;
  category: string;
  matchScore: number;
  explanation: string;
  estimatedCost: number;
  availabilityStatus: 'Available' | 'Limited' | 'Conflict';
}

export interface AIVendorMatchResponse {
  summary: string;
  recommendations: AIVendorRecommendation[];
}

export interface AICompareResult {
  overallSummary: string;
  winnerVendorId: string;
  winnerReason: string;
  vendorAnalyses: Array<{
    vendorId: string;
    vendorName: string;
    pros: string[];
    cons: string[];
    valueVerdict: string;
  }>;
}

export interface AIBudgetOptimization {
  healthStatus: 'on_track' | 'at_risk' | 'over_budget';
  plannedTotal: number;
  committedTotal: number;
  variance: number;
  executiveSummary: string;
  overspendingAlerts: Array<{
    category: string;
    issue: string;
    impactAmount: number;
  }>;
  savingsSuggestions: Array<{
    title: string;
    potentialSavings: number;
    actionDetail: string;
  }>;
  cheaperAlternatives: Array<{
    currentVendorName: string;
    suggestedVendorId: string;
    suggestedVendorName: string;
    estimatedSavings: number;
    reason: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

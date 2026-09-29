export type UserRole = "admin" | "resident" | "security" | "committee";

export interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  title?: string;
  badgeLine?: string;
  wing?: string;
  flatNumber?: string;
  tower?: string;
  floor?: string;
  ownership?: string;
  designation?: string;
  shift?: string;
  aadhaarLastFour?: string;
  avatar?: string;
}

/** Standard envelope returned by every backend endpoint. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AdminKPIs {
  todayCollection: number;
  todayCollectionChange: string;
  pendingBillsCount: number;
  pendingBillsOverdue: number;
  defaultersCount: number;
  defaultersChange: string;
  monthlyRevenue: string;
  monthlyRevenueChange: string;
  openComplaints: number;
  visitorsToday: number;
  staffPresent: string;
  activeQuarter: string;
  currentDateText: string;
}

/** Amounts are in ₹ Lakhs. */
export interface MonthlyCollectionItem {
  month: string;
  income: number;
  expense: number;
}

export interface ExpenseItem {
  category: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface AlertItem {
  id: string;
  type: "warning" | "info" | "success" | "danger";
  text: string;
  time: string;
  icon: string;
}

export interface ManagementModule {
  id: string;
  name: string;
  icon: string;
  badgeColor: string;
  iconColor: string;
}

export interface ReportItem {
  id: string;
  title: string;
  subtitle: string;
  statusColor: string;
  tag: string;
}

export interface DefaulterItem {
  flatNumber: string;
  residentName: string;
  amount: number;
  billingMonth: string;
  dueDate: string;
}

export interface BillItem {
  id?: string;
  flatNumber: string;
  wing: string;
  residentName: string;
  billingMonth: string;
  amount: number;
  maintenanceCharges: number;
  sinkingFundCharges: number;
  waterCharges: number;
  parkingCharges: number;
  clubCharges: number;
  dueDate: string | Date;
  status: "paid" | "pending" | "overdue";
  paidDate?: string | Date;
  paymentMode?: string;
  transactionRef?: string;
}

export type VisitorType = "Guest" | "Delivery" | "Staff" | "Vendor" | "Cab" | "Other";

export interface VisitorItem {
  id: string;
  name: string;
  phone: string;
  visitorType: VisitorType;
  destinationFlat: string;
  vehicleNumber?: string;
  entryGate: string;
  inTime: string | Date;
  outTime?: string | Date;
  status: "Expected" | "Inside" | "Exited";
  otpCode: string;
  isVerified: boolean;
  purpose?: string;
}

export interface GateLogItem {
  id: string;
  name: string;
  visitorType: VisitorType;
  destinationFlat: string;
  inTime: string | Date;
  outTime: string | Date | null;
}

export interface ExpectedVisitorItem {
  id: string;
  name: string;
  destinationFlat: string;
  expectedAt: string | Date;
  status: "Approved" | "Pending";
}

export interface SecurityAlertItem {
  id: string;
  text: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  time: string;
}

export interface SecurityStats {
  activeInside: number;
  visitorsToday: number;
  deliveriesToday: number;
  expectedToday: number;
  totalLogEntries: number;
  activeAlerts: number;
  highPriorityAlerts: number;
}

export interface NoticeItem {
  id: string;
  title: string;
  category: "General" | "Maintenance" | "Emergency" | "Billing" | "Event";
  content: string;
  publishedDate: string | Date;
  isPinned: boolean;
  priority: "Normal" | "Urgent";
  author: string;
}

export interface NOCItem {
  id: string;
  applicantName: string;
  flatNumber: string;
  nocType: string;
  reason: string;
  appliedDate: string | Date;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
  reviewedDate?: string | Date;
  rejectionReason?: string;
  documents: string[];
}

export interface MeetingItem {
  id: string;
  title: string;
  subtitle?: string;
  meetingType: "AGM" | "EGM" | "Managing Committee" | "Emergency";
  scheduledDate: string | Date;
  venue: string;
  agendaItems: string[];
  quorumRequired: number;
  confirmedAttendees: number;
  status: string;
  pastMeetingsCount?: number;
}

export interface FundBalanceItem {
  name: string;
  amount: number;
  color: string;
}

export interface VendorPaymentItem {
  id: string;
  vendor: string;
  amount: number;
  dueDate: string;
}

export interface CommitteeStats {
  pendingNOCs: number;
  complaintEscalations: number;
  staffApprovals: number;
  vendorInvoices: number;
}

export interface MonthlySnapshot {
  totalCollection: number;
  totalExpenses: number;
  netSurplus: number;
  collectionEfficiency: number;
}

export interface RecentActionItem {
  id: string;
  text: string;
  time: string;
}

export interface FamilyMember {
  name: string;
  relation: string;
  phone: string;
  age?: number;
}

export interface Vehicle {
  type: string;
  number: string;
  parkingSlot: string;
}

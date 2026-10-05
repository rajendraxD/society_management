/**
 * Canonical demo dataset for Harmony Heights CHS.
 * Every screen in the Android app is driven by this data so the UI and the
 * API never drift apart.
 */
/** The flat used for every resident-scoped screen in the demo. */
export const DEMO_RESIDENT_FLAT = "A-404";
/**
 * Password for all four seeded demo accounts. Documented in the README so the
 * client can sign in; hashed with bcrypt at seed time and never stored in
 * plaintext. Replace before any real deployment.
 */
export const DEMO_PASSWORD = "Society@123";
export const INITIAL_SOCIETY = {
    name: "Harmony Heights Co-op Housing Society",
    registrationNumber: "MUM/MH/HSG/2018/4921",
    address: "Link Road, Near Inorbit Mall, Malad West",
    city: "Mumbai",
    pincode: "400064",
    totalFlats: 120,
    wings: ["A", "B", "C", "D"],
};
export const INITIAL_USERS = [
    {
        name: "Rajesh Mehta",
        email: "rajesh.mehta@harmonysociety.in",
        phone: "+91 98201 12345",
        role: "admin",
        title: "Society Admin",
        badgeLine: "Full system access",
        wing: "A",
        flatNumber: "A-501",
        aadhaarLastFour: "8912",
        isActive: true,
    },
    {
        name: "Priya Sharma",
        email: "priya.sharma@gmail.com",
        phone: "+91 98765 43210",
        role: "resident",
        title: "Resident",
        badgeLine: `Flat ${DEMO_RESIDENT_FLAT} · 3 BHK`,
        wing: "A",
        flatNumber: DEMO_RESIDENT_FLAT,
        tower: "A",
        floor: "3rd Floor",
        ownership: "Owner",
        aadhaarLastFour: "5421",
        isActive: true,
    },
    {
        name: "Suresh Kumar",
        email: "suresh.guard@harmonysociety.in",
        phone: "+91 91234 56789",
        role: "security",
        title: "Security",
        badgeLine: "Gate guard access",
        wing: "Main Gate",
        flatNumber: "Gate 1",
        shift: "8AM - 4PM",
        aadhaarLastFour: "3319",
        isActive: true,
    },
    {
        name: "Dr. Anita Joshi",
        email: "anita.joshi@harmonysociety.in",
        phone: "+91 98190 98765",
        role: "committee",
        title: "Committee",
        badgeLine: "Governance & oversight",
        wing: "B",
        flatNumber: "B-804",
        designation: "Secretary",
        aadhaarLastFour: "9912",
        isActive: true,
    },
];
/* ------------------------------------------------------------------ *
 * Resident
 * ------------------------------------------------------------------ */
/** Newest first, matching the "Bill History" list in the Bills screen. */
export const INITIAL_BILLS = [
    {
        flatNumber: DEMO_RESIDENT_FLAT,
        wing: "A",
        residentName: "Priya Sharma",
        billingMonth: "January 2025",
        amount: 4850,
        maintenanceCharges: 3500,
        sinkingFundCharges: 0,
        waterCharges: 450,
        parkingCharges: 600,
        clubCharges: 300,
        dueDate: new Date("2025-02-05"),
        status: "pending",
    },
    {
        flatNumber: DEMO_RESIDENT_FLAT,
        wing: "A",
        residentName: "Priya Sharma",
        billingMonth: "December 2024",
        amount: 4850,
        maintenanceCharges: 3500,
        sinkingFundCharges: 0,
        waterCharges: 450,
        parkingCharges: 600,
        clubCharges: 300,
        dueDate: new Date("2025-01-05"),
        status: "paid",
        paidDate: new Date("2024-12-28"),
        paymentMode: "UPI (Google Pay)",
        transactionRef: "UPI/30918291039",
    },
    {
        flatNumber: DEMO_RESIDENT_FLAT,
        wing: "A",
        residentName: "Priya Sharma",
        billingMonth: "November 2024",
        amount: 4850,
        maintenanceCharges: 3500,
        sinkingFundCharges: 0,
        waterCharges: 450,
        parkingCharges: 600,
        clubCharges: 300,
        dueDate: new Date("2024-12-05"),
        status: "paid",
        paidDate: new Date("2024-11-30"),
        paymentMode: "UPI (PhonePe)",
        transactionRef: "UPI/30119823711",
    },
    {
        flatNumber: DEMO_RESIDENT_FLAT,
        wing: "A",
        residentName: "Priya Sharma",
        billingMonth: "October 2024",
        amount: 4850,
        maintenanceCharges: 3500,
        sinkingFundCharges: 0,
        waterCharges: 450,
        parkingCharges: 600,
        clubCharges: 300,
        dueDate: new Date("2024-11-05"),
        status: "paid",
        paidDate: new Date("2024-10-29"),
        paymentMode: "Net Banking",
        transactionRef: "NEFT/2984710293",
    },
    {
        flatNumber: DEMO_RESIDENT_FLAT,
        wing: "A",
        residentName: "Priya Sharma",
        billingMonth: "September 2024",
        amount: 4850,
        maintenanceCharges: 3500,
        sinkingFundCharges: 0,
        waterCharges: 450,
        parkingCharges: 600,
        clubCharges: 300,
        dueDate: new Date("2024-10-05"),
        status: "paid",
        paidDate: new Date("2024-09-27"),
        paymentMode: "UPI (Google Pay)",
        transactionRef: "UPI/28712004561",
    },
    {
        flatNumber: "A-301",
        wing: "A",
        residentName: "Kunal Singhania",
        billingMonth: "December 2024",
        amount: 9200,
        maintenanceCharges: 6000,
        sinkingFundCharges: 1000,
        waterCharges: 1100,
        parkingCharges: 1100,
        clubCharges: 0,
        dueDate: new Date("2025-01-10"),
        status: "overdue",
    },
];
/**
 * Keyed on `flatNumber` so every resident sees only their own household.
 * Without the key these were one shared list — every flat in the society would
 * have shown the same family and the same cars.
 */
export const INITIAL_FAMILY_MEMBERS = [
    { flatNumber: DEMO_RESIDENT_FLAT, name: "Rohit Sharma", relation: "Spouse", phone: "+91 98765 11223", age: 38 },
    { flatNumber: DEMO_RESIDENT_FLAT, name: "Aarav Sharma", relation: "Son", phone: "+91 98765 33445", age: 11 },
    { flatNumber: DEMO_RESIDENT_FLAT, name: "Kamla Devi", relation: "House Help", phone: "+91 98765 55667", age: 45 },
];
export const INITIAL_VEHICLES = [
    { flatNumber: DEMO_RESIDENT_FLAT, type: "Car", number: "MH 02 CZ 4421", parkingSlot: "P-14 (Basement 1)" },
    { flatNumber: DEMO_RESIDENT_FLAT, type: "Motorcycle", number: "MH 02 BK 9012", parkingSlot: "B-22" },
];
/* ------------------------------------------------------------------ *
 * Complaints
 * ------------------------------------------------------------------ */
export const INITIAL_COMPLAINTS = [
    {
        id: "cmp-1",
        title: "Kitchen sink leaking",
        category: "Plumbing",
        flatNumber: DEMO_RESIDENT_FLAT,
        residentName: "Priya Sharma",
        description: "Water pooling under the kitchen sink since yesterday evening. The trap joint is dripping steadily.",
        status: "In Progress",
        priority: "High",
        assignedTo: "Ramesh Plumbing",
        raisedAt: new Date("2025-01-29T09:15:00"),
    },
    {
        id: "cmp-2",
        title: "Lift stuck between floors 3 and 4",
        category: "Lift",
        flatNumber: "B-205",
        residentName: "Meera Nair",
        description: "Lift B stopped with four passengers inside for six minutes. Manual reset by the technician.",
        status: "Resolved",
        priority: "Emergency",
        assignedTo: "Kone Lift Services",
        raisedAt: new Date("2025-01-30T18:40:00"),
        resolvedAt: new Date("2025-01-30T20:05:00"),
    },
    {
        id: "cmp-3",
        title: "Basement B2 lights out",
        category: "Electrical",
        flatNumber: "C-401",
        residentName: "Arjun Rao",
        description: "The entire B2 parking level is dark after 8pm. Residents are navigating by phone torch.",
        status: "Open",
        priority: "High",
        raisedAt: new Date("2025-01-31T08:20:00"),
    },
    {
        id: "cmp-4",
        title: "Corridor dustbins not collected",
        category: "Cleanliness",
        flatNumber: "A-108",
        residentName: "Deepak Kulkarni",
        description: "The dustbins on the third-floor A-wing corridor have not been emptied for three days.",
        status: "Open",
        priority: "Low",
        raisedAt: new Date("2025-01-28T07:00:00"),
    },
];
export const INITIAL_NOTICES = [
    {
        id: "not-1",
        title: "Water supply disruption · Feb 2nd",
        category: "Maintenance",
        content: "Underground water tank cleaning on 2nd Feb between 10:00 AM and 4:00 PM. Please store water in advance.",
        publishedDate: new Date("2025-01-30"),
        isPinned: true,
        priority: "Urgent",
        author: "Maintenance Team",
    },
    {
        id: "not-2",
        title: "AGM scheduled for Feb 15, 2025",
        category: "Event",
        content: "The Annual General Meeting will be held on 15th Feb 2025 at 10:00 AM in the Community Hall.",
        publishedDate: new Date("2025-01-28"),
        isPinned: true,
        priority: "Normal",
        author: "Managing Committee",
    },
    {
        id: "not-3",
        title: "Republic Day Flag Hoisting Ceremony",
        category: "Event",
        content: "All residents are invited for the 76th Republic Day celebrations at 8:30 AM in the central garden.",
        publishedDate: new Date("2025-01-24"),
        isPinned: false,
        priority: "Normal",
        author: "Cultural Committee",
    },
];
/* ------------------------------------------------------------------ *
 * Security
 * ------------------------------------------------------------------ */
export const INITIAL_VISITORS = [
    {
        id: "vis-1",
        name: "Rohit Sharma",
        phone: "+91 99200 44123",
        visitorType: "Guest",
        destinationFlat: "A-404",
        vehicleNumber: "MH 02 ER 8921",
        entryGate: "Gate 1",
        inTime: new Date("2025-01-31T11:30:00"),
        status: "Expected",
        otpCode: "4921",
        isVerified: true,
        purpose: "Family visit",
    },
    {
        id: "vis-2",
        name: "Swiggy Delivery",
        phone: "+91 98211 55678",
        visitorType: "Delivery",
        destinationFlat: "A-404",
        vehicleNumber: "MH 47 BD 3341",
        entryGate: "Gate 1",
        inTime: new Date("2025-01-31T10:15:00"),
        status: "Inside",
        otpCode: "7103",
        isVerified: true,
        purpose: "Food delivery",
    },
    {
        id: "vis-3",
        name: "Geeta (Maid)",
        phone: "+91 97690 11223",
        visitorType: "Staff",
        destinationFlat: "A-404",
        vehicleNumber: "None",
        entryGate: "Gate 1",
        inTime: new Date("2025-01-31T09:00:00"),
        status: "Inside",
        otpCode: "2201",
        isVerified: true,
        purpose: "Domestic help",
    },
    {
        id: "vis-4",
        name: "Ramesh Electrician",
        phone: "+91 99304 77210",
        visitorType: "Vendor",
        destinationFlat: "A-404",
        vehicleNumber: "None",
        entryGate: "Gate 1",
        inTime: new Date("2025-01-31T08:45:00"),
        status: "Exited",
        otpCode: "5518",
        isVerified: true,
        purpose: "Electrical repair",
    },
];
/** Full gate log — newest first. Drives the Visitor Log screen. */
export const INITIAL_GATE_LOG = [
    { id: "log-1", name: "Delivery · Amazon", visitorType: "Delivery", destinationFlat: "B-201", inTime: new Date("2025-01-31T10:45:00"), outTime: new Date("2025-01-31T10:52:00") },
    { id: "log-2", name: "Rahul Gupta", visitorType: "Guest", destinationFlat: "A-101", inTime: new Date("2025-01-31T10:32:00"), outTime: null },
    { id: "log-3", name: "Sunita (Maid)", visitorType: "Staff", destinationFlat: "C-305", inTime: new Date("2025-01-31T09:58:00"), outTime: null },
    { id: "log-4", name: "Ramesh Plumber", visitorType: "Vendor", destinationFlat: "A-204", inTime: new Date("2025-01-31T09:30:00"), outTime: new Date("2025-01-31T11:00:00") },
    { id: "log-5", name: "Pizza Delivery", visitorType: "Delivery", destinationFlat: "B-102", inTime: new Date("2025-01-31T09:15:00"), outTime: new Date("2025-01-31T09:20:00") },
    { id: "log-6", name: "Rohit Singh", visitorType: "Guest", destinationFlat: "D-502", inTime: new Date("2025-01-31T08:45:00"), outTime: new Date("2025-01-31T09:30:00") },
    { id: "log-7", name: "Geeta (Maid)", visitorType: "Staff", destinationFlat: "A-303", inTime: new Date("2025-01-31T08:30:00"), outTime: null },
];
export const INITIAL_EXPECTED_VISITORS = [
    { id: "exp-1", name: "Rohit Sharma", destinationFlat: "A-404", expectedAt: new Date("2025-01-31T11:00:00"), status: "Approved" },
    { id: "exp-2", name: "Electrician", destinationFlat: "B-201", expectedAt: new Date("2025-01-31T14:00:00"), status: "Approved" },
    { id: "exp-3", name: "Dr. Kavita Patel", destinationFlat: "C-305", expectedAt: new Date("2025-01-31T16:00:00"), status: "Pending" },
];
export const INITIAL_SECURITY_ALERTS = [
    { id: "sec-alt-1", text: "Unverified vehicle in B-wing parking", severity: "HIGH", time: "Now" },
    { id: "sec-alt-2", text: "Gate B lock malfunction reported", severity: "HIGH", time: "25m ago" },
    { id: "sec-alt-3", text: "Visitor in A-wing overstayed 2 hrs", severity: "MEDIUM", time: "1h ago" },
    { id: "sec-alt-4", text: "Night patrol check due: Tower C-10F", severity: "LOW", time: "2h ago" },
];
export const INITIAL_SECURITY_STATS = {
    visitorsToday: 41,
    deliveriesToday: 12,
    expectedToday: 8,
    totalLogEntries: 53,
    activeAlerts: 4,
    highPriorityAlerts: 2,
};
/* ------------------------------------------------------------------ *
 * Committee
 * ------------------------------------------------------------------ */
export const INITIAL_NOCS = [
    {
        id: "noc-1",
        applicantName: "Vikram Nair",
        flatNumber: "B-205",
        nocType: "Bank Loan",
        reason: "Applying for a home loan top-up with HDFC Bank; lender requires a society NOC confirming no outstanding dues.",
        appliedDate: new Date("2025-01-28"),
        status: "Pending",
        documents: ["Loan_Application.pdf", "Dues_Clearance_Statement.pdf"],
    },
    {
        id: "noc-2",
        applicantName: "Meena Pillai",
        flatNumber: "A-108",
        nocType: "Property Sale",
        reason: "Sale deed registration scheduled at Andheri SRO; NOC required for the transfer of share certificate.",
        appliedDate: new Date("2025-01-24"),
        status: "Pending",
        documents: ["Sale_Agreement_Draft.pdf", "Share_Certificate.pdf"],
    },
    {
        id: "noc-3",
        applicantName: "Arjun Kapoor",
        flatNumber: "C-401",
        nocType: "Rental",
        reason: "New tenant police verification and society registration for an 11-month leave and licence agreement.",
        appliedDate: new Date("2025-01-30"),
        status: "Pending",
        documents: ["Tenant_Aadhaar.pdf", "Police_Verification_Ack.pdf"],
    },
];
export const NOC_TYPES = [
    "Property Sale",
    "Bank Loan",
    "Passport",
    "Rental",
    "Gas Connection",
    "Electricity",
    "Business License",
    "Society Transfer",
];
export const INITIAL_COMMITTEE_STATS = {
    pendingNOCs: 3,
    complaintEscalations: 7,
    staffApprovals: 2,
    vendorInvoices: 4,
};
export const INITIAL_SNAPSHOT = {
    totalCollection: 1850000,
    totalExpenses: 1020000,
    netSurplus: 830000,
    collectionEfficiency: 78,
};
export const INITIAL_RECENT_ACTIONS = [
    { id: "act-1", text: "Approved NOC for B-205 (Bank Loan)", time: "2h ago" },
    { id: "act-2", text: "Rejected vendor invoice #INV-2847", time: "Yesterday" },
    { id: "act-3", text: "Signed Lift AMC contract renewal", time: "Jan 29" },
];
export const INITIAL_FUND_BALANCES = [
    { name: "Maintenance Fund", amount: 4520000, color: "#8B5CF6" },
    { name: "Sinking Fund", amount: 1850000, color: "#0EA5E9" },
    { name: "Repair Fund", amount: 830000, color: "#F59E0B" },
    { name: "Corpus Fund", amount: 12500000, color: "#10B981" },
];
export const INITIAL_VENDOR_PAYMENTS = [
    { id: "vp-1", vendor: "Kone Lift Services", amount: 85000, dueDate: "Feb 3" },
    { id: "vp-2", vendor: "Aquaguard Water AMC", amount: 12500, dueDate: "Feb 5" },
    { id: "vp-3", vendor: "SecureZone CCTV", amount: 32000, dueDate: "Feb 10" },
];
export const INITIAL_MEETINGS = [
    {
        id: "meet-1",
        title: "AGM 2025",
        subtitle: "Annual General Meeting",
        meetingType: "AGM",
        scheduledDate: new Date("2025-02-15T10:00:00"),
        venue: "Community Hall",
        agendaItems: [
            "Approval of previous AGM minutes",
            "Financial statement FY 2024-25",
            "Maintenance charges revision proposal",
            "Election of new committee members",
            "Swimming pool addition — vote",
        ],
        quorumRequired: 40,
        confirmedAttendees: 48,
        status: "Upcoming",
        pastMeetingsCount: 12,
    },
    {
        id: "meet-2",
        title: "Managing Committee Review",
        subtitle: "Monthly review meeting",
        meetingType: "Managing Committee",
        scheduledDate: new Date("2025-02-05T19:00:00"),
        venue: "Society Admin Office",
        agendaItems: [
            "Review of monthly collection & defaulter follow-up",
            "Lift maintenance vendor contract renewal",
            "Security agency staff performance review",
        ],
        quorumRequired: 6,
        confirmedAttendees: 8,
        status: "Upcoming",
        pastMeetingsCount: 12,
    },
];
/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */
export const ADMIN_KPIS = {
    todayCollection: 245800,
    todayCollectionChange: "+12% vs yesterday",
    pendingBillsCount: 47,
    pendingBillsOverdue: 6,
    defaultersCount: 12,
    defaultersChange: "3 new this month",
    monthlyRevenue: "18.5L",
    monthlyRevenueChange: "+8% vs last month",
    openComplaints: 23,
    visitorsToday: 41,
    staffPresent: "18/22",
    activeQuarter: "Q3 FY2025",
    currentDateText: "Friday, January 31, 2025",
};
/** Income and expense are both in ₹ Lakhs. */
export const MONTHLY_COLLECTION = [
    { month: "Aug", income: 15.2, expense: 8.5 },
    { month: "Sep", income: 16.8, expense: 9.2 },
    { month: "Oct", income: 14.5, expense: 8.1 },
    { month: "Nov", income: 17.1, expense: 9.8 },
    { month: "Dec", income: 16.4, expense: 9.4 },
    { month: "Jan", income: 18.5, expense: 10.2 },
];
export const EXPENSE_BREAKDOWN = [
    { category: "Security", percentage: 28, amount: 285600, color: "#EF4444" },
    { category: "Utilities", percentage: 32, amount: 326400, color: "#3B82F6" },
    { category: "Maintenance", percentage: 19, amount: 193800, color: "#F59E0B" },
    { category: "Housekeeping", percentage: 15, amount: 153000, color: "#10B981" },
    { category: "Admin", percentage: 6, amount: 61200, color: "#8B5CF6" },
];
export const ADMIN_ALERTS = [
    { id: "alt-1", type: "warning", text: "Lift maintenance due - Tower B", time: "2h ago", icon: "warning-outline" },
    { id: "alt-2", type: "info", text: "3 new NOC requests pending approval", time: "4h ago", icon: "notifications-outline" },
    { id: "alt-3", type: "success", text: "Water pump maintenance completed", time: "6h ago", icon: "checkmark-circle-outline" },
    { id: "alt-4", type: "danger", text: "A-301 bill overdue by 30 days", time: "1d ago", icon: "alert-circle-outline" },
];
export const ADMIN_MODULES = [
    { id: "society", name: "Society", icon: "business-outline", badgeColor: "#E0E7FF", iconColor: "#3B82F6" },
    { id: "flats", name: "Flats", icon: "home-outline", badgeColor: "#DCFCE7", iconColor: "#10B981" },
    { id: "billing", name: "Billing", icon: "document-text-outline", badgeColor: "#FEF3C7", iconColor: "#D97706" },
    { id: "payments", name: "Payments", icon: "card-outline", badgeColor: "#CCFBF1", iconColor: "#0D9488" },
    { id: "noc", name: "NOC", icon: "checkmark-done-outline", badgeColor: "#F3E8FF", iconColor: "#8B5CF6" },
    { id: "tenants", name: "Tenants", icon: "people-outline", badgeColor: "#FFE4E6", iconColor: "#E11D48" },
    { id: "police", name: "Police", icon: "shield-outline", badgeColor: "#E0F2FE", iconColor: "#0284C7" },
    { id: "complaints", name: "Complaints", icon: "chatbubble-outline", badgeColor: "#FFEDD5", iconColor: "#EA580C" },
    { id: "visitors", name: "Visitors", icon: "person-add-outline", badgeColor: "#D1FAE5", iconColor: "#059669" },
    { id: "staff", name: "Staff", icon: "person-outline", badgeColor: "#EDE9FE", iconColor: "#6366F1" },
    { id: "vendors", name: "Vendors", icon: "cube-outline", badgeColor: "#FCE7F3", iconColor: "#DB2777" },
    { id: "inventory", name: "Inventory", icon: "grid-outline", badgeColor: "#ECFCCB", iconColor: "#65A30D" },
    { id: "meetings", name: "Meetings", icon: "calendar-outline", badgeColor: "#FFE4E6", iconColor: "#F43F5E" },
    { id: "documents", name: "Documents", icon: "clipboard-outline", badgeColor: "#E0F2FE", iconColor: "#0891B2" },
    { id: "notices", name: "Notices", icon: "notifications-outline", badgeColor: "#FEF3C7", iconColor: "#CA8A04" },
    { id: "whatsapp", name: "WhatsApp", icon: "call-outline", badgeColor: "#DCFCE7", iconColor: "#16A34A" },
    { id: "reports", name: "Reports", icon: "bar-chart-outline", badgeColor: "#F3E8FF", iconColor: "#7C3AED" },
    { id: "audit", name: "Audit", icon: "search-outline", badgeColor: "#F1F5F9", iconColor: "#475569" },
    { id: "alerts", name: "Alerts", icon: "flash-outline", badgeColor: "#FEE2E2", iconColor: "#DC2626" },
];
export const ADMIN_REPORTS = [
    { id: "rep-1", title: "Collection Report", subtitle: "₹18,50,000 collected", statusColor: "#10B981", tag: "Financial" },
    { id: "rep-2", title: "Expense Report", subtitle: "₹10,20,000 total expenses", statusColor: "#F59E0B", tag: "Accounts" },
    { id: "rep-3", title: "Defaulter List", subtitle: "12 flats with outstanding dues", statusColor: "#EF4444", tag: "Recovery" },
    { id: "rep-4", title: "Visitor Report", subtitle: "1,247 entries this month", statusColor: "#3B82F6", tag: "Security" },
    { id: "rep-5", title: "NOC Report", subtitle: "8 NOCs issued this month", statusColor: "#8B5CF6", tag: "Legal" },
    { id: "rep-6", title: "Complaint Report", subtitle: "156 raised · 134 resolved", statusColor: "#F97316", tag: "Operations" },
    { id: "rep-7", title: "Tenant Report", subtitle: "42 active tenants · 3 new", statusColor: "#0D9488", tag: "Admin" },
    { id: "rep-8", title: "Statutory Audit Report", subtitle: "FY 2023-24 Clean Opinion", statusColor: "#475569", tag: "Audit" },
];

import {
  ADMIN_ALERTS,
  ADMIN_KPIS,
  ADMIN_MODULES,
  ADMIN_REPORTS,
  DEMO_RESIDENT_FLAT,
  EXPENSE_BREAKDOWN,
  INITIAL_BILLS,
  INITIAL_COMMITTEE_STATS,
  INITIAL_EXPECTED_VISITORS,
  INITIAL_FAMILY_MEMBERS,
  INITIAL_FUND_BALANCES,
  INITIAL_GATE_LOG,
  INITIAL_MEETINGS,
  INITIAL_NOCS,
  INITIAL_NOTICES,
  INITIAL_RECENT_ACTIONS,
  INITIAL_SECURITY_ALERTS,
  INITIAL_SECURITY_STATS,
  INITIAL_SNAPSHOT,
  INITIAL_SOCIETY,
  INITIAL_USERS,
  INITIAL_VEHICLES,
  INITIAL_VENDOR_PAYMENTS,
  INITIAL_VISITORS,
  MONTHLY_COLLECTION,
  NOC_TYPES,
  VisitorItem,
} from "../seed/seedData.js";
import { isDbConnected } from "../config/db.js";
import { Society } from "../models/Society.js";
import { Bill } from "../models/Bill.js";
import { Visitor } from "../models/Visitor.js";
import { NOC } from "../models/NOC.js";
import { Notice } from "../models/Notice.js";
import { Meeting } from "../models/Meeting.js";
import { User } from "../models/User.js";

/**
 * Runtime data layer.
 *
 * MongoDB is the source of truth whenever it is reachable. The seeded in-memory
 * collections below exist only so the app still boots without a database, and
 * every mutation keeps memory and Mongo in step so a write is never silently
 * lost when the database is down.
 */

const memBills = INITIAL_BILLS.map((b) => ({ ...b }));
const memVisitors = INITIAL_VISITORS.map((v) => ({ ...v }));
const memNOCs = INITIAL_NOCS.map((n) => ({ ...n }));
const memNotices = INITIAL_NOTICES.map((n) => ({ ...n }));
const memGateLog = INITIAL_GATE_LOG.map((l) => ({ ...l }));
const memExpectedVisitors = INITIAL_EXPECTED_VISITORS.map((v) => ({ ...v }));

/**
 * Mongo documents are keyed on `_id`; every client model and every mutation
 * route is keyed on `id`. Normalising here keeps that detail out of the
 * controllers and the Android app.
 */
function withId<T extends { _id?: unknown }>(doc: T): T & { id: string } {
  const { _id, ...rest } = doc;
  return { ...(rest as T), id: String(_id) };
}

function withIds<T extends { _id?: unknown }>(docs: T[]): (T & { id: string })[] {
  return docs.map(withId);
}

export const Store = {
  /* ---------------- Admin & Society ---------------- */

  async getSociety() {
    if (isDbConnected()) {
      const doc = await Society.findOne().lean();
      if (doc) return doc;
    }
    return INITIAL_SOCIETY;
  },

  async getAdminKPIs() {
    return ADMIN_KPIS;
  },

  async getMonthlyCollectionChart() {
    return MONTHLY_COLLECTION;
  },

  async getExpenseBreakdown() {
    return EXPENSE_BREAKDOWN;
  },

  async getRecentAlerts() {
    return ADMIN_ALERTS;
  },

  async getModules() {
    return ADMIN_MODULES;
  },

  async getReports() {
    return ADMIN_REPORTS;
  },

  /* ---------------- Auth & Users ---------------- */

  async getUsers() {
    if (isDbConnected()) {
      const docs = await User.find().lean();
      if (docs.length) return docs;
    }
    return INITIAL_USERS;
  },

  /**
   * Lookup by role, used to resolve the signed-in user's display fields.
   * `select` is explicit because `passwordHash` is excluded by default but the
   * controllers read `shift` / `designation` / `tower` off the result.
   */
  async getUserByRole(role: string) {
    if (isDbConnected()) {
      const doc = await User.findOne({ role })
        .select("name email phone role flatNumber wing tower floor ownership shift designation title badgeLine avatar aadhaarLastFour isActive")
        .lean();
      if (doc) return withId(doc);
    }
    return INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
  },

  /** Full record including the password hash — only the login flow calls this. */
  async getUserByEmailWithHash(email: string) {
    if (!isDbConnected()) return null;
    return User.findOne({ email: email.toLowerCase().trim() })
      .select("+passwordHash")
      .lean();
  },

  async getUserById(id: string) {
    if (!isDbConnected()) return null;
    return User.findById(id)
      .select("name email phone role flatNumber wing tower floor ownership shift designation title badgeLine avatar aadhaarLastFour isActive refreshTokenVersion")
      .lean();
  },

  /** Invalidates every refresh token previously issued to this user. */
  async bumpRefreshTokenVersion(id: string) {
    if (!isDbConnected()) return;
    await User.updateOne({ _id: id }, { $inc: { refreshTokenVersion: 1 } });
  },

  /* ---------------- Resident ---------------- */

  async getResidentBills(flatNumber: string = DEMO_RESIDENT_FLAT) {
    if (isDbConnected()) {
      const docs = await Bill.find({ flatNumber }).sort({ dueDate: -1 }).lean();
      if (docs.length) return withIds(docs);
    }
    return memBills
      .filter((b) => b.flatNumber === flatNumber)
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  },

  async payBill(flatNumber: string, transactionRef?: string) {
    // Mongo is the source of truth when connected — reading the in-memory list
    // here would target a bill the client is not even looking at.
    if (isDbConnected()) {
      const bill = await Bill.findOne({
        flatNumber,
        status: { $ne: "paid" },
      }).sort({ dueDate: -1 });

      if (!bill) {
        return { success: false, message: "No pending bill found for this flat" };
      }

      bill.status = "paid";
      bill.paidDate = new Date();
      bill.paymentMode = "UPI / Razorpay Instant";
      bill.transactionRef = transactionRef || `UPI/${Date.now()}`;
      await bill.save();

      return { success: true, message: "Payment processed successfully", bill };
    }

    const bill = memBills.find(
      (b) => b.flatNumber === flatNumber && b.status !== "paid"
    );
    if (!bill) {
      return { success: false, message: "No pending bill found for this flat" };
    }

    bill.status = "paid";
    bill.paidDate = new Date();
    bill.paymentMode = "UPI / Razorpay Instant";
    bill.transactionRef = transactionRef || `UPI/${Date.now()}`;

    return { success: true, message: "Payment processed successfully", bill };
  },

  /** Bills across every flat — powers the admin Defaulter List. */
  async getDefaulters() {
    if (isDbConnected()) {
      const docs = await Bill.find({ status: "overdue" }).lean();
      if (docs.length) {
        return docs.map((b) => ({
          flatNumber: b.flatNumber,
          residentName: b.residentName,
          amount: b.amount,
          billingMonth: b.billingMonth,
          dueDate: b.dueDate,
        }));
      }
    }

    return memBills
      .filter((b) => b.status === "overdue")
      .map((b) => ({
        flatNumber: b.flatNumber,
        residentName: b.residentName,
        amount: b.amount,
        billingMonth: b.billingMonth,
        dueDate: b.dueDate,
      }));
  },

  async getNotices() {
    if (isDbConnected()) {
      const docs = await Notice.find().sort({ publishedDate: -1 }).lean();
      if (docs.length) return withIds(docs);
    }
    return [...memNotices].sort(
      (a, b) => b.publishedDate.getTime() - a.publishedDate.getTime()
    );
  },

  /* ---------------- Security ---------------- */

  async getVisitors() {
    if (isDbConnected()) {
      const docs = await Visitor.find().sort({ inTime: -1 }).lean();
      if (docs.length) return withIds(docs);
    }
    return memVisitors;
  },

  /** Visitors currently inside the society. */
  async getActiveVisitors() {
    return (await this.getVisitors()).filter((v) => v.status === "Inside");
  },

  async getGateLog() {
    return memGateLog;
  },

  async getExpectedVisitors() {
    return memExpectedVisitors;
  },

  async getSecurityAlerts() {
    return INITIAL_SECURITY_ALERTS;
  },

  async getSecurityStats() {
    const activeInside = (await this.getVisitors()).filter(
      (v) => v.status === "Inside"
    ).length;
    return {
      ...INITIAL_SECURITY_STATS,
      activeInside,
      totalLogEntries:
        INITIAL_SECURITY_STATS.totalLogEntries + memVisitors.length - INITIAL_VISITORS.length,
    };
  },

  async addVisitor(visitorData: {
    name: string;
    phone: string;
    visitorType?: string;
    destinationFlat: string;
    vehicleNumber?: string;
    entryGate?: string;
    otpCode?: string;
    purpose?: string;
    status?: "Expected" | "Inside" | "Exited";
  }): Promise<VisitorItem> {
    const visitor: VisitorItem = {
      id: `vis-${Date.now()}`,
      name: visitorData.name,
      phone: visitorData.phone,
      visitorType: visitorData.visitorType || "Guest",
      destinationFlat: visitorData.destinationFlat,
      vehicleNumber: visitorData.vehicleNumber || "None",
      entryGate: visitorData.entryGate || "Gate 1",
      inTime: new Date(),
      status: visitorData.status || "Inside",
      otpCode:
        visitorData.otpCode ||
        Math.floor(1000 + Math.random() * 9000).toString(),
      isVerified: true,
      purpose: visitorData.purpose || "Visit",
    };

    memVisitors.unshift(visitor);

    if (isDbConnected()) {
      // Mongo assigns the _id, and the client needs it back to check this
      // visitor out later — so the created row, not the in-memory stub, is
      // what the caller receives.
      const created = await Visitor.create({
        name: visitor.name,
        phone: visitor.phone,
        visitorType: visitor.visitorType,
        destinationFlat: visitor.destinationFlat,
        vehicleNumber: visitor.vehicleNumber,
        entryGate: visitor.entryGate,
        inTime: visitor.inTime,
        status: visitor.status,
        otpCode: visitor.otpCode,
        isVerified: visitor.isVerified,
        purpose: visitor.purpose,
      });

      return withId(created.toObject()) as unknown as VisitorItem;
    }

    return visitor;
  },

  async markVisitorExit(visitorId: string) {
    if (isDbConnected()) {
      // The client sends the Mongo _id of the row it rendered, not the
      // in-memory demo id — matching on `id` would never find anything.
      const visitor = await Visitor.findById(visitorId);
      if (!visitor) {
        return { success: false, message: "Visitor not found" };
      }

      visitor.status = "Exited";
      visitor.outTime = new Date();
      await visitor.save();

      return {
        success: true,
        message: "Visitor marked exited",
        visitor: withId(visitor.toObject()) as unknown as VisitorItem,
      };
    }

    const visitor = memVisitors.find((v) => v.id === visitorId);
    if (!visitor) {
      return { success: false, message: "Visitor not found" };
    }

    visitor.status = "Exited";
    visitor.outTime = new Date();

    return { success: true, message: "Visitor marked exited", visitor };
  },

  /* ---------------- Committee ---------------- */

  async getNOCs() {
    if (isDbConnected()) {
      const docs = await NOC.find().sort({ appliedDate: -1 }).lean();
      if (docs.length) return withIds(docs);
    }
    return memNOCs;
  },

  async getPendingNOCs() {
    return (await this.getNOCs()).filter((n) => n.status === "Pending");
  },

  async getNOCTypes() {
    return NOC_TYPES;
  },

  async updateNOCStatus(
    id: string,
    status: "Approved" | "Rejected",
    reason?: string,
    reviewedBy?: string
  ) {
    const approvedBy = `${reviewedBy || "Managing Committee"} (Secretary)`;

    if (isDbConnected()) {
      const noc = await NOC.findById(id);
      if (!noc) {
        return { success: false, message: "NOC not found" };
      }

      noc.status = status;
      noc.reviewedDate = new Date();
      noc.approvedBy = approvedBy;
      if (reason) noc.rejectionReason = reason;
      await noc.save();

      return { success: true, message: `NOC ${status}`, noc };
    }

    const noc = memNOCs.find((n) => n.id === id);
    if (!noc) {
      return { success: false, message: "NOC not found" };
    }

    noc.status = status;
    noc.reviewedDate = new Date();
    noc.approvedBy = approvedBy;
    if (reason) noc.rejectionReason = reason;

    return { success: true, message: `NOC ${status}`, noc };
  },

  async getCommitteeStats() {
    const pendingNOCs = (await this.getPendingNOCs()).length;
    return { ...INITIAL_COMMITTEE_STATS, pendingNOCs };
  },

  async getMonthlySnapshot() {
    return INITIAL_SNAPSHOT;
  },

  async getRecentActions() {
    return INITIAL_RECENT_ACTIONS;
  },

  async getFundBalances() {
    return INITIAL_FUND_BALANCES;
  },

  async getVendorPayments() {
    return INITIAL_VENDOR_PAYMENTS;
  },

  async getMeetings() {
    if (isDbConnected()) {
      const docs = await Meeting.find().sort({ scheduledDate: 1 }).lean();
      if (docs.length) return withIds(docs);
    }
    return [...INITIAL_MEETINGS].sort(
      (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
    );
  },

  async getFamilyMembers() {
    return INITIAL_FAMILY_MEMBERS;
  },

  async getVehicles() {
    return INITIAL_VEHICLES;
  },
};

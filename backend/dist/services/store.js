"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
const seedData_js_1 = require("../seed/seedData.js");
const db_js_1 = require("../config/db.js");
const Society_js_1 = require("../models/Society.js");
const Bill_js_1 = require("../models/Bill.js");
const Visitor_js_1 = require("../models/Visitor.js");
const NOC_js_1 = require("../models/NOC.js");
const Notice_js_1 = require("../models/Notice.js");
const Meeting_js_1 = require("../models/Meeting.js");
const User_js_1 = require("../models/User.js");
/**
 * Runtime data layer.
 *
 * MongoDB is the source of truth whenever it is reachable. The seeded in-memory
 * collections below exist only so the app still boots without a database, and
 * every mutation keeps memory and Mongo in step so a write is never silently
 * lost when the database is down.
 */
const memBills = seedData_js_1.INITIAL_BILLS.map((b) => ({ ...b }));
const memVisitors = seedData_js_1.INITIAL_VISITORS.map((v) => ({ ...v }));
const memNOCs = seedData_js_1.INITIAL_NOCS.map((n) => ({ ...n }));
const memNotices = seedData_js_1.INITIAL_NOTICES.map((n) => ({ ...n }));
const memGateLog = seedData_js_1.INITIAL_GATE_LOG.map((l) => ({ ...l }));
const memExpectedVisitors = seedData_js_1.INITIAL_EXPECTED_VISITORS.map((v) => ({ ...v }));
/**
 * Mongo documents are keyed on `_id`; every client model and every mutation
 * route is keyed on `id`. Normalising here keeps that detail out of the
 * controllers and the Android app.
 */
function withId(doc) {
    const { _id, ...rest } = doc;
    return { ...rest, id: String(_id) };
}
function withIds(docs) {
    return docs.map(withId);
}
exports.Store = {
    /* ---------------- Admin & Society ---------------- */
    async getSociety() {
        if ((0, db_js_1.isDbConnected)()) {
            const doc = await Society_js_1.Society.findOne().lean();
            if (doc)
                return doc;
        }
        return seedData_js_1.INITIAL_SOCIETY;
    },
    async getAdminKPIs() {
        return seedData_js_1.ADMIN_KPIS;
    },
    async getMonthlyCollectionChart() {
        return seedData_js_1.MONTHLY_COLLECTION;
    },
    async getExpenseBreakdown() {
        return seedData_js_1.EXPENSE_BREAKDOWN;
    },
    async getRecentAlerts() {
        return seedData_js_1.ADMIN_ALERTS;
    },
    async getModules() {
        return seedData_js_1.ADMIN_MODULES;
    },
    async getReports() {
        return seedData_js_1.ADMIN_REPORTS;
    },
    /* ---------------- Auth & Users ---------------- */
    async getUsers() {
        if ((0, db_js_1.isDbConnected)()) {
            const docs = await User_js_1.User.find().lean();
            if (docs.length)
                return docs;
        }
        return seedData_js_1.INITIAL_USERS;
    },
    /**
     * Lookup by role, used to resolve the signed-in user's display fields.
     * `select` is explicit because `passwordHash` is excluded by default but the
     * controllers read `shift` / `designation` / `tower` off the result.
     */
    async getUserByRole(role) {
        if ((0, db_js_1.isDbConnected)()) {
            const doc = await User_js_1.User.findOne({ role })
                .select("name email phone role flatNumber wing tower floor ownership shift designation title badgeLine avatar aadhaarLastFour isActive")
                .lean();
            if (doc)
                return withId(doc);
        }
        return seedData_js_1.INITIAL_USERS.find((u) => u.role === role) || seedData_js_1.INITIAL_USERS[0];
    },
    /** Full record including the password hash — only the login flow calls this. */
    async getUserByEmailWithHash(email) {
        if (!(0, db_js_1.isDbConnected)())
            return null;
        return User_js_1.User.findOne({ email: email.toLowerCase().trim() })
            .select("+passwordHash")
            .lean();
    },
    async getUserById(id) {
        if (!(0, db_js_1.isDbConnected)())
            return null;
        return User_js_1.User.findById(id)
            .select("name email phone role flatNumber wing tower floor ownership shift designation title badgeLine avatar aadhaarLastFour isActive refreshTokenVersion")
            .lean();
    },
    /** Invalidates every refresh token previously issued to this user. */
    async bumpRefreshTokenVersion(id) {
        if (!(0, db_js_1.isDbConnected)())
            return;
        await User_js_1.User.updateOne({ _id: id }, { $inc: { refreshTokenVersion: 1 } });
    },
    /* ---------------- Resident ---------------- */
    async getResidentBills(flatNumber = seedData_js_1.DEMO_RESIDENT_FLAT) {
        if ((0, db_js_1.isDbConnected)()) {
            const docs = await Bill_js_1.Bill.find({ flatNumber }).sort({ dueDate: -1 }).lean();
            if (docs.length)
                return withIds(docs);
        }
        return memBills
            .filter((b) => b.flatNumber === flatNumber)
            .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
    },
    async payBill(flatNumber, transactionRef) {
        // Mongo is the source of truth when connected — reading the in-memory list
        // here would target a bill the client is not even looking at.
        if ((0, db_js_1.isDbConnected)()) {
            const bill = await Bill_js_1.Bill.findOne({
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
        const bill = memBills.find((b) => b.flatNumber === flatNumber && b.status !== "paid");
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
        if ((0, db_js_1.isDbConnected)()) {
            const docs = await Bill_js_1.Bill.find({ status: "overdue" }).lean();
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
        if ((0, db_js_1.isDbConnected)()) {
            const docs = await Notice_js_1.Notice.find().sort({ publishedDate: -1 }).lean();
            if (docs.length)
                return withIds(docs);
        }
        return [...memNotices].sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
    },
    /* ---------------- Security ---------------- */
    async getVisitors() {
        if ((0, db_js_1.isDbConnected)()) {
            const docs = await Visitor_js_1.Visitor.find().sort({ inTime: -1 }).lean();
            if (docs.length)
                return withIds(docs);
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
        return seedData_js_1.INITIAL_SECURITY_ALERTS;
    },
    async getSecurityStats() {
        const activeInside = (await this.getVisitors()).filter((v) => v.status === "Inside").length;
        return {
            ...seedData_js_1.INITIAL_SECURITY_STATS,
            activeInside,
            totalLogEntries: seedData_js_1.INITIAL_SECURITY_STATS.totalLogEntries + memVisitors.length - seedData_js_1.INITIAL_VISITORS.length,
        };
    },
    async addVisitor(visitorData) {
        const visitor = {
            id: `vis-${Date.now()}`,
            name: visitorData.name,
            phone: visitorData.phone,
            visitorType: visitorData.visitorType || "Guest",
            destinationFlat: visitorData.destinationFlat,
            vehicleNumber: visitorData.vehicleNumber || "None",
            entryGate: visitorData.entryGate || "Gate 1",
            inTime: new Date(),
            status: visitorData.status || "Inside",
            otpCode: visitorData.otpCode ||
                Math.floor(1000 + Math.random() * 9000).toString(),
            isVerified: true,
            purpose: visitorData.purpose || "Visit",
        };
        memVisitors.unshift(visitor);
        if ((0, db_js_1.isDbConnected)()) {
            // Mongo assigns the _id, and the client needs it back to check this
            // visitor out later — so the created row, not the in-memory stub, is
            // what the caller receives.
            const created = await Visitor_js_1.Visitor.create({
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
            return withId(created.toObject());
        }
        return visitor;
    },
    async markVisitorExit(visitorId) {
        if ((0, db_js_1.isDbConnected)()) {
            // The client sends the Mongo _id of the row it rendered, not the
            // in-memory demo id — matching on `id` would never find anything.
            const visitor = await Visitor_js_1.Visitor.findById(visitorId);
            if (!visitor) {
                return { success: false, message: "Visitor not found" };
            }
            visitor.status = "Exited";
            visitor.outTime = new Date();
            await visitor.save();
            return {
                success: true,
                message: "Visitor marked exited",
                visitor: withId(visitor.toObject()),
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
        if ((0, db_js_1.isDbConnected)()) {
            const docs = await NOC_js_1.NOC.find().sort({ appliedDate: -1 }).lean();
            if (docs.length)
                return withIds(docs);
        }
        return memNOCs;
    },
    async getPendingNOCs() {
        return (await this.getNOCs()).filter((n) => n.status === "Pending");
    },
    async getNOCTypes() {
        return seedData_js_1.NOC_TYPES;
    },
    async updateNOCStatus(id, status, reason, reviewedBy) {
        const approvedBy = `${reviewedBy || "Managing Committee"} (Secretary)`;
        if ((0, db_js_1.isDbConnected)()) {
            const noc = await NOC_js_1.NOC.findById(id);
            if (!noc) {
                return { success: false, message: "NOC not found" };
            }
            noc.status = status;
            noc.reviewedDate = new Date();
            noc.approvedBy = approvedBy;
            if (reason)
                noc.rejectionReason = reason;
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
        if (reason)
            noc.rejectionReason = reason;
        return { success: true, message: `NOC ${status}`, noc };
    },
    async getCommitteeStats() {
        const pendingNOCs = (await this.getPendingNOCs()).length;
        return { ...seedData_js_1.INITIAL_COMMITTEE_STATS, pendingNOCs };
    },
    async getMonthlySnapshot() {
        return seedData_js_1.INITIAL_SNAPSHOT;
    },
    async getRecentActions() {
        return seedData_js_1.INITIAL_RECENT_ACTIONS;
    },
    async getFundBalances() {
        return seedData_js_1.INITIAL_FUND_BALANCES;
    },
    async getVendorPayments() {
        return seedData_js_1.INITIAL_VENDOR_PAYMENTS;
    },
    async getMeetings() {
        if ((0, db_js_1.isDbConnected)()) {
            const docs = await Meeting_js_1.Meeting.find().sort({ scheduledDate: 1 }).lean();
            if (docs.length)
                return withIds(docs);
        }
        return [...seedData_js_1.INITIAL_MEETINGS].sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    },
    async getFamilyMembers() {
        return seedData_js_1.INITIAL_FAMILY_MEMBERS;
    },
    async getVehicles() {
        return seedData_js_1.INITIAL_VEHICLES;
    },
};

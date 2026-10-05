import { ADMIN_ALERTS, ADMIN_KPIS, ADMIN_MODULES, ADMIN_REPORTS, DEMO_PASSWORD, DEMO_RESIDENT_FLAT, EXPENSE_BREAKDOWN, INITIAL_BILLS, INITIAL_COMMITTEE_STATS, INITIAL_COMPLAINTS, INITIAL_EXPECTED_VISITORS, INITIAL_FAMILY_MEMBERS, INITIAL_FUND_BALANCES, INITIAL_GATE_LOG, INITIAL_MEETINGS, INITIAL_NOCS, INITIAL_NOTICES, INITIAL_RECENT_ACTIONS, INITIAL_SECURITY_ALERTS, INITIAL_SECURITY_STATS, INITIAL_SNAPSHOT, INITIAL_SOCIETY, INITIAL_USERS, INITIAL_VEHICLES, INITIAL_VENDOR_PAYMENTS, INITIAL_VISITORS, MONTHLY_COLLECTION, NOC_TYPES, } from "../seed/seedData.js";
import { isDbConnected } from "../config/db.js";
import { hashPassword } from "../utils/password.js";
import { Society } from "../models/Society.js";
import { Bill } from "../models/Bill.js";
import { Visitor } from "../models/Visitor.js";
import { NOC } from "../models/NOC.js";
import { Notice } from "../models/Notice.js";
import { Meeting } from "../models/Meeting.js";
import { Complaint } from "../models/Complaint.js";
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
const memComplaints = INITIAL_COMPLAINTS.map((c) => ({ ...c }));
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
/**
 * Opens a gate-log row for a visitor who just entered. The log is what the
 * guard actually reads on screen, so a check-in that never lands here is a
 * visitor the guard cannot see. Keyed on the id the client receives, so the
 * matching check-out finds the same row.
 *
 * Only visitors who actually entered get a row. A resident pre-approval is a
 * gate pass for somebody who is still outside, and logging it would show the
 * guard a person who never arrived as currently inside, with an `inTime` and a
 * null `outTime` that nothing will ever clear.
 */
function addGateLogEntry(visitor) {
    memGateLog.unshift({
        id: visitor.id,
        name: visitor.name,
        visitorType: visitor.visitorType,
        destinationFlat: visitor.destinationFlat,
        inTime: visitor.inTime,
        outTime: null,
    });
}
/**
 * Records the exit time on the gate-log row opened by a check-in. The log is the
 * guard's on-screen history, so leaving it unstamped would show a departed
 * visitor as still inside forever.
 */
function stampGateLog(visitorId, outTime) {
    const entry = memGateLog.find((l) => l.id === visitorId);
    if (entry)
        entry.outTime = outTime;
}
/**
 * bcrypt hash of the demo password, computed once per process.
 *
 * The seeded users carry no `passwordHash` (it only ever exists in MongoDB), so
 * the database-less demo needs one to verify a submitted password against. It
 * is deliberately slow to compute and therefore never regenerated per request.
 */
let demoHash = null;
function demoPasswordHash() {
    demoHash ??= hashPassword(DEMO_PASSWORD);
    return demoHash;
}
/**
 * Database-less stand-in for `User.refreshTokenVersion`. Logout increments it so
 * refresh tokens issued before the sign-out stop verifying.
 */
const memRefreshVersions = new Map();
let demoIdSeq = 0;
/**
 * Row id for an in-memory document: a unique prefixed id (`vis-…`), the same
 * shape the seeded rows use. Mongo mints a real ObjectId instead.
 */
function newDemoId(prefix) {
    demoIdSeq += 1;
    return `${prefix}-${Date.now().toString(36)}-${demoIdSeq}`;
}
/**
 * Indian financial quarter for today, e.g. "Q3 FY2025-26". April is the
 * fiscal-year start, so Apr-Jun is Q1.
 */
function activeQuarter() {
    const now = new Date();
    const fiscalYearStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const quarter = Math.floor(((now.getMonth() - 3 + 12) % 12) / 3) + 1;
    return `Q${quarter} FY${fiscalYearStart}-${String(fiscalYearStart + 1).slice(2)}`;
}
export const Store = {
    /* ---------------- Admin & Society ---------------- */
    async getSociety() {
        if (isDbConnected()) {
            const doc = await Society.findOne().lean();
            if (doc)
                return doc;
        }
        return INITIAL_SOCIETY;
    },
    async getAdminKPIs() {
        // Only the two date fields are live; the rest is seeded sample data.
        return {
            ...ADMIN_KPIS,
            currentDateText: new Intl.DateTimeFormat("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(new Date()),
            activeQuarter: activeQuarter(),
        };
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
            if (docs.length)
                return docs;
        }
        return INITIAL_USERS;
    },
    /**
     * Lookup by role, used to resolve the signed-in user's display fields.
     * `select` is explicit because `passwordHash` is excluded by default but the
     * controllers read `shift` / `designation` / `tower` off the result.
     */
    async getUserByRole(role) {
        if (isDbConnected()) {
            const doc = await User.findOne({ role })
                .select("name email phone role flatNumber wing tower floor ownership shift designation title badgeLine avatar aadhaarLastFour isActive")
                .lean();
            if (doc)
                return withId(doc);
        }
        return INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    },
    /**
     * Full record including the password hash — only the login flow calls this.
     *
     * With MongoDB down this falls back to the seeded demo users, verified
     * against the demo password hash: the bcrypt hash lives in the database, so
     * without it there is nothing to compare a submitted password against and
     * every sign-in would 401.
     */
    async getUserByEmailWithHash(email) {
        const normalised = email.toLowerCase().trim();
        if (isDbConnected()) {
            return User.findOne({ email: normalised })
                .select("+passwordHash")
                .lean();
        }
        const demoUser = INITIAL_USERS.find((u) => u.email === normalised);
        if (!demoUser)
            return null;
        // A stable synthetic `_id`: the seeded rows have none, and the token's `sub`
        // needs something that survives a restart within this process.
        const id = `demo-${demoUser.role}`;
        return {
            ...demoUser,
            _id: id,
            // The live counter, not a constant 0. Hardcoding 0 here would mint a
            // refresh token stamped `ver: 0` after every logout, which `/refresh`
            // would then reject against the bumped version — one logout would lock
            // that demo account out for the rest of the process.
            refreshTokenVersion: memRefreshVersions.get(id) ?? 0,
            passwordHash: await demoPasswordHash(),
        };
    },
    /**
     * Lookup by the token's `sub`.
     *
     * Database-less, the demo users are matched on the synthetic id that
     * `getUserByEmailWithHash` mints — without this fallback `/auth/me` 404s and
     * `/auth/refresh` 401s, so a signed-in session cannot survive a reload.
     */
    async getUserById(id) {
        if (isDbConnected()) {
            return User.findById(id)
                .select("name email phone role flatNumber wing tower floor ownership shift designation title badgeLine avatar aadhaarLastFour isActive refreshTokenVersion")
                .lean();
        }
        const demoUser = INITIAL_USERS.find((u) => `demo-${u.role}` === id);
        if (!demoUser)
            return null;
        return {
            ...demoUser,
            _id: id,
            refreshTokenVersion: memRefreshVersions.get(id) ?? 0,
        };
    },
    /** Invalidates every refresh token previously issued to this user. */
    async bumpRefreshTokenVersion(id) {
        if (isDbConnected()) {
            await User.updateOne({ _id: id }, { $inc: { refreshTokenVersion: 1 } });
            return;
        }
        // Mirror the counter in memory, otherwise a logout is a no-op without a
        // database and the refresh cookie keeps working.
        memRefreshVersions.set(id, (memRefreshVersions.get(id) ?? 0) + 1);
    },
    /* ---------------- Resident ---------------- */
    async getResidentBills(flatNumber = DEMO_RESIDENT_FLAT) {
        if (isDbConnected()) {
            const docs = await Bill.find({ flatNumber }).sort({ dueDate: -1 }).lean();
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
        // Newest due date first, matching the Mongo branch above. Taking the first
        // array match instead would settle a different bill than the dashboard
        // shows whenever a flat has more than one unpaid invoice.
        const bill = memBills
            .filter((b) => b.flatNumber === flatNumber && b.status !== "paid")
            .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())[0];
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
            if (docs.length)
                return withIds(docs);
        }
        return [...memNotices].sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
    },
    /* ---------------- Security ---------------- */
    async getVisitors() {
        if (isDbConnected()) {
            const docs = await Visitor.find().sort({ inTime: -1 }).lean();
            if (docs.length)
                return withIds(docs);
        }
        return memVisitors;
    },
    /** Visitors currently inside the society. */
    async getActiveVisitors() {
        return (await this.getVisitors()).filter((v) => v.status === "Inside");
    },
    /**
     * The guard's on-screen Visitor Log.
     *
     * ponytail: memory-only. The Visitor rows are persisted, but their gate-log
     * rows are not, so a restart empties the log while the visitors remain — the
     * guard loses history they were shown before the bounce. A `GateEntry` model
     * (or deriving the log from `Visitor.find({ inTime: … })` on read) is the fix;
     * add it when gate history has to survive a deploy.
     */
    async getGateLog() {
        return memGateLog;
    },
    /**
     * Visitors the gate should expect but who have not entered yet.
     *
     * Resident pre-approvals land here, which is the whole point of them: the
     * guard sees the guest on the expected list, checks them in against the
     * fast-entry code, and the row moves to `Inside`.
     */
    async getExpectedVisitors() {
        const live = (await this.getVisitors()).filter((v) => v.status === "Expected");
        return [
            ...live.map((v) => ({
                id: v.id,
                name: v.name,
                destinationFlat: v.destinationFlat,
                expectedAt: v.inTime,
                status: "Approved",
            })),
            ...memExpectedVisitors,
        ];
    },
    async getSecurityAlerts() {
        return INITIAL_SECURITY_ALERTS;
    },
    async getSecurityStats() {
        const activeInside = (await this.getVisitors()).filter((v) => v.status === "Inside").length;
        return {
            ...INITIAL_SECURITY_STATS,
            activeInside,
            totalLogEntries: INITIAL_SECURITY_STATS.totalLogEntries + memVisitors.length - INITIAL_VISITORS.length,
        };
    },
    async addVisitor(visitorData) {
        const visitor = {
            id: newDemoId("vis"),
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
            const saved = withId(created.toObject());
            if (saved.status === "Inside")
                addGateLogEntry(saved);
            return saved;
        }
        if (visitor.status === "Inside")
            addGateLogEntry(visitor);
        return visitor;
    },
    async markVisitorExit(visitorId) {
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
            stampGateLog(visitorId, visitor.outTime);
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
        stampGateLog(visitorId, visitor.outTime);
        return { success: true, message: "Visitor marked exited", visitor };
    },
    /* ---------------- Committee ---------------- */
    async getNOCs() {
        if (isDbConnected()) {
            const docs = await NOC.find().sort({ appliedDate: -1 }).lean();
            if (docs.length)
                return withIds(docs);
        }
        return memNOCs;
    },
    async getPendingNOCs() {
        return (await this.getNOCs()).filter((n) => n.status === "Pending");
    },
    async getNOCTypes() {
        return NOC_TYPES;
    },
    async updateNOCStatus(id, status, reason, reviewedBy) {
        const approvedBy = `${reviewedBy || "Managing Committee"} (Secretary)`;
        if (isDbConnected()) {
            const noc = await NOC.findById(id);
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
            if (docs.length)
                return withIds(docs);
        }
        return [...INITIAL_MEETINGS].sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    },
    /* ---------------- Complaints ---------------- */
    /**
     * Complaints for one flat, newest first.
     *
     * Scoped by flat because a resident may only see their own — the admin view
     * passes no flat and gets the whole society.
     */
    async getComplaints(flatNumber) {
        if (isDbConnected()) {
            // Connected means Mongo is the answer, full stop. Falling through to the
            // demo rows on an empty result would hand the admin four complaints that
            // do not exist, and the first status change on one would 500 on the
            // `cmp-1` demo id.
            const filter = flatNumber ? { flatNumber } : {};
            const docs = await Complaint.find(filter).sort({ raisedAt: -1 }).lean();
            return withIds(docs);
        }
        const rows = flatNumber
            ? memComplaints.filter((c) => c.flatNumber === flatNumber)
            : memComplaints;
        return [...rows].sort((a, b) => b.raisedAt.getTime() - a.raisedAt.getTime());
    },
    /** Raised by a resident. `flatNumber` and `residentName` come from the token. */
    async createComplaint(input) {
        const complaint = {
            id: newDemoId("cmp"),
            title: input.title,
            category: input.category,
            flatNumber: input.flatNumber,
            residentName: input.residentName,
            description: input.description,
            status: "Open",
            priority: input.priority,
            raisedAt: new Date(),
        };
        memComplaints.unshift(complaint);
        if (isDbConnected()) {
            const created = await Complaint.create({
                title: complaint.title,
                category: complaint.category,
                flatNumber: complaint.flatNumber,
                residentName: complaint.residentName,
                description: complaint.description,
                status: complaint.status,
                priority: complaint.priority,
                raisedAt: complaint.raisedAt,
            });
            return withId(created.toObject());
        }
        return complaint;
    },
    /**
     * Admin/committee status change. Stamps `resolvedAt` so a closed complaint
     * carries a date instead of looking abandoned.
     */
    async updateComplaintStatus(id, status, assignedTo) {
        if (isDbConnected()) {
            const complaint = await Complaint.findById(id);
            if (!complaint)
                return { success: false, message: "Complaint not found" };
            complaint.status = status;
            complaint.resolvedAt = status === "Resolved" ? new Date() : undefined;
            if (assignedTo)
                complaint.assignedTo = assignedTo;
            await complaint.save();
            return { success: true, message: `Complaint marked ${status}`, complaint: withId(complaint.toObject()) };
        }
        const complaint = memComplaints.find((c) => c.id === id);
        if (!complaint)
            return { success: false, message: "Complaint not found" };
        complaint.status = status;
        complaint.resolvedAt = status === "Resolved" ? new Date() : undefined;
        if (assignedTo)
            complaint.assignedTo = assignedTo;
        return { success: true, message: `Complaint marked ${status}`, complaint };
    },
    /**
     * Household members of one flat. `flatNumber` is stripped — the client
     * already knows which flat it asked for.
     *
     * ponytail: seeded demo constants, no Mongo model behind them, so a flat
     * with no seeded household gets `[]` in production. Scoping by flat is what
     * matters — an unfiltered list would show every flat the same family. Add a
     * `FamilyMember` model when households become editable.
     */
    async getFamilyMembers(flatNumber) {
        return INITIAL_FAMILY_MEMBERS.filter((f) => f.flatNumber === flatNumber).map(({ flatNumber: _flat, ...rest }) => rest);
    },
    /** Registered vehicles for one flat. Same seeded-constant caveat as
     *  `getFamilyMembers` above. */
    async getVehicles(flatNumber) {
        return INITIAL_VEHICLES.filter((v) => v.flatNumber === flatNumber).map(({ flatNumber: _flat, ...rest }) => rest);
    },
};

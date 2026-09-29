"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Seeds MongoDB with the Harmony Heights demo dataset.
 *
 * Run with `npm run seed`. Idempotent: every collection is replaced, so the
 * script can be re-run after a schema change or to reset a demo.
 */
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const User_js_1 = require("../models/User.js");
const Society_js_1 = require("../models/Society.js");
const Bill_js_1 = require("../models/Bill.js");
const Visitor_js_1 = require("../models/Visitor.js");
const NOC_js_1 = require("../models/NOC.js");
const Notice_js_1 = require("../models/Notice.js");
const Meeting_js_1 = require("../models/Meeting.js");
const password_js_1 = require("../utils/password.js");
const seedData_js_1 = require("./seedData.js");
async function seed() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/society_management";
    console.log(`[seed] Connecting to ${uri}`);
    await mongoose_1.default.connect(uri, { serverSelectionTimeoutMS: 5000 });
    // One hash for all four demo accounts — bcrypt is deliberately slow, so
    // hashing four times would only add seconds to every seed run.
    const passwordHash = await (0, password_js_1.hashPassword)(seedData_js_1.DEMO_PASSWORD);
    const users = seedData_js_1.INITIAL_USERS.map((u) => ({
        ...u,
        passwordHash,
        refreshTokenVersion: 0,
    }));
    /** Drops the demo-only `id`/`subtitle` keys the Mongoose schemas do not have. */
    const strip = (rows, keys) => rows.map((row) => {
        const copy = { ...row };
        for (const key of keys)
            delete copy[key];
        return copy;
    });
    // Reconcile indexes before writing. A database seeded by an older schema can
    // still carry indexes on fields that no longer exist (e.g. a unique
    // `invoiceNumber`), which makes every insert collide on null.
    await Promise.all([
        User_js_1.User.syncIndexes(),
        Society_js_1.Society.syncIndexes(),
        Bill_js_1.Bill.syncIndexes(),
        Visitor_js_1.Visitor.syncIndexes(),
        NOC_js_1.NOC.syncIndexes(),
        Notice_js_1.Notice.syncIndexes(),
        Meeting_js_1.Meeting.syncIndexes(),
    ]);
    const writes = [
        ["users", User_js_1.User.deleteMany({}).then(() => User_js_1.User.insertMany(users))],
        [
            "societies",
            Society_js_1.Society.deleteMany({}).then(() => Society_js_1.Society.create(seedData_js_1.INITIAL_SOCIETY)),
        ],
        ["bills", Bill_js_1.Bill.deleteMany({}).then(() => Bill_js_1.Bill.insertMany(seedData_js_1.INITIAL_BILLS))],
        [
            "visitors",
            Visitor_js_1.Visitor.deleteMany({}).then(() => Visitor_js_1.Visitor.insertMany(strip(seedData_js_1.INITIAL_VISITORS, ["id"]))),
        ],
        [
            "nocs",
            NOC_js_1.NOC.deleteMany({}).then(() => NOC_js_1.NOC.insertMany(strip(seedData_js_1.INITIAL_NOCS, ["id"]))),
        ],
        [
            "notices",
            Notice_js_1.Notice.deleteMany({}).then(() => Notice_js_1.Notice.insertMany(strip(seedData_js_1.INITIAL_NOTICES, ["id"]))),
        ],
        [
            "meetings",
            Meeting_js_1.Meeting.deleteMany({}).then(() => Meeting_js_1.Meeting.insertMany(strip(seedData_js_1.INITIAL_MEETINGS, ["id"]))),
        ],
    ];
    const results = [];
    for (const [name, write] of writes) {
        await write;
        results.push([name, await mongoose_1.default.connection.collection(name).countDocuments()]);
    }
    console.log("\n[seed] Done. Collections written:");
    for (const [name, count] of results) {
        console.log(`  ${name.padEnd(12)} ${count}`);
    }
    console.log("\n[seed] Demo accounts (all share the same password):");
    for (const u of seedData_js_1.INITIAL_USERS) {
        console.log(`  ${u.role.padEnd(9)} ${u.email}`);
    }
    console.log(`  password  ${seedData_js_1.DEMO_PASSWORD}`);
    await mongoose_1.default.disconnect();
}
seed().catch(async (error) => {
    console.error("[seed] Failed:", error);
    await mongoose_1.default.disconnect().catch(() => undefined);
    process.exit(1);
});

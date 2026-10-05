/**
 * Seeds MongoDB with the Harmony Heights demo dataset.
 *
 * Run with `npm run seed`. Idempotent: every collection is replaced, so the
 * script can be re-run after a schema change or to reset a demo.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import { User } from "../models/User.js";
import { Society } from "../models/Society.js";
import { Bill } from "../models/Bill.js";
import { Visitor } from "../models/Visitor.js";
import { NOC } from "../models/NOC.js";
import { Notice } from "../models/Notice.js";
import { Meeting } from "../models/Meeting.js";
import { Complaint } from "../models/Complaint.js";
import { hashPassword } from "../utils/password.js";
import {
  DEMO_PASSWORD,
  INITIAL_BILLS,
  INITIAL_COMPLAINTS,
  INITIAL_MEETINGS,
  INITIAL_NOCS,
  INITIAL_NOTICES,
  INITIAL_SOCIETY,
  INITIAL_USERS,
  INITIAL_VISITORS,
} from "./seedData.js";

async function seed() {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/society_management";

  console.log(`[seed] Connecting to ${uri}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  // One hash for all four demo accounts — bcrypt is deliberately slow, so
  // hashing four times would only add seconds to every seed run.
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const users = INITIAL_USERS.map((u) => ({
    ...u,
    passwordHash,
    refreshTokenVersion: 0,
  }));

  /** Drops the demo-only `id`/`subtitle` keys the Mongoose schemas do not have. */
  const strip = <T extends object>(
    rows: T[],
    keys: string[]
  ): Record<string, unknown>[] =>
    rows.map((row) => {
      const copy = { ...row } as Record<string, unknown>;
      for (const key of keys) delete copy[key];
      return copy;
    });

  // Reconcile indexes before writing. A database seeded by an older schema can
  // still carry indexes on fields that no longer exist (e.g. a unique
  // `invoiceNumber`), which makes every insert collide on null.
  await Promise.all([
    User.syncIndexes(),
    Society.syncIndexes(),
    Bill.syncIndexes(),
    Visitor.syncIndexes(),
    NOC.syncIndexes(),
    Notice.syncIndexes(),
    Meeting.syncIndexes(),
    Complaint.syncIndexes(),
  ]);

  const writes: [string, Promise<unknown>][] = [
    ["users", User.deleteMany({}).then(() => User.insertMany(users))],
    [
      "societies",
      Society.deleteMany({}).then(() => Society.create(INITIAL_SOCIETY)),
    ],
    ["bills", Bill.deleteMany({}).then(() => Bill.insertMany(INITIAL_BILLS))],
    [
      "visitors",
      Visitor.deleteMany({}).then(() =>
        Visitor.insertMany(strip(INITIAL_VISITORS, ["id"]))
      ),
    ],
    [
      "nocs",
      NOC.deleteMany({}).then(() => NOC.insertMany(strip(INITIAL_NOCS, ["id"]))),
    ],
    [
      "notices",
      Notice.deleteMany({}).then(() =>
        Notice.insertMany(strip(INITIAL_NOTICES, ["id"]))
      ),
    ],
    [
      "meetings",
      Meeting.deleteMany({}).then(() =>
        Meeting.insertMany(strip(INITIAL_MEETINGS, ["id"]))
      ),
    ],
    [
      "complaints",
      Complaint.deleteMany({}).then(() =>
        Complaint.insertMany(strip(INITIAL_COMPLAINTS, ["id"]))
      ),
    ],
  ];

  const results: [string, number][] = [];
  for (const [name, write] of writes) {
    await write;
    results.push([name, await mongoose.connection.collection(name).countDocuments()]);
  }

  console.log("\n[seed] Done. Collections written:");
  for (const [name, count] of results) {
    console.log(`  ${name.padEnd(12)} ${count}`);
  }

  console.log("\n[seed] Demo accounts (all share the same password):");
  for (const u of INITIAL_USERS) {
    console.log(`  ${u.role.padEnd(9)} ${u.email}`);
  }
  console.log(`  password  ${DEMO_PASSWORD}`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("[seed] Failed:", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});

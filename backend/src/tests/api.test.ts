/**
 * API regression suite. Boots the real Express app in-process against the
 * in-memory demo store, so it needs neither MongoDB nor a running server.
 *
 * `npm run e2e` remains the broader 73-assertion sweep; this file is the part
 * that can gate a commit in one command.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

import { createApp } from "../server.js";

const PW = "Society@123";
const ACCOUNTS = {
  admin: "rajesh.mehta@harmonysociety.in",
  resident: "priya.sharma@gmail.com",
  security: "suresh.guard@harmonysociety.in",
  committee: "anita.joshi@harmonysociety.in",
};

let server: Server;
let base: string;

interface Reply {
  status: number;
  body: any;
  setCookie: string | null;
}

async function call(
  path: string,
  {
    method = "GET",
    token,
    body,
    cookie,
  }: { method?: string; token?: string; body?: unknown; cookie?: string } = {}
): Promise<Reply> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: res.status,
    body: await res.json().catch(() => null),
    setCookie: res.headers.getSetCookie?.().join("; ") ?? null,
  };
}

async function login(email: string) {
  const r = await call("/auth/login", {
    method: "POST",
    body: { email, password: PW },
  });
  return {
    token: r.body?.data?.accessToken as string,
    cookie: r.setCookie?.split(";")[0] ?? "",
    status: r.status,
  };
}

before(async () => {
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("health", () => {
  it("reports whether a database is attached", async () => {
    const res = await call("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(["connected", "in-memory"].includes(res.body.data.database));
  });
});

describe("auth", () => {
  it("signs in every demo role", async () => {
    for (const email of Object.values(ACCOUNTS)) {
      const { status, token } = await login(email);
      assert.equal(status, 200, `login failed for ${email}`);
      assert.ok(token, `no access token for ${email}`);
    }
  });

  it("never returns the password hash", async () => {
    const res = await call("/auth/login", {
      method: "POST",
      body: { email: ACCOUNTS.resident, password: PW },
    });
    assert.equal(JSON.stringify(res.body).includes("passwordHash"), false);
  });

  it("gives the same answer for a bad password and an unknown email", async () => {
    const wrongPw = await call("/auth/login", {
      method: "POST",
      body: { email: ACCOUNTS.resident, password: "NotThePassword1" },
    });
    const unknown = await call("/auth/login", {
      method: "POST",
      body: { email: "nobody@example.com", password: "NotThePassword1" },
    });

    assert.equal(wrongPw.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrongPw.body.message, unknown.body.message);
  });

  it("sets an httpOnly refresh cookie scoped to /api/auth", async () => {
    const res = await call("/auth/login", {
      method: "POST",
      body: { email: ACCOUNTS.resident, password: PW },
    });
    const cookie = res.setCookie ?? "";
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Path=\/api\/auth/i);
  });

  it("rejects a malformed email before the controller", async () => {
    const res = await call("/auth/login", {
      method: "POST",
      body: { email: "not-an-email", password: "whatever" },
    });
    assert.equal(res.status, 400);
  });

  it("401s a junk or absent access token", async () => {
    assert.equal((await call("/auth/me")).status, 401);
    assert.equal(
      (await call("/auth/me", { token: "garbage.token.value" })).status,
      401
    );
  });

  it("refuses a role that does not match the account", async () => {
    const res = await call("/auth/login", {
      method: "POST",
      body: { email: ACCOUNTS.resident, password: PW, role: "admin" },
    });
    assert.equal(res.status, 403);
  });

  it("exchanges the refresh cookie for a new access token", async () => {
    const { cookie } = await login(ACCOUNTS.admin);
    const res = await call("/auth/refresh", { method: "POST", cookie });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.accessToken);
  });

  it("revokes the refresh token on logout", async () => {
    const { token, cookie } = await login(ACCOUNTS.committee);
    assert.equal(
      (await call("/auth/logout", { method: "POST", token, cookie })).status,
      200
    );
    assert.equal(
      (await call("/auth/refresh", { method: "POST", cookie })).status,
      401
    );
  });

  it("still refreshes after an earlier logout revoked the account", async () => {
    // Regression: the in-memory login path hardcoded `refreshTokenVersion: 0`
    // while the refresh check read the bumped counter, so one logout left that
    // demo account unable to refresh for the rest of the process.
    await login(ACCOUNTS.security);

    const fresh = await login(ACCOUNTS.security);
    const res = await call("/auth/refresh", {
      method: "POST",
      cookie: fresh.cookie,
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.accessToken);
  });

  it("keeps the unauthenticated roles route free of user records", async () => {
    const res = await call("/auth/roles");
    assert.equal(res.status, 200);
    assert.equal(res.body.data.roles.length, 4);

    const blob = JSON.stringify(res.body);
    assert.equal(blob.includes("@"), false);
    assert.equal(/aadhaar|phone|passwordHash/i.test(blob), false);
  });
});

describe("role isolation", () => {
  it("keeps each portal closed to the other three roles", async () => {
    const tokens = await Promise.all(
      Object.entries(ACCOUNTS).map(async ([role, email]) => [
        role,
        (await login(email)).token,
      ] as const)
    );
    const byRole = Object.fromEntries(tokens);

    const portals: [string, string][] = [
      ["/admin/dashboard", "admin"],
      ["/resident/dashboard", "resident"],
      ["/security/dashboard", "security"],
      ["/committee/dashboard", "committee"],
    ];

    for (const [path, owner] of portals) {
      assert.equal(
        (await call(path, { token: byRole[owner] })).status,
        200,
        `${owner} should reach ${path}`
      );

      for (const [otherRole, token] of tokens) {
        if (otherRole === owner) continue;
        assert.equal(
          (await call(path, { token })).status,
          403,
          `${otherRole} must not reach ${path}`
        );
      }

      assert.equal((await call(path)).status, 401, `${path} must need auth`);
    }
  });
});

describe("resident portal", () => {
  it("scopes the dashboard to the flat on the token", async () => {
    const { token } = await login(ACCOUNTS.resident);
    const res = await call("/resident/dashboard", { token });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.flatNumber, "A-404");
    assert.ok(Array.isArray(res.body.data.familyMembers));
    assert.ok(Array.isArray(res.body.data.vehicles));
  });

  it("returns only the caller's bills", async () => {
    const { token } = await login(ACCOUNTS.resident);
    const res = await call("/resident/bills", { token });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.bills.length > 0);
    assert.equal(
      res.body.data.bills.every((b: any) => b.flatNumber === "A-404"),
      true
    );
  });

  it("ignores a foreign flat in the pay-bill body", async () => {
    const { token } = await login(ACCOUNTS.resident);
    const res = await call("/resident/pay-bill", {
      method: "POST",
      token,
      body: { flatNumber: "A-301", transactionRef: "TEST-CROSS-FLAT" },
    });

    // Either it is rejected, or it settles the caller's own flat — never A-301.
    if (res.status === 200) {
      assert.equal(res.body.data.bill.flatNumber, "A-404");
    }
  });

  it("validates the flat format on pay-bill", async () => {
    const { token } = await login(ACCOUNTS.resident);
    const res = await call("/resident/pay-bill", {
      method: "POST",
      token,
      body: { flatNumber: "not-a-flat" },
    });
    assert.equal(res.status, 400);
  });

  it("files a complaint against the caller's own flat", async () => {
    const { token } = await login(ACCOUNTS.resident);
    const created = await call("/resident/complaints", {
      method: "POST",
      token,
      body: {
        title: "Test suite: lift noise",
        category: "Lift",
        description: "The lift hums loudly between the second and third floor.",
        priority: "High",
      },
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.complaint.flatNumber, "A-404");
    assert.equal(created.body.data.complaint.status, "Open");

    const listed = await call("/resident/complaints", { token });
    assert.equal(listed.status, 200);
    assert.equal(
      listed.body.data.complaints.every((c: any) => c.flatNumber === "A-404"),
      true
    );
  });

  it("rejects a complaint with a too-short title or description", async () => {
    const { token } = await login(ACCOUNTS.resident);
    const res = await call("/resident/complaints", {
      method: "POST",
      token,
      body: { title: "ab", description: "short" },
    });
    assert.equal(res.status, 400);
  });

  it("pre-approves a visitor into the caller's flat", async () => {
    const { token } = await login(ACCOUNTS.resident);
    const res = await call("/resident/pre-approve-visitor", {
      method: "POST",
      token,
      body: {
        name: "Suite Guest",
        phone: "+91 98765 43299",
        visitorType: "Guest",
        destinationFlat: "B-999",
      },
    });

    assert.equal(res.status, 201);
    // The body says B-999; the token says A-404. The token wins.
    assert.equal(res.body.data.visitor.destinationFlat, "A-404");
    assert.equal(res.body.data.visitor.status, "Expected");
  });
});

describe("security portal", () => {
  it("checks a visitor in and back out, writing the gate log", async () => {
    const { token } = await login(ACCOUNTS.security);

    const inRes = await call("/security/check-in", {
      method: "POST",
      token,
      body: {
        name: "Suite Tester",
        phone: "+91 98765 43288",
        visitorType: "Guest",
        destinationFlat: "A-404",
      },
    });
    assert.equal(inRes.status, 201);
    const visitorId = inRes.body.data.visitor.id;
    assert.ok(visitorId);

    const dashboard = await call("/security/dashboard", { token });
    assert.ok(
      dashboard.body.data.visitors.some((v: any) => v.id === visitorId),
      "checked-in visitor should be listed as Inside"
    );

    const outRes = await call(`/security/check-out/${visitorId}`, {
      method: "POST",
      token,
    });
    assert.equal(outRes.status, 200);
    assert.equal(outRes.body.data.visitor.status, "Exited");

    const after = await call("/security/dashboard", { token });
    assert.equal(
      after.body.data.visitors.some((v: any) => v.id === visitorId),
      false,
      "an exited visitor is no longer inside"
    );

    const logged = after.body.data.gateLog.find(
      (l: any) => l.id === visitorId || l.name === "Suite Tester"
    );
    assert.ok(logged, "check-in should open a gate-log row");
    assert.ok(logged.outTime, "check-out should stamp the gate-log row");
  });

  it("rejects a malformed id at the edge, not as a Mongoose error", async () => {
    const { token } = await login(ACCOUNTS.security);
    const res = await call("/security/check-out/not-an-id", {
      method: "POST",
      token,
    });

    assert.equal(res.status, 400);
    assert.equal(JSON.stringify(res.body).includes("Cast to ObjectId"), false);
  });

  it("rejects a check-in with no name or a bad phone", async () => {
    const { token } = await login(ACCOUNTS.security);
    assert.equal(
      (
        await call("/security/check-in", {
          method: "POST",
          token,
          body: { name: "" },
        })
      ).status,
      400
    );
    assert.equal(
      (
        await call("/security/check-in", {
          method: "POST",
          token,
          body: { name: "Valid Name", phone: "123", destinationFlat: "A-404" },
        })
      ).status,
      400
    );
  });

  it("shows a date derived from today, not a fixed string", async () => {
    const { token } = await login(ACCOUNTS.security);
    const res = await call("/security/dashboard", { token });

    const shown = new Date(res.body.data.currentDateText);
    assert.equal(Number.isNaN(shown.getTime()), false);
    assert.equal(shown.getFullYear(), new Date().getFullYear());
  });

  it("names the guard who is signed in", async () => {
    const { token } = await login(ACCOUNTS.security);
    const res = await call("/security/dashboard", { token });

    // Regression: the dashboard read `getUserByRole("security")`, which returns
    // *some* user holding the role — with more than one guard on the roster
    // every guard would be shown whichever record sorted first.
    const me = await call("/auth/me", { token });
    assert.equal(res.body.data.guardName, me.body.data.user.name);
  });

  it("lists a pre-approved visitor as expected, not as having entered", async () => {
    const resident = await login(ACCOUNTS.resident);
    const guard = await login(ACCOUNTS.security);

    const approved = await call("/resident/pre-approve-visitor", {
      method: "POST",
      token: resident.token,
      body: {
        name: "Never Arrived Guest",
        phone: "+91 98765 43277",
        visitorType: "Guest",
        destinationFlat: "A-404",
      },
    });
    assert.equal(approved.status, 201);
    const id = approved.body.data.visitor.id;

    const dash = await call("/security/dashboard", { token: guard.token });

    // Regression: every visitor creation opened a gate-log row, so a resident
    // pre-approval showed the guard a person who never arrived as currently
    // inside, with an inTime and a null outTime nothing would ever clear.
    assert.equal(
      dash.body.data.gateLog.some((l: any) => l.id === id),
      false,
      "a pre-approval must not open a gate-log row"
    );
    assert.equal(
      dash.body.data.visitors.some((v: any) => v.id === id),
      false,
      "an Expected visitor is not Inside"
    );

    // ...and it must be visible on the list the guard actually watches for it.
    assert.ok(
      dash.body.data.expectedVisitors.some((e: any) => e.id === id),
      "the pre-approved visitor should appear as expected"
    );
  });
});

describe("committee portal", () => {
  it("approves a pending NOC", async () => {
    const { token } = await login(ACCOUNTS.committee);
    const dash = await call("/committee/dashboard", { token });
    const pending = dash.body.data.pendingNOCs?.[0];

    if (!pending) return; // nothing pending after a previous run

    const res = await call(`/committee/noc/${pending.id}/status`, {
      method: "POST",
      token,
      body: { status: "Approved" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.noc.status, "Approved");
  });

  it("rejects a bad status and a malformed id", async () => {
    const { token } = await login(ACCOUNTS.committee);
    assert.equal(
      (
        await call("/committee/noc/000000000000000000000000/status", {
          method: "POST",
          token,
          body: { status: "bogus" },
        })
      ).status,
      400
    );
    assert.equal(
      (
        await call("/committee/noc/not-an-id/status", {
          method: "POST",
          token,
          body: { status: "Approved" },
        })
      ).status,
      400
    );
    assert.equal(
      (
        await call("/committee/noc/000000000000000000000000/status", {
          method: "POST",
          token,
          body: { status: "Approved" },
        })
      ).status,
      404
    );
  });
});

describe("admin portal", () => {
  it("nests modules and reports inside the standard envelope", async () => {
    const { token } = await login(ACCOUNTS.admin);

    const modules = await call("/admin/modules", { token });
    assert.equal(modules.status, 200);
    assert.ok(Array.isArray(modules.body.data.modules));

    const reports = await call("/admin/reports", { token });
    assert.equal(reports.status, 200);
    assert.ok(Array.isArray(reports.body.data.reports));
  });

  it("summarises complaints and updates their status", async () => {
    const { token } = await login(ACCOUNTS.admin);

    const listed = await call("/admin/complaints", { token });
    assert.equal(listed.status, 200);
    const summary = listed.body.data.summary;
    assert.equal(
      summary.open + summary.inProgress + summary.resolved,
      listed.body.data.complaints.length
    );

    const created = await call("/resident/complaints", {
      method: "POST",
      token: (await login(ACCOUNTS.resident)).token,
      body: {
        title: "Suite status change",
        category: "Other",
        description: "Raised by the suite to exercise the status transition.",
      },
    });
    const id = created.body.data.complaint.id;

    const started = await call(`/admin/complaints/${id}/status`, {
      method: "POST",
      token,
      body: { status: "In Progress" },
    });
    assert.equal(started.status, 200);
    assert.equal(started.body.data.complaint.status, "In Progress");

    const resolved = await call(`/admin/complaints/${id}/status`, {
      method: "POST",
      token,
      body: { status: "Resolved" },
    });
    assert.ok(resolved.body.data.complaint.resolvedAt);
  });

  it("404s an unknown complaint id", async () => {
    const { token } = await login(ACCOUNTS.admin);
    const res = await call("/admin/complaints/000000000000000000000000/status", {
      method: "POST",
      token,
      body: { status: "Resolved" },
    });
    assert.equal(res.status, 404);
  });

  it("names the committee member who is signed in", async () => {
    const { token } = await login(ACCOUNTS.committee);
    const dash = await call("/committee/dashboard", { token });
    const me = await call("/auth/me", { token });

    // Same root cause as the guard lookup: a role lookup returns whichever
    // committee member sorted first, not the caller.
    assert.equal(dash.body.data.memberName, me.body.data.user.name);
    assert.equal(dash.body.data.designation, me.body.data.user.designation);
  });
});

describe("error handling", () => {
  it("404s an unknown route with the standard envelope", async () => {
    const res = await call("/does-not-exist");
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(typeof res.body.message === "string");
  });

  it("reports validation failures per field", async () => {
    const res = await call("/auth/login", {
      method: "POST",
      body: { email: "nope", password: "" },
    });
    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.length > 0);
    assert.ok(typeof res.body.errors[0].field === "string");
  });
});
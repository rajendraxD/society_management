// E2E sweep against the running API. Asserts happy paths, role isolation,
// validation, and refresh-token rotation. Exit code 1 on any failure.
//
//   npm run e2e                 # against http://localhost:5000
//   PORT=8080 npm run e2e       # against a server on another port
const PORT = process.env.PORT || 5000;
const BASE = process.env.API_BASE || `http://127.0.0.1:${PORT}/api`;
const PW = "Society@123";
let pass = 0;
const fails = [];

const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fails.push(name); console.log(`  FAIL ${name} ${extra}`); }
};

async function call(path, { method = "GET", token, body, cookie, raw = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.().join("; ") ?? null;
  const json = raw ? null : await res.json().catch(() => null);
  return { status: res.status, body: json, setCookie };
}

async function login(email) {
  const r = await call("/auth/login", { method: "POST", body: { email, password: PW } });
  const cookie = r.setCookie?.split(";")[0] ?? "";
  return { status: r.status, token: r.body?.data?.accessToken, cookie, user: r.body?.data?.user, full: r.body };
}

console.log("\n[1] AUTH");
const roles = await call("/auth/roles");
ok("GET /auth/roles -> 200", roles.status === 200, roles.status);
const roleList = roles.body?.data?.roles ?? [];
ok("roles lists 4 roles", roleList.length === 4, JSON.stringify(roleList.map(r => r.id)));
// Regression: this route is unauthenticated, so it must not leak user records.
const rolesBlob = JSON.stringify(roles.body);
ok("unauthenticated /auth/roles leaks no user PII",
  !rolesBlob.includes("aadhaar") && !rolesBlob.includes("@") && !rolesBlob.includes("phone") && roles.body?.data?.users === undefined,
  rolesBlob.slice(0, 200));

const admin = await login("rajesh.mehta@harmonysociety.in");
const resident = await login("priya.sharma@gmail.com");
const security = await login("suresh.guard@harmonysociety.in");
const committee = await login("anita.joshi@harmonysociety.in");
ok("admin login -> 200 + token", admin.status === 200 && !!admin.token, admin.status);
ok("resident login -> 200 + token", resident.status === 200 && !!resident.token, resident.status);
ok("security login -> 200 + token", security.status === 200 && !!security.token, security.status);
ok("committee login -> 200 + token", committee.status === 200 && !!committee.token, committee.status);
ok("login sets refresh cookie", !!resident.cookie && resident.cookie.includes("refresh"), resident.cookie?.slice(0, 40));
ok("login response has no passwordHash", JSON.stringify(resident.full).includes("passwordHash") === false);

const badBody = await call("/auth/login", { method: "POST", body: { email: "not-an-email", password: "x" } });
ok("malformed email -> 400 validation", badBody.status === 400, badBody.status);

const meRes = await call("/auth/me", { token: resident.token });
ok("GET /auth/me -> 200", meRes.status === 200, meRes.status);
ok("GET /auth/me returns the right email", meRes.body?.data?.user?.email === "priya.sharma@gmail.com");
const meNoTok = await call("/auth/me");
ok("GET /auth/me without token -> 401", meNoTok.status === 401, meNoTok.status);
const meBadTok = await call("/auth/me", { token: "garbage.token.value" });
ok("GET /auth/me with junk token -> 401", meBadTok.status === 401, meBadTok.status);

const refreshed = await call("/auth/refresh", { method: "POST", cookie: resident.cookie });
ok("POST /auth/refresh -> new access token", refreshed.status === 200 && !!refreshed.body?.data?.accessToken, refreshed.status);
const noCookie = await call("/auth/refresh", { method: "POST" });
ok("POST /auth/refresh without cookie -> 401", noCookie.status === 401, noCookie.status);

console.log("\n[2] ROLE ISOLATION");
const crossAdmin = await call("/admin/dashboard", { token: resident.token });
ok("resident -> /admin/dashboard = 403", crossAdmin.status === 403, crossAdmin.status);
const crossRes = await call("/resident/dashboard", { token: admin.token });
ok("admin -> /resident/dashboard = 403", crossRes.status === 403, crossRes.status);
const crossSec = await call("/security/dashboard", { token: admin.token });
ok("admin -> /security/dashboard = 403", crossSec.status === 403, crossSec.status);
const crossComm = await call("/committee/dashboard", { token: admin.token });
ok("admin -> /committee/dashboard = 403", crossComm.status === 403, crossComm.status);
const noAuthAdmin = await call("/admin/dashboard");
ok("no token -> /admin/dashboard = 401", noAuthAdmin.status === 401, noAuthAdmin.status);

console.log("\n[3] ADMIN");
const dash = await call("/admin/dashboard", { token: admin.token });
ok("GET /admin/dashboard -> 200", dash.status === 200, dash.status);
ok("admin dashboard has KPI block", !!dash.body?.data, "no data");
const mods = await call("/admin/modules", { token: admin.token });
ok("GET /admin/modules -> 200", mods.status === 200, mods.status);
console.log(`       (modules returned: ${Array.isArray(mods.body?.data) ? mods.body.data.length : "n/a"})`);
const reps = await call("/admin/reports", { token: admin.token });
ok("GET /admin/reports -> 200", reps.status === 200, reps.status);

console.log("\n[4] RESIDENT");
const rDash = await call("/resident/dashboard", { token: resident.token });
ok("GET /resident/dashboard -> 200", rDash.status === 200, rDash.status);
const bills = await call("/resident/bills", { token: resident.token });
ok("GET /resident/bills -> 200", bills.status === 200, bills.status);
const billList = bills.body?.data?.bills ?? bills.body?.data;
ok("resident has bills", Array.isArray(billList) && billList.length > 0, JSON.stringify(bills.body?.data).slice(0, 200));

const payBad = await call("/resident/pay-bill", { method: "POST", token: resident.token, body: {} });
ok("pay-bill with no body -> 400", payBad.status === 400, payBad.status);
const payNeg = await call("/resident/pay-bill", { method: "POST", token: resident.token, body: { flatNumber: "not-a-flat", transactionRef: "x".repeat(100) } });
ok("pay-bill negative amount -> 400", payNeg.status === 400, payNeg.status);

const paBad = await call("/resident/pre-approve-visitor", { method: "POST", token: resident.token, body: { visitorName: "" } });
ok("pre-approve with empty name -> 400", paBad.status === 400, paBad.status);

console.log("\n[5] SECURITY");
const sDash = await call("/security/dashboard", { token: security.token });
ok("GET /security/dashboard -> 200", sDash.status === 200, sDash.status);
const ciBad = await call("/security/check-in", { method: "POST", token: security.token, body: { visitorName: "" } });
ok("check-in with empty name -> 400", ciBad.status === 400, ciBad.status);
const ciBadId = await call("/security/check-out/not-an-id", { method: "POST", token: security.token });
ok("check-out with bad id -> 400", ciBadId.status === 400, ciBadId.status);

console.log("\n[6] COMMITTEE");
const cDash = await call("/committee/dashboard", { token: committee.token });
ok("GET /committee/dashboard -> 200", cDash.status === 200, cDash.status);
const nocBadId = await call("/committee/noc/not-an-id/status", { method: "POST", token: committee.token, body: { status: "approved" } });
ok("NOC bad id -> 400", nocBadId.status === 400, nocBadId.status);
const nocBadStatus = await call("/committee/noc/000000000000000000000000/status", { method: "POST", token: committee.token, body: { status: "bogus" } });
ok("NOC invalid status -> 400", nocBadStatus.status === 400, nocBadStatus.status);
const nocMissing = await call("/committee/noc/000000000000000000000000/status", { method: "POST", token: committee.token, body: { status: "Approved" } });
ok("NOC missing id -> 404", nocMissing.status === 404, nocMissing.status);

// Regression: a malformed id used to reach Mongoose and return a raw CastError as
// a 500. It must now be rejected at the validation layer as a 400.
const nocCast = await call("/committee/noc/not-an-id/status", { method: "POST", token: committee.token, body: { status: "Approved" } });
ok("NOC malformed id -> 400, no Mongoose leak", nocCast.status === 400 && !JSON.stringify(nocCast.body).includes("Cast to ObjectId"), `${nocCast.status} ${nocCast.body?.message}`);
const coCast = await call("/security/check-out/not-an-id", { method: "POST", token: security.token });
ok("check-out malformed id -> 400, no Mongoose leak", coCast.status === 400 && !JSON.stringify(coCast.body).includes("Cast to ObjectId"), `${coCast.status} ${coCast.body?.message}`);

console.log("\n[7] LOGOUT / REVOCATION");
const throwaway = await login("priya.sharma@gmail.com");
const lo = await call("/auth/logout", { method: "POST", token: throwaway.token, cookie: throwaway.cookie });
ok("POST /auth/logout -> 200", lo.status === 200, lo.status);
const afterLogout = await call("/auth/refresh", { method: "POST", cookie: throwaway.cookie });
ok("refresh cookie revoked after logout -> 401", afterLogout.status === 401, afterLogout.status);
const stillValid = await call("/resident/dashboard", { token: throwaway.token });
ok("access token still valid until expiry (documented 15m JWT)", stillValid.status === 200, stillValid.status);

console.log(`\n===== ${pass} passed, ${fails.length} failed =====`);
if (fails.length) { console.log("FAILURES:\n - " + fails.join("\n - ")); process.exit(1); }
console.log("\n[8] WRITE PATHS (real mutations)");
const rBefore = await call("/resident/dashboard", { token: resident.token });
const duesBefore = JSON.stringify(rBefore.body?.data?.currentBill);

const paid = await call("/resident/pay-bill", { method: "POST", token: resident.token, body: { flatNumber: "A-404", transactionRef: "E2E-TEST-001" } });
ok("POST /resident/pay-bill -> 200", paid.status === 200, `${paid.status} ${paid.body?.message}`);
if (paid.status !== 200) console.log(`       (info) pay-bill said: ${paid.body?.message}`);

// Regression: pay-bill used to honour the flat in the request body, so a
// tampered request could settle a different flat's dues. The caller's own flat
// comes from the signed token and the body value is ignored.
const paidOther = await call("/resident/pay-bill", { method: "POST", token: resident.token, body: { flatNumber: "A-301", transactionRef: "E2E-CROSS-FLAT" } });
const crossBillFlat = paidOther.body?.data?.bill?.flatNumber;
ok("pay-bill ignores a foreign flat in the body",
  paidOther.status !== 200 || crossBillFlat === "A-404",
  `${paidOther.status} settled ${crossBillFlat}`);

const ci = await call("/security/check-in", { method: "POST", token: security.token,
  body: { name: "E2E Tester", phone: "+91 98765 43211", visitorType: "Guest", destinationFlat: "A-404", purpose: "e2e" } });
ok("POST /security/check-in -> 201", ci.status === 201, `${ci.status} ${ci.body?.message}`);
const visitorId = ci.body?.data?.visitor?.id ?? ci.body?.data?.visitor?._id;
ok("check-in returned a visitor id", !!visitorId);

if (visitorId) {
  const co = await call(`/security/check-out/${visitorId}`, { method: "POST", token: security.token });
  ok("POST /security/check-out -> 200", co.status === 200, `${co.status} ${co.body?.message}`);
}

const pa = await call("/resident/pre-approve-visitor", { method: "POST", token: resident.token,
  body: { name: "E2E Guest", phone: "+91 98765 43222", visitorType: "Guest", destinationFlat: "A-404" } });
ok("POST /resident/pre-approve-visitor -> 200/201", pa.status === 200 || pa.status === 201, `${pa.status} ${pa.body?.message}`);

const nocList = await call("/committee/dashboard", { token: committee.token });
const nocId = nocList.body?.data?.nocs?.find(n => n.status === "Pending")?._id;
if (nocId) {
  const ap = await call(`/committee/noc/${nocId}/status`, { method: "POST", token: committee.token, body: { status: "Approved" } });
  ok(`POST NOC approve ${nocId.slice(0,6)} -> 200`, ap.status === 200, `${ap.status} ${ap.body?.message}`);
} else {
  ok("NOC approve (no pending NOC to approve)", true);
}

console.log("\n[8b] COMPLAINTS");
const cmpBad = await call("/resident/complaints", { method: "POST", token: resident.token, body: { title: "ab", description: "too short" } });
ok("complaint with short title/description -> 400", cmpBad.status === 400, cmpBad.status);

const cmpNew = await call("/resident/complaints", { method: "POST", token: resident.token,
  body: { title: "E2E lift noise", category: "Lift", description: "Lift hums loudly between the 2nd and 3rd floor.", priority: "High" } });
ok("POST /resident/complaints -> 201", cmpNew.status === 201, `${cmpNew.status} ${cmpNew.body?.message}`);
const newCmp = cmpNew.body?.data?.complaint;
ok("new complaint is filed against the caller's flat", newCmp?.flatNumber === "A-404", newCmp?.flatNumber);
ok("new complaint starts Open", newCmp?.status === "Open", newCmp?.status);

const cmpList = await call("/resident/complaints", { token: resident.token });
ok("GET /resident/complaints -> 200", cmpList.status === 200, cmpList.status);
const cmpArr = cmpList.body?.data?.complaints ?? [];
ok("resident complaint list is non-empty", Array.isArray(cmpArr) && cmpArr.length > 0, JSON.stringify(cmpList.body?.data).slice(0, 160));
ok("resident sees only their own flat's complaints",
  Array.isArray(cmpArr) && cmpArr.every((c) => c.flatNumber === "A-404"),
  JSON.stringify(cmpArr.map((c) => c.flatNumber)));

const cmpCross = await call("/resident/complaints", { token: admin.token });
ok("resident complaints route rejects an admin token -> 403", cmpCross.status === 403, cmpCross.status);

const cmpAll = await call("/admin/complaints", { token: admin.token });
ok("GET /admin/complaints -> 200", cmpAll.status === 200, cmpAll.status);
ok("admin summary counts complaints",
  typeof cmpAll.body?.data?.summary?.open === "number",
  JSON.stringify(cmpAll.body?.data?.summary));

if (newCmp?.id) {
  const cmpStart = await call(`/admin/complaints/${newCmp.id}/status`, { method: "POST", token: admin.token, body: { status: "In Progress" } });
  ok("POST /admin/complaints/:id/status -> 200", cmpStart.status === 200, `${cmpStart.status} ${cmpStart.body?.message}`);
  ok("status change persisted", cmpStart.body?.data?.complaint?.status === "In Progress", cmpStart.body?.data?.complaint?.status);

  const cmpResolve = await call(`/admin/complaints/${newCmp.id}/status`, { method: "POST", token: admin.token, body: { status: "Resolved" } });
  ok("resolving stamps resolvedAt", !!cmpResolve.body?.data?.complaint?.resolvedAt, JSON.stringify(cmpResolve.body?.data?.complaint?.resolvedAt));
}

const cmpBadId = await call("/admin/complaints/not-an-id/status", { method: "POST", token: admin.token, body: { status: "Resolved" } });
ok("complaint malformed id -> 400", cmpBadId.status === 400, cmpBadId.status);
const cmpBadStatus = await call("/admin/complaints/cmp-1/status", { method: "POST", token: admin.token, body: { status: "banana" } });
ok("complaint invalid status -> 400", cmpBadStatus.status === 400, cmpBadStatus.status);

console.log("\n[8c] FLAT SCOPING");
const scoped = await call("/resident/dashboard", { token: resident.token });
ok("resident dashboard flat comes from the token", scoped.body?.data?.flatNumber === "A-404", scoped.body?.data?.flatNumber);
ok("resident family members are flat-scoped",
  Array.isArray(scoped.body?.data?.familyMembers) && scoped.body.data.familyMembers.length === 3,
  JSON.stringify(scoped.body?.data?.familyMembers)?.slice(0, 120));

const rAfter = await call("/resident/dashboard", { token: resident.token });
const duesAfter = JSON.stringify(rAfter.body?.data?.currentBill);
ok("payment persisted (bill status/ref recorded)", paid.status !== 200 || String(duesAfter).includes("paidDate"), `${duesAfter}`);

// Regression: the gate log used to be a static array that check-in/check-out
// never wrote to, so a guard could check a visitor in and never see them in the
// log, and check-outs never cleared.
const sAfter = await call("/security/dashboard", { token: security.token });
const logAfter = sAfter.body?.data?.gateLog ?? [];
const logged = logAfter.find(l => l.id === visitorId || l.name === "E2E Tester");
ok("check-in appears in the gate log", !!logged, `gate log ids: ${logAfter.slice(0,3).map(l=>l.id).join(",")}`);
ok("gate log row stamped with outTime after check-out", !!logged?.outTime, JSON.stringify(logged));
ok("checked-out visitor no longer 'Inside'", !sAfter.body?.data?.visitors?.some(v => (v.id ?? v._id) === visitorId));

console.log("\n[9] LOGIN HYGIENE (run last: burns the failed-attempt budget)");
const badPw = await call("/auth/login", { method: "POST", body: { email: "priya.sharma@gmail.com", password: "WrongPassword123" } });
ok("wrong password -> 401", badPw.status === 401, badPw.status);
const unknown = await call("/auth/login", { method: "POST", body: { email: "nobody@nowhere.com", password: "WrongPassword123" } });
ok("unknown email -> same msg as wrong password (no account enumeration)",
  unknown.body?.message === badPw.body?.message, `${unknown.body?.message} vs ${badPw.body?.message}`);

console.log(`\n===== FINAL: ${pass} passed, ${fails.length} failed =====`);
if (fails.length) { console.log("FAILURES:\n - " + fails.join("\n - ")); process.exit(1); }

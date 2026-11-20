# VitalCap — Product Demo (Disruption → Department → Process → Application → People)

> Read this whole file before writing code. Build in the milestone order at the bottom.
> Finish one milestone, show me what changed, and wait for my "go" before the next one.
> I am a beginner: explain each change in plain words and tell me exactly what to run.

---

## 1. What we are building

The **Product Demo is the centrepiece of the investor pitch.** It replaces the current
content of the existing `<section id="risk">` (the nav link "Product Demo" already points
there; keep `id="risk"`).

The demo shows a **bank** ("VitalCap Demo Bank"). The visitor:

1. picks a **Department** from a dropdown,
2. then a **Process** inside that department (dropdown filtered by department),
3. then an **Application** that supports that process (dropdown filtered by process),
4. then chooses a **disruption** (what fails and for how long).

VitalCap then shows, live, **exactly who is disrupted**: which applications go down,
which processes stop or degrade, which teams are affected and **which named people** in
those teams can't do their job, plus which **third-party vendors** are involved, whether
MAD/RTO is breached, and an ordered recovery plan with named owners and backups.

**The whole point:** a business disruption is mapped down to the granular detail of which
person and team it affects. Every panel shows **where its data comes from**:

| Data | Source system (shown as a badge in the UI) | Demo file |
|---|---|---|
| Applications, RTO/RPO, infrastructure, app→app dependencies | **Application Repository (Technology / CMDB)** | `public/data/app-repository.js` |
| Teams, people, names, positions, backups, critical roles | **Workforce System (HR)** | `public/data/workforce.js` |
| Third-party vendors, services, tier, contractual recovery times | **Third-Party Risk Management inventory** | `public/data/third-party-vendors.js` |
| Departments, processes, MAD, process→app/team/vendor links | **Business Impact Analysis (BIA) register** | `public/data/bia-register.js` |

Badges look like small pills, e.g. `Source: Application Repository`, placed in each panel's
header. Hovering/focusing a badge shows a one-line tooltip:
"In production this is synced from the bank's application repository."
(Same pattern for the other sources.)

No backend, no login, no AI calls. Pure front-end logic on the demo files above.

---

## 2. Tech constraints (this repo)

This repo is a **plain HTML/CSS/JS single-page pitch site**: `public/index.html`,
`public/app.js`, `public/data.js`, `public/styles.css`, served by `server.js`
(`npm start`, port 3002). **No build step, no framework. Keep it that way.**

- Vanilla JavaScript. No React, no bundler, no TypeScript. Use JSDoc comments for types.
- Graph = **hand-built SVG** drawn by our JS. No graph library unless I approve.
- Reuse the existing look from `public/styles.css`. Add new styles at the end under
  `/* === Product demo v2 === */`.
- Existing terminology: **RTO** (application recovery time), **RPO**, **MAD**
  (maximum allowable downtime of a process). Keep the existing rule **RTO ≤ MAD**.
- Calculation logic in **`public/bcp-engine.js`**: pure functions, no DOM. Works in the
  browser (`window.VitalCapBCP`) and in Node (`module.exports` when available).
- Data files set globals: `window.VC_APP_REPO`, `window.VC_WORKFORCE`,
  `window.VC_VENDORS`, `window.VC_BIA`, and also `module.exports` for tests.
- UI code in **`public/bcp-ui.js`**.
- Tests: **`tests/bcp-engine.test.js`** with Node's built-in runner. Add
  `"test": "node --test tests/"` to `package.json`. Nothing to install.
- Before replacing `#risk`, check what in `public/app.js` drives it (sliders, gap panel,
  recovery rows) and tell me. Remove that old demo code cleanly so nothing errors in the
  console. **Do not break other sections** (`#incidents`, `#threats`, `#recovery`, ...).
  If `#recovery` or `#incidents` should reuse the new engine, propose it; don't do it yet.

---

## 3. Data model

```js
// bia-register.js  (Source: BIA register)
Department { id, name, head /* personId */ }
Process {
  id, departmentId, name, description,
  madHours,                 // maximum allowable downtime
  criticality,              // 1–5
  applicationIds: [],       // apps the process needs
  teamIds: [],              // teams that perform it
  vendorIds: [],            // vendors used directly by the process
  upstreamProcessIds: [],   // other processes it depends on (cross-department)
  manualWorkaroundHours,    // null = none; how long a manual workaround holds
  minimumStaff              // people needed to run it at minimum service level
}

// app-repository.js  (Source: Application Repository)
Application {
  id, name, owner /* personId */, rtoHours, rpoHours, tier,
  hosting,                  // e.g. "Primary data center", "Cloud region A"
  dependsOnAppIds: [],      // e.g. everything → Identity & Access
  vendorIds: []             // SaaS / vendor providing it
}
Infrastructure items are Applications too (Identity & Access, Core network, Primary DC, Cloud region A) with tier "Infrastructure".

// workforce.js  (Source: Workforce System)
Team   { id, name, departmentId, lead /* personId */, location }
Person {
  id, name, position, teamId, location,
  criticalRole: true|false,
  criticalAccess: [],       // e.g. "SWIFT release authority", "Treasury signatory"
  backupPersonId,           // null = no backup
  usesApplicationIds: []    // apps this person needs to do their job
}

// third-party-vendors.js  (Source: Third-Party Risk Management)
Vendor {
  id, name, service, tier /* "Critical" | "Important" | "Standard" */,
  contractRtoHours, exitPlan: true|false, concentrationNote, lastAssessed /* "YYYY-MM" */
}
```

Disruption types the user can pick (step 4):
- **Application outage** — the selected application (default), or any app/infra
- **Vendor outage** — any vendor from the TPRM list
- **Site / location unavailable** — e.g. "Tel Aviv HQ", "Primary data center"
- **People unavailable** — a team or a specific person (e.g. illness, strike)
- Duration slider: 1–72 hours (default 4)

---

## 4. Calculation rules (`public/bcp-engine.js`)

Time in hours from t=0. Compute for every app, process, team and person:
`{ status: "ok"|"degraded"|"down", downStart, downEnd, reason[] }`.
`reason` is a human-readable chain, e.g.
`["Card processor outage (vendor)", "→ Card Management System down", "→ Card authorization stopped"]`.

1. **Directly disrupted** item: down 0 → duration.
2. **Vendor → Application:** an app with a down vendor is down from 0 until
   `vendor.downEnd + app.rtoHours` — unless duration has already ended before the app
   would be impacted (always impacted for vendors in this demo).
3. **Application → Application:** an app whose `dependsOnAppIds` item is down is down from
   that item's `downStart` until `upstream.downEnd + app.rtoHours`.
   Site outage takes down every app whose `hosting` is that site.
4. **Application/Vendor → Process:** a process with any required app or vendor down:
   - if `manualWorkaroundHours` is set: process is **degraded** from `downStart`, and
     **down** from `downStart + manualWorkaroundHours` only if the app is still down then;
   - else **down** from the app's `downStart` until the app's `downEnd`.
5. **People → Process:** count available people in the process's teams (person is
   unavailable if disrupted directly, by team, or by site location). If a
   `criticalRole` person is unavailable **and** their `backupPersonId` is also unavailable
   or null → process **down**. If available count < `minimumStaff` → process **down**.
   Otherwise, if anyone is unavailable → **degraded**.
6. **Process → Process:** a process whose `upstreamProcessIds` item is down is down over
   the same window (e.g. Outgoing wires stop when Sanctions screening stops).
7. **Process → Teams → People (the key output):** for each impacted process, every team in
   `teamIds` is impacted, and every person in those teams who `usesApplicationIds` a down
   app, or works on the down process, is listed as **disrupted** with the reason chain.
8. Iterate until stable. Detect cycles; report them as a gap, never loop forever.
9. `downtime = downEnd - downStart`. **MAD breach** for a process when `downtime > madHours`.

Outputs (all pure functions):
- `simulate(data, disruption)` → statuses above
- `impactedPeople(result)` → `[{ person, team, department, process, status, reason[], backup }]`
- `buildBia(result)` → per-process rows: department, process, time to impact, downtime,
  MAD, breached?, teams impacted, people impacted, vendors involved
- `buildRecoveryPlan(result)` → ordered steps: infrastructure → vendors → applications →
  processes, tie-break by criticality desc then MAD asc. Each step names the **owner**
  (person), the **backup**, the target time (`T+h`), and workaround activation if any.
- `findGaps(data)` (no disruption needed):
  - **RTO > MAD:** an app's RTO exceeds the MAD of a process that needs it
  - **Vendor RTO > MAD:** vendor `contractRtoHours` > MAD of a process that relies on it
  - **Key-person risk:** criticalRole person with no backup
  - **Backup in same location:** person and backup share a location (site outage takes both)
  - **Critical vendor without exit plan**
  - **Single point of failure:** app needed by ≥3 critical processes with no workaround
  - **Cycle detected**
  Each gap: severity (high/med/low), plain-English sentence naming the people/apps/vendors,
  suggested fix, and the source system the fix belongs to.

---

## 5. Unit tests (must pass before results UI)

Build a tiny fixture inside the test file (not the demo data):
- Vendor `V` (contractRtoHours 2)
- App `A` (rtoHours 1, vendorIds [V]), App `ID` (Identity, rtoHours 1); A dependsOn ID
- Process `P` (madHours 4, applicationIds [A], teamIds [T], minimumStaff 2, no workaround)
- Process `Q` (madHours 8, upstreamProcessIds [P], workaround 3)
- Team `T`: Person `p1` (criticalRole, backup p2, uses A), `p2` (uses A), `p3` (doesn't use A)

1. Vendor V down 3h → A down 0→4; P down 0→4, downtime 4, **not** breached (4 = MAD);
   p1 and p2 listed as disrupted with reason chain starting at V; p3 listed as impacted via
   process P (works on it) — check `reason` explains this.
2. Vendor V down 4h → P downtime 5 → **MAD breached**.
3. Q depends on P → Q down over P's window.
4. p1 unavailable, p2 available → P **degraded**, not down. p1 and p2 unavailable → P **down**.
5. ID down 2h → A down 0→3 via app→app dependency.
6. Set A.rtoHours = 6 → `findGaps` returns RTO > MAD for A/P. Remove p1's backup →
   key-person gap. Add cycle A→ID→A → simulate terminates, cycle gap reported.

---

## 6. Demo data — "VitalCap Demo Bank" (typical bank)

Show the bank name in the demo header only. **No "illustrative" labels anywhere in the demo.**
All names are fictional; never use a real bank's or real person's name.
Cursor: write these four data files with the content below, and **generate the people**
following the pattern (2–5 per team, diverse fictional names, realistic positions).

### Departments → Processes (BIA register)
| Department | Process | MAD h | Crit | Apps | Vendors | Upstream | Workaround h | Min staff |
|---|---|---|---|---|---|---|---|---|
| Payments Operations | Outgoing wire transfers (SWIFT) | 4 | 5 | Payment Hub, SWIFT Gateway | SWIFT network | Sanctions screening of payments | — | 3 |
| Payments Operations | Real-time domestic payments | 2 | 5 | Instant Payments Engine, Payment Hub | Domestic clearing house | Sanctions screening of payments | — | 2 |
| Retail Banking | Customer account servicing | 8 | 4 | Core Banking System, CRM | — | — | 4 (paper forms) | 3 |
| Retail Banking | Card authorization & disputes | 2 | 5 | Card Management System | Card processor | — | — | 2 |
| Treasury & Liquidity | Intraday liquidity monitoring | 2 | 5 | Treasury Management System | Market data provider | Outgoing wire transfers (SWIFT) | 1 (spreadsheet) | 2 |
| Treasury & Liquidity | End-of-day cash positioning | 6 | 4 | Treasury Management System, Core Banking System | — | — | — | 2 |
| Lending & Credit | Loan origination | 24 | 3 | Loan Origination System, Core Banking System | Credit bureau | — | 8 | 2 |
| Lending & Credit | Collateral management | 48 | 3 | Collateral Management System | — | — | 24 | 1 |
| Compliance & Financial Crime | Sanctions screening of payments | 2 | 5 | Sanctions Screening Engine | Watch-list data provider | — | — | 2 |
| Compliance & Financial Crime | AML transaction monitoring | 24 | 4 | AML Monitoring Platform | — | — | 12 | 2 |
| Customer Contact Center | Inbound customer calls | 2 | 4 | Contact Center Platform, CRM | Contact-center SaaS provider | — | — | 4 |

### Applications (Application Repository)
| App | RTO h | RPO h | Tier | Hosting | Depends on | Vendor |
|---|---|---|---|---|---|---|
| Identity & Access (SSO) | 1 | 0 | Infrastructure | Primary data center | — | — |
| Core network | 1 | 0 | Infrastructure | Primary data center | — | — |
| Core Banking System | 4 | 0 | 1 | Primary data center | Identity, Core network | — |
| Payment Hub | 2 | 0 | 1 | Primary data center | Identity, Core Banking | — |
| SWIFT Gateway | 2 | 0 | 1 | Primary data center | Identity, Core network | SWIFT network |
| Instant Payments Engine | 1 | 0 | 1 | Cloud region A | Identity, Payment Hub | Cloud provider |
| Card Management System | 1 | 0 | 1 | Cloud region A | Identity | Card processor, Cloud provider |
| Treasury Management System | 2 | 1 | 1 | Cloud region A | Identity | Cloud provider |
| Sanctions Screening Engine | 1 | 0 | 1 | Primary data center | Identity | Watch-list data provider |
| AML Monitoring Platform | 12 | 4 | 2 | Cloud region A | Identity, Core Banking | Cloud provider |
| CRM | 8 | 4 | 2 | Cloud region A | Identity | Cloud provider |
| Loan Origination System | 12 | 4 | 2 | Cloud region A | Identity, Core Banking | Cloud provider |
| Collateral Management System | 24 | 8 | 3 | Primary data center | Identity | — |
| Contact Center Platform | 2 | 1 | 1 | Vendor SaaS | Identity | Contact-center SaaS provider |
| Cloud region A | 4 | 0 | Infrastructure | Cloud provider | — | Cloud provider |

Deliberate gaps so the Gaps view isn't empty on load:
- **Vendor RTO > MAD:** Contact-center SaaS provider contract RTO 8h > Inbound customer calls MAD 2h.
- **Key-person risk:** one Treasury signatory on the Liquidity Desk has no backup.
- **Backup in same location:** one SWIFT Release Officer's backup is also at Tel Aviv HQ.
- **Critical vendor without exit plan:** Cloud provider (hosts 7 apps).
- **Single point of failure:** Identity & Access (SSO) is needed by every critical process.

### Vendors (Third-Party Risk Management)
SWIFT network (Critical, financial messaging, contract RTO 2, exit plan n/a – market
infrastructure), Domestic clearing house (Critical, 2), Card processor (Critical, 2, exit plan
yes), Cloud provider (Critical, 4, exit plan no — concentration: hosts 7 apps), Market data
provider (Important, 4), Watch-list data provider (Critical, 2), Credit bureau (Important, 24),
Contact-center SaaS provider (Important, 8, exit plan no). Use generic descriptive names
like these, not real company brand names.

### Workforce (Workforce System)
One team per process (e.g. "Wires Team", "Card Ops Team", "Liquidity Desk", "Sanctions
Screening Team"), plus an "IT Service Desk" and "Infrastructure Ops" team owning the
infrastructure apps. Locations: "Tel Aviv HQ", "Haifa Operations Center", "Remote".
Each person: fictional full name, position (e.g. "Wire Operations Analyst",
"Head of Payments Operations", "Treasury Dealer", "Sanctions Analyst", "SWIFT Release
Officer"), critical flag, critical access, backup, apps used. Every department head and
every app owner must be a real person record in this file.

---

## 7. UI — make it big

The Product Demo section is **full-viewport** (`min-height: 100vh`), uses the full content
width (wider than other slides), and has a **"Full screen" button** (Fullscreen API, with a
graceful fallback). Title: "See exactly who a disruption hits."

### 7.1 Top control bar (left to right)
`Department ▾` → `Process ▾` (filtered) → `Application ▾` (filtered to that process's apps)
→ `Disruption type ▾` (Application outage / Vendor outage / Site unavailable / People
unavailable — the second picker adapts) → `Duration` slider (1–72h) → **Run** button.
Picking a department auto-selects its first process and that process's first app, so
something useful shows immediately. Default on load: Payments Operations → Outgoing wire
transfers → SWIFT Gateway, application outage, 4h, already run.

### 7.2 Main area (desktop ≥1100px), three columns
- **Left — Impact map (SVG, ~50% width):** five columns left→right:
  Vendors · Infrastructure & Applications · Processes · Teams · People.
  Lines connect the chain. After Run: red = down, amber = degraded, grey = unaffected
  (dimmed). The selected chain is highlighted; unrelated nodes fade. Hover any node for
  details; click to select. Each column header carries its **source badge**.
- **Middle — "Who is disrupted" (~25%):** list grouped by team → people cards:
  name, position, location, status pill, reason chain ("SWIFT Gateway down → Outgoing
  wires stopped"), backup name and whether the backup is also hit. Header:
  `Source: Workforce System`. Counter at top: "**14 people in 4 teams across 3 departments**".
- **Right — Selected item details (~25%):** the selected process/app/vendor/person with all
  fields; for a process show the RTO-vs-MAD bar (reuse the existing visual style from the
  old demo). Vendor details show tier, contract RTO, exit plan (`Source: Third-Party Risk
  Management`). App details show RTO/RPO/hosting/owner (`Source: Application Repository`).

### 7.3 Bottom tabs (full width)
**Business impact** (BIA table) · **Recovery plan** (ordered steps with owner + backup +
target time) · **Gaps** (from `findGaps`, with the source system each fix belongs to) ·
**Timeline** (a 0–72h scrubber that replays the cascade on the map).

### 7.4 Other
- Mobile (<768px): controls stack; map becomes horizontally scrollable; columns stack.
- Accessibility: status always has a text label too; dropdowns are real `<select>`s;
  tables are real `<table>`s; `aria-live` on the people counter.
- Recalculation feels instant.

---

## 8. Incident case studies (connect, don't duplicate)

The site already has `#incidents` (Incident Lab). Add a small "Replay a real incident"
dropdown in the demo's control bar that pre-sets a disruption on the bank:
1. Faulty endpoint-security update crashing Windows machines → People unavailable
   (all staff on affected laptops) / Identity & Access degraded.
2. Major cloud-region outage → Site unavailable: Cloud region A, 8h.
3. Card processor outage → Vendor outage: Card processor, 4h.
Each needs `incidentName`, `date`, `factualSummary`, `sourceUrl`. **Leave summary and
sourceUrl as `"TODO – founder fills from a reliable source"`.** Never write incident facts
from memory. If `#incidents` already has this data, reuse it and tell me.

---

## 9. Commercial calculator

Leave the existing business-model sections as they are for now. Don't build a calculator
in this spec; I'll ask separately.

---

## 10. Milestones (one at a time)

1. **Recon.** Read `public/index.html`, `public/app.js`, `public/data.js`. Tell me what
   drives the current `#risk` demo, what you'll remove, and whether `#incidents` data can be
   reused. No code yet.
2. **Data files** (section 6) in `public/data/`, loaded by `<script>` tags.
3. **Engine + tests** (sections 4–5). Run `npm test` and show me passing results.
4. **New `#risk` layout + cascading dropdowns** (7.1) with the default selection, old demo removed.
5. **Impact map SVG** (7.2 left) with source badges.
6. **"Who is disrupted" panel + details panel** (7.2 middle/right).
7. **Bottom tabs:** Business impact, Recovery plan, Gaps, Timeline.
8. **Incident replay dropdown** (section 8) + Full screen button.
9. **Polish:** mobile, accessibility, no console errors, every other section still works.

After each milestone: list files changed, the command to run it (`npm start`, then open
http://localhost:3002/#risk), and exactly what to click to check it.

## 11. Definition of done
- `npm test` passes.
- Loading `#risk` shows the default scenario already run, with named people listed.
- Changing Department updates Process; changing Process updates Application.
- Vendor outage "Card processor" 4h → Card authorization down, Card Ops Team people listed,
  MAD breach shown, recovery plan names owner and backup.
- Site unavailable "Cloud region A" → many apps red; people count jumps across departments.
- People unavailable on a critical person with no backup → their process goes down and
  the gap appears.
- Every panel shows its source badge (Application Repository / Workforce System /
  Third-Party Risk Management / BIA register).
- No "illustrative" text in the demo. No console errors. Other sections unchanged.

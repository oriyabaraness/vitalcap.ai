# VitalCap — Interactive BCP Demo: Build Spec for Cursor

> Read this whole file before writing code. Build in the milestone order at the bottom.
> Finish one milestone, show me what changed, and wait for my "go" before the next one.
> I am a beginner: explain each change in plain words and tell me exactly what to run.

---

## 1. What we are building (one paragraph)

An interactive page on the VitalCap investor site where a visitor sees a company's
**departments and the systems/vendors they depend on as a linked graph**. The visitor can
**knock out any node** (e.g. "Cloud hosting down for 8 hours"), **edit a dependency**
(add/remove a link, add a workaround, change an RTO), and immediately see:

1. **Impact cascade** — which departments go down, when, and for how long (animated on the graph).
2. **BIA table** — per-department downtime, RTO breach yes/no, estimated cost (assumption-labeled).
3. **Recovery plan** — an ordered, auto-generated recovery sequence with owners.
4. **Gaps** — single points of failure, RTO mismatches, missing workarounds.

Everything recalculates live. No backend, no login, no AI calls — pure front-end logic
on sample data. The point is to *show* investors the product's core idea in 60 seconds.

---

## 2. Tech choices

**This repo is a plain HTML/CSS/JS single-page pitch site** — `public/index.html`,
`public/app.js`, `public/data.js`, `public/styles.css`, served by `server.js` (`npm start`,
port 3002). There is **no build step and no framework. Keep it that way.**

- Vanilla JavaScript, no React, no bundler, no TypeScript. Types in section 3 are a
  guide — write them as JSDoc comments.
- The graph is **hand-built SVG** drawn by our own JS (simple layered layout: systems/vendors
  on the left, departments on the right). Do not add a graph library unless I approve it.
- Reuse the site's existing look: classes, colors and fonts from `public/styles.css`
  (e.g. the `slide slide-wide` section pattern). Add new styles at the end of `styles.css`
  under a `/* === Dependency demo === */` comment.
- Reuse existing terminology from `public/data.js`: departments already have `rto`, `rpo`
  and **`mad`** (maximum allowable downtime). Treat `mad` as the department's tolerance and
  keep the existing rule "RTO must be ≤ MAD". Existing departments in `businessLines`
  should be the starting departments if that fits; the sample in section 6 fills the rest.
- All calculation logic goes in **`public/bcp-engine.js`** as pure functions with no DOM
  access, written so it works both in the browser (attach to `window.VitalCapBCP`) and in
  Node (`module.exports` when available) — so it can be tested.
- Tests: **`tests/bcp-engine.test.js`** using Node's built-in test runner (`node --test`),
  so nothing needs installing. Add `"test": "node --test tests/"` to `package.json` scripts.
- State: plain JS object + a `render()` function. Optional: save edits to `localStorage`
  wrapped in try/catch. "Reset to sample" button always available.
- Add the demo as a **new `<section id="dependencies">`** in `index.html`, placed right
  after the existing `#risk` demo section, and add it to any nav/slide index the site has.
  **Do not break or remove the existing sections** (`#risk`, `#incidents`, etc.).
  If the existing `#incidents` "incident lab" overlaps with section 7, tell me and propose
  how to connect them instead of duplicating.

File layout:

```
public/bcp-engine.js      # propagation, BIA, recovery plan, gaps (pure, testable)
public/bcp-data.js        # sample company + scenarios (window.VITALCAP_BCP_DATA)
public/bcp-ui.js          # SVG graph, inspector, results tabs, slider, calculator
public/index.html         # add <section id="dependencies"> + 3 <script> tags
public/styles.css         # append demo styles at the end
tests/bcp-engine.test.js  # section 5 tests, run with: npm test
```

---

## 3. Data model

```ts
type NodeKind = "department" | "system" | "vendor" | "facility" | "people";
type Criticality = 1 | 2 | 3 | 4 | 5;        // 5 = most critical

interface BcpNode {
  id: string;
  name: string;
  kind: NodeKind;
  owner: string;                 // role, e.g. "Head of Ops"
  rtoHours: number;              // Recovery Time Objective
  rpoHours?: number;             // Recovery Point Objective (systems/data)
  restoreHours: number;          // time to get back up AFTER its dependencies are back
  criticality: Criticality;
  costPerHourDown?: number;      // departments only — ASSUMPTION, shown with a label
  criticalProcesses?: string[];  // departments only
}

interface Dependency {
  id: string;
  from: string;                  // the node that NEEDS something (dependent)
  to: string;                    // the node it needs (provider)
  type: "hard" | "soft";         // hard = stops; soft = degraded
  workaroundHours: number | null;// how long a manual workaround holds; null = none
  note?: string;
}

interface Disruption { nodeId: string; durationHours: number; }

interface Scenario {
  id: string;
  title: string;
  incident: {                    // REAL event — facts only
    name: string;
    date: string;
    summary: string;             // 1–2 sentences, factual
    sourceUrl: string;           // REQUIRED. Do not ship a scenario without one.
  };
  illustrativeMapping: string;   // how this maps to the sample company (clearly hypothetical)
  disruptions: Disruption[];
  bcpQuestions: string[];        // the questions this incident raises for a BCP owner
}
```

Graph direction on screen: arrows point **from dependent → provider** ("Support needs CRM").

---

## 4. Calculation rules (public/bcp-engine.js)

Implement as pure functions. Time unit = hours from t=0 (the moment of disruption).

### 4.1 Outage propagation — `simulate(nodes, deps, disruptions)`
For every node compute `{ downStart, downEnd, status }`:

1. A **directly disrupted** node: `downStart = 0`, `downEnd = durationHours`.
2. For a node X with a **hard** dependency on a down provider P:
   - `tolerance = workaroundHours ?? 0`
   - candidate `start = P.downStart + tolerance`
   - If `start >= P.downEnd` → the workaround outlasted the outage → **no impact from P**.
   - Otherwise X is down from `start`, and its `end = P.downEnd + X.restoreHours`.
3. If X has several down providers: `downStart = min(starts)`, `downEnd = max(ends)`.
4. A **soft** dependency marks X as `"degraded"` (same timing math) but does **not**
   propagate further down the chain.
5. Iterate until nothing changes (handles chains). **Detect cycles** and report them as a
   gap instead of looping forever.
6. `downtime = downEnd - downStart` (0 if never impacted).
   `status`: `"ok" | "degraded" | "down"`, plus `rtoBreached = downtime > rtoHours`.

### 4.2 BIA — `buildBia(simResult, nodes)`
One row per **department**: name, owner, criticality, time-to-impact, downtime, RTO,
breached?, `estimatedCost = downtime × costPerHourDown`.
Sort by breached first, then criticality desc, then cost desc.
Every cost cell and total shows a small "Assumption" tag.

### 4.3 Recovery plan — `buildRecoveryPlan(simResult, nodes, deps)`
- Only impacted nodes.
- Order = topological order of the dependency graph (providers before dependents),
  tie-break by criticality desc, then RTO asc.
- Each step: `"#n — Restore {name} (owner: {owner}) — target by T+{h}h"` where target is
  `min(downStart + rtoHours, …)`; flag steps whose target is already impossible.
- If a dependency has a workaround, add a sub-step: "Activate workaround (holds {h}h)".

### 4.4 Gaps — `findGaps(nodes, deps)` (does not need a disruption)
- **RTO mismatch:** X depends **hard** on P and `P.rtoHours > X.rtoHours`
  → "Payroll's RTO is 4h but it depends on Payroll Vendor with RTO 24h."
- **Single point of failure:** a node with ≥3 hard dependents and none of those links has a workaround.
- **No workaround on a criticality-5 department's hard dependency.**
- **Cycle** detected.
Each gap has a severity (high/med/low) and a one-line "suggested fix".

---

## 5. Unit tests (must pass before UI work on results)

Tiny graph:
- `R` (system, rtoHours 4, restoreHours 0)
- `A` (department, rtoHours 4, restoreHours 1), hard dep on R, no workaround
- `B` (department, rtoHours 24, restoreHours 0), hard dep on A, workaroundHours 6

Test 1 — disrupt R for 5h:
- R: down 0→5
- A: down 0→6, downtime 6, **RTO breached** (6 > 4)
- B: candidate start 0+6 = 6 ≥ A.downEnd 6 → **not impacted**

Test 2 — same, but B's workaroundHours = 2:
- B: down 2→6 (6 + 0 restore), downtime 4, not breached

Test 3 — set R.rtoHours = 8 → `findGaps` returns an **RTO mismatch** for A→R.

Test 4 — add dep R → B (creates cycle A→R→B→A) → simulate terminates and `findGaps` reports a cycle.

Test 5 — soft dependency: change A→R to soft → A "degraded", B not impacted via A.

---

## 6. Sample data — clearly fictional company

Name it **"Harbor & Pine Logistics (illustrative company)"**. Show the word
"Illustrative" next to the name everywhere it appears.

Departments (with criticality / RTO h / costPerHourDown — all assumptions):
- Customer Support (4 / 4 / 2,000)
- Dispatch & Operations (5 / 2 / 8,000)
- Finance & Billing (4 / 24 / 3,000)
- Payroll & HR (3 / 48 / 500)
- Sales (3 / 24 / 1,500)
- IT Service Desk (4 / 4 / 1,000)

Systems / vendors / facilities:
- Identity & SSO (system, RTO 2)
- Cloud hosting – single region (vendor, RTO 4)
- ERP (system, RTO 8)
- CRM (system, RTO 8)
- Payment processor (vendor, RTO 4)
- Payroll vendor (vendor, RTO 24)
- Endpoint security agent on all laptops (system, RTO 4)
- Head office (facility, RTO 72)
- Telephony / contact-center platform (vendor, RTO 2)

Wire realistic links, e.g. Dispatch → ERP (hard), ERP → Cloud hosting (hard),
everything → Identity & SSO (hard), Support → CRM (hard) and → Telephony (hard),
Finance → Payment processor (hard, workaround 8h manual invoicing),
Payroll → Payroll vendor (hard, workaround 24h), all departments → Endpoint agent (hard),
Sales → CRM (soft). Include at least one deliberate RTO mismatch (Payroll vendor) so the Gaps tab
isn't empty on first load.

---

## 7. Case-study scenarios (historical incidents)

Rules:
- The **incident** block contains only facts, each scenario needs a `sourceUrl`.
  **Leave `summary` and `sourceUrl` as `"TODO – founder to fill from a reliable source"`.**
  Do not write incident facts from memory.
- The **company mapping** is always labeled "Illustrative scenario — not a real company's data."
- Show `bcpQuestions` as a checklist under the scenario.

Starter scenarios (I will verify and fill the facts):
1. **Faulty endpoint-security update crashes Windows machines** → disrupt "Endpoint security agent" 24h.
   Questions: Which departments can work without laptops? Who can restore devices manually, how fast? Is there a vendor update-staging policy?
2. **Major cloud-region outage** → disrupt "Cloud hosting – single region" 12h.
   Questions: Which systems are single-region? Is there a failover region, and has it been tested? What's the real RTO of our ERP?
3. **Airport/air-traffic system disruption causing mass cancellations** (analogy for a critical third-party dependency) → disrupt "Telephony / contact-center platform" 8h.
   Questions: How do we handle a demand surge when our provider is down? Is there a backup channel?

Scenario picker sets the disruptions; the user can still edit everything afterward.

---

## 8. UI layout

Desktop (≥1024px): three areas
- **Left (60%) — graph.** Nodes colored by kind; status overlay after simulating:
  green ok / amber degraded / red down. Edges: solid = hard, dashed = soft,
  small shield icon if a workaround exists. Clicking a node or edge selects it.
- **Right (40%) — Inspector** for the selected node/edge: edit every field; buttons
  "Disrupt this node" (with duration input) and "Delete". "Add dependency" mode: click
  dependent, then provider.
- **Bottom — Results tabs:** BIA | Recovery plan | Gaps, plus a **time slider (0–72h)**
  that replays the cascade on the graph (node turns red when `t` is in `[downStart, downEnd)`).

Top bar: Scenario picker · Reset to sample · "What am I looking at?" (opens a 3-step guided tour).

Mobile (<768px): stack vertically; graph is pan/zoom; Inspector becomes a bottom sheet.

Accessibility: every color status also has a text label/icon; keyboard can select nodes;
results tables are real `<table>` elements.

Performance: recalculation runs on every edit; must feel instant for ≤50 nodes.

---

## 9. Commercial calculator (separate section on the same page)

Inputs (all with visible "Assumption" labels and editable defaults):
- Number of departments with a BCP (default 12)
- Hours to update one department's plan (default 16)
- Updates per year (default 2)
- Blended hourly cost of staff doing it (default $85)
- Estimated time reduction with VitalCap (default 60%)

Outputs: current annual cost of plan maintenance, hours saved, $ saved.
Footer text: "Illustrative estimate based on the assumptions above. Not a forecast."

Below it, two static blocks I will fill in: **"Initial buyer segment"** and
**"How VitalCap differs from established BCM platforms"** — render placeholders
with `TODO` so I don't forget.

---

## 10. Milestones (do them in order, one at a time)

1. **Recon.** Inspect the repo, tell me the framework, where the new page will live,
   and what you'll install. No code yet.
2. **Types + sample data + scenarios** (section 3, 6, 7). No UI.
3. **Engine + tests** (sections 4, 5). Show me test results passing.
4. **Static graph** of the sample data on the new page.
5. **Inspector editing** + add/delete nodes and dependencies + reset.
6. **Disrupt + results tabs** (BIA, Recovery plan, Gaps) wired to the engine.
7. **Time slider replay** + scenario picker + bcpQuestions checklist.
8. **Cost calculator** + placeholder blocks.
9. **Polish:** guided tour, mobile layout, accessibility pass, empty/error states.

After each milestone: list files changed, the command to run it locally, and what I
should click to check it works.

## 11. Definition of done
- All engine tests pass.
- Loading the page with no edits shows the graph and a non-empty Gaps tab.
- Picking scenario 2 turns at least Dispatch, Finance and Support red, and the BIA shows breaches.
- Editing a workaround to a large value removes the related department from the impact.
- Every money figure and incident-mapping is visibly labeled as assumption/illustrative.

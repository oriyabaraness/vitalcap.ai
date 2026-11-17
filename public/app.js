const DATA = window.VITALCAP_DATA;

const titleCase = (s) => s.charAt(0) + s.slice(1).toLowerCase();

/* Highlight nav link for the section in view while scrolling */
const sections = document.querySelectorAll(".slide[id]");
const navLinks = document.querySelectorAll(".deck-link");

if (sections.length && navLinks.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-15% 0px -55% 0px", threshold: 0 }
  );
  sections.forEach((section) => observer.observe(section));
}

function renderPackageFlow() {
  const banner = document.getElementById("min-service");
  const flow = document.getElementById("package-flow");
  if (!flow) return;

  banner.textContent = DATA.minServiceLevel;
  flow.innerHTML = DATA.businessLines
    .map(
      (b) => `
    <div class="flow-row">
      <div class="flow-positions">
        <strong>${b.dept}</strong>
        ${b.positions}
      </div>
      <div class="flow-bridge" aria-hidden="true">→</div>
      <div class="flow-critical">${b.critical}</div>
      <div class="flow-app">
        <p class="flow-app-name">${b.app}</p>
        <p class="flow-app-blurb">${b.blurb}</p>
        <p class="flow-metrics">RTO ${b.rto}h · RPO ${b.rpo}h · MAD ${b.mad}h</p>
      </div>
    </div>`
    )
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderIncidentLab() {
  const root = document.getElementById("incident-lab");
  const lab = DATA.incidentLab;
  if (!root || !lab) return;

  const event = lab.events[0];
  const hypo = lab.hypothetical;

  root.innerHTML = `
    <p class="fine-print incident-disclaimer">${lab.disclaimer}</p>
    <div class="incident-layout">
      <article class="incident-panel incident-panel--facts" aria-labelledby="incident-facts-title">
        <div class="incident-badge">Verified · public record</div>
        <h3 id="incident-facts-title" class="incident-panel-title">${escapeHtml(event.shortTitle)}</h3>
        <p class="incident-date">${escapeHtml(event.date)}</p>
        <p class="incident-headline">${escapeHtml(event.headline)}</p>
        <ul class="incident-facts">
          ${event.verifiedFacts
            .map(
              (f) => `
            <li>
              <span class="incident-fact-label">${escapeHtml(f.label)}</span>
              <span class="incident-fact-text">${escapeHtml(f.text)}</span>
            </li>`
            )
            .join("")}
        </ul>
        <p class="incident-sources-label">Sources</p>
        <ul class="incident-sources">
          ${event.sources
            .map(
              (s) =>
                `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a></li>`
            )
            .join("")}
        </ul>
      </article>

      <article class="incident-panel incident-panel--sim" aria-labelledby="incident-sim-title">
        <div class="incident-badge incident-badge--hypo">Hypothetical · BCP exercise</div>
        <h3 id="incident-sim-title" class="incident-panel-title">${escapeHtml(hypo.orgName)}</h3>
        <p class="incident-org-note">${escapeHtml(hypo.orgNote)}</p>

        <div class="incident-controls">
          <label class="incident-control">
            <span>Stop window (hours)</span>
            <input type="number" id="incident-stop" min="0" step="0.25" value="${event.defaultStopHours}" />
            <span class="incident-control-hint">Default from FAA published stop / lift times.</span>
          </label>
          <label class="incident-control">
            <span>Your recovery lag (hours)</span>
            <input type="number" id="incident-lag" min="0" step="1" value="${event.defaultRecoveryLagHours}" />
            <span class="incident-control-hint">${escapeHtml(event.recoveryLagHint)}</span>
          </label>
          <label class="incident-control">
            <span>Share of volume on air (%)</span>
            <input type="range" id="incident-air" min="0" max="100" step="1" value="${hypo.airShareDefault}" />
            <output id="incident-air-out">${hypo.airShareDefault}</output>
          </label>
        </div>

        <ol class="incident-bcp-steps" id="incident-steps"></ol>
      </article>
    </div>`;

  const stopEl = document.getElementById("incident-stop");
  const lagEl = document.getElementById("incident-lag");
  const airEl = document.getElementById("incident-air");
  const airOut = document.getElementById("incident-air-out");
  const stepsEl = document.getElementById("incident-steps");

  function computeIncident() {
    const stopH = Math.max(0, Number(stopEl.value) || 0);
    const lagH = Math.max(0, Number(lagEl.value) || 0);
    const airPct = Number(airEl.value) || 0;
    const effective = stopH + lagH;
    if (airOut) airOut.textContent = String(airPct);

    const deps = hypo.dependencies
      .map(
        (d) => `
      <li class="incident-dep">
        <span class="incident-dep-name">${escapeHtml(d.name)}</span>
        <span class="incident-dep-detail">${escapeHtml(d.detail)}</span>
        <span class="incident-dep-fn">${escapeHtml(d.bcpFunction)}</span>
      </li>`
      )
      .join("");

    const shipmentRows = hypo.shipments
      .map((s) => {
        const exposed = s.dependsOnAir && airPct > 0;
        const gap = exposed && effective > s.madHours;
        const status = !exposed
          ? { cls: "ok", text: "Not air-dependent in this model" }
          : gap
            ? { cls: "bad", text: `${effective}h effective outage exceeds ${s.madHours}h MAD` }
            : { cls: "ok", text: `Within ${s.madHours}h MAD at ${effective}h modeled outage` };
        return `
        <tr class="incident-ship-row" data-gap="${gap ? "1" : "0"}" data-med="${s.id === "med" ? "1" : "0"}">
          <td>${escapeHtml(s.lane)}</td>
          <td>${escapeHtml(s.volumeLabel)}</td>
          <td>${s.madHours}h</td>
          <td><span class="incident-status incident-status--${status.cls}">${status.text}</span></td>
        </tr>
        <tr class="incident-ship-note"><td colspan="4">${escapeHtml(s.note)}</td></tr>`;
      })
      .join("");

    const gaps = hypo.shipments.filter(
      (s) => s.dependsOnAir && airPct > 0 && effective > s.madHours
    );
    const gapSummary =
      gaps.length === 0
        ? `At ${effective}h modeled outage and ${airPct}% on air, every illustrated lane stays within its MAD.`
        : `${gaps.length} air-dependent lane${gaps.length > 1 ? "s" : ""} exceed MAD — alternatives required.`;

  const playbooks = hypo.playbooks
    .filter((p) => {
      if (p.when === "always") return true;
      if (p.when === "bulk") return true;
      if (p.when === "med") return gaps.some((g) => g.id === "med");
      if (p.when === "gap") return gaps.length > 0;
      return false;
    })
    .map(
      (p) => `
      <li class="incident-playbook">
        <strong>${escapeHtml(p.title)}</strong>
        <span>${escapeHtml(p.detail)}</span>
      </li>`
    )
    .join("");

    stepsEl.innerHTML = `
      <li class="incident-step">
        <h4>1 · Map dependencies</h4>
        <p class="incident-step-intro">Which parts of the plan assume U.S. air cargo is available?</p>
        <ul class="incident-deps">${deps}</ul>
      </li>
      <li class="incident-step">
        <h4>2 · Identify critical shipments</h4>
        <p class="incident-step-intro">Tag lanes with volume and MAD — still fictional numbers.</p>
        <div class="incident-table-wrap">
          <table class="incident-table">
            <thead>
              <tr><th>Lane</th><th>Volume</th><th>MAD</th><th>vs modeled outage</th></tr>
            </thead>
            <tbody>${shipmentRows}</tbody>
          </table>
        </div>
      </li>
      <li class="incident-step">
        <h4>3 · Assess outage vs MAD</h4>
        <p class="incident-step-intro">
          Effective planning outage = <strong>${effective}h</strong>
          (${stopH}h stop + ${lagH}h recovery lag you set). This does <em>not</em> claim Meridian Freight experienced that duration.
        </p>
        <div class="incident-timeline" role="img" aria-label="Modeled outage compared to shortest air-dependent MAD">
          <div class="incident-timeline-bar">
            <span class="incident-timeline-outage" style="width:${Math.min(100, (effective / 72) * 100)}%"></span>
          </div>
          <div class="incident-timeline-labels">
            <span>0h</span>
            <span>Modeled ${effective}h</span>
            <span>72h ref.</span>
          </div>
        </div>
        <p id="incident-gap-summary" class="gap-alert ${gaps.length ? "bad" : "ok"}" role="status">${gapSummary}</p>
      </li>
      <li class="incident-step">
        <h4>4 · Act — alternative arrangements</h4>
        <p class="incident-step-intro">Pre-approved playbook rows VitalCap would surface for this dependency graph.</p>
        <ul class="incident-playbooks">${playbooks}</ul>
      </li>`;
  }

  [stopEl, lagEl, airEl].forEach((el) => el.addEventListener("input", computeIncident));
  computeIncident();
}

function renderThreats() {
  const grid = document.getElementById("threat-grid");
  if (!grid) return;
  grid.innerHTML = DATA.threatSteps
    .map(
      (step) => `
    <article class="threat-card">
      <div class="radar" aria-hidden="true"></div>
      <h3>${step.title}</h3>
      <p>${step.text}</p>
    </article>`
    )
    .join("");
}

const sim = {
  dept: document.getElementById("sim-dept"),
  rto: document.getElementById("sim-rto"),
  rpo: document.getElementById("sim-rpo"),
  mad: document.getElementById("sim-mad"),
  rep: document.getElementById("sim-rep"),
  legal: document.getElementById("sim-legal"),
  reg: document.getElementById("sim-reg"),
  internal: document.getElementById("sim-internal"),
};

function populateSimDept() {
  if (!sim.dept) return;
  sim.dept.innerHTML = DATA.businessLines
    .map((b, i) => `<option value="${i}">${titleCase(b.dept)}</option>`)
    .join("");
}

function loadDept(index) {
  const b = DATA.businessLines[index];
  sim.rto.value = b.rto;
  sim.rpo.value = b.rpo;
  sim.mad.value = b.mad;
}

function riskSegment(value, horizonWeight) {
  const base = value * 8 * horizonWeight;
  return Math.min(200, Math.round(base));
}

function renderRiskBars(rep, legal, reg, internal) {
  const container = document.getElementById("risk-bars");
  if (!container) return;

  const rows = [
    { label: "Reputational", v: rep },
    { label: "Legal", v: legal },
    { label: "Regulatory", v: reg },
    { label: "Internal", v: internal },
  ];

  const maxScale = 200;
  container.innerHTML =
    rows
      .map(({ label, v }) => {
        const s4 = riskSegment(v, 0.35);
        const s24 = riskSegment(v, 0.45);
        const s48 = riskSegment(v, 0.55);
        const total = Math.min(maxScale, s4 + s24 + s48);
        const pct = (n) => `${(n / total || 0) * 100}%`;
        return `
      <div class="risk-row">
        <span class="risk-row-label">${label}</span>
        <div class="risk-row-bg">
          <div class="risk-row-track" style="width:${(total / maxScale) * 100}%">
            <span class="risk-seg risk-seg-4" style="width:${pct(s4)}"></span>
            <span class="risk-seg risk-seg-24" style="width:${pct(s24)}"></span>
            <span class="risk-seg risk-seg-48" style="width:${pct(s48)}"></span>
          </div>
        </div>
      </div>`;
      })
      .join("") +
    `<div class="risk-axis"><span>0</span><span>50</span><span>100</span><span>150</span><span>200</span></div>`;
}

function renderGap(b, rto, rpo, mad) {
  const el = document.getElementById("gap-alert");
  if (!el) return;
  if (rto > mad) {
    el.className = "gap-alert bad";
    el.textContent = `⚠ Gap found: ${b.app} needs ${rto}h to recover, but ${titleCase(b.dept)} can only be down for ${mad}h. VitalCap flags this for a faster recovery option.`;
  } else {
    el.className = "gap-alert ok";
    el.textContent = `✓ Covered: ${b.app} recovers in ${rto}h, within the ${mad}h ${titleCase(b.dept)} can tolerate (up to ${rpo}h of data at risk).`;
  }
}

function renderRecoveryTable(b, rep, legal, clientRisk) {
  const warning = document.getElementById("recovery-warning");
  const tbody = document.getElementById("recovery-rows");
  if (!warning || !tbody) return;

  warning.textContent = `VitalCap warns that ${b.app} is a critical application for the ${titleCase(b.dept)} team’s core functions.`;

  tbody.innerHTML = DATA.recoveryPlan
    .map((step) => {
      const actionText = step.actions.join("; ");
      const prefix = step.automated ? '<span class="auto-tag">Automated</span> ' : "";
      return `
      <tr>
        <td>${step.label}</td>
        <td>${clientRisk}</td>
        <td>${rep}</td>
        <td>${legal}</td>
        <td>${prefix}<span class="action-main">${actionText}</span></td>
      </tr>`;
    })
    .join("");
}

function computeSim() {
  if (!sim.dept) return;

  const b = DATA.businessLines[Number(sim.dept.value)];
  const rto = Number(sim.rto.value) || 0;
  const rpo = Number(sim.rpo.value) || 0;
  const mad = Number(sim.mad.value) || 0;
  const rep = Number(sim.rep.value);
  const legal = Number(sim.legal.value);
  const reg = Number(sim.reg.value);
  const internal = Number(sim.internal.value);

  document.getElementById("out-rep").textContent = rep;
  document.getElementById("out-legal").textContent = legal;
  document.getElementById("out-reg").textContent = reg;
  document.getElementById("out-internal").textContent = internal;

  const clientRisk = Math.max(rep, legal, reg);
  renderRiskBars(rep, legal, reg, internal);
  renderGap(b, rto, rpo, mad);

  const madEl = document.getElementById("mad-recommendation");
  if (madEl) {
    madEl.textContent = `Recommended MAD for ${titleCase(b.dept)}: ${mad} hours`;
  }

  renderRecoveryTable(b, rep, legal, clientRisk);
}

if (sim.dept) {
  populateSimDept();
  loadDept(0);
  sim.dept.addEventListener("change", () => {
    loadDept(Number(sim.dept.value));
    computeSim();
  });
  [sim.rto, sim.rpo, sim.mad, sim.rep, sim.legal, sim.reg, sim.internal].forEach((el) =>
    el.addEventListener("input", computeSim)
  );
  computeSim();
}

renderPackageFlow();
renderIncidentLab();
renderThreats();

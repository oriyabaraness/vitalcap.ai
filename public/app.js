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
renderThreats();

/**
 * Product demo v2 — department / process pickers + application list on the side.
 */
(function () {
  const bia = window.VC_BIA;
  const repo = window.VC_APP_REPO;
  if (!bia || !repo) return;

  const els = {
    section: document.getElementById("risk"),
    bankName: document.getElementById("demo-bank-name"),
    dept: document.getElementById("demo-dept-select"),
    process: document.getElementById("demo-process-select"),
    appList: document.getElementById("demo-app-list"),
    appListWrap: document.getElementById("demo-app-sidebar"),
    appDetail: document.getElementById("demo-app-detail"),
    disruption: document.getElementById("demo-disruption-type"),
    duration: document.getElementById("demo-duration"),
    run: document.getElementById("demo-run"),
  };

  if (!els.dept) return;

  const state = {
    departmentId: bia.defaultSelection.departmentId,
    processId: "",
    applicationId: "",
  };

  function processesForDept(deptId) {
    return bia.processes.filter((p) => p.departmentId === deptId);
  }

  function appsForProcess(process) {
    if (!process) return [];
    return process.applicationIds
      .map((id) => repo.byId[id])
      .filter(Boolean);
  }

  function fillDepartments() {
    els.dept.innerHTML = bia.departments
      .map((d) => `<option value="${d.id}">${d.name}</option>`)
      .join("");
    els.dept.value = state.departmentId;
  }

  function fillProcesses() {
    const list = processesForDept(state.departmentId);
    els.process.innerHTML = list
      .map((p) => `<option value="${p.id}">${p.name}</option>`)
      .join("");
    if (!list.some((p) => p.id === state.processId)) {
      state.processId = list[0]?.id || "";
    }
    els.process.value = state.processId;
  }

  function currentProcess() {
    return bia.processes.find((p) => p.id === state.processId);
  }

  function renderAppSidebar() {
    const process = currentProcess();
    if (!process) {
      els.appListWrap.hidden = true;
      return;
    }
    els.appListWrap.hidden = false;
    const apps = appsForProcess(process);
    if (!apps.some((a) => a.id === state.applicationId)) {
      state.applicationId = apps[0]?.id || "";
    }
    els.appList.innerHTML = apps
      .map((app) => {
        const selected = app.id === state.applicationId;
        return `<li>
          <button type="button" class="demo-app-item${selected ? " demo-app-item--selected" : ""}" data-app-id="${app.id}">
            <span class="demo-app-item__name">${app.name}</span>
            <span class="demo-app-item__meta">RTO ${app.rtoHours}h · Tier ${app.tier}</span>
          </button>
        </li>`;
      })
      .join("");

    els.appList.querySelectorAll("[data-app-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.applicationId = btn.getAttribute("data-app-id");
        renderAppSidebar();
        renderAppDetail();
      });
    });
  }

  function renderAppDetail() {
    const app = repo.byId[state.applicationId];
    const process = currentProcess();
    if (!els.appDetail) return;
    if (!app || !process) {
      els.appDetail.innerHTML = "<p class='demo-muted'>Select an application.</p>";
      return;
    }
    const madBreached = app.rtoHours > process.madHours;
    els.appDetail.innerHTML = `
      <p class="demo-source-badge" title="In production this is synced from the bank's application repository.">Source: Application Repository</p>
      <h3 class="demo-detail-title">${app.name}</h3>
      <dl class="demo-detail-dl">
        <div><dt>RTO</dt><dd>${app.rtoHours}h</dd></div>
        <div><dt>RPO</dt><dd>${app.rpoHours}h</dd></div>
        <div><dt>Hosting</dt><dd>${app.hosting}</dd></div>
        <div><dt>Process MAD</dt><dd>${process.madHours}h</dd></div>
      </dl>
      <p class="gap-panel ${madBreached ? "gap-panel--bad" : "gap-panel--ok"}" role="status">
        ${
          madBreached
            ? `Application RTO (${app.rtoHours}h) exceeds process MAD (${process.madHours}h).`
            : `RTO fits within ${process.name} MAD (${process.madHours}h).`
        }
      </p>
    `;
  }

  function onDeptChange() {
    state.departmentId = els.dept.value;
    const procs = processesForDept(state.departmentId);
    state.processId = procs[0]?.id || "";
    state.applicationId = "";
    fillProcesses();
    renderAppSidebar();
    renderAppDetail();
  }

  function onProcessChange() {
    state.processId = els.process.value;
    state.applicationId = "";
    renderAppSidebar();
    renderAppDetail();
  }

  function init() {
    if (els.bankName) els.bankName.textContent = bia.bankName;
    fillDepartments();
    state.processId = bia.defaultSelection.processId;
    state.applicationId = bia.defaultSelection.applicationId;
    fillProcesses();
    renderAppSidebar();
    renderAppDetail();

    els.dept.addEventListener("change", onDeptChange);
    els.process.addEventListener("change", onProcessChange);
    const durationOut = document.getElementById("demo-duration-out");
    if (els.duration && durationOut) {
      const syncDuration = () => {
        durationOut.textContent = els.duration.value;
      };
      els.duration.addEventListener("input", syncDuration);
      syncDuration();
    }
    if (els.run) els.run.addEventListener("click", () => renderAppDetail());
  }

  init();
})();
/**
 * Pure BCP simulation — no DOM. Browser: window.VitalCapBCP; Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  root.VitalCapBCP = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function vitalCapBcpEngine() {
  const MAX_ITER = 48;

  /** @returns {{ status: string, downStart: number, downEnd: number, reason: string[] }} */
  function emptyStatus() {
    return { status: "ok", downStart: Infinity, downEnd: 0, reason: [] };
  }

  function mergeDown(target, start, end, reason) {
    if (end <= start) return;
    if (target.status === "ok") {
      target.status = "down";
      target.downStart = start;
      target.downEnd = end;
      target.reason = reason.slice();
      return;
    }
    const ns = Math.min(target.downStart, start);
    const ne = Math.max(target.downEnd, end);
    if (ne > target.downEnd || ns < target.downStart) {
      target.downStart = ns;
      target.downEnd = ne;
      if (reason.length) target.reason = reason.slice();
    }
  }

  function setDegraded(target, start, end, reason) {
    if (target.status === "down") return;
    target.status = "degraded";
    target.downStart = Math.min(target.downStart === Infinity ? start : target.downStart, start);
    target.downEnd = Math.max(target.downEnd, end);
    if (reason.length) target.reason = reason.slice();
  }

  function downtimeOf(s) {
    if (s.status === "ok") return 0;
    if (!Number.isFinite(s.downStart) || s.downEnd <= s.downStart) return 0;
    return s.downEnd - s.downStart;
  }

  function peopleByTeam(people) {
    /** @type {Record<string, object[]>} */
    const map = {};
    for (const p of Object.values(people)) {
      if (!p.teamId) continue;
      (map[p.teamId] ||= []).push(p);
    }
    return map;
  }

  function detectAppCycles(applications) {
    const ids = Object.keys(applications);
    const cycles = [];
    const stack = [];
    const inStack = new Set();
    const visited = new Set();

    function dfs(id) {
      if (inStack.has(id)) {
        const idx = stack.indexOf(id);
        cycles.push(stack.slice(idx).concat(id));
        return;
      }
      if (visited.has(id)) return;
      visited.add(id);
      inStack.add(id);
      stack.push(id);
      const app = applications[id];
      for (const dep of app?.dependsOnAppIds || []) {
        if (applications[dep]) dfs(dep);
      }
      stack.pop();
      inStack.delete(id);
    }
    for (const id of ids) dfs(id);
    return cycles;
  }

  /**
   * @param {object} data
   * @param {{ type: string, targetId: string, durationHours: number }} disruption
   */
  function simulate(data, disruption) {
    const duration = disruption.durationHours;
    const apps = { ...data.applications };
    const vendors = { ...(data.vendors || {}) };
    const processes = { ...data.processes };
    const people = { ...(data.people || {}) };
    const teams = { ...(data.teams || {}) };

    const appSt = Object.fromEntries(Object.keys(apps).map((id) => [id, emptyStatus()]));
    const vendorSt = Object.fromEntries(Object.keys(vendors).map((id) => [id, emptyStatus()]));
    const procSt = Object.fromEntries(Object.keys(processes).map((id) => [id, emptyStatus()]));
    const personSt = Object.fromEntries(Object.keys(people).map((id) => [id, emptyStatus()]));

    const cycles = detectAppCycles(apps);

    function applyDirect() {
      const t = disruption.type;
      const target = disruption.targetId;
      if (t === "vendor" && vendors[target]) {
        mergeDown(vendorSt[target], 0, duration, [`${vendors[target].name} outage (vendor)`]);
      } else if (t === "application" && apps[target]) {
        mergeDown(appSt[target], 0, duration, [`${apps[target].name} outage (application)`]);
      } else if (t === "site") {
        for (const [id, app] of Object.entries(apps)) {
          if (app.hosting === target) {
            mergeDown(appSt[id], 0, duration, [`${target} unavailable (site)`, `→ ${app.name} down`]);
          }
        }
        for (const [id, p] of Object.entries(people)) {
          if (p.location === target) {
            mergeDown(personSt[id], 0, duration, [`${target} unavailable (site)`, `→ ${p.name} unavailable`]);
          }
        }
      } else if (t === "people") {
        if (people[target]) {
          mergeDown(personSt[target], 0, duration, [`${people[target].name} unavailable (people)`]);
        } else if (teams[target]) {
          const byTeam = peopleByTeam(people);
          for (const p of byTeam[target] || []) {
            mergeDown(personSt[p.id], 0, duration, [`${teams[target].name} unavailable (people)`, `→ ${p.name} unavailable`]);
          }
        }
      }
    }

    applyDirect();

    let changed = true;
    let iter = 0;
    while (changed && iter < MAX_ITER) {
      changed = false;
      iter += 1;

      // Vendor → Application
      for (const [id, app] of Object.entries(apps)) {
        for (const vid of app.vendorIds || []) {
          const vs = vendorSt[vid];
          if (!vs || vs.status === "ok") continue;
          const vend = vendors[vid];
          const end = vs.downEnd + (app.rtoHours || 0);
          const chain = [...(vs.reason.length ? vs.reason : [`${vend?.name || vid} outage (vendor)`]), `→ ${app.name} down`];
          const before = appSt[id].downEnd;
          mergeDown(appSt[id], 0, end, chain);
          if (appSt[id].downEnd !== before) changed = true;
        }
      }

      // Application → Application (+ skip heavy cycle re-propagation)
      if (!cycles.length) {
        for (const [id, app] of Object.entries(apps)) {
          let start = Infinity;
          let end = 0;
          const chain = [];
          for (const depId of app.dependsOnAppIds || []) {
            const up = appSt[depId];
            if (!up || up.status === "ok") continue;
            start = Math.min(start, up.downStart);
            end = Math.max(end, up.downEnd + (app.rtoHours || 0));
            chain.push(...up.reason, `→ ${app.name} down`);
          }
          if (end > 0 && start < Infinity) {
            const before = appSt[id].downEnd;
            mergeDown(appSt[id], start, end, chain.length ? chain : [`→ ${app.name} down`]);
            if (appSt[id].downEnd !== before) changed = true;
          }
        }
      }

      // Application / Vendor → Process
      for (const [pid, proc] of Object.entries(processes)) {
        let depStart = Infinity;
        let depEnd = 0;
        const reasons = [];
        for (const aid of proc.applicationIds || []) {
          const as = appSt[aid];
          if (as && as.status !== "ok") {
            depStart = Math.min(depStart, as.downStart);
            depEnd = Math.max(depEnd, as.downEnd);
            reasons.push(...as.reason);
          }
        }
        for (const vid of proc.vendorIds || []) {
          const vs = vendorSt[vid];
          if (vs && vs.status !== "ok") {
            depStart = Math.min(depStart, vs.downStart);
            depEnd = Math.max(depEnd, vs.downEnd);
            reasons.push(...vs.reason);
          }
        }
        if (depStart < Infinity && depEnd > depStart) {
          const ps = procSt[pid];
          const before = `${ps.status}:${ps.downEnd}`;
          if (proc.manualWorkaroundHours != null && proc.manualWorkaroundHours > 0) {
            const w = proc.manualWorkaroundHours;
            const degradeEnd = depEnd;
            setDegraded(ps, depStart, degradeEnd, reasons);
            const stillDownAt = depStart + w;
            if (depEnd > stillDownAt) {
              mergeDown(ps, stillDownAt, depEnd, [...reasons, `→ manual workaround exhausted for ${proc.name}`]);
            }
          } else {
            mergeDown(ps, depStart, depEnd, reasons);
          }
          const after = `${ps.status}:${ps.downEnd}`;
          if (before !== after) changed = true;
        }
      }

      // People → Process
      const byTeam = peopleByTeam(people);
      for (const [pid, proc] of Object.entries(processes)) {
        const teamIds = proc.teamIds || [];
        let available = 0;
        let anyUnavail = false;
        let criticalGap = false;
        for (const tid of teamIds) {
          for (const p of byTeam[tid] || []) {
            const ps = personSt[p.id];
            const unavail = ps && ps.status !== "ok";
            if (unavail) anyUnavail = true;
            else available += 1;
            if (p.criticalRole && unavail) {
              const backupId = p.backupPersonId;
              const backup = backupId ? people[backupId] : null;
              const backupSt = backupId ? personSt[backupId] : null;
              const backupDown = !backupId || (backupSt && backupSt.status !== "ok");
              if (backupDown) criticalGap = true;
            }
          }
        }
        const ps = procSt[pid];
        const before = ps.status;
        if (criticalGap || available < (proc.minimumStaff ?? 0)) {
          mergeDown(ps, 0, duration, [`Staffing shortfall for ${proc.name}`]);
        } else if (anyUnavail && ps.status === "ok") {
          setDegraded(ps, 0, duration, [`Partial staffing for ${proc.name}`]);
        }
        if (ps.status !== before) changed = true;
      }

      // Process → Process
      for (const [qid, q] of Object.entries(processes)) {
        for (const upId of q.upstreamProcessIds || []) {
          const up = procSt[upId];
          if (!up || up.status === "ok") continue;
          const before = procSt[qid].downEnd;
          mergeDown(procSt[qid], up.downStart, up.downEnd, [...up.reason, `→ ${q.name} blocked by upstream process`]);
          if (procSt[qid].downEnd !== before) changed = true;
        }
      }
    }

    const madBreached = {};
    for (const [id, proc] of Object.entries(processes)) {
      const st = procSt[id];
      madBreached[id] = downtimeOf(st) > proc.madHours;
    }

    return {
      applications: appSt,
      vendors: vendorSt,
      processes: procSt,
      people: personSt,
      madBreached,
      cyclesDetected: cycles,
      disruption,
    };
  }

  /** @param {ReturnType<simulate>} result @param {object} data */
  function impactedPeople(result, data) {
    const people = data.people || {};
    const processes = data.processes || {};
    const departments = data.departments || {};
    const teams = data.teams || {};
    const apps = data.applications || {};
    const deptById = Object.fromEntries((departments.list || departments).map?.((d) => [d.id, d]) || Object.entries(departments).map(([k, v]) => (v.id ? [v.id, v] : [k, v])));

    const rows = [];
    const downAppIds = new Set(
      Object.entries(result.applications)
        .filter(([, s]) => s.status !== "ok")
        .map(([id]) => id)
    );
    const impactedProcIds = new Set(
      Object.entries(result.processes)
        .filter(([, s]) => s.status !== "ok")
        .map(([id]) => id)
    );

    for (const proc of Object.values(processes)) {
      if (!impactedProcIds.has(proc.id)) continue;
      const pst = result.processes[proc.id];
      for (const tid of proc.teamIds || []) {
        const team = teams[tid];
        for (const p of Object.values(people)) {
          if (p.teamId !== tid) continue;
          const personSt = result.people[p.id];
          const usesDownApp = (p.usesApplicationIds || []).some((aid) => downAppIds.has(aid));
          const worksOnProc = true;
          if (!usesDownApp && !personSt?.reason?.length && !worksOnProc) continue;

          const reasons = [];
          if (personSt?.reason?.length) reasons.push(...personSt.reason);
          if (usesDownApp) {
            const appNames = (p.usesApplicationIds || [])
              .filter((aid) => downAppIds.has(aid))
              .map((aid) => apps[aid]?.name || aid);
            reasons.push(`Cannot use ${appNames.join(", ")} while application is down`);
          }
          if (!usesDownApp && !personSt?.reason?.length) {
            reasons.push(`Works on impacted process ${proc.name}`);
          }
          if (pst?.reason?.length) reasons.push(...pst.reason);

          const dept = deptById[proc.departmentId] || { name: proc.departmentId };
          const backup = p.backupPersonId ? people[p.backupPersonId] : null;
          rows.push({
            person: p,
            team,
            department: dept,
            process: proc,
            status: personSt?.status !== "ok" ? personSt.status : pst?.status || "degraded",
            reason: reasons,
            backup,
          });
        }
      }
    }
    return rows;
  }

  /** @param {ReturnType<simulate>} result @param {object} data */
  function buildBia(result, data) {
    const processes = data.processes || {};
    const departments = data.departments || {};
    const deptList = departments.list || Object.values(departments).filter((d) => d && d.id);
    const deptById = Object.fromEntries(deptList.map((d) => [d.id, d]));
    const peopleRows = impactedPeople(result, data);

    return Object.values(processes).map((proc) => {
      const st = result.processes[proc.id] || emptyStatus();
      const dt = downtimeOf(st);
      const procPeople = peopleRows.filter((r) => r.process.id === proc.id);
      return {
        department: deptById[proc.departmentId]?.name || proc.departmentId,
        process: proc.name,
        timeToImpact: st.downStart === Infinity ? null : st.downStart,
        downtime: dt,
        madHours: proc.madHours,
        breached: result.madBreached[proc.id],
        teamsImpacted: (proc.teamIds || []).length,
        peopleImpacted: procPeople.length,
        vendorsInvolved: proc.vendorIds || [],
        status: st.status,
      };
    });
  }

  /** @param {ReturnType<simulate>} result @param {object} data */
  function buildRecoveryPlan(result, data) {
    const apps = data.applications || {};
    const vendors = data.vendors || {};
    const processes = data.processes || {};
    const people = data.people || {};
    const steps = [];

    const downVendors = Object.entries(result.vendors).filter(([, s]) => s.status !== "ok");
    for (const [id, st] of downVendors) {
      const v = vendors[id];
      steps.push({ layer: "vendor", name: v?.name || id, targetHours: st.downEnd, owner: null, backup: null, criticality: 5 });
    }
    const downApps = Object.entries(result.applications).filter(([, s]) => s.status !== "ok");
    for (const [id, st] of downApps) {
      const app = apps[id];
      const owner = app?.owner ? people[app.owner] : null;
      const backup = owner?.backupPersonId ? people[owner.backupPersonId] : null;
      steps.push({
        layer: app?.tier === "Infrastructure" ? "infrastructure" : "application",
        name: app?.name || id,
        targetHours: st.downEnd,
        owner: owner?.name || null,
        backup: backup?.name || null,
        criticality: app?.tier === "Infrastructure" ? 5 : 3,
      });
    }
    const downProcs = Object.entries(result.processes).filter(([, s]) => s.status !== "ok");
    for (const [id, st] of downProcs) {
      const proc = processes[id];
      steps.push({
        layer: "process",
        name: proc.name,
        targetHours: st.downEnd,
        owner: null,
        backup: null,
        criticality: proc.criticality,
        workaround: proc.manualWorkaroundHours,
      });
    }
    const order = { infrastructure: 0, vendor: 1, application: 2, process: 3 };
    steps.sort((a, b) => {
      const la = order[a.layer] ?? 9;
      const lb = order[b.layer] ?? 9;
      if (la !== lb) return la - lb;
      if (b.criticality !== a.criticality) return b.criticality - a.criticality;
      return a.targetHours - b.targetHours;
    });
    return steps;
  }

  /** @param {object} data */
  function findGaps(data) {
    const gaps = [];
    const apps = data.applications || {};
    const vendors = data.vendors || {};
    const processes = Object.values(data.processes || {});
    const people = Object.values(data.people || {});

    for (const proc of processes) {
      for (const aid of proc.applicationIds || []) {
        const app = apps[aid];
        if (app && app.rtoHours > proc.madHours) {
          gaps.push({
            severity: "high",
            message: `Application ${app.name} RTO (${app.rtoHours}h) exceeds MAD (${proc.madHours}h) for process ${proc.name}.`,
            suggestedFix: `Reduce RTO or increase MAD; align in application repository and BIA.`,
            source: "Application Repository / BIA register",
          });
        }
      }
      for (const vid of proc.vendorIds || []) {
        const v = vendors[vid];
        if (v && v.contractRtoHours > proc.madHours) {
          gaps.push({
            severity: "high",
            message: `Vendor ${v.name} contract RTO (${v.contractRtoHours}h) exceeds MAD (${proc.madHours}h) for ${proc.name}.`,
            suggestedFix: "Renegotiate SLA or add workaround in BIA.",
            source: "Third-Party Risk Management",
          });
        }
      }
    }

    for (const p of people) {
      if (p.criticalRole && !p.backupPersonId) {
        gaps.push({
          severity: "high",
          message: `Key-person risk: ${p.name} (${p.position}) has no backup.`,
          suggestedFix: "Assign and train a backup in workforce system.",
          source: "Workforce System",
        });
      }
      if (p.backupPersonId) {
        const backup = people.find((x) => x.id === p.backupPersonId) || data.people?.[p.backupPersonId];
        if (backup && backup.location === p.location) {
          gaps.push({
            severity: "med",
            message: `${p.name} and backup ${backup.name} share location ${p.location}.`,
            suggestedFix: "Distribute critical roles across sites.",
            source: "Workforce System",
          });
        }
      }
    }

    for (const v of Object.values(vendors)) {
      if (v.tier === "Critical" && v.exitPlan === false) {
        gaps.push({
          severity: "med",
          message: `Critical vendor ${v.name} has no exit plan.`,
          suggestedFix: "Define exit strategy in TPRM.",
          source: "Third-Party Risk Management",
        });
      }
    }

    const procByApp = {};
    for (const proc of processes) {
      if (proc.criticality < 4) continue;
      for (const aid of proc.applicationIds || []) {
        (procByApp[aid] ||= []).push(proc);
      }
    }
    for (const [aid, procs] of Object.entries(procByApp)) {
      if (procs.length >= 3) {
        const app = apps[aid];
        const allNoWorkaround = procs.every((p) => p.manualWorkaroundHours == null);
        if (allNoWorkaround) {
          gaps.push({
            severity: "high",
            message: `${app?.name || aid} is required by ${procs.length} critical processes with no workaround.`,
            suggestedFix: "Add redundancy or manual workaround in BIA.",
            source: "BIA register",
          });
        }
      }
    }

    const cycles = detectAppCycles(apps);
    for (const cyc of cycles) {
      gaps.push({
        severity: "high",
        message: `Dependency cycle detected: ${cyc.join(" → ")}.`,
        suggestedFix: "Break circular dependency in application repository.",
        source: "Application Repository",
      });
    }

    return gaps;
  }

  return { simulate, impactedPeople, buildBia, buildRecoveryPlan, findGaps, detectAppCycles };
});
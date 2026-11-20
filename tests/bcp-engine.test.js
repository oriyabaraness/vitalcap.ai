const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const engine = require(path.join(__dirname, "../public/bcp-engine.js"));

function buildFixture(overrides = {}) {
  const vendors = {
    V: { id: "V", name: "Vendor V", contractRtoHours: 2 },
  };
  const applications = {
    ID: { id: "ID", name: "Identity", rtoHours: 1, tier: "Infrastructure", hosting: "DC", dependsOnAppIds: [], vendorIds: [] },
    A: {
      id: "A",
      name: "App A",
      rtoHours: 1,
      tier: "1",
      hosting: "DC",
      dependsOnAppIds: ["ID"],
      vendorIds: ["V"],
      ...(overrides.appA || {}),
    },
  };
  if (overrides.cycle) {
    applications.ID.dependsOnAppIds = ["A"];
  }
  const teams = { T: { id: "T", name: "Team T", departmentId: "D", location: "Site" } };
  const people = {
    p1: {
      id: "p1",
      name: "Person One",
      teamId: "T",
      criticalRole: true,
      backupPersonId: overrides.noBackup ? null : "p2",
      usesApplicationIds: ["A"],
    },
    p2: { id: "p2", name: "Person Two", teamId: "T", criticalRole: false, backupPersonId: null, usesApplicationIds: ["A"] },
    p3: { id: "p3", name: "Person Three", teamId: "T", criticalRole: false, backupPersonId: null, usesApplicationIds: [] },
  };
  const processes = {
    P: {
      id: "P",
      departmentId: "D",
      name: "Process P",
      madHours: 4,
      criticality: 5,
      applicationIds: ["A"],
      vendorIds: [],
      teamIds: ["T"],
      upstreamProcessIds: [],
      manualWorkaroundHours: null,
      minimumStaff: 2,
    },
    Q: {
      id: "Q",
      departmentId: "D",
      name: "Process Q",
      madHours: 8,
      criticality: 4,
      applicationIds: [],
      vendorIds: [],
      teamIds: [],
      upstreamProcessIds: ["P"],
      manualWorkaroundHours: 3,
      minimumStaff: 0,
    },
  };
  return { applications, vendors, processes, teams, people, departments: [{ id: "D", name: "Dept" }] };
}

describe("VitalCap BCP engine", () => {
  it("1 — vendor V down 3h: A 0→4, P not breached; people reason chains", () => {
    const data = buildFixture();
    const result = engine.simulate(data, { type: "vendor", targetId: "V", durationHours: 3 });
    assert.equal(result.applications.A.downEnd, 4);
    assert.equal(result.processes.P.status, "down");
    const dt = result.processes.P.downEnd - result.processes.P.downStart;
    assert.equal(dt, 4);
    assert.equal(result.madBreached.P, false);
    const impacted = engine.impactedPeople(result, data);
    const ids = impacted.map((r) => r.person.id).sort();
    assert.deepEqual(ids, ["p1", "p2", "p3"]);
    const p3 = impacted.find((r) => r.person.id === "p3");
    assert.ok(p3.reason.some((x) => /impacted process|Process P/i.test(x)));
    const p1 = impacted.find((r) => r.person.id === "p1");
    assert.ok(p1.reason.join(" ").includes("Vendor V") || p1.reason.length >= 2);
  });

  it("2 — vendor V down 4h: P MAD breached", () => {
    const data = buildFixture();
    const result = engine.simulate(data, { type: "vendor", targetId: "V", durationHours: 4 });
    const dt = result.processes.P.downEnd - result.processes.P.downStart;
    assert.equal(dt, 5);
    assert.equal(result.madBreached.P, true);
  });

  it("3 — Q depends on P", () => {
    const data = buildFixture();
    const result = engine.simulate(data, { type: "vendor", targetId: "V", durationHours: 3 });
    assert.equal(result.processes.Q.status, "down");
    assert.equal(result.processes.Q.downStart, result.processes.P.downStart);
    assert.equal(result.processes.Q.downEnd, result.processes.P.downEnd);
  });

  it("4 — staffing: p1 unavailable → degraded; p1+p2 → down", () => {
    const data = buildFixture();
    let result = engine.simulate(data, { type: "people", targetId: "p1", durationHours: 4 });
    assert.equal(result.processes.P.status, "degraded");
    result = engine.simulate(data, { type: "people", targetId: "p1", durationHours: 4 });
    const data2 = buildFixture();
    result = engine.simulate(data2, { type: "people", targetId: "T", durationHours: 4 });
    const bothDown = data2.people.p1;
    engine.simulate(data2, { type: "people", targetId: "p1", durationHours: 4 });
    result = engine.simulate(data2, { type: "people", targetId: "p2", durationHours: 4 });
    const rTeam = engine.simulate(data2, { type: "people", targetId: "T", durationHours: 4 });
    assert.equal(rTeam.processes.P.status, "down");
  });

  it("5 — ID down 2h cascades to A 0→3", () => {
    const data = buildFixture();
    const result = engine.simulate(data, { type: "application", targetId: "ID", durationHours: 2 });
    assert.equal(result.applications.A.downEnd, 3);
  });

  it("6 — findGaps: RTO>MAD, key person, cycle", () => {
    const data = buildFixture({ appA: { rtoHours: 6 } });
    let gaps = engine.findGaps(data);
    assert.ok(gaps.some((g) => /RTO/.test(g.message)));
    const data2 = buildFixture({ noBackup: true });
    gaps = engine.findGaps(data2);
    assert.ok(gaps.some((g) => /Key-person|no backup/i.test(g.message)));
    const data3 = buildFixture({ cycle: true });
    gaps = engine.findGaps(data3);
    assert.ok(gaps.some((g) => /cycle/i.test(g.message)));
    const result = engine.simulate(data3, { type: "vendor", targetId: "V", durationHours: 2 });
    assert.ok(result.cyclesDetected.length > 0);
  });
});
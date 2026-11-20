/* Source: Workforce System (HR) */
(function (root, factory) {
  const data = factory();
  root.VC_WORKFORCE = data;
  if (typeof module !== "undefined" && module.exports) module.exports = data;
})(typeof window !== "undefined" ? window : globalThis, function workforce() {
  const teams = [
    { id: "team-wires", name: "Wires Team", departmentId: "dept-payments", lead: "person-maya-cohen", location: "Tel Aviv HQ" },
    { id: "team-card-ops", name: "Card Ops Team", departmentId: "dept-retail", lead: "person-dan-levy", location: "Haifa Operations Center" },
    { id: "team-liquidity", name: "Liquidity Desk", departmentId: "dept-treasury", lead: "person-eli-rosen", location: "Tel Aviv HQ" },
    { id: "team-sanctions", name: "Sanctions Screening Team", departmentId: "dept-compliance", lead: "person-sara-nguyen", location: "Tel Aviv HQ" },
    { id: "team-contact", name: "Contact Center Team", departmentId: "dept-contact", lead: "person-james-okafor", location: "Remote" },
    { id: "team-it-desk", name: "IT Service Desk", departmentId: "dept-payments", lead: "person-avital-sharon", location: "Tel Aviv HQ" },
    { id: "team-infra", name: "Infrastructure Ops", departmentId: "dept-payments", lead: "person-yuki-tanaka", location: "Haifa Operations Center" },
  ];
  const people = [
    { id: "person-maya-cohen", name: "Maya Cohen", position: "SWIFT Release Officer", teamId: "team-wires", location: "Tel Aviv HQ", criticalRole: true, criticalAccess: ["SWIFT release authority"], backupPersonId: "person-omri-weiss", usesApplicationIds: ["app-swift-gateway", "app-payment-hub"] },
    { id: "person-omri-weiss", name: "Omri Weiss", position: "Wire Operations Analyst", teamId: "team-wires", location: "Tel Aviv HQ", criticalRole: false, criticalAccess: [], backupPersonId: null, usesApplicationIds: ["app-swift-gateway", "app-payment-hub"] },
    { id: "person-lina-haddad", name: "Lina Haddad", position: "Head of Payments Operations", teamId: "team-wires", location: "Tel Aviv HQ", criticalRole: true, criticalAccess: ["Payment Hub admin"], backupPersonId: null, usesApplicationIds: ["app-payment-hub"] },
    { id: "person-dan-levy", name: "Dan Levy", position: "Card Operations Manager", teamId: "team-card-ops", location: "Haifa Operations Center", criticalRole: true, criticalAccess: [], backupPersonId: "person-priya-sharma", usesApplicationIds: ["app-card-mgmt"] },
    { id: "person-priya-sharma", name: "Priya Sharma", position: "Disputes Analyst", teamId: "team-card-ops", location: "Haifa Operations Center", criticalRole: false, criticalAccess: [], backupPersonId: null, usesApplicationIds: ["app-card-mgmt"] },
    { id: "person-eli-rosen", name: "Eli Rosen", position: "Treasury Dealer", teamId: "team-liquidity", location: "Tel Aviv HQ", criticalRole: true, criticalAccess: ["Treasury signatory"], backupPersonId: null, usesApplicationIds: ["app-treasury"] },
    { id: "person-sara-nguyen", name: "Sara Nguyen", position: "Sanctions Analyst", teamId: "team-sanctions", location: "Tel Aviv HQ", criticalRole: true, criticalAccess: [], backupPersonId: "person-tom-berg", usesApplicationIds: ["app-sanctions"] },
    { id: "person-tom-berg", name: "Tom Berg", position: "AML Investigator", teamId: "team-sanctions", location: "Remote", criticalRole: false, criticalAccess: [], backupPersonId: null, usesApplicationIds: ["app-aml"] },
    { id: "person-james-okafor", name: "James Okafor", position: "Contact Center Supervisor", teamId: "team-contact", location: "Remote", criticalRole: true, criticalAccess: [], backupPersonId: "person-amira-hassan", usesApplicationIds: ["app-contact-center", "app-crm"] },
    { id: "person-amira-hassan", name: "Amira Hassan", position: "Customer Service Representative", teamId: "team-contact", location: "Remote", criticalRole: false, criticalAccess: [], backupPersonId: null, usesApplicationIds: ["app-contact-center"] },
    { id: "person-avital-sharon", name: "Avital Sharon", position: "IT Service Desk Lead", teamId: "team-it-desk", location: "Tel Aviv HQ", criticalRole: false, criticalAccess: [], backupPersonId: null, usesApplicationIds: ["app-identity"] },
    { id: "person-yuki-tanaka", name: "Yuki Tanaka", position: "Infrastructure Engineer", teamId: "team-infra", location: "Haifa Operations Center", criticalRole: false, criticalAccess: [], backupPersonId: null, usesApplicationIds: ["app-core-network", "app-cloud-region-a"] },
  ];
  const processTeamMap = {
    "proc-swift-wires": ["team-wires"],
    "proc-domestic-rt": ["team-wires"],
    "proc-card-auth": ["team-card-ops"],
    "proc-intraday-liq": ["team-liquidity"],
    "proc-sanctions": ["team-sanctions"],
    "proc-inbound-calls": ["team-contact"],
  };
  const byTeam = Object.fromEntries(teams.map((t) => [t.id, t]));
  const byPerson = Object.fromEntries(people.map((p) => [p.id, p]));
  return { teams, people, byTeam, byPerson, processTeamMap };
});
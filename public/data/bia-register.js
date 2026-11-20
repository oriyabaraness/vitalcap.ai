/** Source: Business Impact Analysis (BIA) register */
(function (root, factory) {
  const data = factory();
  root.VC_BIA = data;
  if (typeof module !== "undefined" && module.exports) module.exports = data;
})(typeof window !== "undefined" ? window : globalThis, function biaRegister() {
  const bankName = "VitalCap Demo Bank";
  const departments = [
    { id: "dept-payments", name: "Payments Operations" },
    { id: "dept-retail", name: "Retail Banking" },
    { id: "dept-treasury", name: "Treasury & Liquidity" },
    { id: "dept-lending", name: "Lending & Credit" },
    { id: "dept-compliance", name: "Compliance & Financial Crime" },
    { id: "dept-contact", name: "Customer Contact Center" },
  ];
  const processes = [
    { id: "proc-swift-wires", departmentId: "dept-payments", name: "Outgoing wire transfers (SWIFT)", madHours: 4, criticality: 5, applicationIds: ["app-payment-hub", "app-swift-gateway"], vendorIds: ["vendor-swift"], teamIds: ["team-wires"], upstreamProcessIds: ["proc-sanctions"], manualWorkaroundHours: null, minimumStaff: 3 },
    { id: "proc-domestic-rt", departmentId: "dept-payments", name: "Real-time domestic payments", madHours: 2, criticality: 5, applicationIds: ["app-instant-payments", "app-payment-hub"], vendorIds: ["vendor-domestic-clearing"], teamIds: ["team-wires"], upstreamProcessIds: ["proc-sanctions"], manualWorkaroundHours: null, minimumStaff: 2 },
    { id: "proc-account-serv", departmentId: "dept-retail", name: "Customer account servicing", madHours: 8, criticality: 4, applicationIds: ["app-core-banking", "app-crm"], vendorIds: [], upstreamProcessIds: [], manualWorkaroundHours: 4, minimumStaff: 3 },
    { id: "proc-card-auth", departmentId: "dept-retail", name: "Card authorization & disputes", madHours: 2, criticality: 5, applicationIds: ["app-card-mgmt"], vendorIds: ["vendor-card"], teamIds: ["team-card-ops"], upstreamProcessIds: [], manualWorkaroundHours: null, minimumStaff: 2 },
    { id: "proc-intraday-liq", departmentId: "dept-treasury", name: "Intraday liquidity monitoring", madHours: 2, criticality: 5, applicationIds: ["app-treasury"], vendorIds: ["vendor-market-data"], teamIds: ["team-liquidity"], upstreamProcessIds: ["proc-swift-wires"], manualWorkaroundHours: 1, minimumStaff: 2 },
    { id: "proc-eod-cash", departmentId: "dept-treasury", name: "End-of-day cash positioning", madHours: 6, criticality: 4, applicationIds: ["app-treasury", "app-core-banking"], vendorIds: [], upstreamProcessIds: [], manualWorkaroundHours: null, minimumStaff: 2 },
    { id: "proc-loan-orig", departmentId: "dept-lending", name: "Loan origination", madHours: 24, criticality: 3, applicationIds: ["app-loan-orig", "app-core-banking"], vendorIds: ["vendor-credit-bureau"], upstreamProcessIds: [], manualWorkaroundHours: 8, minimumStaff: 2 },
    { id: "proc-collateral", departmentId: "dept-lending", name: "Collateral management", madHours: 48, criticality: 3, applicationIds: ["app-collateral"], vendorIds: [], upstreamProcessIds: [], manualWorkaroundHours: 24, minimumStaff: 1 },
    { id: "proc-sanctions", departmentId: "dept-compliance", name: "Sanctions screening of payments", madHours: 2, criticality: 5, applicationIds: ["app-sanctions"], vendorIds: ["vendor-watchlist"], teamIds: ["team-sanctions"], upstreamProcessIds: [], manualWorkaroundHours: null, minimumStaff: 2 },
    { id: "proc-aml", departmentId: "dept-compliance", name: "AML transaction monitoring", madHours: 24, criticality: 4, applicationIds: ["app-aml"], vendorIds: [], upstreamProcessIds: [], manualWorkaroundHours: 12, minimumStaff: 2 },
    { id: "proc-inbound-calls", departmentId: "dept-contact", name: "Inbound customer calls", madHours: 2, criticality: 4, applicationIds: ["app-contact-center", "app-crm"], vendorIds: ["vendor-contact-saas"], teamIds: ["team-contact"], upstreamProcessIds: [], manualWorkaroundHours: null, minimumStaff: 4 },
  ];
  return {
    bankName,
    departments,
    processes,
    defaultSelection: {
      departmentId: "dept-payments",
      processId: "proc-swift-wires",
      applicationId: "app-swift-gateway",
    },
  };
});
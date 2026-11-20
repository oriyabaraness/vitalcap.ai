/* Source: Application Repository (Technology / CMDB) */
(function (root, factory) {
  const data = factory();
  root.VC_APP_REPO = data;
  if (typeof module !== "undefined" && module.exports) module.exports = data;
})(typeof window !== "undefined" ? window : globalThis, function appRepository() {
  const applications = [
    { id: "app-identity", name: "Identity & Access (SSO)", rtoHours: 1, rpoHours: 0, tier: "Infrastructure", hosting: "Primary data center", dependsOnAppIds: [], vendorIds: [] },
    { id: "app-core-network", name: "Core network", rtoHours: 1, rpoHours: 0, tier: "Infrastructure", hosting: "Primary data center", dependsOnAppIds: [], vendorIds: [] },
    { id: "app-core-banking", name: "Core Banking System", rtoHours: 4, rpoHours: 0, tier: "1", hosting: "Primary data center", dependsOnAppIds: ["app-identity", "app-core-network"], vendorIds: [] },
    { id: "app-payment-hub", name: "Payment Hub", rtoHours: 2, rpoHours: 0, tier: "1", hosting: "Primary data center", dependsOnAppIds: ["app-identity", "app-core-banking"], vendorIds: [] },
    { id: "app-swift-gateway", name: "SWIFT Gateway", rtoHours: 2, rpoHours: 0, tier: "1", hosting: "Primary data center", dependsOnAppIds: ["app-identity", "app-core-network"], vendorIds: ["vendor-swift"] },
    { id: "app-instant-payments", name: "Instant Payments Engine", rtoHours: 1, rpoHours: 0, tier: "1", hosting: "Cloud region A", dependsOnAppIds: ["app-identity", "app-payment-hub"], vendorIds: ["vendor-cloud"] },
    { id: "app-card-mgmt", name: "Card Management System", rtoHours: 1, rpoHours: 0, tier: "1", hosting: "Cloud region A", dependsOnAppIds: ["app-identity"], vendorIds: ["vendor-card", "vendor-cloud"] },
    { id: "app-treasury", name: "Treasury Management System", rtoHours: 2, rpoHours: 1, tier: "1", hosting: "Cloud region A", dependsOnAppIds: ["app-identity"], vendorIds: ["vendor-cloud"] },
    { id: "app-sanctions", name: "Sanctions Screening Engine", rtoHours: 1, rpoHours: 0, tier: "1", hosting: "Primary data center", dependsOnAppIds: ["app-identity"], vendorIds: ["vendor-watchlist"] },
    { id: "app-aml", name: "AML Monitoring Platform", rtoHours: 12, rpoHours: 4, tier: "2", hosting: "Cloud region A", dependsOnAppIds: ["app-identity", "app-core-banking"], vendorIds: ["vendor-cloud"] },
    { id: "app-crm", name: "CRM", rtoHours: 8, rpoHours: 4, tier: "2", hosting: "Cloud region A", dependsOnAppIds: ["app-identity"], vendorIds: ["vendor-cloud"] },
    { id: "app-loan-orig", name: "Loan Origination System", rtoHours: 12, rpoHours: 4, tier: "2", hosting: "Cloud region A", dependsOnAppIds: ["app-identity", "app-core-banking"], vendorIds: ["vendor-cloud"] },
    { id: "app-collateral", name: "Collateral Management System", rtoHours: 24, rpoHours: 8, tier: "3", hosting: "Primary data center", dependsOnAppIds: ["app-identity"], vendorIds: [] },
    { id: "app-contact-center", name: "Contact Center Platform", rtoHours: 2, rpoHours: 1, tier: "1", hosting: "Vendor SaaS", dependsOnAppIds: ["app-identity"], vendorIds: ["vendor-contact-saas"] },
    { id: "app-cloud-region-a", name: "Cloud region A", rtoHours: 4, rpoHours: 0, tier: "Infrastructure", hosting: "Cloud provider", dependsOnAppIds: [], vendorIds: ["vendor-cloud"] },
  ];
  const byId = Object.fromEntries(applications.map((a) => [a.id, a]));
  return { applications, byId };
});
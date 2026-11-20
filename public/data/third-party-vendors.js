/* Source: Third-Party Risk Management */
(function (root, factory) {
  const data = factory();
  root.VC_VENDORS = data;
  if (typeof module !== "undefined" && module.exports) module.exports = data;
})(typeof window !== "undefined" ? window : globalThis, function vendors() {
  const vendors = [
    { id: "vendor-swift", name: "SWIFT network", service: "Financial messaging", tier: "Critical", contractRtoHours: 2, exitPlan: false, concentrationNote: "Market infrastructure", lastAssessed: "2025-09" },
    { id: "vendor-domestic-clearing", name: "Domestic clearing house", service: "Domestic payments", tier: "Critical", contractRtoHours: 2, exitPlan: true, concentrationNote: "", lastAssessed: "2025-06" },
    { id: "vendor-card", name: "Card processor", service: "Card authorization", tier: "Critical", contractRtoHours: 2, exitPlan: true, concentrationNote: "", lastAssessed: "2025-08" },
    { id: "vendor-cloud", name: "Cloud provider", service: "Cloud hosting", tier: "Critical", contractRtoHours: 4, exitPlan: false, concentrationNote: "Hosts 7 applications", lastAssessed: "2025-10" },
    { id: "vendor-market-data", name: "Market data provider", service: "Market data feeds", tier: "Important", contractRtoHours: 4, exitPlan: true, concentrationNote: "", lastAssessed: "2025-05" },
    { id: "vendor-watchlist", name: "Watch-list data provider", service: "Sanctions lists", tier: "Critical", contractRtoHours: 2, exitPlan: true, concentrationNote: "", lastAssessed: "2025-07" },
    { id: "vendor-credit-bureau", name: "Credit bureau", service: "Credit checks", tier: "Important", contractRtoHours: 24, exitPlan: true, concentrationNote: "", lastAssessed: "2025-04" },
    { id: "vendor-contact-saas", name: "Contact-center SaaS provider", service: "Contact center", tier: "Important", contractRtoHours: 8, exitPlan: false, concentrationNote: "", lastAssessed: "2025-03" },
  ];
  const byId = Object.fromEntries(vendors.map((v) => [v.id, v]));
  return { vendors, byId };
});
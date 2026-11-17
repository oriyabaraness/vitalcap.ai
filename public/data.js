window.VITALCAP_DATA = {
  minServiceLevel: "Minimum service level: about 10% of the workforce is critical",
  // Illustrative figures. Rule: RTO (app recovery time) must be ≤ MAD (how long the process can be down).
  businessLines: [
    {
      dept: "SALES",
      app: "Salesforce Einstein",
      blurb:
        "AI features in Salesforce CRM for lead scoring, forecasting and customer insights, keeping sales running during disruptions.",
      rto: 2,
      rpo: 1,
      mad: 4,
      critical: "1 Analyst (language proficiency accounted for)",
      positions: "2 Analysts, 4 Associates, 1 Lead",
    },
    {
      dept: "FINANCE",
      app: "BlackLine Transaction Matching",
      blurb:
        "Automates reconciliations, transaction matching and journal entries, enabling rapid recovery and data integrity in financial processes.",
      rto: 2,
      rpo: 1,
      mad: 4,
      critical: "1 Manager/controller, 1 treasury staff (access to virtual safe)",
      positions:
        "2–4 analysts, 2–4 accountants/associates, 1 manager/controller, and 1–2 FP&A or treasury staff.",
    },
    {
      dept: "MARKETING",
      app: "HubSpot Marketing Hub",
      blurb:
        "AI-powered automation for email campaigns, content and customer segmentation, maintaining marketing activity during disruptions.",
      rto: 24,
      rpo: 24,
      mad: 48,
      critical: "1 Analyst, 1 associate, and 1 manager",
      positions: "3 analysts, 5 associates, and 2 other positions such as a manager and a designer.",
    },
    {
      dept: "HUMAN RESOURCES",
      app: "Workday HCM",
      blurb:
        "Employee data, payroll and recruitment workflows, keeping HR functions operational during crises.",
      rto: 24,
      rpo: 4,
      mad: 72,
      critical: "1 Payroll and 1 HR",
      positions:
        "1–2 HR analysts, 2–4 HR associates or coordinators, an HR manager or director (1), recruitment specialists (1), and HR support staff (1–2).",
    },
    {
      dept: "COMMUNICATIONS",
      app: "Everbridge Critical Event Management",
      blurb:
        "Crisis communication, automated alerting and stakeholder notifications during emergencies.",
      rto: 2,
      rpo: 1,
      mad: 4,
      critical: "1 Media relations specialist",
      positions:
        "2 analysts, 2–4 associates or coordinators, a communications manager or director (1), media relations specialists (1), and support staff (1–2).",
    },
    {
      dept: "OPERATIONS",
      app: "IBM Maximo",
      blurb:
        "Asset management for predictive maintenance and supply-chain optimization, reducing downtime and ensuring continuity.",
      rto: 8,
      rpo: 4,
      mad: 24,
      critical: "1 Analyst, 1 associate, 1 specialist",
      positions:
        "2–4 analysts, 3–6 associates or coordinators, operations managers (1–2), process improvement specialists (1), and support staff (1–2).",
    },
  ],
  recoveryPlan: [
    {
      horizon: 2,
      label: "0–2 h",
      actions: ["Back up sales data now", "Send AI-drafted communications to clients"],
      automated: true,
    },
    {
      horizon: 4,
      label: "2–4 h",
      actions: [
        "Fail over to the backup or alternative sales platform",
        "Activate pre-approved short-term suppliers for core products and services",
      ],
    },
    {
      horizon: 24,
      label: "24 h",
      actions: [
        "Stand up interim customer support with dedicated staff",
        "Apply lessons from the last test cycle",
      ],
    },
    {
      horizon: 48,
      label: "48 h",
      actions: [
        "Run a full test cycle and evaluate the results",
        "Adjust strategies based on the test outcomes",
      ],
    },
  ],
  threatSteps: [
    {
      title: "1 · Detect",
      text: "VitalCap’s threat radar scans open-source data and picks up a strong earthquake near Shibuya, Tokyo.",
    },
    {
      title: "2 · Connect",
      text: "Supplier data shows that NimbusPay, the Sales team’s payments vendor, is headquartered in Shibuya.",
    },
    {
      title: "3 · Assess",
      text: "NimbusPay’s recovery time (RTO) is 6 hours, but Sales can only be down for 4 hours (MAD). That’s a 2-hour gap.",
    },
    {
      title: "4 · Act",
      text: "VitalCap alerts the team and launches a ready playbook: back up now, notify clients, prepare failover.",
    },
  ],
};

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
  demoDefaultId: "payment",
  demoDisclaimer:
    "Try adjusting the sliders. This is a simplified illustration of one recovery-objective consistency check, not a complete BIA.",
  demoProcesses: [
    {
      id: "payment",
      process: "Payment Processing",
      app: "Payment Gateway",
      rto: 10,
      rpo: 1,
      mad: 8,
      impacts: { rep: 6, legal: 7, reg: 8, internal: 5 },
      recoveryWhenGap: [
        {
          label: "0–2 h",
          actions: [
            "Switch to manual payment capture queue",
            "Notify card networks and key merchants of degraded processing",
          ],
          automated: true,
        },
        {
          label: "2–4 h",
          actions: [
            "Fail over to secondary gateway region (target RTO ≤ MAD)",
            "Escalate regulatory incident per PSD2 / DORA playbooks",
          ],
        },
        {
          label: "4–8 h",
          actions: [
            "Stand up alternative acquirer routing for critical merchants",
            "Daily reconciliation against gateway settlement files",
          ],
        },
        {
          label: "8–24 h",
          actions: [
            "Renegotiate vendor RTO or add warm standby gateway",
            "Board-level review of payment impact tolerance",
          ],
        },
      ],
      recoveryWhenOk: [
        {
          label: "0–2 h",
          actions: ["Monitor gateway health dashboards", "Confirm runbook owner on call"],
          automated: true,
        },
        {
          label: "2–8 h",
          actions: ["Routine settlement checks", "No customer comms required"],
        },
        {
          label: "8–24 h",
          actions: ["Include gateway in next tabletop exercise"],
        },
      ],
    },
    {
      id: "treasury",
      process: "Treasury & settlements",
      app: "BlackLine Transaction Matching",
      rto: 2,
      rpo: 1,
      mad: 4,
      impacts: { rep: 4, legal: 6, reg: 7, internal: 4 },
      recoveryWhenGap: [
        {
          label: "0–2 h",
          actions: ["Manual reconciliation spreadsheet", "Alert finance controller"],
          automated: true,
        },
        {
          label: "2–4 h",
          actions: ["Restore BlackLine or shift to backup matching tool"],
        },
      ],
      recoveryWhenOk: [
        { label: "0–4 h", actions: ["Standard monitoring", "Patch window as scheduled"] },
      ],
    },
    {
      id: "sales",
      process: "Customer order capture",
      app: "Salesforce Einstein",
      rto: 2,
      rpo: 1,
      mad: 4,
      impacts: { rep: 5, legal: 3, reg: 4, internal: 4 },
      recoveryWhenGap: [
        {
          label: "0–2 h",
          actions: ["Backup CRM export", "AI-drafted client comms"],
          automated: true,
        },
        { label: "2–4 h", actions: ["Fail over to alternative sales platform"] },
      ],
      recoveryWhenOk: [
        { label: "0–4 h", actions: ["Continue selling on primary CRM", "Routine pipeline sync"] },
      ],
    },
    {
      id: "hr-payroll",
      process: "Payroll disbursement",
      app: "Workday HCM",
      rto: 24,
      rpo: 4,
      mad: 72,
      impacts: { rep: 5, legal: 8, reg: 6, internal: 7 },
      recoveryWhenGap: [
        {
          label: "0–4 h",
          actions: ["Identify missed pay run cutoff", "Legal review of labor obligations"],
          automated: true,
        },
        { label: "4–24 h", actions: ["Manual payroll file to bank", "Employee notice templates"] },
      ],
      recoveryWhenOk: [
        { label: "0–24 h", actions: ["Payroll proceeds on schedule", "HR helpdesk staffed"] },
      ],
    },
  ],
  incidentLab: {
    disclaimer:
      "Verified blocks cite U.S. government and FAA public statements. Meridian Freight Co. and all shipment outcomes below are a fictional planning exercise — not confirmed impacts on any real company.",
    events: [
      {
        id: "faa-2026-11-13",
        shortTitle: "FAA nationwide ground stop",
        date: "November 13, 2026",
        headline:
          "On November 13, 2026, the FAA ordered a nationwide ground stop after communications and radar feeds became unstable.",
        verifiedFacts: [
          {
            label: "Ground stop window",
            text: "The FAA states the stop was issued at about 3:30 p.m. Eastern Time and air traffic resumed at 8:15 p.m. the same day — roughly 4 hours 45 minutes.",
          },
          {
            label: "Cause (preliminary)",
            text: "FAA describes legacy equipment instability after excessive connection attempts on the FAA Telecommunications Infrastructure (FTI) network, disrupting aircraft communications and radar feeds.",
          },
          {
            label: "Scale (public reporting)",
            text: "FAA reports about 3,500 aircraft safely landed during the stop. The same Q&A cites roughly 12,462 U.S. flight cancellations on November 13, noting not every cancellation was attributable only to the ground stop.",
          },
          {
            label: "After the stop",
            text: "Official updates warn that lifting the stop did not instantly restore normal airline schedules — recovery continued over subsequent days.",
          },
        ],
        sources: [
          {
            label: "FAA — Nationwide ground stop Q&A",
            url: "https://www.faa.gov/newsroom/nationwide-ground-stop-questions-and-answers",
          },
          {
            label: "FAA — Statement (Nov 13, 2026)",
            url: "https://www.faa.gov/newsroom/faa-statement-nationwide-ground-stop",
          },
          {
            label: "U.S. DOT — Restoration briefing",
            url: "https://www.transportation.gov/briefing-room/icymi-us-transportation-secretary-sean-p-duffy-provides-update-restoration-airspace",
          },
        ],
        defaultStopHours: 4.75,
        defaultRecoveryLagHours: 24,
        recoveryLagHint:
          "Optional lag after the stop lifts — use your own planning assumption for backlog and rescheduled flights (not a government-published figure).",
      },
    ],
    hypothetical: {
      orgName: "Meridian Freight Co.",
      orgNote: "Illustrative mid-market logistics operator (fictional).",
      airShareDefault: 38,
      dependencies: [
        {
          id: "belly",
          name: "Commercial belly cargo",
          detail: "Scheduled passenger flights carry high-priority parcels.",
          bcpFunction: "Map · transportation dependency",
        },
        {
          id: "integrator",
          name: "Integrator air hubs",
          detail: "Nightly sorts at MEM / IND / SDF-style hubs.",
          bcpFunction: "Map · SPoF site",
        },
        {
          id: "charter",
          name: "On-demand air charter",
          detail: "Backup lane for medical and AOG parts.",
          bcpFunction: "Map · alternate carrier",
        },
        {
          id: "ground",
          name: "Line-haul trucking",
          detail: "Primary mode for non-time-critical freight.",
          bcpFunction: "Map · mode shift option",
        },
      ],
      shipments: [
        {
          id: "med",
          lane: "Medical cold chain",
          volumeLabel: "12 pallets / night",
          madHours: 8,
          dependsOnAir: true,
          note: "Cells and reagents with temperature band.",
        },
        {
          id: "ecom",
          lane: "E-commerce next-day",
          volumeLabel: "~400 cartons",
          madHours: 18,
          dependsOnAir: true,
          note: "SLA tied to air sort at regional hub.",
        },
        {
          id: "jit",
          lane: "Factory JIT components",
          volumeLabel: "3 skids",
          madHours: 36,
          dependsOnAir: true,
          note: "Could defer to ground if line idle.",
        },
        {
          id: "bulk",
          lane: "Bulk replenishment",
          volumeLabel: "Truckload",
          madHours: 72,
          dependsOnAir: false,
          note: "Already on trailer network.",
        },
      ],
      playbooks: [
        {
          id: "shift-ground",
          title: "Shift to line-haul + regional cross-dock",
          when: "gap",
          detail: "Hold express at origin; release on first available ground departures.",
        },
        {
          id: "charter",
          title: "Activate charter broker",
          when: "med",
          detail: "Pre-approved brokers for lanes under 8h MAD.",
        },
        {
          id: "defer",
          title: "Defer non-critical WMS releases",
          when: "bulk",
          detail: "Pause low-priority picks; protect cold chain and SLA tiers.",
        },
        {
          id: "comms",
          title: "Customer comms template",
          when: "always",
          detail: "Notify shippers with revised ETA and regulatory holds if any.",
        },
      ],
    },
  },
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

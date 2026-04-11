import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { SSP_WEBSITE_CSS, SSP_WEBSITE_HTML } from "./sspWebsiteTemplate";
import "./styles.css";

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  associate: "Associate",
};

const PERMISSION_PRESETS = {
  owner: [
    "View Command",
    "Manage Calendar",
    "Generate Schedules",
    "Manage Associates",
    "Manage Invoices",
    "Sync Paychex",
    "Run Outreach",
    "Publish LinkedIn",
    "Manage Users",
    "Approve AI Actions",
  ],
  admin: [
    "View Command",
    "Manage Calendar",
    "Generate Schedules",
    "Manage Associates",
    "Manage Invoices",
    "Sync Paychex",
    "Run Outreach",
    "Publish LinkedIn",
    "Manage Users",
    "Approve AI Actions",
  ],
  manager: [
    "View Command",
    "Manage Calendar",
    "Generate Schedules",
    "Manage Associates",
    "Manage Invoices",
    "Run Outreach",
    "Publish LinkedIn",
    "Approve AI Actions",
  ],
  associate: [
    "View Own Assignments",
    "Edit Own Profile",
    "Submit Availability",
    "Ask Support",
  ],
};

const INTERNAL_NAV = [
  { id: "command", label: "Command", eyebrow: "Executive", roles: ["owner", "admin", "manager"] },
  { id: "calendar", label: "Calendar", eyebrow: "Events", roles: ["owner", "admin", "manager"] },
  { id: "scheduling", label: "Scheduling", eyebrow: "Coverage", roles: ["owner", "admin", "manager"] },
  { id: "associates", label: "Associates", eyebrow: "Workforce", roles: ["owner", "admin", "manager"] },
  { id: "payroll", label: "Payroll", eyebrow: "Paychex", roles: ["owner", "admin"] },
  { id: "invoices", label: "Invoices", eyebrow: "Gmail", roles: ["owner", "admin", "manager"] },
  { id: "crm", label: "CRM", eyebrow: "Outreach", roles: ["owner", "admin", "manager"] },
  { id: "linkedin", label: "LinkedIn", eyebrow: "Brand", roles: ["owner", "admin", "manager"] },
  { id: "users", label: "Users", eyebrow: "Access", roles: ["owner", "admin"] },
  { id: "copilot", label: "Copilot", eyebrow: "AI", roles: ["owner", "admin", "manager"] },
];

const ASSOCIATE_NAV = [
  { id: "assignments", label: "Assignments", eyebrow: "My Work" },
  { id: "profile", label: "Profile", eyebrow: "Identity" },
  { id: "availability", label: "Availability", eyebrow: "Coverage" },
  { id: "support", label: "Support", eyebrow: "AI Help" },
];

const USERS_SEED = [
  {
    id: "U-001",
    name: "Dijon Lowery",
    email: "owner@specialservicesprotection.com",
    username: "DLowery5",
    password: "Demarcus0614",
    role: "owner",
    status: "Active",
    scope: "All SSP",
    lastLogin: "Today 08:12",
  },
  {
    id: "U-014",
    name: "Operations Admin",
    email: "admin@specialservicesprotection.com",
    role: "admin",
    status: "Active",
    scope: "All Operations",
    lastLogin: "Today 07:42",
  },
  {
    id: "U-022",
    name: "North Atlanta Manager",
    email: "manager@specialservicesprotection.com",
    role: "manager",
    status: "Active",
    scope: "Atlanta Events",
    lastLogin: "Yesterday 18:44",
  },
  {
    id: "U-041",
    name: "Marcus Reid",
    email: "marcus@example.com",
    role: "associate",
    status: "Active",
    scope: "Self",
    associateId: "A-104",
    lastLogin: "Apr 9",
  },
  {
    id: "U-044",
    name: "Tasha Williams",
    email: "tasha@example.com",
    role: "associate",
    status: "Invited",
    scope: "Self",
    associateId: "A-117",
    lastLogin: "Pending",
  },
];

const ASSOCIATES_SEED = [
  {
    id: "A-104",
    userId: "U-041",
    name: "Marcus Reid",
    role: "Senior Officer",
    city: "Atlanta",
    phone: "(404) 555-0101",
    email: "marcus@example.com",
    status: "Ready",
    armed: true,
    availability: ["Mon 06:00-14:00", "Wed 18:00-02:00", "Sat 12:00-22:00"],
    certs: ["Armed", "Executive Protection", "Crowd Control"],
    preferredRoles: ["Executive Protection", "Lead Officer"],
    radius: 30,
    hours: 32,
    score: 96,
    notes: "Prefers executive detail and premium event posts.",
  },
  {
    id: "A-117",
    userId: "U-044",
    name: "Tasha Williams",
    role: "Officer",
    city: "Atlanta",
    phone: "(404) 555-0102",
    email: "tasha@example.com",
    status: "Ready",
    armed: false,
    availability: ["Tue 08:00-16:00", "Thu 08:00-16:00", "Fri 16:00-00:00"],
    certs: ["Unarmed", "Event Security", "Patrol"],
    preferredRoles: ["Crowd Control", "Event Security"],
    radius: 18,
    hours: 24,
    score: 88,
    notes: "Strong on guest-facing event coverage.",
  },
  {
    id: "A-122",
    userId: null,
    name: "Devon Clark",
    role: "Officer",
    city: "Marietta",
    phone: "(404) 555-0103",
    email: "devon@example.com",
    status: "Needs Cert",
    armed: true,
    availability: ["Fri 18:00-02:00", "Sat 18:00-02:00", "Sun 10:00-18:00"],
    certs: ["Armed"],
    preferredRoles: ["Patrol", "Overnight"],
    radius: 22,
    hours: 18,
    score: 78,
    notes: "Crowd-control renewal pending.",
  },
  {
    id: "A-130",
    userId: null,
    name: "Janet Moore",
    role: "Supervisor",
    city: "Atlanta",
    phone: "(404) 555-0104",
    email: "janet@example.com",
    status: "Ready",
    armed: true,
    availability: ["Mon 14:00-22:00", "Wed 14:00-22:00", "Sat 08:00-18:00"],
    certs: ["Armed", "Supervisor", "Crowd Control"],
    preferredRoles: ["Supervisor", "Crowd Control"],
    radius: 35,
    hours: 36,
    score: 94,
    notes: "Best fit for high-traffic operations oversight.",
  },
  {
    id: "A-141",
    userId: null,
    name: "Ray Thompson",
    role: "Officer",
    city: "Decatur",
    phone: "(404) 555-0105",
    email: "ray@example.com",
    status: "Profile Pending",
    armed: false,
    availability: ["Sun 12:00-20:00"],
    certs: ["Unarmed"],
    preferredRoles: ["Patrol"],
    radius: 15,
    hours: 8,
    score: 63,
    notes: "Needs full onboarding and weekday availability.",
  },
];

const EVENTS_SEED = [
  {
    id: "EV-2101",
    name: "Atlanta United Home Match",
    type: "Sports Event",
    client: "Mercedes-Benz Event Ops",
    city: "Atlanta",
    date: "Apr 13",
    time: "15:00",
    startsAt: "2026-04-13T15:00:00-05:00",
    endsAt: "2026-04-13T23:00:00-05:00",
    required: 12,
    assigned: 9,
    status: "At Risk",
    roles: ["Supervisor", "Crowd Control", "Armed"],
  },
  {
    id: "EV-2099",
    name: "Lenox Square Executive Detail",
    type: "Executive Protection",
    client: "Lenox Square",
    city: "Atlanta",
    date: "Apr 11",
    time: "18:00",
    startsAt: "2026-04-11T18:00:00-05:00",
    endsAt: "2026-04-11T23:00:00-05:00",
    required: 2,
    assigned: 2,
    status: "Covered",
    roles: ["Executive Protection", "Supervisor"],
  },
  {
    id: "EV-2104",
    name: "Ponce City Market Weekend Detail",
    type: "Recurring Site",
    client: "Ponce City Market",
    city: "Atlanta",
    date: "Apr 14",
    time: "10:00",
    startsAt: "2026-04-14T10:00:00-05:00",
    endsAt: "2026-04-14T18:00:00-05:00",
    required: 6,
    assigned: 6,
    status: "Covered",
    roles: ["Unarmed", "Patrol"],
  },
  {
    id: "EV-2110",
    name: "Midtown Music Festival Vendor Walk",
    type: "Festival",
    client: "Prospect",
    city: "Atlanta",
    date: "Apr 16",
    time: "09:00",
    startsAt: "2026-04-16T09:00:00-05:00",
    endsAt: "2026-04-16T17:00:00-05:00",
    required: 10,
    assigned: 4,
    status: "Planning",
    roles: ["Crowd Control", "Supervisor"],
  },
  {
    id: "EV-2112",
    name: "Buckhead Executive Protection",
    type: "Executive Protection",
    client: "Buckhead Properties LLC",
    city: "Buckhead",
    date: "Apr 17",
    time: "18:00",
    startsAt: "2026-04-17T18:00:00-05:00",
    endsAt: "2026-04-17T23:00:00-05:00",
    required: 4,
    assigned: 4,
    status: "Covered",
    roles: ["Armed", "Executive Protection"],
  },
];

const ASSIGNMENT_BOOK_SEED = {
  "EV-2099": ["A-104", "A-130"],
  "EV-2104": ["A-117", "A-130"],
  "EV-2112": ["A-104", "A-130"],
};

const INVOICES_SEED = [
  {
    id: "INV-001",
    client: "Hartsfield-Jackson Airport",
    amount: 12500,
    status: "Sent",
    due: "Apr 15",
    dueDate: "2026-04-15T17:00:00-05:00",
    lastContact: "Apr 7",
    reminders: 1,
    thread: "Gmail linked",
  },
  {
    id: "INV-002",
    client: "Buckhead Properties LLC",
    amount: 8750,
    status: "Viewed",
    due: "Apr 20",
    dueDate: "2026-04-20T17:00:00-05:00",
    lastContact: "Apr 8",
    reminders: 0,
    thread: "Gmail linked",
  },
  {
    id: "INV-003",
    client: "Midtown Mall Management",
    amount: 6200,
    status: "Overdue",
    due: "Mar 30",
    dueDate: "2026-03-30T17:00:00-05:00",
    lastContact: "Apr 3",
    reminders: 2,
    thread: "Reminder due",
  },
  {
    id: "INV-004",
    client: "Atlanta Tech Campus",
    amount: 9400,
    status: "Draft",
    due: "Apr 30",
    dueDate: "2026-04-30T17:00:00-05:00",
    lastContact: "None",
    reminders: 0,
    thread: "No Gmail thread",
  },
];

const LEADS_SEED = [
  {
    id: "L-301",
    company: "Atlanta Jazz Festival",
    contact: "Event Operations",
    type: "Festival",
    city: "Atlanta",
    value: 42000,
    stage: "Targeted",
    priority: 96,
    scheduledFor: "2026-04-12T10:00:00-05:00",
    next: "Send tailored security coverage pitch",
  },
  {
    id: "L-318",
    company: "State Farm Arena Concert Ops",
    contact: "Venue Security",
    type: "Concert",
    city: "Atlanta",
    value: 58000,
    stage: "New",
    priority: 92,
    scheduledFor: "2026-04-14T13:00:00-05:00",
    next: "Identify decision maker",
  },
  {
    id: "L-327",
    company: "Peachtree Road Race Vendor Village",
    contact: "Race Logistics",
    type: "Large Scale Event",
    city: "Atlanta",
    value: 36000,
    stage: "Outreach Sent",
    priority: 89,
    scheduledFor: "2026-04-18T09:00:00-05:00",
    next: "Follow up Friday",
  },
  {
    id: "L-334",
    company: "Emory Campus Events",
    contact: "Campus Safety",
    type: "Campus",
    city: "Atlanta",
    value: 25000,
    stage: "Discovery",
    priority: 84,
    scheduledFor: "2026-04-21T11:00:00-05:00",
    next: "Schedule scope call",
  },
];

const CONTENT_SEED = [
  {
    id: "POST-09",
    title: "Weekend Detail Recap",
    status: "Draft",
    source: "Ponce City Market Weekend Detail",
    channel: "LinkedIn",
  },
  {
    id: "POST-12",
    title: "Officer Spotlight: Janet Moore",
    status: "Ready",
    source: "Roster",
    channel: "LinkedIn",
  },
];

const PAYROLL_SEED = {
  period: "Apr 1 - Apr 15",
  periodStart: "2026-04-01T00:00:00-05:00",
  periodEnd: "2026-04-15T23:59:59-05:00",
  reviewCloseAt: "2026-04-15T17:00:00-05:00",
  syncStatus: "Awaiting Sync",
  lastSync: "Never",
  entries: [
    { id: "P-104", associateId: "A-104", name: "Marcus Reid", hours: 78, rate: 22, status: "Pending Review", issue: "2 hours missing from executive detail" },
    { id: "P-117", associateId: "A-117", name: "Tasha Williams", hours: 72, rate: 18, status: "Ready", issue: "None" },
    { id: "P-130", associateId: "A-130", name: "Janet Moore", hours: 80, rate: 26, status: "Ready", issue: "None" },
    { id: "P-141", associateId: "A-141", name: "Ray Thompson", hours: 12, rate: 18, status: "Blocked", issue: "Onboarding incomplete in Paychex" },
  ],
  exceptions: [
    "Marcus Reid has a two-hour discrepancy between assigned coverage and payroll import.",
    "Ray Thompson cannot sync until onboarding is completed in Paychex.",
  ],
  history: [
    { id: "CHK-104-1", associateId: "A-104", name: "Marcus Reid", period: "Mar 16 - Mar 31", paidOn: "Apr 4", paidOnAt: "2026-04-04T09:00:00-05:00", gross: 1584, net: 1288, status: "Paychex Deposited" },
    { id: "CHK-104-0", associateId: "A-104", name: "Marcus Reid", period: "Mar 1 - Mar 15", paidOn: "Mar 20", paidOnAt: "2026-03-20T09:00:00-05:00", gross: 1496, net: 1218, status: "Paychex Deposited" },
    { id: "CHK-117-1", associateId: "A-117", name: "Tasha Williams", period: "Mar 16 - Mar 31", paidOn: "Apr 4", paidOnAt: "2026-04-04T09:00:00-05:00", gross: 1296, net: 1097, status: "Paychex Deposited" },
  ],
};

const TIMECARDS_SEED = [
  {
    id: "TC-104-APR11",
    associateId: "A-104",
    eventId: "EV-2099",
    title: "Lenox Square Executive Detail",
    city: "Atlanta",
    scheduledStart: "2026-04-11T18:00:00-05:00",
    scheduledEnd: "2026-04-11T23:00:00-05:00",
    clockIn: null,
    clockOut: null,
    hours: 0,
    status: "Scheduled",
    paychexStatus: "Not Synced",
  },
  {
    id: "TC-104-APR17",
    associateId: "A-104",
    eventId: "EV-2112",
    title: "Buckhead Executive Protection",
    city: "Buckhead",
    scheduledStart: "2026-04-17T18:00:00-05:00",
    scheduledEnd: "2026-04-17T23:00:00-05:00",
    clockIn: null,
    clockOut: null,
    hours: 0,
    status: "Scheduled",
    paychexStatus: "Not Synced",
  },
  {
    id: "TC-104-APR05",
    associateId: "A-104",
    eventId: "HIST-APR05",
    title: "State Farm Arena Concert Escort",
    city: "Atlanta",
    scheduledStart: "2026-04-05T17:00:00-05:00",
    scheduledEnd: "2026-04-05T23:00:00-05:00",
    clockIn: "2026-04-05T16:52:00-05:00",
    clockOut: "2026-04-05T23:11:00-05:00",
    hours: 6.3,
    status: "Completed",
    paychexStatus: "Synced",
  },
  {
    id: "TC-104-MAR29",
    associateId: "A-104",
    eventId: "HIST-MAR29",
    title: "Buckhead Executive Escort",
    city: "Buckhead",
    scheduledStart: "2026-03-29T18:00:00-05:00",
    scheduledEnd: "2026-03-29T23:00:00-05:00",
    clockIn: "2026-03-29T17:57:00-05:00",
    clockOut: "2026-03-29T23:02:00-05:00",
    hours: 5.1,
    status: "Completed",
    paychexStatus: "Synced",
  },
  {
    id: "TC-117-APR14",
    associateId: "A-117",
    eventId: "EV-2104",
    title: "Ponce City Market Weekend Detail",
    city: "Atlanta",
    scheduledStart: "2026-04-14T10:00:00-05:00",
    scheduledEnd: "2026-04-14T18:00:00-05:00",
    clockIn: null,
    clockOut: null,
    hours: 0,
    status: "Scheduled",
    paychexStatus: "Not Synced",
  },
  {
    id: "TC-130-APR11",
    associateId: "A-130",
    eventId: "EV-2099",
    title: "Lenox Square Executive Detail",
    city: "Atlanta",
    scheduledStart: "2026-04-11T18:00:00-05:00",
    scheduledEnd: "2026-04-11T23:00:00-05:00",
    clockIn: null,
    clockOut: null,
    hours: 0,
    status: "Scheduled",
    paychexStatus: "Not Synced",
  },
  {
    id: "TC-130-APR17",
    associateId: "A-130",
    eventId: "EV-2112",
    title: "Buckhead Executive Protection",
    city: "Buckhead",
    scheduledStart: "2026-04-17T18:00:00-05:00",
    scheduledEnd: "2026-04-17T23:00:00-05:00",
    clockIn: null,
    clockOut: null,
    hours: 0,
    status: "Scheduled",
    paychexStatus: "Not Synced",
  },
];

const INTAKE_LINKS_SEED = [
  {
    id: "LINK-001",
    label: "Marcus Reid Intake Link",
    associateId: "A-104",
    userId: "U-041",
    associateName: "Marcus Reid",
    email: "marcus@example.com",
    url: "/login?invite=LINK-001",
    status: "Completed",
    delivery: "Email sent",
    created: "Today",
  },
];

const AUDIT_SEED = [
  { id: "AUD-001", actor: "System", text: "SSP Command initialized with operations-first workflow.", time: "08:00" },
  { id: "AUD-002", actor: "Integrations", text: "Gmail, Paychex, and LinkedIn placeholders are staged for one-click actions.", time: "08:04" },
  { id: "AUD-003", actor: "Scheduling Agent", text: "Initial staffing recommendations generated from current associate readiness.", time: "08:06" },
];

function readStoredState(key, initialValue) {
  if (typeof window === "undefined") return initialValue;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initialValue;
  } catch {
    return initialValue;
  }
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => readStoredState(key, initialValue));

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage write issues and keep the in-memory experience working.
    }
  }, [key, value]);

  return [value, setValue];
}

function currency(value) {
  return "$" + Number(value).toLocaleString();
}

function initials(name) {
  return String(name)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function parseMonthDayLabel(value) {
  const baseYear = new Date().getFullYear();
  const parsed = new Date(`${value} ${baseYear}`);
  return Number.isNaN(parsed.getTime()) ? new Date(`${value} 2026`) : parsed;
}

function parseTimelineValue(dateLabel, timeLabel = "00:00") {
  const parsed = parseMonthDayLabel(dateLabel);
  const [hours, minutes] = String(timeLabel).split(":").map((part) => Number(part) || 0);
  parsed.setHours(hours, minutes, 0, 0);
  return parsed;
}

function eventStartValue(event) {
  return event.startsAt ? new Date(event.startsAt) : parseTimelineValue(event.date, event.time);
}

function eventEndValue(event) {
  if (event.endsAt) return new Date(event.endsAt);
  const fallback = eventStartValue(event);
  fallback.setHours(fallback.getHours() + 6);
  return fallback;
}

function sortByDateAsc(items, getter) {
  return [...items].sort((a, b) => getter(a).getTime() - getter(b).getTime());
}

function sortByDateDesc(items, getter) {
  return [...items].sort((a, b) => getter(b).getTime() - getter(a).getTime());
}

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimeLabel(value) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateTimeLabel(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShiftWindow(start, end) {
  return `${formatDateLabel(start)} | ${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;
}

function timecardHours(start, end, fallback = 0) {
  if (!start || !end) return fallback;
  const hours = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
  return Math.max(0, Math.round(hours * 10) / 10);
}

function payRateForAssociate(associate, payroll) {
  const existing = payroll.entries.find((entry) => entry.associateId === associate.id);
  if (existing) return existing.rate;
  if (String(associate.role).toLowerCase().includes("supervisor")) return 26;
  if (String(associate.role).toLowerCase().includes("senior")) return 22;
  return 18;
}

function normalizePayrollState(payroll) {
  return {
    ...PAYROLL_SEED,
    ...payroll,
    entries: Array.isArray(payroll?.entries) ? payroll.entries : PAYROLL_SEED.entries,
    exceptions: Array.isArray(payroll?.exceptions) ? payroll.exceptions : PAYROLL_SEED.exceptions,
    history: Array.isArray(payroll?.history) ? payroll.history : PAYROLL_SEED.history,
  };
}

function normalizeTimecardsState(timecards) {
  return Array.isArray(timecards)
    ? timecards.map((timecard) => ({
        ...timecard,
        hours: Number(timecard.hours || 0),
        paychexStatus: timecard.paychexStatus || "Not Synced",
        paychexCheckId: timecard.paychexCheckId || null,
        paychexCheckComponentId: timecard.paychexCheckComponentId || null,
        paychexSyncedAt: timecard.paychexSyncedAt || null,
        paychexMessage: timecard.paychexMessage || "",
        paychexError: timecard.paychexError || "",
        status: timecard.status || "Scheduled",
      }))
    : TIMECARDS_SEED;
}

function statusTone(status) {
  const normalized = String(status).toLowerCase();
  if (["covered", "ready", "active", "queued", "approved", "synced", "confirmed", "duty"].some((word) => normalized.includes(word))) return "good";
  if (["risk", "overdue", "needs", "pending", "draft", "monitor", "invited", "planning"].some((word) => normalized.includes(word))) return "warn";
  if (["blocked", "lost", "inactive", "declined", "error", "failed", "missing"].some((word) => normalized.includes(word))) return "bad";
  return "neutral";
}

function scoreEventRisk(event) {
  const gap = Math.max(event.required - event.assigned, 0);
  if (gap === 0) return "Covered";
  if (gap <= 2) return "Monitor";
  return "At Risk";
}

function isMetroMatch(eventCity, associateCity) {
  if (eventCity === associateCity) return true;
  const metroCities = new Set(["Atlanta", "Buckhead", "Marietta", "Decatur"]);
  return metroCities.has(eventCity) && metroCities.has(associateCity);
}

function createId(prefix) {
  return `${prefix}-${Math.floor(Math.random() * 900 + 100)}`;
}

const ROLE_PASSWORDS = {
  owner: "Owner2026!",
  admin: "Admin2026!",
  manager: "Manager2026!",
  associate: "Associate2026!",
};

const OWNER_USERNAME = "DLowery5";
const OWNER_PASSWORD = "Demarcus0614";

function makeUsername(name, email, fallback = "ssp") {
  const base =
    (email && String(email).split("@")[0]) ||
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") ||
    fallback;

  return base || fallback;
}

function defaultPasswordForRole(role) {
  return ROLE_PASSWORDS[role] || "SspSecure2026!";
}

function enrichUserRecord(user) {
  const record = {
    ...user,
    username: user.username || makeUsername(user.name, user.email, String(user.id || "ssp").toLowerCase()),
    password: user.password || defaultPasswordForRole(user.role),
  };

  if (user.id === "U-001" || user.email === "owner@specialservicesprotection.com") {
    record.username = OWNER_USERNAME;
    record.password = OWNER_PASSWORD;
  }

  return record;
}

const INTERNAL_PAGE_IDS = INTERNAL_NAV.map((item) => item.id);
const ASSOCIATE_PAGE_IDS = ASSOCIATE_NAV.map((item) => item.id);

function parseLocationPath() {
  if (typeof window === "undefined") {
    return { mode: "marketing", page: null };
  }

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { mode: "marketing", page: null };
  }

  if (segments[0] === "login") {
    return { mode: "login", page: null };
  }

  if (segments[0] === "portal") {
    const page = ASSOCIATE_PAGE_IDS.includes(segments[1]) ? segments[1] : "assignments";
    return { mode: "associate", page };
  }

  const page = INTERNAL_PAGE_IDS.includes(segments[0]) ? segments[0] : "command";
  return { mode: "internal", page };
}

function pathForInternalPage(page) {
  return `/${page}`;
}

function pathForAssociatePage(page) {
  return `/portal/${page}`;
}

function pathForWebsite() {
  return "/";
}

function pushPath(path) {
  if (typeof window === "undefined") return;
  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (currentPath === path) return;
  window.history.pushState({}, "", path);
}

function parseInviteToken() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("invite");
}

function buildInviteUrl(linkId) {
  const relativePath = `/login?invite=${linkId}`;
  if (typeof window === "undefined") return relativePath;
  return `${window.location.origin}${relativePath}`;
}

function normalizeInviteUrl(url) {
  if (!url || typeof window === "undefined" || /^https?:\/\//.test(url)) return url;
  return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
}

function buildInviteEmail(name, inviteUrl) {
  const subject = "Complete your Special Services Protection profile";
  const body = [
    `Hello ${name},`,
    "",
    "You have been invited to complete your associate profile for Special Services Protection.",
    "Use the secure link below to submit your city, availability, certifications, and preferred assignments:",
    inviteUrl,
    "",
    "If you have any questions, reply directly to SSP Operations.",
    "",
    "SSP Operations",
  ].join("\n");

  return { subject, body };
}

function buildMailtoUrl(email, subject, body) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildGmailComposeUrl(email, subject, body) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: email,
    su: subject,
    body,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

function openExternalUrl(url) {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function buildRecommendations(events, associates) {
  const assignedByDate = new Map();

  return events.map((event) => {
    const takenForDate = assignedByDate.get(event.date) || new Set();

    const ranked = associates
      .filter((associate) => associate.status === "Ready" && !takenForDate.has(associate.id))
      .map((associate) => {
        const roleMatches = event.roles.filter((role) => associate.certs.includes(role)).length;
        const cityScore = isMetroMatch(event.city, associate.city) ? 24 : 10;
        const credentialScore = roleMatches * 18;
        const loadScore = Math.max(0, 24 - Math.round(associate.hours / 2));
        const armedScore = event.roles.includes("Armed") ? (associate.armed ? 16 : -18) : 6;
        const readinessScore = Math.round(associate.score / 5);

        return {
          ...associate,
          matchScore: cityScore + credentialScore + loadScore + armedScore + readinessScore,
        };
      })
      .sort((left, right) => right.matchScore - left.matchScore);

    const team = ranked.slice(0, event.required);
    const nextTaken = new Set(takenForDate);
    team.forEach((associate) => nextTaken.add(associate.id));
    assignedByDate.set(event.date, nextTaken);

    return {
      eventId: event.id,
      event: event.name,
      city: event.city,
      date: event.date,
      needed: event.required,
      recommended: team.length,
      gaps: Math.max(event.required - team.length, 0),
      risk: team.length >= event.required ? "Covered" : "Needs Coverage",
      team,
    };
  });
}

function defaultInternalPage(role) {
  const first = INTERNAL_NAV.find((item) => item.roles.includes(role));
  return first ? first.id : "command";
}

function buildExecutiveBrief({ recommendations, invoices, leads, payroll, associates }) {
  const openPosts = recommendations.reduce((sum, item) => sum + item.gaps, 0);
  const overdue = invoices.filter((invoice) => invoice.status === "Overdue").length;
  const hotLead = leads.find((lead) => lead.priority >= 90);
  const blockedAssociates = associates.filter((associate) => associate.status !== "Ready").length;
  const payrollIssues = payroll.exceptions.length;

  return `Operations first: ${openPosts} open post${openPosts === 1 ? "" : "s"}, ${overdue} overdue invoice${overdue === 1 ? "" : "s"}, ${blockedAssociates} associate record${blockedAssociates === 1 ? "" : "s"} needing attention, and ${payrollIssues} Paychex exception${payrollIssues === 1 ? "" : "s"}. ${hotLead ? `Top growth target is ${hotLead.company}.` : ""}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

function App() {
  const initialRoute = parseLocationPath();
  const [routeMode, setRouteMode] = useState(initialRoute.mode);
  const [inviteToken, setInviteToken] = useState(() => parseInviteToken());
  const [rememberedUserId, setRememberedUserId] = useStoredState("ssp.sessionUserId.v1", null);
  const [sessionUserId, setSessionUserId] = useState(() => rememberedUserId);
  const [internalPage, setInternalPage] = useState(
    initialRoute.mode === "internal" ? initialRoute.page : "command"
  );
  const [associatePage, setAssociatePage] = useState(
    initialRoute.mode === "associate" ? initialRoute.page : "assignments"
  );
  const [users, setUsers] = useStoredState("ssp.users.v2", USERS_SEED);
  const [associates, setAssociates] = useStoredState("ssp.associates.v2", ASSOCIATES_SEED);
  const [events, setEvents] = useStoredState("ssp.events.v2", EVENTS_SEED);
  const [assignmentBook, setAssignmentBook] = useStoredState("ssp.assignments.v2", ASSIGNMENT_BOOK_SEED);
  const [invoices, setInvoices] = useStoredState("ssp.invoices.v2", INVOICES_SEED);
  const [leads, setLeads] = useStoredState("ssp.leads.v2", LEADS_SEED);
  const [content, setContent] = useStoredState("ssp.content.v2", CONTENT_SEED);
  const [payroll, setPayroll] = useStoredState("ssp.payroll.v2", PAYROLL_SEED);
  const [timecards, setTimecards] = useStoredState("ssp.timecards.v1", TIMECARDS_SEED);
  const [intakeLinks, setIntakeLinks] = useStoredState("ssp.intakeLinks.v2", INTAKE_LINKS_SEED);
  const [audit, setAudit] = useStoredState("ssp.audit.v2", AUDIT_SEED);
  const [paychexConnection, setPaychexConnection] = useState({
    configured: false,
    readyForSync: false,
    authenticated: false,
    missing: [],
    summary: "Paychex connection has not been checked yet.",
    error: "",
  });
  const [paychexSyncBusy, setPaychexSyncBusy] = useState(false);
  const [paychexNotice, setPaychexNotice] = useState(null);

  useEffect(() => {
    const nextUsers = users.map((user) => {
      const enriched = enrichUserRecord(user);

      if (user.id === "U-001" || user.email === "owner@specialservicesprotection.com") {
        return {
          ...enriched,
          username: OWNER_USERNAME,
          password: OWNER_PASSWORD,
        };
      }

      return enriched;
    });

    const needsUpdate = nextUsers.some(
      (user, index) =>
        user.username !== users[index]?.username || user.password !== users[index]?.password
    );

    if (needsUpdate) {
      setUsers(nextUsers);
    }
  }, [users, setUsers]);

  useEffect(() => {
    const normalized = normalizePayrollState(payroll);
    if (JSON.stringify(normalized) !== JSON.stringify(payroll)) {
      setPayroll(normalized);
    }
  }, [payroll, setPayroll]);

  useEffect(() => {
    const normalized = normalizeTimecardsState(timecards);
    if (JSON.stringify(normalized) !== JSON.stringify(timecards)) {
      setTimecards(normalized);
    }
  }, [timecards, setTimecards]);

  const currentUser = useMemo(
    () => users.find((user) => user.id === sessionUserId) || null,
    [sessionUserId, users]
  );
  const payrollState = useMemo(() => normalizePayrollState(payroll), [payroll]);
  const timecardsState = useMemo(() => normalizeTimecardsState(timecards), [timecards]);

  const currentAssociate = useMemo(() => {
    if (!currentUser || currentUser.role !== "associate") return null;
    return associates.find((associate) => associate.userId === currentUser.id || associate.id === currentUser.associateId) || null;
  }, [associates, currentUser]);

  const currentInvite = useMemo(
    () => intakeLinks.find((link) => link.id === inviteToken) || null,
    [intakeLinks, inviteToken]
  );
  const canManagePaychex = currentUser ? ["owner", "admin"].includes(currentUser.role) : false;

  const recommendations = useMemo(() => buildRecommendations(events, associates), [events, associates]);

  const stats = useMemo(() => {
    const openShifts = events.reduce((sum, event) => sum + Math.max(event.required - event.assigned, 0), 0);
    const outstanding = invoices
      .filter((invoice) => !["Paid", "Cancelled"].includes(invoice.status))
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return {
      activeContracts: events.filter((event) => event.client !== "Prospect").length,
      eventsWeek: events.length,
      scheduledToday: Object.values(assignmentBook).reduce((sum, team) => sum + team.length, 0),
      openShifts,
      coverageRisk: openShifts > 4 ? "High" : openShifts > 0 ? "Medium" : "Low",
      outstanding,
      overdue: invoices.filter((invoice) => invoice.status === "Overdue").length,
      hotLeads: leads.filter((lead) => lead.priority >= 88).length,
      pendingAssociates: associates.filter((associate) => associate.status !== "Ready").length,
      payrollExceptions: payrollState.exceptions.length,
      contentReady: content.filter((item) => item.status === "Ready").length,
    };
  }, [assignmentBook, associates, content, events, invoices, leads, payrollState]);

  const brief = useMemo(
    () => buildExecutiveBrief({ recommendations, invoices, leads, payroll: payrollState, associates }),
    [associates, invoices, leads, payrollState, recommendations]
  );

  const refreshPaychexStatus = useCallback(async () => {
    if (!canManagePaychex) return null;

    try {
      const payload = await requestJson("/api/paychex/status");
      setPaychexConnection(payload);
      return payload;
    } catch (error) {
      const fallback = {
        configured: false,
        readyForSync: false,
        authenticated: false,
        missing: [],
        summary: error.message,
        error: error.message,
      };
      setPaychexConnection(fallback);
      return fallback;
    }
  }, [canManagePaychex]);

  useEffect(() => {
    if (!canManagePaychex) return undefined;

    let cancelled = false;
    refreshPaychexStatus().then((payload) => {
      if (!cancelled && payload) {
        setPaychexConnection(payload);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [canManagePaychex, refreshPaychexStatus]);

  useEffect(() => {
    const handlePopstate = () => {
      const route = parseLocationPath();
      setRouteMode(route.mode);
      setInviteToken(parseInviteToken());
      if (route.mode === "login") {
        setSessionUserId(null);
      } else if (route.mode === "internal") {
        setInternalPage(route.page);
      } else if (route.mode === "associate") {
        setAssociatePage(route.page);
      }
    };

    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  useEffect(() => {
    if (sessionUserId && !users.some((user) => user.id === sessionUserId)) {
      setSessionUserId(null);
      setRememberedUserId(null);
    }
  }, [sessionUserId, setRememberedUserId, users]);

  useEffect(() => {
    if (!rememberedUserId || sessionUserId) return;
    setSessionUserId(rememberedUserId);
  }, [rememberedUserId, sessionUserId]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (routeMode === "marketing") {
      document.title = "Special Services Protection | The Standard";
      return;
    }

    if (routeMode === "login") {
      document.title = inviteToken
        ? "Special Services Protection | Complete Profile"
        : "Special Services Protection | Employees";
      return;
    }

    if (routeMode === "associate" || currentUser?.role === "associate") {
      document.title = "Special Services Protection | Associate Portal";
      return;
    }

    document.title = "Special Services Protection | Command Center";
  }, [currentUser?.role, inviteToken, routeMode]);

  useEffect(() => {
    if (!currentUser || routeMode !== "login") return;

    if (currentUser.role === "associate") {
      setRouteMode("associate");
      setAssociatePage("assignments");
      pushPath(pathForAssociatePage("assignments"));
      return;
    }

    const landingPage = defaultInternalPage(currentUser.role);
    setRouteMode("internal");
    setInternalPage(landingPage);
    pushPath(pathForInternalPage(landingPage));
  }, [currentUser, routeMode]);

  const logAction = (actor, text) => {
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setAudit((items) => [
      { id: createId("AUD"), actor, text, time },
      ...items,
    ].slice(0, 18));
  };

  const signInAs = (userId, options = {}) => {
    const { remember = false, skipLog = false } = options;
    const user = users.find((item) => item.id === userId);
    if (!user || user.status !== "Active") return;

    setSessionUserId(userId);
    setRememberedUserId(remember ? userId : null);
    setInviteToken(null);
    if (user.role === "associate") {
      setRouteMode("associate");
      setAssociatePage("assignments");
      pushPath(pathForAssociatePage("assignments"));
    } else {
      const landingPage = defaultInternalPage(user.role);
      setRouteMode("internal");
      setInternalPage(landingPage);
      pushPath(pathForInternalPage(landingPage));
    }
    if (!skipLog) {
      logAction("Auth", `${user.name} signed into SSP Command.`);
    }
  };

  const signOut = () => {
    if (currentUser) {
      logAction("Auth", `${currentUser.name} signed out.`);
    }
    setSessionUserId(null);
    setRememberedUserId(null);
    setInviteToken(null);
    setRouteMode("login");
    pushPath("/login");
  };

  const navigateInternal = (nextPage) => {
    setRouteMode("internal");
    setInternalPage(nextPage);
    pushPath(pathForInternalPage(nextPage));
  };

  const navigateAssociate = (nextPage) => {
    setRouteMode("associate");
    setAssociatePage(nextPage);
    pushPath(pathForAssociatePage(nextPage));
  };

  const goToWebsite = () => {
    setInviteToken(null);
    setRouteMode("marketing");
    pushPath(pathForWebsite());
  };

  const goToLogin = () => {
    setRouteMode("login");
    pushPath("/login");
  };

  const authenticateUser = ({ username, password, remember }) => {
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");

    const user = users.find((item) => {
      const candidate = enrichUserRecord(item);
      return [candidate.username, candidate.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase() === normalizedUsername);
    });

    if (!user || user.status !== "Active") {
      return { ok: false, error: "Invalid username or password." };
    }

    const candidate = enrichUserRecord(user);
    if (candidate.password !== normalizedPassword) {
      return { ok: false, error: "Invalid username or password." };
    }

    signInAs(candidate.id, { remember });
    return { ok: true };
  };

  const inviteUser = (role = "associate") => {
    const id = createId("U");
    const email = `${role}.${id.toLowerCase()}@specialservicesprotection.com`;
    setUsers((items) => [
      {
        id,
        name: `${ROLE_LABELS[role]} Invite`,
        email,
        username: makeUsername(`${ROLE_LABELS[role]} Invite`, email, `${role}.${id.toLowerCase()}`),
        password: defaultPasswordForRole(role),
        role,
        status: "Invited",
        scope: role === "associate" ? "Self" : "Pending scope",
        lastLogin: "Pending",
      },
      ...items,
    ]);
    logAction("Users", `Invite created for ${ROLE_LABELS[role]} access.`);
  };

  const createAssociateLink = () => {
    const id = createId("LINK");
    setIntakeLinks((items) => [
      {
        id,
        label: "Associate Intake Link",
        associateId: null,
        userId: null,
        associateName: "Open Intake",
        email: "Not assigned",
        url: buildInviteUrl(id),
        status: "Open",
        delivery: "Link created",
        created: "Today",
      },
      ...items,
    ]);
    logAction("Associate Intake Agent", `Secure associate intake link created: ${id}.`);
  };

  const sendAssociateInvite = ({ name, email, city, role }) => {
    const userId = createId("U");
    const associateId = createId("A");
    const linkId = createId("LINK");
    const inviteUrl = buildInviteUrl(linkId);
    const emailDraft = buildInviteEmail(name, inviteUrl);
    const mailtoUrl = buildMailtoUrl(email, emailDraft.subject, emailDraft.body);
    const gmailUrl = buildGmailComposeUrl(email, emailDraft.subject, emailDraft.body);

    setUsers((items) => [
      {
        id: userId,
        name,
        email,
        username: makeUsername(name, email, userId.toLowerCase()),
        password: defaultPasswordForRole("associate"),
        role: "associate",
        status: "Invited",
        scope: "Self",
        associateId,
        lastLogin: "Pending",
      },
      ...items,
    ]);

    setAssociates((items) => [
      {
        id: associateId,
        userId,
        name,
        role: role || "Officer",
        city: city || "Pending",
        phone: "",
        email,
        status: "Profile Pending",
        armed: false,
        availability: [],
        certs: [],
        preferredRoles: [],
        radius: 0,
        hours: 0,
        score: 48,
        notes: "Invite created. Awaiting onboarding profile.",
      },
      ...items,
    ]);

    setIntakeLinks((items) => [
      {
        id: linkId,
        label: `${name} Intake Link`,
        associateId,
        userId,
        associateName: name,
        email,
        url: inviteUrl,
        status: "Sent",
        delivery: "Gmail draft opened",
        mailtoUrl,
        gmailUrl,
        created: "Today",
      },
      ...items,
    ]);

    openExternalUrl(gmailUrl);
    logAction("Associate Intake Agent", `Invite prepared for ${email} and Gmail draft opened for ${name}.`);
    return { linkId, inviteUrl, gmailUrl, mailtoUrl };
  };

  const completeAssociateInvite = (linkId, payload) => {
    const link = intakeLinks.find((item) => item.id === linkId);
    if (!link) return;

    const associateId = link.associateId || createId("A");
    const userId = link.userId || createId("U");
    const fallbackName = payload.name || link.associateName || "New Associate";
    const fallbackEmail = payload.email || (link.email !== "Not assigned" ? link.email : "");

    setAssociates((items) => {
      const nextAssociate = {
        id: associateId,
        userId,
        name: fallbackName,
        role: payload.role || "Officer",
        city: payload.city || "Atlanta",
        phone: payload.phone || "",
        email: fallbackEmail,
        status: "Ready",
        armed: Boolean(payload.armed),
        availability: payload.availability || [],
        certs: payload.certs || [],
        preferredRoles: payload.preferredRoles || [],
        radius: payload.radius || 20,
        hours: 0,
        score: 82,
        notes: payload.notes || "Profile completed from intake link.",
      };

      const existing = items.find((associate) => associate.id === associateId);
      if (!existing) return [nextAssociate, ...items];

      return items.map((associate) =>
        associate.id === associateId
          ? {
              ...associate,
              ...payload,
              userId,
              name: fallbackName,
              email: fallbackEmail,
              city: payload.city || associate.city,
              phone: payload.phone || associate.phone,
              role: payload.role || associate.role,
              status: "Ready",
              certs: payload.certs || associate.certs,
              preferredRoles: payload.preferredRoles || associate.preferredRoles,
              availability: payload.availability || associate.availability,
              notes: payload.notes || associate.notes,
            }
          : associate
      );
    });

    setUsers((items) => {
      const existing = items.find((user) => user.id === userId);
      const nextUser = {
        id: userId,
        name: fallbackName,
        email: fallbackEmail,
        username: existing?.username || makeUsername(fallbackName, fallbackEmail, userId.toLowerCase()),
        password: existing?.password || defaultPasswordForRole("associate"),
        role: "associate",
        status: "Active",
        scope: "Self",
        associateId,
        lastLogin: "Just now",
      };

      if (!existing) return [nextUser, ...items];

      return items.map((user) =>
        user.id === userId
          ? { ...user, ...nextUser }
          : user
      );
    });

    setIntakeLinks((items) =>
      items.map((item) =>
        item.id === linkId
          ? { ...item, status: "Completed", delivery: "Profile completed" }
          : item
      )
    );

    setSessionUserId(userId);
    setInviteToken(null);
    setRouteMode("associate");
    setAssociatePage("profile");
    pushPath(pathForAssociatePage("profile"));
    logAction("Associate Intake", `${link.associateName} completed profile from invite link ${linkId}.`);
  };

  const updateAssociateProfile = (associateId, patch) => {
    setAssociates((items) =>
      items.map((associate) =>
        associate.id === associateId ? { ...associate, ...patch } : associate
      )
    );
    logAction("Associates", `Profile updated for ${associateId}.`);
  };

  const addAvailabilitySlot = (associateId, slot) => {
    if (!slot.trim()) return;
    setAssociates((items) =>
      items.map((associate) =>
        associate.id === associateId
          ? { ...associate, availability: [...associate.availability, slot.trim()] }
          : associate
      )
    );
    logAction("Associates", `Availability added for ${associateId}: ${slot.trim()}.`);
  };

  const removeAvailabilitySlot = (associateId, slot) => {
    setAssociates((items) =>
      items.map((associate) =>
        associate.id === associateId
          ? { ...associate, availability: associate.availability.filter((item) => item !== slot) }
          : associate
      )
    );
    logAction("Associates", `Availability removed for ${associateId}: ${slot}.`);
  };

  const ensureScheduledTimecards = (items, event, associateIds) => {
    const next = [...items];

    associateIds.forEach((associateId) => {
      const exists = next.some((timecard) => timecard.eventId === event.id && timecard.associateId === associateId);
      if (exists) return;

      next.push({
        id: createId("TC"),
        associateId,
        eventId: event.id,
        title: event.name,
        city: event.city,
        scheduledStart: eventStartValue(event).toISOString(),
        scheduledEnd: eventEndValue(event).toISOString(),
        clockIn: null,
        clockOut: null,
        hours: 0,
        status: "Scheduled",
        paychexStatus: "Not Synced",
      });
    });

    return next;
  };

  const applyRecommendation = (eventId) => {
    const recommendation = recommendations.find((item) => item.eventId === eventId);
    if (!recommendation) return;
    const event = events.find((item) => item.id === eventId);
    if (!event) return;

    const teamIds = recommendation.team.map((associate) => associate.id);

    setAssignmentBook((items) => ({
      ...items,
      [eventId]: teamIds,
    }));

    setEvents((items) =>
      items.map((event) =>
        event.id === eventId
          ? {
              ...event,
              assigned: Math.max(event.assigned, teamIds.length),
              status: recommendation.gaps > 0 ? "Partially Staffed" : "Covered",
            }
          : event
      )
    );

    setAssociates((items) =>
      items.map((associate) =>
        teamIds.includes(associate.id)
          ? { ...associate, hours: associate.hours + 6 }
          : associate
      )
    );

    setTimecards((items) => ensureScheduledTimecards(items, event, teamIds));

    logAction("Scheduling Agent", `Recommended team applied to ${eventId}. ${teamIds.length} associate(s) moved into the assignment plan.`);
  };

  const clockAssociateIn = (associateId, timecardId) => {
    const associate = associates.find((item) => item.id === associateId);
    const cards = sortByDateAsc(
      timecardsState.filter((item) => item.associateId === associateId && item.status === "Scheduled"),
      (item) => new Date(item.scheduledStart)
    );
    const target = cards.find((item) => !timecardId || item.id === timecardId);
    if (!associate || !target) return;

    const stamp = new Date().toISOString();

    setTimecards((items) =>
      items.map((timecard) =>
        timecard.id === target.id
          ? {
              ...timecard,
              clockIn: stamp,
              status: "On Duty",
              paychexStatus: "In Progress",
              paychexError: "",
              paychexMessage: "",
            }
          : timecard
      )
    );

    setPayroll((current) => ({
      ...normalizePayrollState(current),
      syncStatus: "Live Time Clock Running",
    }));

    logAction("Time Clock", `${associate.name} clocked in for ${target.title}.`);
  };

  const clockAssociateOut = (associateId, timecardId) => {
    const associate = associates.find((item) => item.id === associateId);
    const target = timecardsState.find(
      (item) => item.associateId === associateId && item.id === timecardId && item.status === "On Duty"
    );
    if (!associate || !target) return;

    const stamp = new Date().toISOString();
    const actualHours = timecardHours(
      target.clockIn || target.scheduledStart,
      stamp,
      0
    );
    const loggedHours =
      actualHours > 0.1
        ? actualHours
        : timecardHours(target.scheduledStart, target.scheduledEnd, target.hours || 0);

    setTimecards((items) =>
      items.map((timecard) =>
        timecard.id === target.id
          ? {
              ...timecard,
              clockOut: stamp,
              hours: loggedHours,
              status: "Completed",
              paychexStatus: "Pending Sync",
              paychexError: "",
              paychexMessage: "Ready for Paychex sync.",
              paychexCheckId: null,
              paychexCheckComponentId: null,
              paychexSyncedAt: null,
            }
          : timecard
      )
    );

    setPayroll((current) => {
      const normalized = normalizePayrollState(current);
      const existing = normalized.entries.find((entry) => entry.associateId === associateId);
      const rate = payRateForAssociate(associate, normalized);

      return {
        ...normalized,
        syncStatus: "Clock Events Pending Sync",
        entries: existing
          ? normalized.entries.map((entry) =>
              entry.associateId === associateId
                ? {
                    ...entry,
                    hours: Math.round((entry.hours + loggedHours) * 10) / 10,
                    status: entry.status === "Blocked" ? "Blocked" : "Ready",
                    issue: entry.status === "Blocked" ? entry.issue : "Clock event captured from SSP Command",
                  }
                : entry
            )
          : [
              {
                id: createId("P"),
                associateId,
                name: associate.name,
                hours: loggedHours,
                rate,
                status: "Ready",
                issue: "Clock event captured from SSP Command",
              },
              ...normalized.entries,
            ],
      };
    });

    logAction("Time Clock", `${associate.name} clocked out from ${target.title}. ${loggedHours} hour(s) queued for Paychex sync.`);
  };

  const sendInvoiceReminder = (invoiceId) => {
    setInvoices((items) =>
      items.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              lastContact: "Today",
              reminders: invoice.reminders + 1,
              thread: "Reminder drafted in Gmail",
            }
          : invoice
      )
    );
    logAction("Collections Agent", `Gmail reminder drafted for ${invoiceId}.`);
  };

  const syncPaychex = async () => {
    if (!canManagePaychex) {
      setPaychexNotice({
        tone: "bad",
        title: "Paychex access required",
        text: "Only owner and admin accounts can run Paychex sync.",
      });
      return;
    }

    if (paychexSyncBusy) return;

    const pendingTimecards = timecardsState.filter(
      (timecard) => timecard.status === "Completed" && timecard.paychexStatus !== "Synced"
    );

    if (!pendingTimecards.length) {
      setPaychexNotice({
        tone: "neutral",
        title: "Nothing waiting",
        text: "No completed timecards are waiting for Paychex sync right now.",
      });
      return;
    }

    const stamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const payload = {
      associates: associates.map((associate) => ({
        id: associate.id,
        name: associate.name,
        email: associate.email,
        paychexWorkerId: associate.paychexWorkerId || "",
        paychexEmployeeId: associate.paychexEmployeeId || "",
        paychexClockId: associate.paychexClockId || "",
      })),
      payrollEntries: payrollState.entries.map((entry) => ({
        associateId: entry.associateId,
        rate: entry.rate,
      })),
      timecards: pendingTimecards.map((timecard) => ({
        id: timecard.id,
        associateId: timecard.associateId,
        scheduledStart: timecard.scheduledStart,
        scheduledEnd: timecard.scheduledEnd,
        clockOut: timecard.clockOut,
        hours: timecard.hours,
      })),
    };

    setPaychexSyncBusy(true);
    setPaychexNotice({
      tone: "neutral",
      title: "Syncing Paychex",
      text: `Sending ${pendingTimecards.length} completed timecard${pendingTimecards.length === 1 ? "" : "s"} to Paychex.`,
    });
    setPayroll((current) => ({
      ...normalizePayrollState(current),
      syncStatus: "Syncing Paychex...",
    }));

    try {
      const result = await requestJson("/api/paychex/sync", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const resultMap = new Map(result.results.map((item) => [item.timecardId, item]));
      const syncedAssociateIds = new Set(
        result.results
          .filter((item) => item.status === "synced")
          .map((item) => item.associateId)
      );
      const failureMessages = result.results
        .filter((item) => item.status === "failed")
        .map((item) => `${item.associateName || item.associateId}: ${item.message}`);

      setTimecards((items) =>
        items.map((timecard) => {
          const syncResult = resultMap.get(timecard.id);
          if (!syncResult) return timecard;

          if (syncResult.status === "synced") {
            return {
              ...timecard,
              paychexStatus: "Synced",
              paychexCheckId: syncResult.paycheckId || timecard.paychexCheckId || null,
              paychexCheckComponentId:
                syncResult.checkComponentId || timecard.paychexCheckComponentId || null,
              paychexSyncedAt: result.syncedAt,
              paychexMessage: syncResult.message,
              paychexError: "",
            };
          }

          return {
            ...timecard,
            paychexStatus: "Sync Error",
            paychexMessage: syncResult.message,
            paychexError: syncResult.message,
          };
        })
      );

      setPayroll((current) => {
        const normalized = normalizePayrollState(current);
        return {
          ...normalized,
          syncStatus: result.summary.failed > 0 ? "Attention Required" : "Synced",
          lastSync: `Today ${stamp}`,
          entries: normalized.entries.map((entry) =>
            syncedAssociateIds.has(entry.associateId) && entry.status !== "Blocked"
              ? { ...entry, status: "Approved", issue: "None" }
              : entry
          ),
          exceptions: Array.from(
            new Set([
              ...normalized.exceptions.filter((item) => !item.startsWith("Paychex sync failed for ")),
              ...failureMessages.map((message) => `Paychex sync failed for ${message}`),
            ])
          ),
        };
      });

      setPaychexConnection(result.connection || paychexConnection);
      setPaychexNotice({
        tone: result.summary.failed > 0 ? "warn" : "good",
        title: result.summary.failed > 0 ? "Paychex sync finished with follow-up" : "Paychex sync complete",
        text:
          result.summary.failed > 0
            ? `${result.summary.synced} synced, ${result.summary.failed} need attention.`
            : `${result.summary.synced} completed timecard${result.summary.synced === 1 ? "" : "s"} synced into Paychex.`,
      });
      logAction(
        "Paychex",
        result.summary.failed > 0
          ? `Paychex sync finished. ${result.summary.synced} synced, ${result.summary.failed} need review.`
          : `Paychex sync completed. ${result.summary.synced} completed timecard${result.summary.synced === 1 ? "" : "s"} posted.`
      );
    } catch (error) {
      setPayroll((current) => ({
        ...normalizePayrollState(current),
        syncStatus: "Attention Required",
      }));
      setPaychexNotice({
        tone: "bad",
        title: "Paychex sync failed",
        text: error.message,
      });
      logAction("Paychex", `Paychex sync failed: ${error.message}`);
      await refreshPaychexStatus();
    } finally {
      setPaychexSyncBusy(false);
    }
  };

  const approvePayrollEntry = (entryId) => {
    setPayroll((current) => {
      const normalized = normalizePayrollState(current);
      return {
        ...normalized,
        entries: normalized.entries.map((entry) =>
          entry.id === entryId ? { ...entry, status: "Approved", issue: "None" } : entry
        ),
        exceptions: normalized.exceptions.filter((item) => !item.includes(entryId)),
      };
    });
    logAction("Payroll", `Payroll entry approved: ${entryId}.`);
  };

  const runLeadOutreach = (leadId) => {
    setLeads((items) =>
      items.map((lead) =>
        lead.id === leadId
          ? { ...lead, stage: "Outreach Sent", next: "Follow up in 3 business days" }
          : lead
      )
    );
    logAction("Outreach Agent", `Gmail outreach drafted and logged for ${leadId}.`);
  };

  const convertLeadToEvent = (leadId) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;

    const eventId = createId("EV");
    setEvents((items) => [
      {
        id: eventId,
        name: `${lead.company} Security Planning`,
        type: lead.type,
        client: lead.company,
        city: lead.city,
        date: "May 02",
        time: "09:00",
        startsAt: "2026-05-02T09:00:00-05:00",
        endsAt: "2026-05-02T15:00:00-05:00",
        required: 6,
        assigned: 0,
        status: "Planning",
        roles: ["Supervisor", "Crowd Control"],
      },
      ...items,
    ]);

    setLeads((items) =>
      items.map((item) =>
        item.id === leadId ? { ...item, stage: "Discovery", next: "Convert scope into staffing plan" } : item
      )
    );

    logAction("CRM", `${lead.company} converted into planning event ${eventId}.`);
  };

  const queueContent = (contentId) => {
    setContent((items) =>
      items.map((item) =>
        item.id === contentId ? { ...item, status: "Queued" } : item
      )
    );
    logAction("Content Agent", `${contentId} queued for LinkedIn approval.`);
  };

  const generateRecapFromEvent = (eventId) => {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;

    setContent((items) => [
      {
        id: createId("POST"),
        title: `${event.name} Recap`,
        status: "Draft",
        source: event.name,
        channel: "LinkedIn",
      },
      ...items,
    ]);
    logAction("Content Agent", `LinkedIn draft created from ${event.name}.`);
  };

  const internalProps = {
    currentUser,
    stats,
    events,
    associates,
    invoices,
    leads,
    users,
    content,
    payroll: payrollState,
    timecards: timecardsState,
    intakeLinks,
    recommendations,
    assignmentBook,
    brief,
    audit,
    inviteUser,
    createAssociateLink,
    sendAssociateInvite,
    applyRecommendation,
    sendInvoiceReminder,
    syncPaychex,
    paychexConnection,
    paychexSyncBusy,
    paychexNotice,
    approvePayrollEntry,
    clockAssociateIn,
    clockAssociateOut,
    runLeadOutreach,
    convertLeadToEvent,
    queueContent,
    generateRecapFromEvent,
    logAction,
  };

  if (currentInvite) {
    return (
      <AssociateInviteScreen
        invite={currentInvite}
        associate={associates.find((item) => item.id === currentInvite.associateId) || null}
        onComplete={completeAssociateInvite}
      />
    );
  }

  if (routeMode === "marketing") {
    return <WebsiteHome onLogin={goToLogin} />;
  }

  if (!currentUser) {
    return (
      <AuthScreen
        onAuthenticate={authenticateUser}
        onBackToWebsite={goToWebsite}
      />
    );
  }

  if (currentUser.role === "associate" && currentAssociate) {
    return (
      <AssociateShell
        user={currentUser}
        associate={currentAssociate}
        page={associatePage}
        setPage={navigateAssociate}
        recommendations={recommendations}
        assignmentBook={assignmentBook}
        payroll={payrollState}
        timecards={timecardsState}
        updateAssociateProfile={updateAssociateProfile}
        addAvailabilitySlot={addAvailabilitySlot}
        removeAvailabilitySlot={removeAvailabilitySlot}
        clockAssociateIn={clockAssociateIn}
        clockAssociateOut={clockAssociateOut}
        signOut={signOut}
        audit={audit}
      />
    );
  }

  return (
      <InternalShell
        user={currentUser}
        page={internalPage}
        setPage={navigateInternal}
      signOut={signOut}
      {...internalProps}
    />
  );
}

function WebsiteHome({ onLogin }) {
  useEffect(() => {
    const body = document.body;
    const priorOverflow = body.style.overflow;

    const mmenu = document.getElementById("mmenu");
    const qModal = document.getElementById("qModal");
    const contactForm = document.getElementById("cForm");
    const quoteForm = document.getElementById("qForm");

    window.toggleMenu = () => {
      mmenu?.classList.toggle("open");
    };

    window.closeMenu = () => {
      mmenu?.classList.remove("open");
    };

    window.openQuote = () => {
      qModal?.classList.add("open");
      body.style.overflow = "hidden";
    };

    window.closeQuote = () => {
      qModal?.classList.remove("open");
      body.style.overflow = priorOverflow;
    };

    window.submitForm = () => {
      const success = document.getElementById("fSuccess");
      success && (success.style.display = "block");
      contactForm?.reset();
      window.setTimeout(() => {
        if (success) success.style.display = "none";
      }, 5000);
    };

    window.submitQuote = () => {
      const success = document.getElementById("qSuccess");
      success && (success.style.display = "block");
      quoteForm?.reset();
      window.setTimeout(() => {
        if (success) success.style.display = "none";
        window.closeQuote?.();
      }, 3000);
    };

    const handleScroll = () => {
      const nav = document.getElementById("nav");
      if (nav) {
        nav.style.borderBottomColor =
          window.scrollY > 60 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)";
      }
    };

    const handleModalClick = (event) => {
      if (event.target === qModal) {
        window.closeQuote?.();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        window.closeQuote?.();
      }
    };

    const handleContactSubmit = (event) => {
      event.preventDefault();
      window.submitForm?.();
    };

    const handleQuoteSubmit = (event) => {
      event.preventDefault();
      window.submitQuote?.();
    };

    const anchorHandler = (event) => {
      const href = event.currentTarget.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    };

    const loginHandler = (event) => {
      event.preventDefault();
      window.closeMenu?.();
      onLogin();
    };

    const anchors = Array.from(document.querySelectorAll('a[href^="#"]'));
    const loginLinks = Array.from(document.querySelectorAll("[data-login-link='true']"));

    anchors.forEach((anchor) => anchor.addEventListener("click", anchorHandler));
    loginLinks.forEach((link) => link.addEventListener("click", loginHandler));
    qModal?.addEventListener("click", handleModalClick);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, { passive: true });
    contactForm?.addEventListener("submit", handleContactSubmit);
    quoteForm?.addEventListener("submit", handleQuoteSubmit);
    handleScroll();

    return () => {
      anchors.forEach((anchor) => anchor.removeEventListener("click", anchorHandler));
      loginLinks.forEach((link) => link.removeEventListener("click", loginHandler));
      qModal?.removeEventListener("click", handleModalClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll);
      contactForm?.removeEventListener("submit", handleContactSubmit);
      quoteForm?.removeEventListener("submit", handleQuoteSubmit);
      body.style.overflow = priorOverflow;
      delete window.toggleMenu;
      delete window.closeMenu;
      delete window.openQuote;
      delete window.closeQuote;
      delete window.submitForm;
      delete window.submitQuote;
    };
  }, [onLogin]);

  return (
    <>
      <style>{SSP_WEBSITE_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: SSP_WEBSITE_HTML }} />
    </>
  );
}

function AuthScreen({ onAuthenticate, onBackToWebsite }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: true,
  });
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const result = onAuthenticate(form);
    if (!result?.ok) {
      setError(result?.error || "Invalid username or password.");
      return;
    }
    setError("");
  };

  return (
    <div className="login-shell">
      <section className="login-visual">
        <div className="login-visual-main">
          <img src="/IMG_1137.jpg" alt="Special Services Protection executive escort detail" />
          <div className="login-visual-overlay" />
          <div className="login-visual-copy">
            <img src="/ssp-logo.jpeg" alt="Special Services Protection logo" className="login-mark" />
            <p className="eyebrow">Employee Access</p>
            <h1>SSP Command Center</h1>
            <p>
              Operations, scheduling, payroll review, invoicing, associate intake, and support in
              one secure internal system.
            </p>
          </div>
        </div>

        <div className="login-gallery">
          <img src="/IMG_3679.jpeg" alt="SSP event deployment in the field" />
          <img src="/IMG_1133.jpg" alt="SSP artist escort movement through a secured corridor" />
        </div>
      </section>

      <section className="login-panel">
        <button className="ghost login-back" type="button" onClick={onBackToWebsite}>Back to Website</button>

        <div className="login-card">
          <p className="eyebrow">Employees</p>
          <h2>Sign In</h2>
          <p className="login-copy">Use your assigned employee username and password to continue.</p>

          <form className="login-form" onSubmit={submit}>
            <label className="field">
              <span>Username</span>
              <input
                type="text"
                autoComplete="username"
                placeholder="username or email"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete={form.remember ? "current-password" : "off"}
                placeholder="Enter password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>

            <label className="remember-row">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
              />
              <span>Remember me</span>
            </label>

            {error && <p className="login-error">{error}</p>}

            <button type="submit">Enter Dashboard</button>
          </form>

          <div className="login-note-row">
            <span>Authorized employees only</span>
            <span>Associate onboarding still runs from secure invite links</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function AssociateInviteScreen({ invite, associate, onComplete }) {
  const [form, setForm] = useState({
    name: associate?.name || invite.associateName || "",
    email: associate?.email || invite.email || "",
    city: associate?.city === "Pending" ? "" : associate?.city || "",
    phone: associate?.phone || "",
    role: associate?.role || "Officer",
    armed: associate?.armed || false,
    radius: associate?.radius || 20,
    certs: associate?.certs?.join(", ") || "",
    preferredRoles: associate?.preferredRoles?.join(", ") || "",
    availability: associate?.availability?.join("\n") || "",
    notes: associate?.notes || "",
  });

  return (
    <div className="auth-shell">
      <div className="auth-panel auth-hero">
        <img src="/ssp-logo.jpeg" alt="Special Services Protection logo" />
        <div>
          <p className="eyebrow">Associate Intake</p>
          <h1>Complete Your Profile</h1>
          <p>
            Finish your SSP onboarding profile so operations can match you to assignments and
            coverage needs.
          </p>
        </div>
      </div>

      <section className="auth-panel">
        <div className="panel-head">
          <h2>{invite.associateName || "Associate"} Intake</h2>
          <span>{invite.id}</span>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Full Name</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="field">
            <span>Email</span>
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="field">
            <span>City</span>
            <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          </label>
          <label className="field">
            <span>Phone</span>
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label className="field">
            <span>Role</span>
            <input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
          </label>
          <label className="field">
            <span>Travel Radius (miles)</span>
            <input type="number" value={form.radius} onChange={(event) => setForm({ ...form, radius: Number(event.target.value) })} />
          </label>
          <label className="field full">
            <span>Certifications</span>
            <input value={form.certs} onChange={(event) => setForm({ ...form, certs: event.target.value })} placeholder="Armed, Crowd Control, Executive Protection" />
          </label>
          <label className="field full">
            <span>Preferred Roles</span>
            <input value={form.preferredRoles} onChange={(event) => setForm({ ...form, preferredRoles: event.target.value })} placeholder="Lead Officer, Executive Protection" />
          </label>
          <label className="field full">
            <span>Availability</span>
            <textarea value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value })} rows={5} placeholder={"Mon 06:00-14:00\nFri 18:00-02:00"} />
          </label>
          <label className="field full">
            <span>Notes</span>
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} />
          </label>
          <label className="checkbox-row full">
            <input type="checkbox" checked={form.armed} onChange={(event) => setForm({ ...form, armed: event.target.checked })} />
            <span>Armed status is current and accurate</span>
          </label>
        </div>
        <div className="button-row top-gap">
          <button
            onClick={() =>
              onComplete(invite.id, {
                name: form.name,
                email: form.email,
                city: form.city,
                phone: form.phone,
                role: form.role,
                armed: form.armed,
                radius: form.radius,
                certs: form.certs.split(",").map((item) => item.trim()).filter(Boolean),
                preferredRoles: form.preferredRoles.split(",").map((item) => item.trim()).filter(Boolean),
                availability: form.availability.split("\n").map((item) => item.trim()).filter(Boolean),
                notes: form.notes,
              })
            }
          >
            Submit Profile
          </button>
        </div>
      </section>
    </div>
  );
}

function InternalShell({ user, page, setPage, signOut, ...props }) {
  const allowedNav = INTERNAL_NAV.filter((item) => item.roles.includes(user.role));

  useEffect(() => {
    if (!allowedNav.some((item) => item.id === page)) {
      setPage(allowedNav[0].id);
    }
  }, [allowedNav, page, setPage]);

  return (
    <div className="app">
      <Sidebar
        navItems={allowedNav}
        activePage={page}
        setActivePage={setPage}
        user={user}
        portalLabel="Command"
      />
      <main className="main-panel">
        <Topbar
          title="SSP Command Center"
          eyebrow="Internal Command Platform"
          user={user}
          signOut={signOut}
        />
        {page === "command" && <CommandPage {...props} />}
        {page === "calendar" && <CalendarPage {...props} />}
        {page === "scheduling" && <SchedulingPage {...props} />}
        {page === "associates" && <AssociatesPage {...props} />}
        {page === "payroll" && <PayrollPage {...props} />}
        {page === "invoices" && <InvoicesPage {...props} />}
        {page === "crm" && <CrmPage {...props} />}
        {page === "linkedin" && <LinkedInPage {...props} />}
        {page === "users" && <UsersPage {...props} currentRole={user.role} />}
        {page === "copilot" && <CopilotPage {...props} />}
      </main>
    </div>
  );
}

function AssociateShell({
  user,
  associate,
  page,
  setPage,
  recommendations,
  assignmentBook,
  payroll,
  timecards,
  updateAssociateProfile,
  addAvailabilitySlot,
  removeAvailabilitySlot,
  clockAssociateIn,
  clockAssociateOut,
  signOut,
  audit,
}) {
  return (
    <div className="app">
      <Sidebar
        navItems={ASSOCIATE_NAV}
        activePage={page}
        setActivePage={setPage}
        user={user}
        portalLabel="Associate"
      />
      <main className="main-panel">
        <Topbar
          title="Associate Portal"
          eyebrow="Special Services Protection"
          user={user}
          signOut={signOut}
        />
        {page === "assignments" && (
          <AssociateAssignmentsPage
            associate={associate}
            recommendations={recommendations}
            assignmentBook={assignmentBook}
            payroll={payroll}
            timecards={timecards}
            clockAssociateIn={clockAssociateIn}
            clockAssociateOut={clockAssociateOut}
          />
        )}
        {page === "profile" && (
          <AssociateProfilePage
            associate={associate}
            onSave={updateAssociateProfile}
          />
        )}
        {page === "availability" && (
          <AssociateAvailabilityPage
            associate={associate}
            onAdd={addAvailabilitySlot}
            onRemove={removeAvailabilitySlot}
          />
        )}
        {page === "support" && (
          <AssociateSupportPage associate={associate} audit={audit} />
        )}
      </main>
    </div>
  );
}

function Sidebar({ navItems, activePage, setActivePage, user, portalLabel }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/ssp-logo.jpeg" alt="Special Services Protection shield logo" />
        <div className="brand-copy">
          <p>Special Services Protection</p>
          <strong>{portalLabel === "Associate" ? "Associate Portal" : "Command Center"}</strong>
          <span className="brand-meta">Atlanta, Georgia</span>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const active = item.id === activePage;
          return (
            <button
              key={item.id}
              className={active ? "active" : ""}
              onClick={() => setActivePage(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.eyebrow}</small>
            </button>
          );
        })}
      </nav>

      <div className="role-card">
        <span>Signed In</span>
        <strong>{user.name}</strong>
        <small>{ROLE_LABELS[user.role]} - {user.scope}</small>
      </div>
    </aside>
  );
}

function Topbar({ title, eyebrow, user, signOut }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <div className="topbar-user">
          <strong>{user.name}</strong>
          <small>{ROLE_LABELS[user.role]}</small>
        </div>
        <button className="ghost" onClick={signOut}>Sign Out</button>
      </div>
    </header>
  );
}

function CommandPage({ stats, events, associates, invoices, leads, content, payroll, brief, audit, sendInvoiceReminder, runLeadOutreach, syncPaychex, createAssociateLink }) {
  const sortedEvents = sortByDateAsc(events, eventStartValue);
  const atRiskEvents = sortedEvents.filter((event) => scoreEventRisk(event) !== "Covered");
  const overdueInvoice = invoices.find((invoice) => invoice.status === "Overdue");

  return (
    <section className="page-grid command-layout">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Executive Briefing Agent</p>
          <h2>{brief}</h2>
          <p>
            Today’s operating order is coverage first, collections second, and growth actions after
            staffing confidence is restored.
          </p>
        </div>
        <div className="hero-actions">
          <button onClick={syncPaychex}>Sync Paychex</button>
          {overdueInvoice && (
            <button className="secondary" onClick={() => sendInvoiceReminder(overdueInvoice.id)}>
              Draft Overdue Reminder
            </button>
          )}
          <button className="secondary" onClick={createAssociateLink}>Create Intake Link</button>
        </div>
      </div>

      <KpiStrip
        items={[
          ["Active Contracts", stats.activeContracts],
          ["Events This Week", stats.eventsWeek],
          ["Scheduled Today", stats.scheduledToday],
          ["Open Shifts", stats.openShifts],
          ["Coverage Risk", stats.coverageRisk],
          ["Outstanding", currency(stats.outstanding)],
          ["Overdue", stats.overdue],
          ["Payroll Exceptions", stats.payrollExceptions],
        ]}
      />

      <Panel title="Operations Calendar" action="Next 7 days">
        {sortedEvents.map((event) => (
          <Row
            key={event.id}
            title={event.name}
            meta={`${formatShiftWindow(eventStartValue(event), eventEndValue(event))} - ${event.city} - ${event.type}`}
            value={`${event.assigned}/${event.required}`}
            tone={statusTone(scoreEventRisk(event))}
          />
        ))}
      </Panel>

      <Panel title="Coverage Board" action={`${stats.openShifts} open posts`}>
        <div className="coverage-grid">
          {atRiskEvents.map((event) => (
            <div className="mini-card" key={event.id}>
              <span className={`pill ${statusTone(scoreEventRisk(event))}`}>{scoreEventRisk(event)}</span>
              <strong>{event.name}</strong>
              <p>{Math.max(event.required - event.assigned, 0)} posts open for {event.roles.join(", ")}</p>
            </div>
          ))}
          {atRiskEvents.length === 0 && <p className="empty">All current events are covered.</p>}
        </div>
      </Panel>

      <Panel title="Associate Readiness" action={`${stats.pendingAssociates} needs attention`}>
        {associates.map((associate) => (
          <Row
            key={associate.id}
            title={associate.name}
            meta={`${associate.city} - ${associate.role} - ${associate.certs.join(", ") || "No certifications"}`}
            value={associate.status}
            tone={statusTone(associate.status)}
          />
        ))}
      </Panel>

      <Panel title="Gmail Action Center" action={`${stats.overdue} overdue`}>
        {invoices.map((invoice) => (
          <ActionRow
            key={invoice.id}
            title={invoice.client}
            meta={`${invoice.id} - ${invoice.thread} - Last contact ${invoice.lastContact}`}
            value={currency(invoice.amount)}
            button="Reminder"
            onClick={() => sendInvoiceReminder(invoice.id)}
          />
        ))}
      </Panel>

      <Panel title="Paychex Exception Board" action={payroll.syncStatus}>
        <div className="insight-list">
          {payroll.exceptions.map((item) => <p key={item}>{item}</p>)}
        </div>
      </Panel>

      <Panel title="CRM Hot Queue" action={`${stats.hotLeads} hot leads`}>
        {leads.slice(0, 3).map((lead) => (
          <ActionRow
            key={lead.id}
            title={lead.company}
            meta={`${lead.type} - ${lead.stage} - ${lead.next}`}
            value={lead.priority}
            button="Outreach"
            onClick={() => runLeadOutreach(lead.id)}
          />
        ))}
      </Panel>

      <Panel title="Brand Queue" action={`${stats.contentReady} ready`}>
        {content.map((item) => (
          <Row
            key={item.id}
            title={item.title}
            meta={`${item.source} - ${item.channel}`}
            value={item.status}
            tone={statusTone(item.status)}
          />
        ))}
      </Panel>

      <Panel title="Audit Trail" action="Live">
        <AuditList audit={audit} />
      </Panel>
    </section>
  );
}

function CalendarPage({ events, invoices, leads, payroll }) {
  const items = sortByDateAsc([
    ...events.map((event) => ({
      id: event.id,
      title: event.name,
      kind: event.type,
      when: formatDateTimeLabel(eventStartValue(event)),
      detail: `${event.assigned}/${event.required} staffed`,
      tone: statusTone(scoreEventRisk(event)),
      sortAt: eventStartValue(event),
    })),
    ...invoices.map((invoice) => ({
      id: invoice.id,
      title: `${invoice.client} invoice due`,
      kind: "Collections",
      when: invoice.due,
      detail: currency(invoice.amount),
      tone: statusTone(invoice.status),
      sortAt: invoice.dueDate ? new Date(invoice.dueDate) : parseTimelineValue(invoice.due),
    })),
    ...leads.slice(0, 3).map((lead) => ({
      id: lead.id,
      title: `${lead.company} outreach`,
      kind: "CRM",
      when: lead.scheduledFor ? formatDateTimeLabel(lead.scheduledFor) : "This week",
      detail: lead.next,
      tone: "neutral",
      sortAt: lead.scheduledFor ? new Date(lead.scheduledFor) : new Date(),
    })),
    {
      id: "PAYROLL-DATE",
      title: "Paychex review close",
      kind: "Payroll",
      when: payroll.period,
      detail: `${payroll.exceptions.length} open exceptions`,
      tone: payroll.exceptions.length ? "warn" : "good",
      sortAt: payroll.reviewCloseAt ? new Date(payroll.reviewCloseAt) : new Date(),
    },
  ], (item) => item.sortAt);

  return (
    <section className="page-grid two-col">
      <PageIntro
        title="Master Operations Calendar"
        text="Jobs, recurring coverage, collections deadlines, payroll readiness, CRM follow-ups, onboarding, and content timing all live in one operating timeline."
      />
      <Panel title="Calendar Feed" action={`${items.length} tracked items`}>
        {items.map((item) => (
          <Row
            key={item.id}
            title={item.title}
            meta={`${item.kind} - ${item.detail}`}
            value={item.when}
            tone={item.tone}
          />
        ))}
      </Panel>
      <Panel title="Calendar Intelligence" action="AI Review">
        <div className="insight-list">
          <p>Atlanta United remains the highest staffing risk before the next event window.</p>
          <p>Payroll close and overdue collections should stay visible on the same operating calendar.</p>
          <p>CRM planning items convert cleanly into events once a prospect moves into discovery.</p>
        </div>
      </Panel>
    </section>
  );
}

function SchedulingPage({ recommendations, applyRecommendation, assignmentBook }) {
  return (
    <section className="page-grid">
      <PageIntro
        title="Scheduling Engine"
        text="Recommendations are generated from city, availability, certifications, armed status, travel radius, and current load. Apply a team to move it into the assignment plan."
      />
      <div className="schedule-grid">
        {recommendations.map((recommendation) => (
          <Panel key={recommendation.eventId} title={recommendation.event} action={recommendation.risk}>
            <div className="schedule-meta">
              <span>{recommendation.date}</span>
              <span>{recommendation.city}</span>
              <span>{recommendation.recommended}/{recommendation.needed} recommended</span>
            </div>
            {recommendation.team.map((associate) => (
              <Row
                key={associate.id}
                title={associate.name}
                meta={`${associate.role} - ${associate.certs.join(", ")}`}
                value={associate.matchScore}
                tone="good"
              />
            ))}
            {recommendation.gaps > 0 && (
              <p className="warning-copy">{recommendation.gaps} posts still need recruiting or manual assignment.</p>
            )}
            <div className="button-row">
              <button onClick={() => applyRecommendation(recommendation.eventId)}>Apply Recommendation</button>
              <span className="meta-copy">
                {assignmentBook[recommendation.eventId]?.length
                  ? `${assignmentBook[recommendation.eventId].length} associate(s) currently in assignment plan`
                  : "No confirmed assignment plan yet"}
              </span>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}

function AssociatesPage({ associates, intakeLinks, createAssociateLink, sendAssociateInvite }) {
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    city: "",
    role: "Officer",
  });

  return (
    <section className="page-grid">
      <PageIntro
        title="Associates"
        text="Collect profiles by secure link, track certifications and city coverage, and keep every associate scheduling-ready."
        action={<button onClick={createAssociateLink}>Create Intake Link</button>}
      />
      <div className="two-col">
        <Panel title="Intake Links" action={`${intakeLinks.length} active`}>
          <div className="list-stack">
            {intakeLinks.map((link) => (
              <div className="data-row action-row" key={link.id}>
                <div>
                  <strong>{link.associateName || link.label}</strong>
                  <p>{link.email} - {normalizeInviteUrl(link.url)}</p>
                </div>
                <div className="row-actions">
                  <span className={`pill ${statusTone(link.status)}`}>{link.status}</span>
                  <button
                    className="ghost"
                    onClick={() => openExternalUrl(normalizeInviteUrl(link.url))}
                  >
                    Open Link
                  </button>
                  <button
                    className="ghost"
                    onClick={() => {
                      const emailDraft = link.gmailUrl
                        || buildGmailComposeUrl(
                          link.email,
                          buildInviteEmail(link.associateName || "Associate", normalizeInviteUrl(link.url)).subject,
                          buildInviteEmail(link.associateName || "Associate", normalizeInviteUrl(link.url)).body
                        );
                      openExternalUrl(emailDraft);
                    }}
                  >
                    Gmail Draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Send Associate Invite" action="Email intake link">
          <div className="form-grid compact">
            <label className="field">
              <span>Name</span>
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="New associate name" />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="associate@email.com" />
            </label>
            <label className="field">
              <span>City</span>
              <input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} placeholder="Atlanta" />
            </label>
            <label className="field">
              <span>Role</span>
              <input value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} placeholder="Officer" />
            </label>
          </div>
          <div className="button-row top-gap">
            <button
              onClick={() => {
                if (!draft.name.trim() || !draft.email.trim()) return;
                sendAssociateInvite({
                  name: draft.name.trim(),
                  email: draft.email.trim(),
                  city: draft.city.trim(),
                  role: draft.role.trim(),
                });
                setDraft({ name: "", email: "", city: "", role: "Officer" });
              }}
            >
              Send Profile Invite
            </button>
            <button className="secondary" onClick={createAssociateLink}>Create Open Link</button>
          </div>
        </Panel>
      </div>
      <Panel title="Readiness Summary" action={`${associates.length} associates`}>
        <div className="insight-list">
          <p>{associates.filter((associate) => associate.status === "Ready").length} associates are ready for immediate scheduling.</p>
          <p>{associates.filter((associate) => associate.status === "Profile Pending").length} profiles still need onboarding completion.</p>
          <p>{associates.filter((associate) => associate.status === "Needs Cert").length} associates need credential follow-up.</p>
        </div>
      </Panel>
      <div className="cards-grid">
        {associates.map((associate) => (
          <article className="profile-card" key={associate.id}>
            <div className="profile-head">
              <div className="avatar">{initials(associate.name)}</div>
              <div>
                <h3>{associate.name}</h3>
                <p>{associate.role} - {associate.city}</p>
              </div>
              <span className={`pill ${statusTone(associate.status)}`}>{associate.status}</span>
            </div>
            <div className="tag-wrap">
              {associate.certs.map((cert) => <span key={cert}>{cert}</span>)}
            </div>
            <div className="availability-list">
              {associate.availability.map((slot) => <p key={slot}>{slot}</p>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PayrollPage({
  payroll,
  timecards,
  syncPaychex,
  approvePayrollEntry,
  clockAssociateIn,
  clockAssociateOut,
  paychexConnection,
  paychexSyncBusy,
  paychexNotice,
}) {
  const outstanding = payroll.entries.filter((entry) => entry.status !== "Approved").length;
  const timeClockFeed = sortByDateAsc(
    timecards.filter((timecard) => ["Scheduled", "On Duty", "Completed"].includes(timecard.status)),
    (timecard) => new Date(timecard.scheduledStart)
  );
  const pendingClockSync = timeClockFeed.filter((timecard) => timecard.paychexStatus === "Pending Sync").length;

  return (
    <section className="page-grid">
      <PageIntro
        title="Payroll + Paychex"
        text="SSP Command tracks payroll readiness, exceptions, and completed timecards while Paychex remains the payroll system of record."
        action={
          <button onClick={syncPaychex} disabled={paychexSyncBusy}>
            {paychexSyncBusy ? "Syncing..." : "Sync Paychex"}
          </button>
        }
      />
      <KpiStrip
        items={[
          ["Pay Period", payroll.period],
          ["Sync Status", payroll.syncStatus],
          ["Last Sync", payroll.lastSync],
          ["Pending Entries", outstanding],
        ]}
      />
      <div className="two-col">
        <Panel
          title="Paychex Connection"
          action={paychexConnection?.readyForSync ? "Ready" : "Needs setup"}
        >
          <div className="insight-list">
            <p>{paychexConnection?.summary || "Paychex connection has not been checked yet."}</p>
            {paychexConnection?.companyIdMasked && (
              <p>Linked company: {paychexConnection.companyIdMasked}</p>
            )}
            {paychexConnection?.displayIdMasked && (
              <p>Client display ID: {paychexConnection.displayIdMasked}</p>
            )}
            {paychexConnection?.componentName && (
              <p>Default earnings component: {paychexConnection.componentName}</p>
            )}
            {Array.isArray(paychexConnection?.missing) && paychexConnection.missing.length > 0 && (
              <p>Missing config: {paychexConnection.missing.join(", ")}</p>
            )}
          </div>
        </Panel>
        <Panel
          title={paychexNotice?.title || "Sync Activity"}
          action={paychexNotice ? paychexNotice.tone : "Idle"}
        >
          <div className={`callout ${paychexNotice ? paychexNotice.tone : "neutral"}`}>
            <strong>{paychexNotice?.title || "Paychex is standing by."}</strong>
            <p>{paychexNotice?.text || "Run sync when completed timecards are ready for payroll export."}</p>
          </div>
        </Panel>
      </div>
      <div className="two-col">
        <Panel title="Paychex Exception Board" action={`${payroll.exceptions.length} open`}>
          <div className="insight-list">
            {payroll.exceptions.map((item) => <p key={item}>{item}</p>)}
          </div>
        </Panel>
        <Panel title="Time Clock Feed" action={`${pendingClockSync} pending sync`}>
          <div className="list-stack">
            {timeClockFeed.slice(0, 5).map((timecard) => {
              const actionLabel =
                timecard.status === "Scheduled"
                  ? "Clock In"
                  : timecard.status === "On Duty"
                    ? "Clock Out"
                    : timecard.paychexStatus === "Pending Sync"
                      ? "Pending Sync"
                      : timecard.paychexStatus === "Sync Error"
                        ? "Review Sync"
                        : "Synced";

              return (
                <ActionRow
                  key={timecard.id}
                  title={timecard.title}
                  meta={`${timecard.city} - ${formatShiftWindow(timecard.scheduledStart, timecard.scheduledEnd)} - ${timecard.paychexStatus}${timecard.paychexMessage ? ` - ${timecard.paychexMessage}` : ""}`}
                  value={timecard.status}
                  button={actionLabel}
                  disabled={timecard.status === "Completed"}
                  onClick={() =>
                    timecard.status === "Scheduled"
                      ? clockAssociateIn(timecard.associateId, timecard.id)
                      : clockAssociateOut(timecard.associateId, timecard.id)
                  }
                />
              );
            })}
          </div>
        </Panel>
      </div>
      <Panel title="Payroll Entries" action={payroll.syncStatus}>
        {payroll.entries.map((entry) => (
          <ActionRow
            key={entry.id}
            title={entry.name}
            meta={`${entry.hours}h @ ${currency(entry.rate)} / ${entry.issue}`}
            value={entry.status}
            button={entry.status === "Approved" ? "Approved" : "Approve"}
            disabled={entry.status === "Approved"}
            onClick={() => approvePayrollEntry(entry.id)}
          />
        ))}
      </Panel>
    </section>
  );
}

function InvoicesPage({ invoices, sendInvoiceReminder }) {
  return (
    <section className="page-grid">
      <PageIntro
        title="Invoices + Gmail"
        text="Collections workflow surfaces invoice status, Gmail thread state, reminder cadence, and the next communication action."
      />
      <div className="two-col">
        <Panel title="Receivables" action="Collections">
          {invoices.map((invoice) => (
            <ActionRow
              key={invoice.id}
              title={invoice.client}
              meta={`${invoice.id} - Due ${invoice.due} - Last contact ${invoice.lastContact}`}
              value={currency(invoice.amount)}
              button="Draft Reminder"
              onClick={() => sendInvoiceReminder(invoice.id)}
            />
          ))}
        </Panel>
        <Panel title="Gmail Thread Health" action="One-click">
          <div className="insight-list">
            {invoices.map((invoice) => (
              <p key={invoice.id}>
                {invoice.client}: {invoice.thread}. {invoice.reminders} reminder{invoice.reminders === 1 ? "" : "s"} logged.
              </p>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function CrmPage({ leads, runLeadOutreach, convertLeadToEvent }) {
  return (
    <section className="page-grid">
      <PageIntro
        title="SSP CRM Engine"
        text="Track opportunities for festivals, sports, concerts, venues, campuses, hospitals, executive protection, and recurring security contracts."
      />
      <div className="cards-grid">
        {leads.map((lead) => (
          <article className="lead-card" key={lead.id}>
            <span className="lead-score">{lead.priority}</span>
            <p className="eyebrow">{lead.type}</p>
            <h3>{lead.company}</h3>
            <p>{lead.contact} - {lead.city}</p>
            <div className="lead-meta">
              <span>{currency(lead.value)}</span>
              <span>{lead.stage}</span>
            </div>
            <p className="next-action">{lead.next}</p>
            <div className="button-row">
              <button onClick={() => runLeadOutreach(lead.id)}>One-click Outreach</button>
              <button className="secondary" onClick={() => convertLeadToEvent(lead.id)}>Create Event</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LinkedInPage({ content, events, queueContent, generateRecapFromEvent }) {
  return (
    <section className="page-grid two-col">
      <PageIntro
        title="LinkedIn Brand Studio"
        text="Turn completed jobs and associate spotlights into content in SSP voice, then queue for LinkedIn publishing."
      />
      <Panel title="Content Queue" action="Publishing">
        {content.map((item) => (
          <ActionRow
            key={item.id}
            title={item.title}
            meta={`${item.source} - ${item.channel}`}
            value={item.status}
            button="Queue"
            onClick={() => queueContent(item.id)}
            disabled={item.status === "Queued"}
          />
        ))}
      </Panel>
      <Panel title="Generate From Operations" action="AI Draft">
        <div className="list-stack">
          {events.map((event) => (
            <ActionRow
              key={event.id}
              title={event.name}
              meta={`${event.type} - ${event.client}`}
              value={event.status}
              button="Create Recap"
              onClick={() => generateRecapFromEvent(event.id)}
            />
          ))}
        </div>
      </Panel>
    </section>
  );
}

function UsersPage({ users, currentRole, inviteUser, audit }) {
  return (
    <section className="page-grid">
      <PageIntro
        title="User Management"
        text="Create logins for owners, admins, managers, and associates with role-based permissions and scoped access."
        action={
          <div className="button-row">
            <button onClick={() => inviteUser("admin")}>Invite Admin</button>
            <button className="secondary" onClick={() => inviteUser("manager")}>Invite Manager</button>
            <button className="secondary" onClick={() => inviteUser("associate")}>Invite Associate</button>
          </div>
        }
      />
      <div className="two-col">
        <Panel title="Users" action={`${users.length} accounts`}>
          {users.map((user) => (
            <Row
              key={user.id}
              title={user.name}
              meta={`${user.email} - ${ROLE_LABELS[user.role]} - ${user.scope}`}
              value={user.status}
              tone={statusTone(user.status)}
            />
          ))}
        </Panel>
        <Panel title="Permission Matrix" action={`${ROLE_LABELS[currentRole]} view`}>
          <div className="permission-grid">
            {Object.entries(PERMISSION_PRESETS).map(([role, permissions]) => (
              <div key={role} className="permission-card">
                <h3>{ROLE_LABELS[role]}</h3>
                {permissions.map((permission) => <p key={permission}>{permission}</p>)}
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Recent Access Activity" action="Audit">
        <AuditList audit={audit.slice(0, 6)} />
      </Panel>
    </section>
  );
}

function CopilotPage({ stats, recommendations, invoices, leads, payroll, runLeadOutreach, syncPaychex }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Ask me about staffing, invoices, Paychex readiness, leads, or brand actions.",
    },
  ]);
  const [input, setInput] = useState("Who can cover Atlanta events this week?");

  const answer = () => {
    const query = input.toLowerCase();
    let text = `Current operating summary: ${stats.openShifts} open shifts, ${stats.overdue} overdue invoices, ${stats.hotLeads} hot leads, and ${stats.payrollExceptions} payroll exceptions.`;

    if (query.includes("cover") || query.includes("staff")) {
      const highestRisk = recommendations.find((item) => item.gaps > 0);
      text = highestRisk
        ? `Highest staffing risk is ${highestRisk.event}. Top candidates are ${highestRisk.team.map((associate) => associate.name).join(", ")}.`
        : "Current schedule recommendations show full coverage on tracked events.";
    } else if (query.includes("invoice") || query.includes("paid")) {
      const overdue = invoices.filter((invoice) => invoice.status === "Overdue").map((invoice) => invoice.client).join(", ");
      text = overdue
        ? `Collections priority: ${overdue}. Draft reminders today and keep them visible on the command dashboard.`
        : "No overdue invoices are active right now.";
    } else if (query.includes("lead") || query.includes("outreach")) {
      text = `Best outreach targets today: ${leads.slice(0, 3).map((lead) => lead.company).join(", ")}.`;
    } else if (query.includes("payroll") || query.includes("paychex")) {
      text = `Paychex status is ${payroll.syncStatus}. ${payroll.exceptions.length} exception${payroll.exceptions.length === 1 ? "" : "s"} still need attention.`;
    }

    setMessages((items) => [...items, { role: "user", text: input }, { role: "ai", text }]);
    setInput("");
  };

  return (
    <section className="page-grid two-col">
      <PageIntro
        title="AI Copilot"
        text="Operational AI that summarizes the business, answers cross-system questions, and prepares approved actions."
      />
      <Panel title="Conversation" action="Operational AI">
        <div className="chat-log">
          {messages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={index}>{message.text}</div>
          ))}
        </div>
        <div className="chat-input">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask SSP Command..."
          />
          <button onClick={answer}>Ask</button>
        </div>
      </Panel>
      <Panel title="Approved AI Actions" action="One-click">
        <div className="button-column">
          <button onClick={syncPaychex}>Sync Paychex</button>
          <button className="secondary" onClick={() => runLeadOutreach(leads[0].id)}>Draft outreach for top lead</button>
        </div>
        <div className="insight-list">
          <p>Auto-run stays off for external actions until you explicitly approve recurring automations.</p>
          <p>Gmail, LinkedIn, and payroll flows remain approval-gated by default.</p>
        </div>
      </Panel>
    </section>
  );
}

function AssociateAssignmentsPage({ associate, recommendations, assignmentBook, payroll, timecards, clockAssociateIn, clockAssociateOut }) {
  const suggestedAssignments = sortByDateAsc(
    recommendations
      .filter((recommendation) => {
        const confirmed = assignmentBook[recommendation.eventId] || [];
        return !confirmed.includes(associate.id) && recommendation.team.some((person) => person.id === associate.id);
      })
      .map((recommendation) => ({
        ...recommendation,
        state: "Recommended",
      })),
    (recommendation) => parseTimelineValue(recommendation.date)
  );

  const upcomingSchedule = sortByDateAsc(
    timecards.filter((timecard) => timecard.associateId === associate.id && ["Scheduled", "On Duty"].includes(timecard.status)),
    (timecard) => new Date(timecard.scheduledStart)
  );
  const pastSchedule = sortByDateDesc(
    timecards.filter((timecard) => timecard.associateId === associate.id && timecard.status === "Completed"),
    (timecard) => new Date(timecard.clockOut || timecard.scheduledEnd)
  );
  const paycheckHistory = sortByDateDesc(
    payroll.history.filter((item) => item.associateId === associate.id),
    (item) => new Date(item.paidOnAt || parseMonthDayLabel(item.paidOn))
  );
  const liveShift = upcomingSchedule.find((timecard) => timecard.status === "On Duty") || null;
  const nextShift = liveShift || upcomingSchedule[0] || null;
  const pendingSyncCount = timecards.filter(
    (timecard) => timecard.associateId === associate.id && timecard.paychexStatus === "Pending Sync"
  ).length;

  return (
    <section className="page-grid">
      <PageIntro
        title="My Schedule"
        text="See upcoming coverage, completed shifts, paycheck history, and live time-clock status in one place."
      />
      <KpiStrip
        items={[
          ["Current City", associate.city],
          ["Next Shift", nextShift ? formatDateLabel(nextShift.scheduledStart) : "None"],
          ["Past Shifts", pastSchedule.length],
          ["Pending Sync", pendingSyncCount],
        ]}
      />
      <div className="two-col">
        <Panel title="Time Clock" action={liveShift ? "On Duty" : "Ready"}>
          {nextShift ? (
            <div className="insight-list">
              <p><strong>{nextShift.title}</strong></p>
              <p>{formatShiftWindow(nextShift.scheduledStart, nextShift.scheduledEnd)} - {nextShift.city}</p>
              <p>Paychex: {nextShift.paychexStatus}</p>
              <div className="button-row top-gap">
                {nextShift.status === "Scheduled" && (
                  <button onClick={() => clockAssociateIn(associate.id, nextShift.id)}>Clock In</button>
                )}
                {nextShift.status === "On Duty" && (
                  <button onClick={() => clockAssociateOut(associate.id, nextShift.id)}>Clock Out</button>
                )}
                <button className="secondary" disabled={nextShift.status === "Completed"}>
                  {nextShift.status}
                </button>
              </div>
            </div>
          ) : (
            <p className="empty">No scheduled shift is ready for time clock actions right now.</p>
          )}
        </Panel>
        <Panel title="Upcoming Schedule" action={`${upcomingSchedule.length} confirmed`}>
          {upcomingSchedule.length ? upcomingSchedule.map((timecard) => (
            <Row
              key={timecard.id}
              title={timecard.title}
              meta={`${formatShiftWindow(timecard.scheduledStart, timecard.scheduledEnd)} - ${timecard.city}`}
              value={timecard.status}
              tone={statusTone(timecard.status)}
            />
          )) : <p className="empty">No confirmed upcoming assignments are attached to your profile.</p>}
        </Panel>
      </div>
      <div className="two-col">
        <Panel title="Past Schedule" action={`${pastSchedule.length} completed`}>
          {pastSchedule.length ? pastSchedule.map((timecard) => (
            <Row
              key={timecard.id}
              title={timecard.title}
              meta={`${formatShiftWindow(timecard.scheduledStart, timecard.scheduledEnd)} - ${timecard.city}`}
              value={`${timecard.hours}h`}
              tone={statusTone(timecard.paychexStatus)}
            />
          )) : <p className="empty">Completed shifts will appear here after clock-out.</p>}
        </Panel>
        <Panel title="Paycheck History" action={`${paycheckHistory.length} records`}>
          {paycheckHistory.length ? paycheckHistory.map((entry) => (
            <Row
              key={entry.id}
              title={entry.period}
              meta={`${entry.status} - Paid ${entry.paidOn}`}
              value={currency(entry.net)}
              tone="good"
            />
          )) : <p className="empty">Paycheck history will appear once Paychex payouts are recorded.</p>}
        </Panel>
      </div>
      {suggestedAssignments.length > 0 && (
        <Panel title="Recommended Opportunities" action={`${suggestedAssignments.length} suggested`}>
          {suggestedAssignments.map((assignment) => (
            <Row
              key={assignment.eventId}
              title={assignment.event}
              meta={`${assignment.date} - ${assignment.city} - ${assignment.needed} total posts`}
              value={assignment.state}
              tone={statusTone(assignment.state)}
            />
          ))}
        </Panel>
      )}
    </section>
  );
}

function AssociateProfilePage({ associate, onSave }) {
  const [draft, setDraft] = useState(associate);

  useEffect(() => {
    setDraft(associate);
  }, [associate]);

  return (
    <section className="page-grid">
      <PageIntro
        title="My Profile"
        text="Keep your city, contact details, travel radius, and preferred roles up to date so scheduling stays accurate."
        action={<button onClick={() => onSave(associate.id, draft)}>Save Profile</button>}
      />
      <div className="form-grid">
        <label className="field">
          <span>Full Name</span>
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label className="field">
          <span>Role</span>
          <input value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} />
        </label>
        <label className="field">
          <span>City</span>
          <input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
        </label>
        <label className="field">
          <span>Email</span>
          <input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
        </label>
        <label className="field">
          <span>Travel Radius (miles)</span>
          <input type="number" value={draft.radius} onChange={(event) => setDraft({ ...draft, radius: Number(event.target.value) })} />
        </label>
        <label className="field full">
          <span>Preferred Roles</span>
          <input value={draft.preferredRoles.join(", ")} onChange={(event) => setDraft({ ...draft, preferredRoles: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
        </label>
        <label className="field full">
          <span>Notes</span>
          <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={5} />
        </label>
        <label className="checkbox-row full">
          <input type="checkbox" checked={draft.armed} onChange={(event) => setDraft({ ...draft, armed: event.target.checked })} />
          <span>Armed status is current and accurate</span>
        </label>
      </div>
    </section>
  );
}

function AssociateAvailabilityPage({ associate, onAdd, onRemove }) {
  const [slot, setSlot] = useState("");

  return (
    <section className="page-grid">
      <PageIntro
        title="My Availability"
        text="Availability drives the scheduling engine. Add city-specific days and times as often as they change."
      />
      <div className="two-col">
        <Panel title="Current Availability" action={`${associate.availability.length} slots`}>
          <div className="list-stack">
            {associate.availability.map((item) => (
              <ActionRow
                key={item}
                title={item}
                meta={associate.city}
                value="Saved"
                button="Remove"
                onClick={() => onRemove(associate.id, item)}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Add Availability" action="Scheduling ready">
          <div className="availability-editor">
            <input value={slot} onChange={(event) => setSlot(event.target.value)} placeholder="Example: Fri 18:00-02:00" />
            <button
              onClick={() => {
                onAdd(associate.id, slot);
                setSlot("");
              }}
            >
              Add Slot
            </button>
          </div>
          <div className="insight-list">
            <p>Use one line per day and time window.</p>
            <p>Updates here should feed straight into staffing recommendations.</p>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function AssociateSupportPage({ associate, audit }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: `Hi ${associate.name.split(" ")[0]}, I can help with profile updates, assignment questions, and availability guidance.` },
  ]);
  const [input, setInput] = useState("When should I update my availability?");

  const send = () => {
    const query = input.toLowerCase();
    let reply = "Keep your profile current so operations can match you accurately.";
    if (query.includes("availability")) {
      reply = "Update availability as soon as your schedule changes. The scheduling engine uses it directly when building coverage recommendations.";
    } else if (query.includes("assignment")) {
      reply = "Assignments marked confirmed are already in the active plan. Recommended assignments are still pending admin approval.";
    } else if (query.includes("profile")) {
      reply = "Use the profile page to update your city, travel radius, preferred roles, and notes. Those fields affect matching quality.";
    }

    setMessages((items) => [...items, { role: "user", text: input }, { role: "ai", text: reply }]);
    setInput("");
  };

  return (
    <section className="page-grid two-col">
      <PageIntro
        title="Support"
        text="Use the portal assistant for profile, assignment, and availability questions."
      />
      <Panel title="Associate Copilot" action="AI Support">
        <div className="chat-log">
          {messages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={index}>{message.text}</div>
          ))}
        </div>
        <div className="chat-input">
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask for help..." />
          <button onClick={send}>Send</button>
        </div>
      </Panel>
      <Panel title="Recent Company Activity" action="Awareness">
        <AuditList audit={audit.slice(0, 5)} />
      </Panel>
    </section>
  );
}

function KpiStrip({ items }) {
  return (
    <div className="kpi-strip">
      {items.map(([label, value]) => (
        <div className="kpi" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function PageIntro({ title, text, action }) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">SSP Operating System</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {action && <span>{action}</span>}
      </div>
      {children}
    </section>
  );
}

function Row({ title, meta, value, tone = "neutral" }) {
  return (
    <div className="data-row">
      <div>
        <strong>{title}</strong>
        <p>{meta}</p>
      </div>
      <span className={`pill ${tone}`}>{value}</span>
    </div>
  );
}

function ActionRow({ title, meta, value, button, onClick, disabled = false }) {
  return (
    <div className="data-row action-row">
      <div>
        <strong>{title}</strong>
        <p>{meta}</p>
      </div>
      <div className="row-actions">
        <span>{value}</span>
        <button className={disabled ? "ghost" : ""} onClick={onClick} disabled={disabled}>
          {button}
        </button>
      </div>
    </div>
  );
}

function AuditList({ audit }) {
  return (
    <div className="audit-list">
      {audit.map((item) => (
        <div className="audit-item" key={item.id}>
          <div>
            <strong>{item.actor}</strong>
            <p>{item.text}</p>
          </div>
          <span>{item.time}</span>
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

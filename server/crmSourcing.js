const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-mini";

export class CrmSourcingError extends Error {
  constructor(message, { status = 500, details = null } = {}) {
    super(message);
    this.name = "CrmSourcingError";
    this.status = status;
    this.details = details;
  }
}

function cleanText(value, fallback = "") {
  return String(value || fallback).trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function splitList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean);
  const items = cleanText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

function leadTimeDaysForDate(date) {
  if (!date) return 0;
  const target = new Date(`${date}T12:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
}

function planningStageForLeadTime(days, minimumLeadDays) {
  if (!days) return "Date needed";
  if (days < minimumLeadDays) return "Too close";
  if (days < minimumLeadDays + 60) return "Active planning";
  if (days <= 540) return "Planning window";
  return "Early watch";
}

function normalizeCriteria(criteria = {}) {
  const eventTypes = splitList(criteria.eventTypes, ["Festival", "Sports Event", "Concert", "Large Scale Event"]);
  const region = cleanText(criteria.region, "United States");
  const minimumLeadDays = clamp(toNumber(criteria.minimumLeadDays, 120), 45, 365);
  const horizonMonths = clamp(toNumber(criteria.horizonMonths, 18), 3, 36);
  const minCapacity = Math.max(0, toNumber(criteria.minCapacity, 1000));

  return {
    region,
    eventTypes,
    minCapacity,
    minimumLeadDays,
    horizonMonths,
    decisionSignals: splitList(criteria.decisionSignals, [
      "RFP",
      "vendor application",
      "sponsorship packet",
      "event permit",
      "planning committee",
    ]),
    notes: cleanText(criteria.notes),
  };
}

export function buildSourcingQueries(criteria = {}) {
  const normalized = normalizeCriteria(criteria);
  const typeQuery = normalized.eventTypes.join(" OR ");
  const signals = normalized.decisionSignals.join(" OR ");

  return [
    `${normalized.region} (${typeQuery}) ${signals} security vendor ${new Date().getFullYear() + 1}`,
    `${normalized.region} festival concert sports event vendor application security operations planning`,
    `${normalized.region} major event RFP crowd management private security upcoming`,
    `${normalized.region} convention festival race concert planning committee security vendor`,
  ];
}

function buildPrompt(criteria, queries) {
  return [
    "You are the CRM Mastermind for Special Services Protection, an Atlanta security company.",
    "Find real public event opportunities that fit SSP's security services. Prioritize large-scale events, festivals, sports events, concerts, venue operations, conventions, races, campuses, hospitals, and executive protection opportunities.",
    "",
    "Hard rules:",
    criteria.region.toLowerCase().includes("united states") || criteria.region.toLowerCase().includes("nationwide")
      ? "- Include events anywhere in the United States. Prefer major markets and events large enough to justify travel, advance planning, and multi-post staffing."
      : `- Only include events in or near ${criteria.region}.`,
    `- Prefer events at least ${criteria.minimumLeadDays} days away so SSP has time for outreach, discovery, site planning, and staffing.`,
    `- Prefer expected capacity of ${criteria.minCapacity.toLocaleString()}+ when public information supports it.`,
    `- Look for planning signals: ${criteria.decisionSignals.join(", ")}.`,
    "- Do not include past events, events happening immediately, or opportunities without enough public signal to justify outreach.",
    "- Every candidate must include a source URL and a clear reason it fits.",
    "- If capacity is not public, estimate conservatively from venue/event context and explain that in the profile.",
    "",
    `Search queries to use as starting points: ${queries.join(" | ")}`,
    criteria.notes ? `Operator notes: ${criteria.notes}` : "",
  ].filter(Boolean).join("\n");
}

function eventCandidateSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      candidates: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            company: { type: "string" },
            eventName: { type: "string" },
            contact: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            type: { type: "string" },
            city: { type: "string" },
            venue: { type: "string" },
            eventDate: { type: "string", description: "YYYY-MM-DD when known, otherwise empty string" },
            startTime: { type: "string" },
            endTime: { type: "string" },
            expectedCapacity: { type: "number" },
            staffingNeeds: { type: "number" },
            requiredRoles: { type: "array", items: { type: "string" } },
            securityNeeds: { type: "string" },
            profile: { type: "string" },
            value: { type: "number" },
            stage: { type: "string" },
            priority: { type: "number" },
            next: { type: "string" },
            sourceName: { type: "string" },
            sourceUrl: { type: "string" },
            planningStage: { type: "string" },
            fitReason: { type: "string" },
            citations: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  };
}

function outputText(response) {
  if (typeof response.output_text === "string") return response.output_text;
  const parts = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n");
}

function parseJsonPayload(text) {
  const cleaned = cleanText(text).replace(/^```json\s*|\s*```$/g, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new CrmSourcingError("CRM agent returned an unreadable response.", { status: 502 });
    return JSON.parse(match[0]);
  }
}

function normalizeCandidate(candidate, criteria) {
  const eventDate = cleanText(candidate.eventDate);
  const leadTimeDays = leadTimeDaysForDate(eventDate);
  const planningStage = candidate.planningStage || planningStageForLeadTime(leadTimeDays, criteria.minimumLeadDays);

  return {
    company: cleanText(candidate.company, candidate.eventName || "Event Organizer"),
    eventName: cleanText(candidate.eventName, candidate.company || "Sourced Event"),
    contact: cleanText(candidate.contact, "Decision maker TBD"),
    email: cleanText(candidate.email),
    phone: cleanText(candidate.phone),
    type: cleanText(candidate.type, "Large Scale Event"),
    city: cleanText(candidate.city, criteria.region),
    venue: cleanText(candidate.venue, "Venue TBD"),
    eventDate,
    startTime: cleanText(candidate.startTime, "09:00"),
    endTime: cleanText(candidate.endTime, "17:00"),
    expectedCapacity: Math.max(0, toNumber(candidate.expectedCapacity, 0)),
    staffingNeeds: Math.max(0, toNumber(candidate.staffingNeeds, 0)),
    requiredRoles: splitList(candidate.requiredRoles, ["Supervisor", "Crowd Control"]),
    securityNeeds: cleanText(candidate.securityNeeds, "Security scope pending discovery."),
    profile: cleanText(candidate.profile, "Public source identified this as a potential fit. Discovery still required."),
    value: Math.max(0, toNumber(candidate.value, 0)),
    stage: cleanText(candidate.stage, "Sourced"),
    priority: clamp(toNumber(candidate.priority, 70), 0, 100),
    next: cleanText(candidate.next, "Confirm decision maker and request event operations scope."),
    sourceName: cleanText(candidate.sourceName, "Public web"),
    sourceUrl: cleanText(candidate.sourceUrl),
    planningStage,
    leadTimeDays,
    fitReason: cleanText(candidate.fitReason, "Fits SSP target profile."),
    citations: Array.isArray(candidate.citations) ? candidate.citations : [],
  };
}

export async function sourcePlanningEvents(criteriaInput = {}) {
  const criteria = normalizeCriteria(criteriaInput);
  const queries = buildSourcingQueries(criteria);

  if (!process.env.OPENAI_API_KEY) {
    return {
      configured: false,
      summary: "CRM Mastermind is ready, but live event sourcing needs OPENAI_API_KEY in Vercel environment variables.",
      criteria,
      queries,
      candidates: [],
      searchedAt: new Date().toISOString(),
    };
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.CRM_AGENT_MODEL || DEFAULT_MODEL,
      reasoning: { effort: "low" },
      tools: [
        {
          type: "web_search",
          user_location: {
            country: "US",
            city: criteria.region.toLowerCase().includes("united states") || criteria.region.toLowerCase().includes("nationwide") ? undefined : "Atlanta",
            region: criteria.region.toLowerCase().includes("united states") || criteria.region.toLowerCase().includes("nationwide") ? undefined : "Georgia",
            timezone: "America/New_York",
          },
          search_context_size: "medium",
        },
      ],
      tool_choice: "auto",
      include: ["web_search_call.action.sources"],
      instructions: "Return only structured JSON that matches the schema. Preserve cited source URLs in each candidate.",
      input: buildPrompt(criteria, queries),
      text: {
        format: {
          type: "json_schema",
          name: "crm_event_sourcing",
          description: "Live event prospects for SSP CRM sourcing.",
          schema: eventCandidateSchema(),
          strict: false,
        },
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new CrmSourcingError(payload.error?.message || "CRM event sourcing failed.", {
      status: response.status,
      details: payload,
    });
  }

  const parsed = parseJsonPayload(outputText(payload));
  const candidates = (Array.isArray(parsed.candidates) ? parsed.candidates : [])
    .map((candidate) => normalizeCandidate(candidate, criteria))
    .filter((candidate) => candidate.sourceUrl || candidate.citations.length);

  return {
    configured: true,
    summary: cleanText(parsed.summary, `${candidates.length} planning-stage event candidate(s) found.`),
    criteria,
    queries,
    candidates,
    searchedAt: new Date().toISOString(),
  };
}

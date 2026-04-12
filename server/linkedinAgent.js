const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_LINKEDIN_VERSION = "202603";

export class LinkedInAgentError extends Error {
  constructor(message, { status = 500, details = null } = {}) {
    super(message);
    this.name = "LinkedInAgentError";
    this.status = status;
    this.details = details;
  }
}

function cleanText(value, fallback = "") {
  return String(value || fallback).trim();
}

function toList(value) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean);
  return cleanText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
    if (!match) {
      throw new LinkedInAgentError("LinkedIn agent returned an unreadable response.", { status: 502 });
    }
    return JSON.parse(match[0]);
  }
}

function getAuthorUrn() {
  if (process.env.LINKEDIN_AUTHOR_URN) return process.env.LINKEDIN_AUTHOR_URN;
  if (process.env.LINKEDIN_ORGANIZATION_ID) return `urn:li:organization:${process.env.LINKEDIN_ORGANIZATION_ID}`;
  if (process.env.LINKEDIN_PERSON_ID) return `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`;
  return "";
}

function friendlyOpenAiIssue(response, payload) {
  const code = payload?.error?.code || "";
  const message = cleanText(payload?.error?.message || payload?.error);

  if (code === "insufficient_quota" || /quota|billing/i.test(message)) {
    return {
      issue: "billing",
      title: "OpenAI quota needs attention.",
      summary: "LinkedIn Agent is connected to OpenAI, but the OpenAI project has no available API quota. Add billing or credits, then run the agent again.",
    };
  }

  if (response.status === 401 || /api key|auth|unauthorized/i.test(message)) {
    return {
      issue: "openai_key",
      title: "OpenAI key needs to be checked.",
      summary: "LinkedIn Agent could not authenticate with OpenAI. Check OPENAI_API_KEY in Vercel, then redeploy.",
    };
  }

  if (response.status === 429) {
    return {
      issue: "rate_limit",
      title: "OpenAI is rate limiting this request.",
      summary: "The LinkedIn Agent is connected but being rate limited. Wait a moment, then retry.",
    };
  }

  return {
    issue: "agent_error",
    title: "LinkedIn Agent could not finish.",
    summary: "The LinkedIn Agent hit a service error before it could return a content plan.",
  };
}

function normalizePost(post = {}, index = 0) {
  const body = cleanText(post.body || post.copy || post.text);
  const hashtags = toList(post.hashtags);

  return {
    title: cleanText(post.title, `SSP LinkedIn Post ${index + 1}`),
    angle: cleanText(post.angle, "Brand authority"),
    audience: cleanText(post.audience, "Security buyers and event operators"),
    source: cleanText(post.source, "LinkedIn Agent"),
    recommendedTiming: cleanText(post.recommendedTiming, "Next available posting window"),
    body,
    hashtags,
    callToAction: cleanText(post.callToAction, "Connect with Special Services Protection for security planning."),
    approvalNotes: cleanText(post.approvalNotes, "Review names, locations, and client permissions before publishing."),
  };
}

function linkedinPlanSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      contentStrategy: { type: "string" },
      approvalChecklist: { type: "array", items: { type: "string" } },
      posts: {
        type: "array",
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            angle: { type: "string" },
            audience: { type: "string" },
            source: { type: "string" },
            recommendedTiming: { type: "string" },
            body: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            callToAction: { type: "string" },
            approvalNotes: { type: "string" },
          },
        },
      },
    },
  };
}

function briefList(items, mapper, limit = 8) {
  return (Array.isArray(items) ? items : [])
    .slice(0, limit)
    .map(mapper)
    .filter(Boolean)
    .join("\n");
}

function buildLinkedInPrompt({ goal, context = {} }) {
  const events = briefList(context.events, (event) =>
    `- Event: ${event.name}; client ${event.client}; type ${event.type}; status ${event.status}; city ${event.city}; capacity ${event.expectedCapacity || 0}; staffing ${event.assigned || 0}/${event.required || 0}`
  );
  const leads = briefList(context.leads, (lead) =>
    `- Prospect: ${lead.eventName || lead.company}; company ${lead.company}; city ${lead.city}; date ${lead.eventDate || "TBD"}; capacity ${lead.expectedCapacity || 0}; stage ${lead.stage}; fit ${lead.fitReason || lead.securityNeeds || ""}`
  );
  const content = briefList(context.content, (item) =>
    `- Existing draft: ${item.title}; status ${item.status}; source ${item.source}`
  );
  const stats = context.stats
    ? `Operational stats: open shifts ${context.stats.openShifts || 0}, hot leads ${context.stats.hotLeads || 0}, overdue invoices ${context.stats.overdue || 0}, content ready ${context.stats.contentReady || 0}.`
    : "";
  const brief = cleanText(context.brief);
  const notes = cleanText(context.notes);

  return [
    "You are the LinkedIn Brand Agent for Special Services Protection, an Atlanta-based professional security company with national event capability.",
    "Create content for the SSP business page connected through an authorized personal LinkedIn admin account.",
    "The voice should feel elite, disciplined, operational, credible, and human. Avoid hype, fake claims, client confidentiality issues, and anything that implies law enforcement authority.",
    "Every post must be approval-ready and should support security buyers, large-scale events, festivals, sports events, corporate campuses, venues, and executive protection decision makers.",
    "",
    `Operator goal: ${cleanText(goal, "Build an SSP LinkedIn content plan from current operations and CRM opportunities.")}`,
    stats,
    brief ? `Executive brief: ${brief}` : "",
    events ? `Current events:\n${events}` : "Current events: none entered yet.",
    leads ? `CRM prospects:\n${leads}` : "CRM prospects: none entered yet.",
    content ? `Existing content queue:\n${content}` : "Existing content queue: empty.",
    notes ? `Operator notes: ${notes}` : "",
    "",
    "Return 3 to 5 posts. Include one strategic summary, one approval checklist, and post copy under 1,300 characters each. Do not invent completed client work; use neutral language when details are not confirmed.",
  ].join("\n");
}

export function getLinkedInStatus() {
  const authorUrn = getAuthorUrn();
  const missing = [];

  if (!process.env.LINKEDIN_ACCESS_TOKEN) missing.push("LINKEDIN_ACCESS_TOKEN");
  if (!authorUrn) missing.push("LINKEDIN_ORGANIZATION_ID or LINKEDIN_AUTHOR_URN");

  return {
    configured: missing.length === 0,
    publishingReady: missing.length === 0,
    accountMode: process.env.LINKEDIN_PERSON_ID && !process.env.LINKEDIN_ORGANIZATION_ID
      ? "Personal admin account"
      : "SSP business page through personal admin",
    requiredPageRoles: ["ADMINISTRATOR", "DIRECT_SPONSORED_CONTENT_POSTER", "CONTENT_ADMIN"],
    authorUrn: authorUrn ? authorUrn.replace(/(.{14}).+/, "$1...") : "",
    requiredScopes: ["w_organization_social", "r_organization_social"],
    optionalScopes: ["w_member_social"],
    missing,
    apiVersion: process.env.LINKEDIN_API_VERSION || DEFAULT_LINKEDIN_VERSION,
    summary: missing.length
      ? "LinkedIn Brand Studio can generate and approve posts now. Publishing needs the SSP business page access token and organization author configured in Vercel."
      : "LinkedIn publishing is connected for the SSP business page.",
  };
}

export async function runLinkedInAgent(input = {}) {
  const goal = cleanText(input.goal);

  if (!process.env.OPENAI_API_KEY) {
    return {
      configured: false,
      issue: "openai_setup",
      summary: "LinkedIn Brand Agent needs OPENAI_API_KEY before it can generate campaign plans.",
      contentStrategy: "",
      approvalChecklist: [],
      posts: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.LINKEDIN_AGENT_MODEL || process.env.CRM_AGENT_MODEL || DEFAULT_MODEL,
      reasoning: { effort: "low" },
      instructions: "Return only structured JSON that matches the schema.",
      input: buildLinkedInPrompt({ goal, context: input.context || {} }),
      text: {
        format: {
          type: "json_schema",
          name: "linkedin_content_plan",
          description: "LinkedIn content plan and approval-ready post drafts for SSP.",
          schema: linkedinPlanSchema(),
          strict: false,
        },
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const issue = friendlyOpenAiIssue(response, payload);
    return {
      configured: true,
      ...issue,
      contentStrategy: "",
      approvalChecklist: [],
      posts: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const parsed = parseJsonPayload(outputText(payload));
  const posts = (Array.isArray(parsed.posts) ? parsed.posts : [])
    .map((post, index) => normalizePost(post, index))
    .filter((post) => post.body);

  return {
    configured: true,
    issue: "",
    summary: cleanText(parsed.summary, `${posts.length} LinkedIn draft(s) prepared.`),
    contentStrategy: cleanText(parsed.contentStrategy),
    approvalChecklist: toList(parsed.approvalChecklist),
    posts,
    generatedAt: new Date().toISOString(),
  };
}

function linkedinErrorSummary(response, payloadText) {
  if (response.status === 401) return "LinkedIn rejected the access token. Reconnect the personal admin account or refresh LINKEDIN_ACCESS_TOKEN.";
  if (response.status === 403) return "LinkedIn denied publishing access. Confirm the personal account is an admin of the SSP business page and has organization posting scope.";
  if (response.status === 429) return "LinkedIn is rate limiting publishing. Wait a moment, then retry.";
  return payloadText || "LinkedIn publishing failed before the post could be created.";
}

export async function publishLinkedInPost(input = {}) {
  const status = getLinkedInStatus();
  const text = cleanText(input.text || input.body || input.copy);

  if (!text) {
    throw new LinkedInAgentError("Post text is required before publishing to LinkedIn.", { status: 400 });
  }

  if (!status.configured) {
    return {
      configured: false,
      published: false,
      summary: status.summary,
      missing: status.missing,
    };
  }

  const response = await fetch(LINKEDIN_POSTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": process.env.LINKEDIN_API_VERSION || DEFAULT_LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: getAuthorUrn(),
      commentary: text,
      visibility: input.visibility || "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!response.ok) {
    const payloadText = await response.text().catch(() => "");
    throw new LinkedInAgentError(linkedinErrorSummary(response, payloadText), {
      status: response.status,
      details: payloadText || null,
    });
  }

  return {
    configured: true,
    published: true,
    postId: response.headers.get("x-restli-id") || "",
    summary: "Post published to the SSP LinkedIn business page.",
    publishedAt: new Date().toISOString(),
  };
}

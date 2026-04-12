import {
  LinkedInAgentError,
  getLinkedInStatus,
  publishLinkedInPost,
  runLinkedInAgent,
} from "./linkedinAgent.js";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new LinkedInAgentError("Request body must be valid JSON.", { status: 400 });
  }
}

function withRoute(methods, handler) {
  return async function routeHandler(req, res) {
    if (!methods.includes(req.method)) {
      res.statusCode = 405;
      res.setHeader("Allow", methods.join(", "));
      sendJson(res, 405, { error: `Method not allowed. Use ${methods.join(", ")}.` });
      return;
    }

    try {
      const body = methods.includes("POST") ? await readJsonBody(req) : {};
      const payload = await handler({ body });
      sendJson(res, 200, payload);
    } catch (error) {
      const status = error instanceof LinkedInAgentError ? error.status : 500;
      sendJson(res, status, {
        error: error.message || "Unexpected server error.",
        details: error.details || null,
      });
    }
  };
}

export const handleLinkedInStatus = withRoute(["GET"], async () => getLinkedInStatus());

export const handleLinkedInAgent = withRoute(["POST"], async ({ body }) =>
  runLinkedInAgent(body || {})
);

export const handleLinkedInPublish = withRoute(["POST"], async ({ body }) =>
  publishLinkedInPost(body || {})
);

export const linkedInRouteHandlers = new Map([
  ["/api/linkedin/status", handleLinkedInStatus],
  ["/api/linkedin/agent", handleLinkedInAgent],
  ["/api/linkedin/publish", handleLinkedInPublish],
]);

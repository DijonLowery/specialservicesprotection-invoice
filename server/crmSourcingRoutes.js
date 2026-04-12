import { CrmSourcingError, sourcePlanningEvents } from "./crmSourcing.js";

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
    throw new CrmSourcingError("Request body must be valid JSON.", { status: 400 });
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
      const status = error instanceof CrmSourcingError ? error.status : 500;
      sendJson(res, status, {
        error: error.message || "Unexpected server error.",
        details: error.details || null,
      });
    }
  };
}

export const handleCrmSourceEvents = withRoute(["POST"], async ({ body }) =>
  sourcePlanningEvents(body?.criteria || body || {})
);

export const crmSourcingRouteHandlers = new Map([
  ["/api/crm/source-events", handleCrmSourceEvents],
]);

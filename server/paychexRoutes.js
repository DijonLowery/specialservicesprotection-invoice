import {
  PaychexSyncError,
  getPaychexStatus,
  requestPaychexClientAccess,
  syncTimecardsToPaychex,
} from "./paychex.js";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function methodNotAllowed(res, methods) {
  res.statusCode = 405;
  res.setHeader("Allow", methods.join(", "));
  sendJson(res, 405, {
    error: `Method not allowed. Use ${methods.join(", ")}.`,
  });
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
    throw new PaychexSyncError("Request body must be valid JSON.", { status: 400 });
  }
}

function withRoute(methods, handler) {
  return async function routeHandler(req, res) {
    if (!methods.includes(req.method)) {
      methodNotAllowed(res, methods);
      return;
    }

    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const body = methods.includes("POST") || methods.includes("PATCH") ? await readJsonBody(req) : {};
      const payload = await handler({
        req,
        query: Object.fromEntries(url.searchParams.entries()),
        body,
      });

      sendJson(res, 200, payload);
    } catch (error) {
      const status = error instanceof PaychexSyncError ? error.status : 500;
      sendJson(res, status, {
        error: error.message || "Unexpected server error.",
        details: error.details || null,
      });
    }
  };
}

export const handlePaychexStatus = withRoute(["GET"], async () => getPaychexStatus());

export const handlePaychexClientAccess = withRoute(["POST"], async ({ body, query }) =>
  requestPaychexClientAccess({
    displayId: body.displayId || query.displayId,
  })
);

export const handlePaychexSync = withRoute(["POST"], async ({ body }) =>
  syncTimecardsToPaychex(body || {})
);

export const paychexRouteHandlers = new Map([
  ["/api/paychex/status", handlePaychexStatus],
  ["/api/paychex/client-access", handlePaychexClientAccess],
  ["/api/paychex/sync", handlePaychexSync],
]);

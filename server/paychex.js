const PAYCHEX_API_BASE = "https://api.paychex.com";
const WORKER_COMMUNICATIONS_ACCEPT = "application/vnd.paychex.workers_communications.v1+json";
const OPEN_PAY_PERIOD_STATUSES = new Set(["ENTRY", "INITIAL"]);
const CLOSED_PAY_PERIOD_STATUSES = new Set([
  "COMPLETED",
  "COMPLETED_BY_MEC",
  "PROCESSING",
  "REISSUED",
  "RELEASED",
  "REVERSED",
]);

let tokenCache = {
  value: null,
  expiresAt: 0,
};

class PaychexSyncError extends Error {
  constructor(message, { status = 500, details = null } = {}) {
    super(message);
    this.name = "PaychexSyncError";
    this.status = status;
    this.details = details;
  }
}

function getPaychexConfig() {
  return {
    clientId: process.env.PAYCHEX_API_CLIENT_ID || "",
    clientSecret: process.env.PAYCHEX_API_CLIENT_SECRET || "",
    companyId: process.env.PAYCHEX_COMPANY_ID || "",
    displayId: process.env.PAYCHEX_CLIENT_DISPLAY_ID || "",
    earningComponentId: process.env.PAYCHEX_EARNING_COMPONENT_ID || "",
    earningComponentName: process.env.PAYCHEX_EARNING_COMPONENT_NAME || "Hourly",
  };
}

function getMissingConfig(config) {
  const missing = [];

  if (!config.clientId) missing.push("PAYCHEX_API_CLIENT_ID");
  if (!config.clientSecret) missing.push("PAYCHEX_API_CLIENT_SECRET");
  if (!config.companyId && !config.displayId) {
    missing.push("PAYCHEX_COMPANY_ID or PAYCHEX_CLIENT_DISPLAY_ID");
  }

  return missing;
}

function maskValue(value) {
  if (!value) return null;
  const stringValue = String(value);
  const tail = stringValue.slice(-4);
  return `${"*".repeat(Math.max(0, stringValue.length - 4))}${tail}`;
}

function toContentItems(payload) {
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload)) return payload;
  return [];
}

function firstItem(payload) {
  return toContentItems(payload)[0] || null;
}

function roundValue(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(Number(value || 0) * factor) / factor;
}

function normalizeLineDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date(Date.UTC(1970, 0, 1)).toISOString();
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

function parseNumericString(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesNumericValue(left, right) {
  const leftValue = parseNumericString(left);
  const rightValue = parseNumericString(right);

  if (leftValue === null || rightValue === null) return false;
  return Math.abs(leftValue - rightValue) < 0.01;
}

function buildAssociateName(associate) {
  return normalizeText(associate.name);
}

function buildWorkerName(worker) {
  const name = worker?.name || {};
  return normalizeText(
    [name.givenName, name.middleName, name.familyName].filter(Boolean).join(" ")
  );
}

function getWorkerEmail(worker) {
  const communications = Array.isArray(worker?.communications) ? worker.communications : [];
  const email = communications.find((item) => item?.type === "EMAIL" && item?.uri);
  return email?.uri ? String(email.uri).trim().toLowerCase() : "";
}

function formatPaychexError(payload, fallback) {
  if (!payload) return fallback;

  if (Array.isArray(payload.errors) && payload.errors.length) {
    return payload.errors
      .map((item) =>
        [item.code, item.description, item.resolution]
          .filter(Boolean)
          .join(": ")
      )
      .join(" | ");
  }

  if (payload.error) return String(payload.error);
  if (payload.raw) return String(payload.raw);
  if (typeof payload === "string") return payload;
  return fallback;
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function getAccessToken() {
  const config = getPaychexConfig();
  const missing = getMissingConfig(config);

  if (missing.length) {
    throw new PaychexSyncError(
      `Paychex is not configured. Missing ${missing.join(", ")}.`,
      { status: 503, details: { missing } }
    );
  }

  if (tokenCache.value && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(`${PAYCHEX_API_BASE}/auth/oauth/v2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new PaychexSyncError(
      formatPaychexError(payload, "Unable to authenticate with Paychex."),
      { status: response.status || 502, details: payload }
    );
  }

  if (!payload?.access_token) {
    throw new PaychexSyncError("Paychex authentication did not return an access token.", {
      status: 502,
      details: payload,
    });
  }

  const expiresIn = Number(payload.expires_in || 3600);
  tokenCache = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(expiresIn - 60, 60) * 1000,
  };

  return tokenCache.value;
}

async function paychexRequest(path, { method = "GET", headers = {}, body = null } = {}) {
  const token = await getAccessToken();
  const requestHeaders = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...headers,
  };

  let requestBody = body;
  if (body && !(body instanceof URLSearchParams) && typeof body !== "string") {
    requestBody = JSON.stringify(body);
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
  }

  const response = await fetch(`${PAYCHEX_API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new PaychexSyncError(
      formatPaychexError(payload, `Paychex ${method} ${path} failed.`),
      { status: response.status || 502, details: payload }
    );
  }

  return payload;
}

async function resolveCompanyContext(config = getPaychexConfig()) {
  if (config.companyId) {
    return {
      companyId: config.companyId,
      displayId: config.displayId || null,
    };
  }

  const displayId = String(config.displayId || "").replace(/\D/g, "").slice(-8);
  if (!displayId) {
    throw new PaychexSyncError(
      "Paychex company mapping is incomplete. Add PAYCHEX_COMPANY_ID or PAYCHEX_CLIENT_DISPLAY_ID.",
      { status: 400 }
    );
  }

  const companyPayload = await paychexRequest(`/companies?displayid=${encodeURIComponent(displayId)}`);
  const company = firstItem(companyPayload);

  if (!company?.companyId) {
    throw new PaychexSyncError("Paychex did not return a linked company for the configured display ID.", {
      status: 404,
      details: companyPayload,
    });
  }

  return {
    companyId: company.companyId,
    displayId: company.displayId || displayId,
  };
}

function payPeriodPriority(period, referenceDate) {
  const reference = new Date(referenceDate).getTime();
  const start = new Date(period.startDate).getTime();
  const end = new Date(period.endDate).getTime();
  const statusRank = period.status === "ENTRY" ? 0 : period.status === "INITIAL" ? 1 : 2;
  const containsReference = start <= reference && end >= reference ? 0 : 1;
  const distance = Math.abs(reference - start);

  return [containsReference, statusRank, distance];
}

function comparePriority(left, right) {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if ((left[index] || 0) < (right[index] || 0)) return -1;
    if ((left[index] || 0) > (right[index] || 0)) return 1;
  }
  return 0;
}

function choosePayPeriod(payload, referenceDate = new Date()) {
  const periods = toContentItems(payload);
  const openPeriods = periods.filter((period) => !CLOSED_PAY_PERIOD_STATUSES.has(period.status));
  const preferred = openPeriods.filter((period) => OPEN_PAY_PERIOD_STATUSES.has(period.status));
  const pool = preferred.length ? preferred : openPeriods;

  if (!pool.length) return null;

  return [...pool].sort((left, right) =>
    comparePriority(payPeriodPriority(left, referenceDate), payPeriodPriority(right, referenceDate))
  )[0];
}

async function resolvePayPeriod(companyId, referenceDate = new Date()) {
  const from = new Date(referenceDate);
  from.setDate(from.getDate() - 30);
  const to = new Date(referenceDate);
  to.setDate(to.getDate() + 30);

  const payload = await paychexRequest(
    `/companies/${companyId}/payperiods?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(
      to.toISOString()
    )}`
  );
  const payPeriod = choosePayPeriod(payload, referenceDate);

  if (!payPeriod?.payPeriodId) {
    throw new PaychexSyncError(
      "Paychex did not return an open pay period that SSP can post hours into.",
      { status: 409, details: payload }
    );
  }

  return payPeriod;
}

function matchesRegularEarning(component) {
  const effectOnPay = String(component?.effectOnPay || "").toUpperCase();
  const classification = String(component?.classificationType || "").toUpperCase();
  return effectOnPay === "ADDITION" && classification === "REGULAR";
}

async function resolveEarningComponent(companyId, config = getPaychexConfig()) {
  const payload = await paychexRequest(
    `/companies/${companyId}/paycomponents?effectonpay=${encodeURIComponent("ADDITION")}`
  );
  const components = toContentItems(payload);

  if (!components.length) {
    throw new PaychexSyncError("Paychex did not return any addition pay components for this company.", {
      status: 404,
      details: payload,
    });
  }

  if (config.earningComponentId) {
    const match = components.find((item) => item.componentId === config.earningComponentId);
    if (match) return match;
  }

  if (config.earningComponentName) {
    const targetName = normalizeText(config.earningComponentName);
    const exactName = components.find(
      (item) => normalizeText(item.name) === targetName && matchesRegularEarning(item)
    );
    if (exactName) return exactName;
  }

  const regular = components.find(matchesRegularEarning);
  if (regular) return regular;

  return components[0];
}

async function getCompanyWorkers(companyId) {
  return paychexRequest(`/companies/${companyId}/workers`, {
    headers: {
      Accept: WORKER_COMMUNICATIONS_ACCEPT,
    },
  });
}

function resolveWorkerForAssociate(workersPayload, associate) {
  const workers = toContentItems(workersPayload);

  if (!workers.length) {
    throw new PaychexSyncError("Paychex did not return any linked workers for this company.", {
      status: 404,
      details: workersPayload,
    });
  }

  if (associate.paychexWorkerId) {
    const direct = workers.find((worker) => worker.workerId === associate.paychexWorkerId);
    if (direct) return direct;
  }

  if (associate.paychexEmployeeId) {
    const employeeMatch = workers.find((worker) => worker.employeeId === associate.paychexEmployeeId);
    if (employeeMatch) return employeeMatch;
  }

  if (associate.paychexClockId) {
    const clockMatch = workers.find((worker) => worker.clockId === associate.paychexClockId);
    if (clockMatch) return clockMatch;
  }

  const associateEmail = String(associate.email || "").trim().toLowerCase();
  if (associateEmail) {
    const emailMatch = workers.find((worker) => getWorkerEmail(worker) === associateEmail);
    if (emailMatch) return emailMatch;
  }

  const associateName = buildAssociateName(associate);
  const nameMatches = workers.filter((worker) => buildWorkerName(worker) === associateName);
  if (nameMatches.length === 1) return nameMatches[0];

  if (nameMatches.length > 1) {
    throw new PaychexSyncError(
      `Multiple Paychex workers matched ${associate.name}. Add a Paychex worker ID for this associate.`,
      { status: 409 }
    );
  }

  throw new PaychexSyncError(
    `No Paychex worker match was found for ${associate.name}. Match by email or add a Paychex worker ID.`,
    { status: 404 }
  );
}

async function getWorkerChecks(workerId, payPeriodId) {
  return paychexRequest(
    `/workers/${workerId}/checks?payperiodid=${encodeURIComponent(payPeriodId)}`
  );
}

function buildEarningLine(component, timecard, rate) {
  return {
    componentId: component.componentId,
    name: component.name,
    classificationType: component.classificationType,
    effectOnPay: component.effectOnPay || "ADDITION",
    payHours: String(roundValue(timecard.hours, 2)),
    payRate: String(roundValue(rate, 2)),
    memoed: false,
    lineDate: normalizeLineDate(timecard.clockOut || timecard.scheduledEnd || timecard.scheduledStart),
  };
}

function findMatchingEarning(check, earningLine) {
  const earnings = Array.isArray(check?.earnings) ? check.earnings : [];

  return (
    earnings.find((earning) => {
      const earningLineDate = normalizeLineDate(earning.lineDate || check.checkDate || earning.startDate);

      return (
        String(earning.componentId || "") === String(earningLine.componentId || "") &&
        matchesNumericValue(earning.hours || earning.payHours, earningLine.payHours) &&
        matchesNumericValue(earning.rate || earning.payRate, earningLine.payRate) &&
        earningLineDate === normalizeLineDate(earningLine.lineDate)
      );
    }) || null
  );
}

async function createWorkerCheck(workerId, payPeriodId, earningLine, correlationId) {
  return paychexRequest(`/workers/${workerId}/checks`, {
    method: "POST",
    body: {
      payPeriodId,
      checkCorrelationId: correlationId,
      earnings: [earningLine],
    },
  });
}

async function addCheckComponent(checkId, earningLine) {
  return paychexRequest(`/checks/${checkId}/checkcomponents`, {
    method: "POST",
    body: earningLine,
  });
}

function summarizeConnection(config, context = {}) {
  return {
    configured: !getMissingConfig(config).length,
    readyForSync: Boolean(context.readyForSync),
    authenticated: Boolean(context.authenticated),
    hasCompanyId: Boolean(config.companyId),
    hasDisplayId: Boolean(config.displayId),
    hasEarningComponentId: Boolean(config.earningComponentId),
    missing: getMissingConfig(config),
    companyIdMasked: maskValue(context.companyId || config.companyId),
    displayIdMasked: maskValue(context.displayId || config.displayId),
    componentName: context.componentName || null,
    summary: context.summary || "",
    error: context.error || "",
  };
}

export async function getPaychexStatus() {
  const config = getPaychexConfig();
  const missing = getMissingConfig(config);

  if (missing.length) {
    return summarizeConnection(config, {
      readyForSync: false,
      authenticated: false,
      summary: `Missing ${missing.join(", ")}.`,
      error: "Paychex credentials are not configured yet.",
    });
  }

  try {
    const company = await resolveCompanyContext(config);
    const component = await resolveEarningComponent(company.companyId, config);

    return summarizeConnection(config, {
      authenticated: true,
      readyForSync: true,
      companyId: company.companyId,
      displayId: company.displayId,
      componentName: component.name,
      summary: "Paychex is connected and ready to create SSP worker checks for payroll review.",
    });
  } catch (error) {
    return summarizeConnection(config, {
      authenticated: false,
      readyForSync: false,
      error: error.message,
      summary: error.message,
    });
  }
}

export async function requestPaychexClientAccess({ displayId } = {}) {
  const config = getPaychexConfig();
  const normalizedDisplayId = String(displayId || config.displayId || "").replace(/\D/g, "").slice(-8);

  if (!normalizedDisplayId) {
    throw new PaychexSyncError(
      "A Paychex client display ID is required to request client access.",
      { status: 400 }
    );
  }

  const payload = await paychexRequest("/management/requestclientaccess", {
    method: "POST",
    body: {
      displayId: normalizedDisplayId,
    },
  });

  return {
    displayId: normalizedDisplayId,
    approvalLink: payload?.approvalLink || "",
  };
}

export async function syncTimecardsToPaychex({ associates = [], payrollEntries = [], timecards = [] } = {}) {
  if (!Array.isArray(timecards) || !timecards.length) {
    throw new PaychexSyncError("There are no completed SSP timecards waiting for Paychex sync.", {
      status: 400,
    });
  }

  const config = getPaychexConfig();
  const connection = await getPaychexStatus();

  if (!connection.readyForSync) {
    throw new PaychexSyncError(connection.error || connection.summary || "Paychex is not ready for sync.", {
      status: 503,
      details: connection,
    });
  }

  const company = await resolveCompanyContext(config);
  const payPeriod = await resolvePayPeriod(company.companyId, new Date());
  const component = await resolveEarningComponent(company.companyId, config);
  const workersPayload = await getCompanyWorkers(company.companyId);
  const associateMap = new Map(associates.map((associate) => [associate.id, associate]));
  const payRateMap = new Map(
    payrollEntries
      .filter((entry) => entry?.associateId)
      .map((entry) => [entry.associateId, Number(entry.rate || 0)])
  );
  const checkCache = new Map();
  const results = [];

  const sortedTimecards = [...timecards].sort(
    (left, right) => new Date(left.scheduledStart).getTime() - new Date(right.scheduledStart).getTime()
  );

  for (const timecard of sortedTimecards) {
    const associate = associateMap.get(timecard.associateId);

    try {
      if (!associate) {
        throw new PaychexSyncError(
          `SSP associate ${timecard.associateId} could not be resolved for Paychex sync.`,
          { status: 404 }
        );
      }

      const rate = payRateMap.get(associate.id);
      if (!rate) {
        throw new PaychexSyncError(
          `No payroll rate is available for ${associate.name}.`,
          { status: 400 }
        );
      }

      const worker = resolveWorkerForAssociate(workersPayload, associate);
      const earningLine = buildEarningLine(component, timecard, rate);
      let currentCheck = checkCache.get(worker.workerId) || null;

      if (!currentCheck) {
        const workerChecks = await getWorkerChecks(worker.workerId, payPeriod.payPeriodId);
        currentCheck = firstItem(workerChecks);
        if (currentCheck) {
          checkCache.set(worker.workerId, currentCheck);
        }
      }

      if (currentCheck) {
        const existing = findMatchingEarning(currentCheck, earningLine);
        if (existing) {
          results.push({
            timecardId: timecard.id,
            associateId: associate.id,
            associateName: associate.name,
            workerId: worker.workerId,
            status: "synced",
            message: "Already present on the current Paychex check.",
            paycheckId: currentCheck.paycheckId,
            checkComponentId: existing.checkComponentId || null,
          });
          continue;
        }

        const updatedCheckPayload = await addCheckComponent(currentCheck.paycheckId, earningLine);
        const updatedCheck = firstItem(updatedCheckPayload) || currentCheck;
        const syncedComponent = findMatchingEarning(updatedCheck, earningLine);
        checkCache.set(worker.workerId, updatedCheck);

        results.push({
          timecardId: timecard.id,
          associateId: associate.id,
          associateName: associate.name,
          workerId: worker.workerId,
          status: "synced",
          message: "Hours added to an existing Paychex check.",
          paycheckId: updatedCheck.paycheckId,
          checkComponentId: syncedComponent?.checkComponentId || null,
        });
        continue;
      }

      const createdCheckPayload = await createWorkerCheck(
        worker.workerId,
        payPeriod.payPeriodId,
        earningLine,
        `ssp-${timecard.id}`
      );
      const createdCheck = firstItem(createdCheckPayload);
      const syncedComponent = findMatchingEarning(createdCheck, earningLine);
      checkCache.set(worker.workerId, createdCheck);

      results.push({
        timecardId: timecard.id,
        associateId: associate.id,
        associateName: associate.name,
        workerId: worker.workerId,
        status: "synced",
        message: "Created a new Paychex check for this worker and posted hours.",
        paycheckId: createdCheck?.paycheckId || null,
        checkComponentId: syncedComponent?.checkComponentId || null,
      });
    } catch (error) {
      results.push({
        timecardId: timecard.id,
        associateId: associate?.id || timecard.associateId,
        associateName: associate?.name || null,
        status: "failed",
        message: error.message || "Paychex sync failed for this timecard.",
      });
    }
  }

  const summary = {
    attempted: results.length,
    synced: results.filter((item) => item.status === "synced").length,
    failed: results.filter((item) => item.status === "failed").length,
  };

  return {
    connection: summarizeConnection(config, {
      authenticated: true,
      readyForSync: true,
      companyId: company.companyId,
      displayId: company.displayId,
      componentName: component.name,
      summary:
        summary.failed > 0
          ? "Paychex sync completed with follow-up needed."
          : "Paychex checks were updated successfully and are ready for final payroll review in Flex.",
    }),
    payPeriod: {
      payPeriodId: payPeriod.payPeriodId,
      description: payPeriod.description,
      status: payPeriod.status,
      startDate: payPeriod.startDate,
      endDate: payPeriod.endDate,
      checkDate: payPeriod.checkDate,
    },
    component: {
      componentId: component.componentId,
      name: component.name,
      classificationType: component.classificationType,
    },
    summary,
    syncedAt: new Date().toISOString(),
    results,
  };
}

export { PaychexSyncError };

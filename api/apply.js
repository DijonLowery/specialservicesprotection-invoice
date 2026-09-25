import { createApplicationPdf } from "../lib/applicationPdf.js";

const APPLICATION_TO_EMAIL = "specialservicespro@gmail.com";
const MAX_REQUEST_BYTES = 75_000;
const MAX_ATTEMPTS_PER_HOUR = 6;

const ALLOWED_ROLES = new Set([
  "Armed Security Officer",
  "Unarmed Security Officer",
  "Event Security / Crowd Management",
  "Executive / Personal Protection",
  "Access Control Officer",
  "Mobile Patrol Officer",
  "Corporate / Residential Security",
  "Site Supervisor / Field Lead",
  "Other",
]);

const ARRAY_FIELDS = new Set(["roles", "workPreference", "availableDays", "availableShifts", "certifications"]);
const REQUIRED_FIELDS = ["firstName", "lastName", "email", "phone", "city", "state", "contactMethod", "startDate", "travel", "transportation", "driversLicense", "age18", "gaRegistration", "yearsExperience", "relevantExperience", "whySsp", "deescalation", "serviceBalance", "essentialDuties", "signature", "signatureDate"];

function clean(value, max = 2500) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

function cleanList(value) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map((item) => clean(item, 120)).filter(Boolean).slice(0, 20);
}

function escapeHtml(value) {
  return clean(value, 5000).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function normalizeBody(body) {
  const normalized = {};
  for (const [key, value] of Object.entries(body || {})) {
    normalized[key] = ARRAY_FIELDS.has(key) ? cleanList(value) : clean(value, key.includes("Experience") || ["whySsp", "deescalation", "serviceBalance"].includes(key) ? 2500 : 400);
  }
  return normalized;
}

function rateLimited(ip) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  globalThis.__sspApplicationAttempts ||= new Map();
  const attempts = (globalThis.__sspApplicationAttempts.get(ip) || []).filter((time) => time > hourAgo);
  if (attempts.length >= MAX_ATTEMPTS_PER_HOUR) return true;
  attempts.push(now);
  globalThis.__sspApplicationAttempts.set(ip, attempts);
  return false;
}

function field(label, value) {
  const display = Array.isArray(value) ? value.join(", ") : value;
  return `<tr><td style="padding:10px 14px;color:#777;border-bottom:1px solid #222;width:34%;font:600 11px Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(label)}</td><td style="padding:10px 14px;color:#eee;border-bottom:1px solid #222;font:14px/1.55 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(display || "Not provided")}</td></tr>`;
}

function section(title, rows) {
  return `<h2 style="margin:30px 0 10px;color:#f0f0f0;font:600 22px Georgia,serif">${escapeHtml(title)}</h2><table role="presentation" style="width:100%;border-collapse:collapse;background:#101010;border:1px solid #252525">${rows.join("")}</table>`;
}

function buildEmail(application) {
  const applicant = `${application.firstName} ${application.lastName}`.trim();
  const primaryRole = application.roles[0] || "General Application";
  const html = `<!doctype html><html><body style="margin:0;background:#050505;color:#ddd"><div style="max-width:760px;margin:0 auto;padding:34px 22px 60px"><div style="padding:22px;border-bottom:1px solid #333"><p style="margin:0 0 7px;color:#888;font:600 10px Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase">Special Services Protection</p><h1 style="margin:0;color:#f0f0f0;font:600 34px Georgia,serif">New Employment Application</h1><p style="margin:10px 0 0;color:#999;font:14px Arial,sans-serif">${escapeHtml(applicant)} · ${escapeHtml(primaryRole)}</p></div>${section("Contact Information", [field("Name", applicant), field("Preferred name", application.preferredName), field("Email", application.email), field("Phone", application.phone), field("Location", `${application.city}, ${application.state}`), field("Preferred contact", application.contactMethod)])}${section("Position & Availability", [field("Roles", application.roles), field("Work preference", application.workPreference), field("Available days", application.availableDays), field("Available shifts", application.availableShifts), field("Start date", application.startDate), field("Travel", application.travel), field("Transportation", application.transportation), field("Driver's license", application.driversLicense)])}${section("Licensing & Qualifications", [field("At least 18", application.age18), field("At least 21 — armed role", application.age21), field("GA security registration", application.gaRegistration), field("Armed registration", application.armedRegistration), field("POST certification", application.postCertification), field("Experience", application.yearsExperience), field("Training / certifications", application.certifications), field("Credential details", application.certificationDetails)])}${section("Experience & Judgment", [field("Recent employer", application.recentEmployer), field("Recent job title", application.recentJobTitle), field("Relevant experience", application.relevantExperience), field("Why SSP", application.whySsp), field("De-escalation example", application.deescalation), field("Customer service and enforcement", application.serviceBalance), field("Essential duties", application.essentialDuties), field("Résumé / LinkedIn", application.resumeUrl)])}${section("Certification", [field("Accuracy", application.accuracyAcknowledgment), field("Verification", application.verificationAcknowledgment), field("Screening acknowledgment", application.screeningAcknowledgment), field("Privacy acknowledgment", application.privacyAcknowledgment), field("Electronic signature", application.signature), field("Signature date", application.signatureDate)])}<p style="margin:28px 0 0;color:#555;font:11px/1.6 Arial,sans-serif">Submitted from specialservicesprotection.com/apply. Reply directly to this email to contact the applicant.</p></div></body></html>`;
  const text = [`NEW SSP EMPLOYMENT APPLICATION`, `Applicant: ${applicant}`, `Primary role: ${primaryRole}`, `Email: ${application.email}`, `Phone: ${application.phone}`, `Location: ${application.city}, ${application.state}`, ``, `Roles: ${application.roles.join(", ")}`, `Availability: ${application.workPreference.join(", ")} · ${application.availableDays.join(", ")} · ${application.availableShifts.join(", ")}`, `Start date: ${application.startDate}`, `Travel: ${application.travel}`, ``, `GA registration: ${application.gaRegistration}`, `Armed registration: ${application.armedRegistration || "Not applicable"}`, `Experience: ${application.yearsExperience}`, `Certifications: ${application.certifications.join(", ") || "Not provided"}`, ``, `RELEVANT EXPERIENCE`, application.relevantExperience, ``, `WHY SSP`, application.whySsp, ``, `DE-ESCALATION`, application.deescalation, ``, `CUSTOMER SERVICE & ENFORCEMENT`, application.serviceBalance, ``, `Résumé / LinkedIn: ${application.resumeUrl || "Not provided"}`, ``, `Signed: ${application.signature} on ${application.signatureDate}`].join("\n");
  return { applicant, primaryRole, html, text };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > MAX_REQUEST_BYTES) return response.status(413).json({ error: "Application is too large." });

  const ip = clean(request.headers["x-forwarded-for"]?.split(",")[0] || request.socket?.remoteAddress || "unknown", 80);
  if (rateLimited(ip)) return response.status(429).json({ error: "Too many submissions. Please try again later." });

  const application = normalizeBody(request.body);
  if (application.website) return response.status(200).json({ ok: true });
  if (Number(application.startedAt) && Date.now() - Number(application.startedAt) < 2500) return response.status(400).json({ error: "Please review the application before submitting." });

  application.roles = cleanList(request.body?.roles).filter((role) => ALLOWED_ROLES.has(role));
  application.workPreference = cleanList(request.body?.workPreference);
  application.availableDays = cleanList(request.body?.availableDays);
  application.availableShifts = cleanList(request.body?.availableShifts);
  application.certifications = cleanList(request.body?.certifications);

  const missing = REQUIRED_FIELDS.filter((key) => !application[key]);
  if (!application.roles.length) missing.push("roles");
  if (!application.workPreference.length) missing.push("workPreference");
  if (!application.availableDays.length) missing.push("availableDays");
  if (!application.availableShifts.length) missing.push("availableShifts");
  if (application.roles.includes("Armed Security Officer") && (!application.age21 || !application.armedRegistration)) missing.push("armedEligibility");
  if (["accuracyAcknowledgment", "verificationAcknowledgment", "screeningAcknowledgment", "privacyAcknowledgment"].some((key) => application[key] !== "Agreed")) missing.push("acknowledgments");
  if (missing.length) return response.status(400).json({ error: "Please complete all required fields." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email)) return response.status(400).json({ error: "Please enter a valid email address." });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.APPLICATION_FROM_EMAIL || "SSP Careers <applications@specialservicesprotection.com>";
  const to = process.env.APPLICATION_TO_EMAIL || APPLICATION_TO_EMAIL;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured.");
    return response.status(503).json({ error: "Applications are temporarily unavailable. Please try again later." });
  }

  const email = buildEmail(application);
  try {
  const pdf = await createApplicationPdf(application);
  const safeName = `${application.firstName}-${application.lastName}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 100) || "Applicant";
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ from, to: [to], reply_to: application.email, subject: `New SSP Application — ${email.applicant} — ${email.primaryRole}`, html: email.html, text: email.text, attachments: [{ filename: `SSP-Application-${safeName}.pdf`, content: pdf.toString("base64"), content_type: "application/pdf" }] }),
  });

  if (!resendResponse.ok) {
    const providerError = await resendResponse.text();
    console.error("Application email failed:", resendResponse.status, providerError.slice(0, 500));
    return response.status(502).json({ error: "We could not deliver your application. Please try again." });
  }

  return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Application delivery failed:", error.name);
    return response.status(502).json({ error: "We could not send your application. Your entries are still here; please try again." });
  }
}

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";

const SECTIONS = [
  ["Contact Information", [["firstName", "First name"], ["lastName", "Last name"], ["preferredName", "Preferred name"], ["email", "Email"], ["phone", "Phone"], ["city", "City"], ["state", "State"], ["contactMethod", "Preferred contact"]]],
  ["Position & Availability", [["roles", "Positions of interest"], ["workPreference", "Work preference"], ["availableDays", "Available days"], ["availableShifts", "Available shifts"], ["startDate", "Earliest start date"], ["travel", "Travel availability"], ["transportation", "Reliable transportation"], ["driversLicense", "Valid driver's license"]]],
  ["Licensing & Qualifications", [["age18", "At least 18 years old"], ["age21", "At least 21 - armed role"], ["gaRegistration", "Georgia security registration"], ["armedRegistration", "Armed registration"], ["postCertification", "POST certification"], ["yearsExperience", "Relevant experience"], ["certifications", "Training & certifications"], ["certificationDetails", "Credential details"]]],
  ["Experience & Professional Judgment", [["recentEmployer", "Most recent employer"], ["recentJobTitle", "Most recent job title"], ["relevantExperience", "Relevant experience"], ["whySsp", "Why SSP"], ["deescalation", "De-escalation example"], ["serviceBalance", "Customer service and enforcement"], ["essentialDuties", "Essential duties with or without reasonable accommodation"], ["resumeUrl", "Resume / LinkedIn URL"]]],
  ["Certification & Acknowledgment", [["accuracyAcknowledgment", "Information is true and complete"], ["verificationAcknowledgment", "Employment and credential verification acknowledged"], ["screeningAcknowledgment", "Separate screening disclosures and authorization acknowledged"], ["privacyAcknowledgment", "Recruiting use authorized; employment not guaranteed"], ["signature", "Electronic signature (typed full name)"], ["signatureDate", "Signature date"]]],
];

export async function createApplicationPdf(application, submittedAt = new Date()) {
  const doc = await PDFDocument.create();
  doc.setTitle("SSP Employment Application");
  doc.setAuthor("Special Services Protection");
  doc.setCreationDate(submittedAt);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const logo = await doc.embedPng(await readFile(new URL("../public/image.png", import.meta.url)));
  const ink = rgb(0.12, 0.12, 0.13);
  const muted = rgb(0.38, 0.38, 0.40);
  // Standard PDF fonts support Western scripts. Preserve other code points as
  // explicit Unicode notation instead of dropping text or failing a submission.
  const printable = (value) => Array.from(String(value ?? "").normalize("NFC").replace(/\t/g, " ").replace(/[\u2010-\u2015]/g, "-")).map((char) => {
    if (char === "\n" || char === "\r") return "\n";
    try { regular.encodeText(char); return char; }
    catch { return `[U+${char.codePointAt(0).toString(16).toUpperCase()}]`; }
  }).join("");
  let page;
  let y;
  const newPage = () => {
    page = doc.addPage([612, 792]);
    page.drawRectangle({ x: 0, y: 686, width: 612, height: 106, color: rgb(0.035, 0.035, 0.04) });
    page.drawImage(logo, { x: 44, y: 712, width: 51, height: 51 });
    page.drawText("SPECIAL SERVICES PROTECTION", { x: 111, y: 753, size: 12, font: bold, color: rgb(0.94, 0.94, 0.94) });
    page.drawText("Employment Application", { x: 111, y: 728, size: 22, font: serif, color: rgb(0.83, 0.83, 0.83) });
    page.drawText("ATLANTA, GEORGIA  |  RECRUITING COPY", { x: 111, y: 707, size: 8, font: regular, color: rgb(0.65, 0.65, 0.65) });
    y = 662;
  };
  const ensure = (height) => { if (y - height < 64) newPage(); };
  const wrap = (text, size, width, font = regular) => {
    const lines = [];
    for (const paragraph of printable(text).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (!word) continue;
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue; }
        if (line) { lines.push(line); line = ""; }
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width) { lines.push(line); line = ""; }
          line += char;
        }
      }
      lines.push(line);
    }
    return lines;
  };
  const textBlock = (text, size = 10, color = ink, font = regular) => {
    for (const line of wrap(text, size, 524, font)) {
      ensure(15);
      page.drawText(line, { x: 44, y, size, font, color });
      y -= 15;
    }
  };
  newPage();
  textBlock(`${application.firstName} ${application.lastName}`, 17, ink, bold);
  y -= 8;
  textBlock(`Submitted: ${submittedAt.toISOString().replace("T", " ").slice(0, 19)} UTC`, 9, muted);
  y -= 12;
  for (const [title, fields] of SECTIONS) {
    ensure(title === "Certification & Acknowledgment" ? 260 : 83);
    page.drawRectangle({ x: 44, y: y - 4, width: 524, height: 26, color: rgb(0.93, 0.93, 0.94) });
    page.drawText(title, { x: 53, y: y + 4, size: 12, font: bold, color: ink });
    y -= 24;
    for (const [key, label] of fields) {
      const value = Array.isArray(application[key]) ? application[key].join(", ") : application[key];
      const display = value || "Not provided / not applicable";
      if (String(display).length < 150) {
        const labels = wrap(label.toUpperCase(), 8, 176, bold);
        const values = wrap(display, 10, 332);
        const height = Math.max(labels.length, values.length) * 15 + 9;
        ensure(height);
        labels.forEach((line, index) => page.drawText(line, { x: 44, y: y - index * 15, size: 8, font: bold, color: muted }));
        values.forEach((line, index) => page.drawText(line, { x: 236, y: y - index * 15, size: 10, font: regular, color: ink }));
        y -= height;
        continue;
      }
      const labelLines = wrap(label.toUpperCase(), 8, 524, bold);
      ensure(labelLines.length * 15 + 30);
      textBlock(label.toUpperCase(), 8, muted, bold);
      textBlock(display);
      y -= 10;
    }
    y -= 7;
  }
  const pages = doc.getPages();
  pages.forEach((item, index) => {
    item.drawLine({ start: { x: 44, y: 46 }, end: { x: 568, y: 46 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    item.drawText("CONFIDENTIAL - SSP RECRUITING USE", { x: 44, y: 31, size: 8, font: regular, color: muted });
    item.drawText(`${index + 1} / ${pages.length}`, { x: 540, y: 31, size: 8, font: regular, color: muted });
  });
  return Buffer.from(await doc.save());
}

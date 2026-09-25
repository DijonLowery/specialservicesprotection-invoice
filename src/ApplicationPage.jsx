import React, { useMemo, useRef, useState } from "react";

const ROLE_OPTIONS = [
  "Armed Security Officer",
  "Unarmed Security Officer",
  "Event Security / Crowd Management",
  "Executive / Personal Protection",
  "Access Control Officer",
  "Mobile Patrol Officer",
  "Corporate / Residential Security",
  "Site Supervisor / Field Lead",
  "Other",
];

const CERTIFICATION_OPTIONS = [
  "Georgia basic security training",
  "Armed qualification",
  "CPR / First Aid / AED",
  "De-escalation",
  "Crowd management",
  "Executive protection",
  "Access control",
  "Incident report writing",
  "Supervisory experience",
];

const APPLICATION_CSS = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
:root{--ssp-black:#050505;--ssp-panel:#0b0b0b;--ssp-card:#111;--ssp-line:rgba(255,255,255,.08);--ssp-silver:#c8c8c8;--ssp-white:#f0f0f0;--ssp-muted:#888;--ssp-error:#e8a0a0;--ssp-success:#a9d4b4}
*{box-sizing:border-box}
body{margin:0;background:var(--ssp-black);color:var(--ssp-silver);font-family:Inter,sans-serif}
.apply-page{min-height:100vh;background:radial-gradient(circle at 80% 5%,rgba(200,200,200,.055),transparent 30%),var(--ssp-black)}
.apply-nav{height:72px;padding:0 60px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--ssp-line);background:rgba(5,5,5,.96);position:sticky;top:0;z-index:10;backdrop-filter:blur(16px)}
.apply-brand{display:flex;align-items:center;gap:12px;color:var(--ssp-white);text-decoration:none;background:none;border:0;cursor:pointer;text-align:left}
.apply-brand img{width:42px;height:42px;border-radius:50%;object-fit:cover}
.apply-brand strong{display:block;font-size:13px;letter-spacing:.06em}.apply-brand small{display:block;margin-top:3px;color:var(--ssp-muted);font-size:9px;letter-spacing:.27em;text-transform:uppercase}
.apply-back{border:1px solid rgba(200,200,200,.25);background:transparent;color:var(--ssp-silver);padding:11px 18px;font:500 10px Inter,sans-serif;letter-spacing:.18em;text-transform:uppercase;cursor:pointer}
.apply-back:hover{background:var(--ssp-white);color:var(--ssp-black)}
.apply-hero{max-width:1180px;margin:0 auto;padding:90px 60px 72px;display:grid;grid-template-columns:1.15fr .85fr;gap:70px;align-items:end}
.apply-eyebrow{display:flex;align-items:center;gap:12px;color:var(--ssp-muted);font-size:10px;letter-spacing:.3em;text-transform:uppercase}.apply-eyebrow:before{content:"";width:34px;height:1px;background:#555}
.apply-hero h1{margin:25px 0 24px;color:var(--ssp-white);font:600 clamp(48px,6vw,78px)/1.02 "Playfair Display",serif;letter-spacing:-.025em}.apply-hero h1 em{color:var(--ssp-muted);font-weight:500}
.apply-lead{max-width:650px;margin:0;color:var(--ssp-muted);font-size:15px;line-height:1.9;font-weight:300}
.apply-values{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--ssp-line)}.apply-value{padding:22px;border-right:1px solid var(--ssp-line);border-bottom:1px solid var(--ssp-line)}.apply-value:nth-child(even){border-right:0}.apply-value:nth-last-child(-n+2){border-bottom:0}.apply-value span{display:block;color:#555;font:500 9px Inter,sans-serif;letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}.apply-value strong{color:var(--ssp-white);font:500 15px "Playfair Display",serif}
.apply-wrap{max-width:1180px;margin:0 auto;padding:0 60px 100px;display:grid;grid-template-columns:270px 1fr;gap:50px;align-items:start}
.apply-aside{position:sticky;top:105px;padding:28px;border-left:1px solid var(--ssp-line)}.apply-aside h2{margin:0 0 12px;color:var(--ssp-white);font:600 24px "Playfair Display",serif}.apply-aside p{margin:0 0 22px;color:var(--ssp-muted);font-size:12px;line-height:1.8}.apply-aside ol{list-style:none;margin:0;padding:0;counter-reset:steps}.apply-aside li{counter-increment:steps;padding:12px 0;border-top:1px solid var(--ssp-line);font-size:11px;color:#777}.apply-aside li:before{content:"0" counter(steps);color:#444;margin-right:12px;font-family:"Playfair Display",serif}
.apply-form{display:flex;flex-direction:column;gap:18px}.apply-section{background:var(--ssp-panel);border:1px solid var(--ssp-line);padding:36px}.apply-section-head{display:flex;gap:18px;align-items:start;margin-bottom:28px}.apply-section-number{color:#555;font:500 12px "Playfair Display",serif;padding-top:5px}.apply-section h2{margin:0 0 7px;color:var(--ssp-white);font:600 27px "Playfair Display",serif}.apply-section-intro{margin:0;color:var(--ssp-muted);font-size:12px;line-height:1.7}
.apply-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.apply-field{display:flex;flex-direction:column;gap:8px}.apply-field.full{grid-column:1/-1}.apply-field label,.apply-label{color:#999;font-size:9px;letter-spacing:.19em;text-transform:uppercase}.apply-required{color:var(--ssp-silver)}
.apply-field>input,.apply-field>select,.apply-field>textarea{width:100%;border:1px solid var(--ssp-line);background:var(--ssp-card);color:var(--ssp-white);padding:14px;font:400 13px Inter,sans-serif;outline:none;border-radius:0}.apply-field>textarea{min-height:125px;resize:vertical;line-height:1.6}.apply-field>input:focus,.apply-field>select:focus,.apply-field>textarea:focus{border-color:rgba(200,200,200,.35)}.apply-field>input::placeholder,.apply-field>textarea::placeholder{color:#555}.apply-help{color:#666;font-size:10px;line-height:1.6}
.apply-options{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.apply-option{position:relative;display:flex;align-items:flex-start;gap:10px;border:1px solid var(--ssp-line);background:var(--ssp-card);padding:13px;color:#aaa;font-size:12px;line-height:1.45;cursor:pointer}.apply-option:has(input:checked){border-color:rgba(200,200,200,.4);color:var(--ssp-white);background:#151515}.apply-option input{accent-color:#ddd;margin:2px 0 0;flex-shrink:0}.apply-option.wide{grid-column:1/-1}
.apply-conditional{margin-top:22px;padding:20px;border-left:2px solid #777;background:#0e0e0e}.apply-conditional-title{margin:0 0 15px;color:var(--ssp-white);font:500 17px "Playfair Display",serif}.apply-note{padding:17px 19px;border:1px solid var(--ssp-line);color:#888;font-size:11px;line-height:1.75;background:#090909}.apply-note strong{color:var(--ssp-silver)}
.apply-consent{display:flex;gap:11px;align-items:flex-start;color:#999;font-size:11px;line-height:1.65;margin-top:13px}.apply-consent input{accent-color:#ddd;margin-top:3px;flex-shrink:0}.apply-consent a{color:var(--ssp-silver)}
.apply-submit-row{padding:30px 36px;border:1px solid var(--ssp-line);background:var(--ssp-panel);display:flex;align-items:center;justify-content:space-between;gap:25px}.apply-submit-row p{margin:0;max-width:480px;color:#777;font-size:10px;line-height:1.7}.apply-submit{background:var(--ssp-white);color:var(--ssp-black);border:0;padding:16px 28px;font:600 10px Inter,sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;white-space:nowrap}.apply-submit:hover{background:#fff}.apply-submit:disabled{opacity:.5;cursor:wait}.apply-status{padding:15px 18px;border:1px solid var(--ssp-line);font-size:12px;line-height:1.6}.apply-status.error{color:var(--ssp-error);border-color:rgba(232,160,160,.25)}
.apply-success{max-width:760px;margin:80px auto;padding:70px 55px;text-align:center;border:1px solid var(--ssp-line);background:var(--ssp-panel)}.apply-success img{width:78px;height:78px;border-radius:50%;object-fit:cover;margin-bottom:28px}.apply-success .check{width:45px;height:45px;margin:0 auto 25px;border:1px solid rgba(169,212,180,.35);display:grid;place-items:center;color:var(--ssp-success)}.apply-success h1{color:var(--ssp-white);font:600 44px "Playfair Display",serif;margin:0 0 18px}.apply-success p{color:var(--ssp-muted);font-size:14px;line-height:1.8;margin:0 0 30px}
.apply-footer{border-top:1px solid var(--ssp-line);padding:30px 60px;display:flex;justify-content:space-between;gap:20px;max-width:1180px;margin:0 auto;color:#555;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
.apply-hp{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
@media(max-width:900px){.apply-hero{grid-template-columns:1fr}.apply-values{max-width:560px}.apply-wrap{grid-template-columns:1fr}.apply-aside{position:static;border-left:0;border-top:1px solid var(--ssp-line);padding:25px 0}.apply-aside ol{display:grid;grid-template-columns:1fr 1fr}.apply-aside li{padding-right:14px}}
@media(max-width:650px){.apply-nav{padding:0 20px}.apply-brand strong{font-size:11px}.apply-brand small{letter-spacing:.18em}.apply-back{padding:10px 12px;font-size:9px}.apply-hero{padding:65px 22px 45px}.apply-wrap{padding:0 22px 65px}.apply-section{padding:27px 20px}.apply-grid,.apply-options{grid-template-columns:1fr}.apply-option.wide,.apply-field.full{grid-column:auto}.apply-submit-row{padding:25px 20px;align-items:stretch;flex-direction:column}.apply-submit{width:100%}.apply-footer{padding:25px 22px;flex-direction:column}.apply-hero h1{font-size:50px}.apply-values{grid-template-columns:1fr}.apply-value{border-right:0}.apply-value:nth-last-child(2){border-bottom:1px solid var(--ssp-line)}}
`;

function OptionGroup({ name, options, required = false }) {
  return (
    <div className="apply-options">
      {options.map((option) => (
        <label className="apply-option" key={option}>
          <input type="checkbox" name={name} value={option} required={required} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function Section({ number, title, intro, children }) {
  return (
    <section className="apply-section">
      <div className="apply-section-head">
        <span className="apply-section-number">{number}</span>
        <div><h2>{title}</h2><p className="apply-section-intro">{intro}</p></div>
      </div>
      {children}
    </section>
  );
}

export default function ApplicationPage({ onBack }) {
  const [armedSelected, setArmedSelected] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const startedAt = useRef(Date.now());
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const handleRoleChange = (event) => {
    if (event.target.name !== "roles") return;
    const form = event.currentTarget;
    const selected = Array.from(form.querySelectorAll('input[name="roles"]:checked')).map((item) => item.value);
    setArmedSelected(selected.includes("Armed Security Officer"));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const requiredGroups = [
      ["roles", "Please select at least one position of interest."],
      ["workPreference", "Please select at least one work preference."],
      ["availableDays", "Please select at least one available day."],
      ["availableShifts", "Please select at least one available shift."],
    ];
    const incompleteGroup = requiredGroups.find(([name]) => !form.querySelector(`input[name="${name}"]:checked`));
    if (incompleteGroup) {
      setStatus("error");
      setMessage(incompleteGroup[1]);
      form.querySelector(`input[name="${incompleteGroup[0]}"]`)?.focus();
      return;
    }

    setStatus("submitting");
    setMessage("");
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      if (data[key]) data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
      else data[key] = value;
    }
    data.startedAt = startedAt.current;

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not send your application.");
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "We could not send your application. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="apply-page">
        <style>{APPLICATION_CSS}</style>
        <nav className="apply-nav">
          <button type="button" className="apply-brand" onClick={onBack}>
            <img src="/image.png" alt="SSP logo" /><span><strong>Special Services Protection</strong><small>Atlanta, Georgia</small></span>
          </button>
          <button type="button" className="apply-back" onClick={onBack}>Return to Website</button>
        </nav>
        <main className="apply-success">
          <img src="/image.png" alt="Special Services Protection" />
          <div className="check">✓</div>
          <p className="apply-eyebrow" style={{ justifyContent: "center" }}>Application Received</p>
          <h1>Thank You for Stepping Forward.</h1>
          <p>Your application has been delivered to the SSP team. If your qualifications match an upcoming assignment, a representative will contact you using the information you provided.</p>
          <button type="button" className="apply-submit" onClick={onBack}>Return to SSP</button>
        </main>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <style>{APPLICATION_CSS}</style>
      <nav className="apply-nav">
        <button type="button" className="apply-brand" onClick={onBack}>
          <img src="/image.png" alt="SSP logo" /><span><strong>Special Services Protection</strong><small>Atlanta, Georgia</small></span>
        </button>
        <button type="button" className="apply-back" onClick={onBack}>Back to Website</button>
      </nav>

      <header className="apply-hero">
        <div>
          <p className="apply-eyebrow">Careers at SSP</p>
          <h1>The Standard Starts<br />With the <em>Team.</em></h1>
          <p className="apply-lead">Join a protection team built on experience, readiness, discretion, and accountability. We accept applications for event security, crowd management, access control, mobile patrol, personal protection, and qualified armed and unarmed assignments.</p>
        </div>
        <div className="apply-values" aria-label="SSP team values">
          {[["01","Professionalism"],["02","Readiness"],["03","Discretion"],["04","Accountability"]].map(([number,value]) => <div className="apply-value" key={number}><span>{number}</span><strong>{value}</strong></div>)}
        </div>
      </header>

      <div className="apply-wrap">
        <aside className="apply-aside">
          <h2>Applicant Profile</h2>
          <p>Complete each section carefully. Fields marked with an asterisk are required.</p>
          <ol><li>Contact</li><li>Position</li><li>Availability</li><li>Qualifications</li><li>Experience</li><li>Certification</li></ol>
        </aside>

        <form className="apply-form" onSubmit={handleSubmit} onChange={handleRoleChange}>
          <div className="apply-hp" aria-hidden="true"><label>Website<input name="website" type="text" tabIndex="-1" autoComplete="off" /></label></div>

          <Section number="01" title="Contact Information" intro="How the SSP recruiting team can reach you.">
            <div className="apply-grid">
              <div className="apply-field"><label>First Name <span className="apply-required">*</span></label><input name="firstName" type="text" maxLength="60" autoComplete="given-name" required /></div>
              <div className="apply-field"><label>Last Name <span className="apply-required">*</span></label><input name="lastName" type="text" maxLength="60" autoComplete="family-name" required /></div>
              <div className="apply-field"><label>Preferred Name</label><input name="preferredName" type="text" maxLength="60" /></div>
              <div className="apply-field"><label>Preferred Contact Method <span className="apply-required">*</span></label><select name="contactMethod" required defaultValue=""><option value="" disabled>Select one</option><option>Email</option><option>Phone call</option><option>Text message</option></select></div>
              <div className="apply-field"><label>Email <span className="apply-required">*</span></label><input name="email" type="email" maxLength="120" autoComplete="email" required /></div>
              <div className="apply-field"><label>Phone <span className="apply-required">*</span></label><input name="phone" type="tel" maxLength="30" autoComplete="tel" required /></div>
              <div className="apply-field"><label>City <span className="apply-required">*</span></label><input name="city" type="text" maxLength="80" autoComplete="address-level2" required /></div>
              <div className="apply-field"><label>State <span className="apply-required">*</span></label><input name="state" type="text" maxLength="40" autoComplete="address-level1" defaultValue="Georgia" required /></div>
            </div>
          </Section>

          <Section number="02" title="Position Interests" intro="Select every type of SSP assignment you would like to be considered for.">
            <p className="apply-label">Positions <span className="apply-required">*</span></p>
            <OptionGroup name="roles" options={ROLE_OPTIONS} />
            {armedSelected && <div className="apply-conditional"><p className="apply-conditional-title">Armed Assignment Eligibility</p><div className="apply-grid"><div className="apply-field"><label>Are you at least 21 years old? <span className="apply-required">*</span></label><select name="age21" required defaultValue=""><option value="" disabled>Select one</option><option>Yes</option><option>No</option></select></div><div className="apply-field"><label>Georgia Armed Registration Status <span className="apply-required">*</span></label><select name="armedRegistration" required defaultValue=""><option value="" disabled>Select one</option><option>Active</option><option>Pending</option><option>Not currently registered</option></select></div></div><p className="apply-help">Armed assignments are considered only for applicants who meet applicable licensing, age, training, and qualification requirements.</p></div>}
          </Section>

          <Section number="03" title="Availability & Deployment" intro="Tell us when and where you can reliably accept assignments.">
            <div className="apply-grid">
              <div className="apply-field full"><span className="apply-label">Work Preference <span className="apply-required">*</span></span><OptionGroup name="workPreference" options={["Full-time","Part-time","Event / as-needed"]} /></div>
              <div className="apply-field full"><span className="apply-label">Available Days <span className="apply-required">*</span></span><OptionGroup name="availableDays" options={["Weekdays","Weekends","Holidays"]} /></div>
              <div className="apply-field full"><span className="apply-label">Available Shifts <span className="apply-required">*</span></span><OptionGroup name="availableShifts" options={["Day","Evening","Overnight"]} /></div>
              <div className="apply-field"><label>Earliest Start Date <span className="apply-required">*</span></label><input name="startDate" type="date" required /></div>
              <div className="apply-field"><label>Travel Availability <span className="apply-required">*</span></label><select name="travel" required defaultValue=""><option value="" disabled>Select one</option><option>Atlanta metro only</option><option>Throughout Georgia</option><option>Nationwide</option></select></div>
              <div className="apply-field"><label>Reliable Transportation? <span className="apply-required">*</span></label><select name="transportation" required defaultValue=""><option value="" disabled>Select one</option><option>Yes</option><option>No</option></select></div>
              <div className="apply-field"><label>Valid Driver's License? <span className="apply-required">*</span></label><select name="driversLicense" required defaultValue=""><option value="" disabled>Select one</option><option>Yes</option><option>No</option></select><span className="apply-help">Required only for assignments where driving is an essential duty. Do not enter your license number.</span></div>
            </div>
          </Section>

          <Section number="04" title="Licensing & Qualifications" intro="SSP will verify licenses and credentials later in the selection process.">
            <div className="apply-grid">
              <div className="apply-field"><label>Are you at least 18 years old? <span className="apply-required">*</span></label><select name="age18" required defaultValue=""><option value="" disabled>Select one</option><option>Yes</option><option>No</option></select></div>
              <div className="apply-field"><label>Georgia Security Registration <span className="apply-required">*</span></label><select name="gaRegistration" required defaultValue=""><option value="" disabled>Select one</option><option>Active</option><option>Pending</option><option>Not currently registered</option><option>Not applicable</option></select></div>
              <div className="apply-field"><label>Current POST Certification</label><select name="postCertification" defaultValue="Not applicable"><option>Yes</option><option>No</option><option>Not applicable</option></select></div>
              <div className="apply-field"><label>Years of Relevant Experience <span className="apply-required">*</span></label><select name="yearsExperience" required defaultValue=""><option value="" disabled>Select one</option><option>Less than 1 year</option><option>1–2 years</option><option>3–5 years</option><option>6–10 years</option><option>More than 10 years</option></select></div>
              <div className="apply-field full"><span className="apply-label">Training & Certifications</span><OptionGroup name="certifications" options={CERTIFICATION_OPTIONS} /></div>
              <div className="apply-field full"><label>Additional License or Certification Details</label><textarea name="certificationDetails" maxLength="1200" placeholder="List issuing organization, credential type, and current status. Do not include identification or license numbers." /></div>
            </div>
          </Section>

          <Section number="05" title="Experience & Professional Judgment" intro="Help us understand how your background aligns with SSP's operating standard.">
            <div className="apply-grid">
              <div className="apply-field"><label>Most Recent Employer</label><input name="recentEmployer" type="text" maxLength="120" /></div>
              <div className="apply-field"><label>Most Recent Job Title</label><input name="recentJobTitle" type="text" maxLength="120" /></div>
              <div className="apply-field full"><label>Relevant Experience <span className="apply-required">*</span></label><textarea name="relevantExperience" maxLength="2500" required placeholder="Describe security, law enforcement, military, event, hospitality, customer-service, or leadership experience relevant to the roles you selected." /></div>
              <div className="apply-field full"><label>Why do you want to join SSP? <span className="apply-required">*</span></label><textarea name="whySsp" maxLength="1800" required /></div>
              <div className="apply-field full"><label>Describe a time you helped de-escalate a tense situation. <span className="apply-required">*</span></label><textarea name="deescalation" maxLength="2200" required /></div>
              <div className="apply-field full"><label>How do you balance customer service with enforcing security rules? <span className="apply-required">*</span></label><textarea name="serviceBalance" maxLength="1800" required /></div>
              <div className="apply-field full"><label>Résumé or LinkedIn URL</label><input name="resumeUrl" type="url" maxLength="300" placeholder="https://" /><span className="apply-help">Optional. Do not submit Social Security numbers, birth dates, medical information, or government identification numbers.</span></div>
              <div className="apply-field full"><label>Can you perform the essential duties of your selected roles, with or without reasonable accommodation? <span className="apply-required">*</span></label><select name="essentialDuties" required defaultValue=""><option value="" disabled>Select one</option><option>Yes</option><option>No</option></select></div>
            </div>
          </Section>

          <Section number="06" title="Certification & Acknowledgment" intro="Review these statements before signing your application.">
            <div className="apply-note" style={{ marginBottom: 12 }}><strong>Equal opportunity:</strong> SSP provides equal employment opportunity to qualified applicants without regard to race, color, religion, sex, pregnancy, national origin, age, disability, genetic information, veteran status, or any other status protected by applicable law.</div>
            <div className="apply-note"><strong>Employment eligibility:</strong> If hired, you will be required to provide documentation establishing identity and authorization to work in the United States. SSP does not request citizenship or immigration documents through this application.</div>
            <label className="apply-consent"><input name="accuracyAcknowledgment" type="checkbox" value="Agreed" required /><span>I certify that the information in this application is true and complete to the best of my knowledge.</span></label>
            <label className="apply-consent"><input name="verificationAcknowledgment" type="checkbox" value="Agreed" required /><span>I understand that SSP may verify employment history, licenses, registrations, and certifications relevant to the position.</span></label>
            <label className="apply-consent"><input name="screeningAcknowledgment" type="checkbox" value="Agreed" required /><span>I understand that applicants who advance may receive separate disclosures and authorization requests for lawful background or drug screening based on the assignment. This application is not that authorization.</span></label>
            <label className="apply-consent"><input name="privacyAcknowledgment" type="checkbox" value="Agreed" required /><span>I authorize SSP to use the information submitted here for recruiting and employment consideration. Submission does not guarantee employment.</span></label>
            <div className="apply-grid" style={{ marginTop: 24 }}>
              <div className="apply-field"><label>Electronic Signature — Full Name <span className="apply-required">*</span></label><input name="signature" type="text" maxLength="120" required /></div>
              <div className="apply-field"><label>Date <span className="apply-required">*</span></label><input name="signatureDate" type="date" required /></div>
            </div>
          </Section>

          {status === "error" && <div className="apply-status error" role="alert">{message}</div>}
          <div className="apply-submit-row">
            <p>By submitting, you confirm that you have reviewed the application and acknowledgments. Your information will be delivered securely to Special Services Protection for recruiting review.</p>
            <button className="apply-submit" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Sending…" : "Submit Application →"}</button>
          </div>
        </form>
      </div>

      <footer className="apply-footer"><span>© {currentYear} Special Services Protection</span><span>Licensed · Bonded · Insured</span></footer>
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Sun,
  LoaderCircle,
} from "lucide-react";
import { ServiceIcon } from "./site";
import { services } from "@/lib/content";
import { validateRequest } from "@/lib/validation.mjs";
type Values = Record<string, string>;
type Errors = Record<string, string>;
const blank: Values = {
  service_type: "",
  property_type: "",
  city: "",
  address: "",
  monthly_bill: "",
  preferred_date: "",
  preferred_time: "",
  full_name: "",
  email: "",
  phone: "",
  message: "",
};
export default function Booking() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const key = useRef("");
  useEffect(() => {
    key.current = crypto.randomUUID();
    const s = new URLSearchParams(window.location.search).get("service");
    if (services.some((x) => x.slug === s))
      setValues((v) => ({ ...v, service_type: s! }));
  }, []);
  const change = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const field = (
    key: string,
    label: string,
    type = "text",
    placeholder = "",
    required = true,
  ) => (
    <div className="field">
      <label htmlFor={key}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={key}
        type={type}
        value={values[key]}
        required={required}
        placeholder={placeholder}
        maxLength={key === "email" ? 254 : 200}
        onChange={(e) => change(key, e.target.value)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        autoComplete={
          (
            {
              full_name: "name",
              email: "email",
              phone: "tel",
              city: "address-level2",
              address: "street-address",
            } as Record<string, string>
          )[key]
        }
        min={
          type === "date"
            ? new Date(Date.now() + 86400000).toISOString().slice(0, 10)
            : undefined
        }
      />
      {errors[key] && (
        <span id={`${key}-error`} className="field-error">
          {errors[key]}
        </span>
      )}
    </div>
  );
  function next() {
    const validation = validateRequest({ ...values, consent }, "booking");
    const group =
      step === 0
        ? ["service_type"]
        : [
            "city",
            "property_type",
            "preferred_date",
            "preferred_time",
            "monthly_bill",
          ];
    const found = Object.fromEntries(
      Object.entries(validation.errors).filter(([k]) => group.includes(k)),
    ) as Errors;
    setErrors(found);
    if (!Object.keys(found).length) {
      setStep(step + 1);
      setTimeout(() => heading.current?.focus(), 0);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) {
      next();
      return;
    }
    const validation = validateRequest({ ...values, consent }, "booking");
    setErrors(validation.errors);
    if (!validation.valid) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key.current,
        },
        body: JSON.stringify({ ...values, consent }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(
          data.error || "We couldn’t save your request. Please try again.",
        );
      }
      setResult(data.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Connection failed. Your entries are preserved. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-card">
      {result ? (
        <div className="success-state" role="status">
          <div className="success-icon">
            <Check size={30} />
          </div>
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            REQUEST RECEIVED
          </span>
          <h2>A brighter next step.</h2>
          <p>
            Your consultation request has been saved. Our team will review your
            details and contact you to discuss coverage and confirm a suitable
            time. This is not yet a confirmed appointment.
          </p>
          <div className="reference">Request reference: {result}</div>
          <Link className="button" href="/services">
            Explore your options <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <div className="stepper" aria-label={`Step ${step + 1} of 3`}>
            {["Your solution", "Your property", "Let’s connect"].map(
              (label, i) => (
                <div
                  key={label}
                  className={
                    i === step ? "current" : i < step ? "complete" : ""
                  }
                >
                  <span>{i < step ? <Check size={12} /> : i + 1}</span>
                  {label}
                </div>
              ),
            )}
          </div>
          <h2 ref={heading} tabIndex={-1}>
            {
              [
                "What powers your plans?",
                "Tell us about your space.",
                "Let’s keep in touch.",
              ][step]
            }
          </h2>
          <p>
            {
              [
                "Choose the solution you’d like to explore. We’ll help confirm the right fit.",
                "A few details help us make the conversation more useful.",
                "Where should our team reach you about your request?",
              ][step]
            }
          </p>
          <form noValidate onSubmit={submit}>
            {step === 0 && (
              <>
                <fieldset style={{ padding: 0, border: 0, margin: 0 }}>
                  <legend className="sr-only">Choose your system type</legend>
                  <div className="service-options">
                    {services.map((s) => (
                      <label key={s.slug} className="service-option">
                        <input
                          type="radio"
                          name="service_type"
                          value={s.slug}
                          checked={values.service_type === s.slug}
                          onChange={() => change("service_type", s.slug)}
                        />
                        <ServiceIcon type={s.icon} />
                        <span>
                          <strong>{s.name}</strong>
                          <small>{s.short}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {errors.service_type && (
                  <p role="alert" className="field-error">
                    {errors.service_type}
                  </p>
                )}
                <div className="notice">
                  Not sure? Choose the closest fit. A consultation is about
                  exploring options, not committing to a system.
                </div>
              </>
            )}
            {step === 1 && (
              <div className="form-fields">
                <div className="field-row">
                  {field(
                    "city",
                    "City / location",
                    "text",
                    "Where is your property?",
                  )}
                  <div className="field">
                    <label htmlFor="property_type">Property type *</label>
                    <select
                      id="property_type"
                      value={values.property_type}
                      onChange={(e) => change("property_type", e.target.value)}
                      aria-invalid={!!errors.property_type}
                    >
                      <option value="">Select a property type</option>
                      <option value="home">Home</option>
                      <option value="business">Business</option>
                      <option value="farm">Farm / remote site</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.property_type && (
                      <span role="alert" className="field-error">
                        {errors.property_type}
                      </span>
                    )}
                  </div>
                </div>
                {field(
                  "address",
                  "Property address",
                  "text",
                  "Street or area (optional)",
                  false,
                )}
                {field(
                  "monthly_bill",
                  "Approximate monthly electricity bill",
                  "text",
                  "Amount (optional)",
                  false,
                )}
                <small className="fine-print">
                  Use your local currency; include the currency in your notes.
                </small>
                <div className="field-row">
                  {field("preferred_date", "Preferred date", "date")}
                  <div className="field">
                    <label htmlFor="preferred_time">Preferred time *</label>
                    <select
                      id="preferred_time"
                      value={values.preferred_time}
                      onChange={(e) => change("preferred_time", e.target.value)}
                      aria-invalid={!!errors.preferred_time}
                    >
                      <option value="">Choose a time window</option>
                      <option value="morning">Morning · 9 am–12 pm</option>
                      <option value="afternoon">Afternoon · 12–4 pm</option>
                      <option value="evening">Evening · 4–7 pm</option>
                    </select>
                    {errors.preferred_time && (
                      <span role="alert" className="field-error">
                        {errors.preferred_time}
                      </span>
                    )}
                  </div>
                </div>
                <div className="notice">
                  Times refer to your property’s local time. This is a
                  preference only. Our team will confirm availability and
                  service coverage.
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="form-fields">
                {field("full_name", "Full name", "text", "Your full name")}
                <div className="field-row">
                  {field("email", "Email address", "email", "you@example.com")}
                  {field(
                    "phone",
                    "Phone number",
                    "tel",
                    "Include country code",
                  )}
                </div>
                <div className="field">
                  <label htmlFor="message">Anything else we should know?</label>
                  <textarea
                    id="message"
                    value={values.message}
                    maxLength={4000}
                    onChange={(e) => change("message", e.target.value)}
                    placeholder="Your energy goals, local currency, existing system or questions…"
                  />
                </div>
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setErrors((v) => ({ ...v, consent: "" }));
                    }}
                  />
                  I agree that Open Energy may store these details and contact
                  me about this request. My details will not be used for
                  marketing without separate permission.
                </label>
                {errors.consent && (
                  <span role="alert" className="field-error">
                    {errors.consent}
                  </span>
                )}
              </div>
            )}
            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}
            <div className="form-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="back-button"
                  disabled={busy}
                  onClick={() => {
                    setStep(step - 1);
                    setErrors({});
                    setError("");
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <button type="submit" disabled={busy} className="button">
                {busy
                  ? "Saving request…"
                  : step === 2
                    ? "Request consultation"
                    : "Continue"}
                {busy ? <LoaderCircle size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

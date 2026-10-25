"use client";
import { useRef, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { validateRequest } from "@/lib/validation.mjs";
export default function ContactForm() {
  const [values, setValues] = useState<Record<string, string>>({
    full_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState("");
  const key = useRef("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateRequest({ ...values, consent }, "contact");
    setErrors(v.errors);
    if (!v.valid) return;
    key.current ||= crypto.randomUUID();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key.current,
        },
        body: JSON.stringify({ ...values, consent }),
        signal: AbortSignal.timeout(20000),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.errors) setErrors(d.errors);
        throw new Error(
          d.error || "Could not save your message. Please try again.",
        );
      }
      setId(d.id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Connection failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-card">
      {id ? (
        <div className="success-state" role="status">
          <div className="success-icon">
            <Check size={28} />
          </div>
          <h2>Message received.</h2>
          <p>
            Your inquiry has been saved for our team to review. We’ll contact
            you using the details you provided.
          </p>
          <div className="reference">Reference: {id}</div>
        </div>
      ) : (
        <>
          <h2>Let’s start a conversation.</h2>
          <p>Have a question? We’re ready to listen.</p>
          <form noValidate onSubmit={submit}>
            <div className="form-fields">
              {[
                ["full_name", "Full name", "text"],
                ["email", "Email address", "email"],
                ["phone", "Phone number", "tel"],
                ["subject", "Subject", "text"],
                ["message", "Your message", "textarea"],
              ].map(([k, label, type]) => (
                <div className="field" key={k}>
                  <label htmlFor={k}>{label} *</label>
                  {type === "textarea" ? (
                    <textarea
                      id={k}
                      value={values[k]}
                      maxLength={4000}
                      onChange={(e) => {
                        setValues({ ...values, [k]: e.target.value });
                        setErrors({ ...errors, [k]: "" });
                      }}
                      aria-invalid={!!errors[k]}
                      aria-describedby={errors[k] ? `${k}-error` : undefined}
                    />
                  ) : (
                    <input
                      id={k}
                      type={type}
                      value={values[k]}
                      maxLength={k === "email" ? 254 : 200}
                      onChange={(e) => {
                        setValues({ ...values, [k]: e.target.value });
                        setErrors({ ...errors, [k]: "" });
                      }}
                      aria-invalid={!!errors[k]}
                      aria-describedby={errors[k] ? `${k}-error` : undefined}
                      autoComplete={
                        (
                          {
                            full_name: "name",
                            email: "email",
                            phone: "tel",
                          } as Record<string, string>
                        )[k]
                      }
                    />
                  )}{" "}
                  {errors[k] && (
                    <span id={`${k}-error`} className="field-error">
                      {errors[k]}
                    </span>
                  )}
                </div>
              ))}
              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                I agree that Open Energy may store my details and contact me
                about this inquiry.
              </label>
              {errors.consent && (
                <span role="alert" className="field-error">
                  {errors.consent}
                </span>
              )}
            </div>
            {error && (
              <p role="alert" className="error-banner">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button className="button" disabled={busy}>
                {busy ? "Sending…" : "Send message"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

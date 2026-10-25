"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, MessageCircle, Phone, X } from "lucide-react";
import { company, whatsappUrl } from "@/lib/company";
export default function ContactDock() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  if (path.startsWith("/admin")) return null;
  return (
    <div className="contact-dock" ref={root}>
      {open && (
        <section
          className="whatsapp-panel"
          id="whatsapp-options"
          aria-label="Contact Open Energy on WhatsApp"
        >
          <div className="whatsapp-panel-heading">
            <span className="wa-mark">
              <MessageCircle size={27} />
              <Phone size={12} />
            </span>
            <div>
              <strong>Let’s talk solar.</strong>
              <span>Choose a number to start a chat.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
              aria-label="Close WhatsApp options"
            >
              <X size={18} />
            </button>
          </div>
          <div className="whatsapp-panel-body">
            <p>Tell us about your home, business, or next energy project.</p>
            {company.phones.map((phone, i) => (
              <a
                key={phone.local}
                href={whatsappUrl(phone.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-number"
              >
                <span className="wa-number-icon">
                  <MessageCircle size={20} />
                </span>
                <span>
                  <small>WhatsApp · Line {i + 1}</small>
                  <strong dir="ltr">{phone.local}</strong>
                </span>
                <ArrowUpRight size={18} />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
            <span className="whatsapp-privacy">
              Opens WhatsApp. You choose when to send your message.
            </span>
          </div>
        </section>
      )}
      <button
        type="button"
        ref={trigger}
        className={`whatsapp-trigger${open ? " is-open" : ""}`}
        aria-label={open ? "Close WhatsApp chat" : "Chat on WhatsApp"}
        aria-expanded={open}
        aria-controls={open ? "whatsapp-options" : undefined}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <X size={25} />
        ) : (
          <>
            <span className="wa-mark">
              <MessageCircle size={28} />
              <Phone size={12} />
            </span>
            <span className="whatsapp-trigger-label">Let’s talk solar</span>
          </>
        )}
      </button>
    </div>
  );
}

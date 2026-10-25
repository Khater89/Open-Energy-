import ContactForm from "@/components/contact-form";
import Link from "next/link";
import { ArrowUpRight, Mail, Phone, MessageCircle } from "lucide-react";
import { company, whatsappUrl } from "@/lib/company";
export const metadata = {
  title: "Contact us",
  description: `Talk to Open Energy about solar design and installation. Email ${company.email} or call ${company.phones.map((p) => p.local).join(" or ")}.`,
};
export default function Page() {
  return (
    <>
      <section className="page-hero container">
        <span className="eyebrow">
          <i /> GET IN TOUCH
        </span>
        <h1>
          Your questions.
          <br />
          <span>Our next conversation.</span>
        </h1>
        <p>
          Call, message, or tell us about your plans. Good energy starts with a
          conversation.
        </p>
      </section>
      <section className="container contact-grid">
        <div className="contact-info">
          <h2>Let’s make a connection.</h2>
          <p>
            From a first question to a tailored solar proposal, reach our team
            in the way that works for you.
          </p>
          <div className="direct-contact-card">
            <span className="direct-contact-icon">
              <Mail size={22} />
            </span>
            <div>
              <span className="contact-card-label">EMAIL OUR TEAM</span>
              <a className="contact-email" href={`mailto:${company.email}`}>
                {company.email}
              </a>
              <small>Tell us about your property and energy goals.</small>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <div className="phone-contact-grid">
            {company.phones.map((phone, i) => (
              <div className="phone-contact-card" key={phone.local}>
                <span className="contact-card-label">DIRECT LINE {i + 1}</span>
                <a href={`tel:${phone.international}`} className="phone-number">
                  <Phone size={18} />
                  <span dir="ltr">{phone.local}</span>
                </a>
                <div className="phone-card-actions">
                  <a href={`tel:${phone.international}`}>
                    Call us <ArrowUpRight size={13} />
                  </a>
                  <a
                    href={whatsappUrl(phone.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${phone.local} (opens in a new tab)`}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
          <Link href="/book" className="text-link">
            Prefer a tailored consultation? <ArrowUpRight size={17} />
          </Link>
          <div className="contact-info-block" style={{ marginTop: 30 }}>
            <strong>Tell us where you are</strong>
            <p>
              Include your city and property location in your inquiry. Our team
              will confirm coverage before arranging a visit.
            </p>
          </div>
          <div className="notice">
            A booking is a consultation request. We’ll review your details and
            agree on the next steps with you.
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}

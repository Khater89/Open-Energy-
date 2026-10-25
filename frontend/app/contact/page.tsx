import ContactForm from "@/components/contact-form";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export const metadata = {
  title: "Contact us",
  description:
    "Contact Open Energy to discuss solar design, installation, service coverage or an existing project.",
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
          From early ideas to a specific energy challenge, we’d like to hear
          what you have in mind.
        </p>
      </section>
      <section className="container contact-grid">
        <div className="contact-info">
          <h2>Open to possibilities.</h2>
          <p>
            Send us a message using the form. Looking for a system
            recommendation? The consultation request captures a few more details
            to help us prepare.
          </p>
          <Link href="/book" className="text-link">
            Book a consultation <ArrowUpRight size={17} />
          </Link>
          <div className="contact-info-block" style={{ marginTop: 35 }}>
            <strong>Service coverage</strong>
            <p>
              Tell us your city and property location. Our team will confirm
              whether we can serve your area before arranging a visit.
            </p>
          </div>
          <div className="contact-info-block">
            <strong>Direct contact & office details</strong>
            <p>
              Our verified phone, email, office address and business hours will
              be published here when available. In the meantime, use this form
              to reach the team.
            </p>
          </div>
          <div className="notice">
            Submitting a request does not confirm an appointment. Our team
            reviews each inquiry before agreeing on next steps.
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}

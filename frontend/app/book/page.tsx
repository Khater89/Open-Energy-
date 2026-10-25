import Booking from "@/components/booking";
import { Check, ShieldCheck } from "lucide-react";
export const metadata = {
  title: "Book a consultation",
  description:
    "Request a tailored solar consultation for your home or business. Tell us about your property and preferred solar system.",
};
export default function Page() {
  return (
    <section className="form-page">
      <div className="container form-layout">
        <div className="form-intro">
          <span className="eyebrow">
            <i /> LET’S TALK SOLAR
          </span>
          <h1>
            Good energy starts
            <br />
            with a conversation.
          </h1>
          <p>
            No two spaces are the same. Tell us a little about yours and we’ll
            help you explore a solar solution that fits.
          </p>
          <ul className="check-list">
            <li>
              <Check size={17} /> A conversation, not a commitment
            </li>
            <li>
              <Check size={17} /> A solution shaped around your needs
            </li>
            <li>
              <Check size={17} /> Clear, practical next steps
            </li>
          </ul>
          <div className="form-assurance">
            <ShieldCheck size={26} />
            <span>
              Your information is only used to respond to your inquiry.
            </span>
          </div>
        </div>
        <Booking />
      </div>
    </section>
  );
}

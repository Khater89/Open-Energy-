import { faqs } from "@/lib/content";
import { CTA, FaqList } from "@/components/site";
export const metadata = {
  title: "Frequently asked questions",
  description:
    "Answers to common questions about solar systems, battery backup and consultation requests.",
};
export default function Page() {
  return (
    <>
      <section className="page-hero container">
        <span className="eyebrow">
          <i /> SOLAR, EXPLAINED
        </span>
        <h1>
          A little clarity.
          <br />
          <span>A confident next step.</span>
        </h1>
        <p>Answers to the questions that come before a brighter decision.</p>
      </section>
      <section className="container narrow section">
        <FaqList items={faqs} />
      </section>
      <CTA />
    </>
  );
}

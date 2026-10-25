import Projects from "@/components/projects";
import { CTA } from "@/components/site";
export const metadata = {
  title: "Our projects",
  description:
    "Browse verified Open Energy solar installations and project stories.",
};
export default function Page() {
  return (
    <>
      <section className="page-hero container">
        <span className="eyebrow">
          <i /> OUR PROJECTS
        </span>
        <h1>
          Real spaces.
          <br />
          <span>New possibilities.</span>
        </h1>
        <p>
          A place for the systems we design, the spaces we transform, and the
          stories behind them.
        </p>
      </section>
      <section className="container gallery-section">
        <Projects />
      </section>
      <CTA />
    </>
  );
}

import { Sun, Compass, Leaf, ShieldCheck } from "lucide-react";
import { CTA } from "@/components/site";
export const metadata = {
  title: "About us",
  description:
    "Meet Open Energy, a new company focused on thoughtful renewable-energy design and installation.",
};
export default function About() {
  return (
    <>
      <section className="page-hero container">
        <span className="eyebrow">
          <i /> MEET OPEN ENERGY
        </span>
        <h1>
          A fresh perspective.
          <br />
          <span>A brighter future.</span>
        </h1>
        <p>
          We’re a new renewable-energy company with a simple focus: helping
          people make a thoughtful switch to solar.
        </p>
      </section>
      <section className="container about-page">
        <div
          className="about-wide-image"
          role="img"
          aria-label="Illustrative solar panel landscape"
        />
        <p className="fine-print">
          Illustrative imagery. Company project photography will be added when
          available.
        </p>
        <div className="story-grid">
          <h2>
            Opening up
            <br />
            better energy.
          </h2>
          <div>
            <p>
              Energy touches every part of daily life. How we generate it should
              work for the way we live, the places we work and the future we
              want to build.
            </p>
            <p>
              Open Energy offers design and installation for on-grid, off-grid
              and hybrid systems. Our approach begins with understanding your
              property, your usage and your priorities, then developing a
              practical path forward.
            </p>
            <p>
              As a new company, we’re building our story one conversation and
              one carefully considered project at a time.
            </p>
          </div>
        </div>
        <div className="values-grid">
          {[
            [
              Compass,
              "Clarity first",
              "Straightforward explanations and a system recommendation grounded in your needs.",
            ],
            [
              ShieldCheck,
              "Care in the details",
              "Thoughtful design, clear scope and careful coordination through installation.",
            ],
            [
              Leaf,
              "Long-term thinking",
              "A focus on practical renewable energy that fits your space and future.",
            ],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof Sun;
            return (
              <div key={String(title)}>
                <I size={29} />
                <h3>{String(title)}</h3>
                <p>{String(copy)}</p>
              </div>
            );
          })}
        </div>
      </section>
      <CTA />
    </>
  );
}

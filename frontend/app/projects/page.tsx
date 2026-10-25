import SolarInspiration from "@/components/solar-inspiration";
import Projects from "@/components/projects";
import { CTA } from "@/components/site";
export const metadata = {
  title: "Our projects",
  description:
    "Explore clearly labeled solar concept images and verified Open Energy project updates.",
};
export default function Page() {
  return (
    <>
      <section className="page-hero container">
        <span className="eyebrow">
          <i /> OUR PROJECTS
        </span>
        <h1>
          New perspectives.
          <br />
          <span>Brighter possibilities.</span>
        </h1>
        <p>
          Explore clearly labeled solar concepts and, as they become available,
          verified stories from our own installations.
        </p>
      </section>
      <SolarInspiration showHeading={false} />
      <section className="container gallery-section verified-gallery">
        <div className="verified-gallery-heading">
          <span className="eyebrow">
            <i /> OPEN ENERGY PORTFOLIO
          </span>
          <h2>Our verified projects.</h2>
          <p>
            Company installations will appear here with authorized photography
            and verified details.
          </p>
        </div>
        <Projects />
      </section>
      <CTA />
    </>
  );
}

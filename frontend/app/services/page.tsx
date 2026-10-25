import Link from "next/link";
import { ArrowUpRight, Check, Minus } from "lucide-react";
import { services, faqs } from "@/lib/content";
import { ServiceIcon, CTA, FaqList } from "@/components/site";
export const metadata = {
  title: "Solar solutions",
  description:
    "Compare on-grid, off-grid and hybrid solar systems and find the right approach for your property.",
};
export default function Services() {
  return (
    <>
      <section className="page-hero container">
        <span className="eyebrow">
          <i /> OUR SOLUTIONS
        </span>
        <h1>
          Your space. Your needs.
          <br />
          <span>Your kind of energy.</span>
        </h1>
        <p>
          Three ways to harness the sun. One thoughtful approach to finding what
          works for you.
        </p>
      </section>
      <div className="container service-details">
        {services.map((s, i) => (
          <section id={s.slug} className="service-detail" key={s.slug}>
            <div className="service-detail-heading">
              <span className="service-icon">
                <ServiceIcon type={s.icon} size={30} />
              </span>
              <span className="eyebrow">
                0{i + 1} / {s.tag}
              </span>
              <h2>{s.name}</h2>
              <h3>{s.short}</h3>
              <p>{s.description}</p>
            </div>
            <div>
              <h4>What it offers</h4>
              <ul className="check-list">
                {s.benefits.map((b) => (
                  <li key={b}>
                    <Check size={18} />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="ideal-box">
                <strong>A good fit for</strong>
                <p>{s.ideal}</p>
              </div>
              <Link className="text-link" href={`/book?service=${s.slug}`}>
                Discuss {s.name.toLowerCase()} <ArrowUpRight size={16} />
              </Link>
            </div>
          </section>
        ))}
      </div>
      <section className="section comparison-section">
        <div className="container">
          <span className="eyebrow">SIDE BY SIDE</span>
          <h2>Find your fit.</h2>
          <div className="table-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>System capability</th>
                  <th>On-grid</th>
                  <th>Off-grid</th>
                  <th>Hybrid</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Grid connection", "Yes", "No", "Yes"],
                  [
                    "Battery storage",
                    "Not standard",
                    "Required",
                    "Included in design",
                  ],
                  [
                    "Backup during outages",
                    "Not standard",
                    "Standalone supply*",
                    "Selected loads*",
                  ],
                  [
                    "Primary consideration",
                    "Grid reliability",
                    "Load and storage sizing",
                    "Storage and backup needs",
                  ],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((v, i) =>
                      i === 0 ? <th key={i}>{v}</th> : <td key={i}>{v}</td>,
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine-print">
            *Subject to equipment, system design, stored energy and operating
            conditions. Final specifications follow a property assessment.
          </p>
        </div>
      </section>
      <section className="section container narrow">
        <h2>Before you make the switch.</h2>
        <FaqList items={faqs} />
      </section>
      <CTA />
    </>
  );
}

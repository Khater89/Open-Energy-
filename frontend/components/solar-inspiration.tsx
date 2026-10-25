"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
const concepts = [
  {
    image: "/images/solar-rooftop.webp",
    category: "RESIDENTIAL SOLAR",
    title: "A brighter place to call home.",
    description:
      "Explore how rooftop solar can become part of everyday living.",
    alt: "AI-generated concept of rooftop solar panels on a sunlit Mediterranean-style home",
    service: "on-grid",
  },
  {
    image: "/images/solar-commercial.webp",
    category: "COMMERCIAL SOLAR",
    title: "Big spaces. Bigger possibilities.",
    description: "A visual look at the potential of commercial rooftop space.",
    alt: "AI-generated aerial concept of a commercial roof covered in photovoltaic panels",
    service: "on-grid",
  },
  {
    image: "/images/solar-storage.webp",
    category: "HYBRID & STORAGE",
    title: "Keep the possibilities open.",
    description:
      "See the idea of pairing solar generation with energy storage.",
    alt: "AI-generated concept of a home solar battery and inverter installation",
    service: "hybrid",
  },
];
export default function SolarInspiration({
  showHeading = true,
}: {
  showHeading?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const modal = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected !== null) modal.current?.showModal();
  }, [selected]);
  return (
    <section className="section inspiration-section">
      <div className="container">
        {showHeading && (
          <div className="section-heading inspiration-heading">
            <div>
              <span className="eyebrow">
                <i /> A WINDOW INTO WHAT’S POSSIBLE
              </span>
              <h2>
                Picture a brighter
                <br />
                <span>kind of energy.</span>
              </h2>
            </div>
            <div className="section-heading-side">
              <p>
                From rooftops to battery storage, explore the possibilities for
                your space.
              </p>
              <Link href="/projects" className="text-link">
                Explore the gallery <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        )}
        <p className="illustration-disclaimer">
          <span>ILLUSTRATIVE CONCEPTS</span> These AI-generated images show
          system ideas, not completed Open Energy projects.
        </p>
        <div className="inspiration-grid">
          {concepts.map((concept, index) => (
            <figure key={concept.image} className="inspiration-card">
              <button
                type="button"
                className="inspiration-image"
                onClick={() => setSelected(index)}
                aria-label={`View ${concept.category.toLowerCase()} illustration`}
              >
                <img
                  src={concept.image}
                  alt={concept.alt}
                  width={1200}
                  height={800}
                  loading="lazy"
                />
                <span className="illustration-badge">Illustrative concept</span>
                <span className="image-expand">
                  <Expand size={18} />
                </span>
              </button>
              <figcaption>
                <span className="card-eyebrow">{concept.category}</span>
                <h3>{concept.title}</h3>
                <p>{concept.description}</p>
                <Link
                  href={`/services#${concept.service}`}
                  className="text-link"
                >
                  Explore the solution <ArrowUpRight size={15} />
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      {selected !== null && (
        <dialog
          ref={modal}
          className="concept-modal"
          aria-labelledby="concept-modal-title"
          onCancel={() => setSelected(null)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              const controls = Array.from(
                e.currentTarget.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
                ),
              );
              const first = controls[0],
                last = controls[controls.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }
            if (e.key === "ArrowRight")
              setSelected((selected + 1) % concepts.length);
            if (e.key === "ArrowLeft")
              setSelected((selected + concepts.length - 1) % concepts.length);
          }}
        >
          <button
            className="concept-close"
            aria-label="Close illustration"
            onClick={() => setSelected(null)}
            autoFocus
          >
            <X size={22} />
          </button>
          <img
            src={concepts[selected].image}
            alt={concepts[selected].alt}
            width={1200}
            height={800}
          />
          <div className="concept-modal-caption">
            <div>
              <span className="eyebrow">
                ILLUSTRATIVE CONCEPT · {selected + 1} / {concepts.length}
              </span>
              <h2 id="concept-modal-title">{concepts[selected].title}</h2>
              <p>
                AI-generated visual. Not a completed Open Energy project or a
                technical installation specification.
              </p>
            </div>
            <div className="concept-modal-controls">
              <button
                aria-label="Previous illustration"
                onClick={() =>
                  setSelected(
                    (selected + concepts.length - 1) % concepts.length,
                  )
                }
              >
                <ArrowLeft size={19} />
              </button>
              <button
                aria-label="Next illustration"
                onClick={() => setSelected((selected + 1) % concepts.length)}
              >
                <ArrowRight size={19} />
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}

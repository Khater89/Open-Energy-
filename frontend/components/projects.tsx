"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, Images, X } from "lucide-react";
type Project = {
  id: string;
  title: string;
  system_type: string;
  location: string;
  summary: string;
  image_url: string;
};
export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [retry, setRetry] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
  }, [selected]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/projects")
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            "Projects are unavailable right now. Please try again.",
          );
        return r.json();
      })
      .then((d) => {
        if (active) setProjects(d.projects);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const visible = projects.filter(
    (p) =>
      (filter === "all" || p.system_type === filter) &&
      `${p.title} ${p.location} ${p.summary}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="gallery-toolbar">
        <div className="filter-chips">
          {[
            ["all", "All projects"],
            ["on-grid", "On-grid"],
            ["off-grid", "Off-grid"],
            ["hybrid", "Hybrid"],
          ].map(([v, l]) => (
            <button
              key={v}
              aria-pressed={v === filter}
              className={v === filter ? "active" : ""}
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
          />
        </label>
      </div>
      {loading ? (
        <div className="empty-state" role="status">
          Loading projects…
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <p>{error}</p>
          <button className="button" onClick={() => setRetry(retry + 1)}>
            Try again
          </button>
        </div>
      ) : visible.length ? (
        <div className="project-grid">
          {visible.map((p) => (
            <button
              className="project-card"
              key={p.id}
              onClick={() => setSelected(p)}
            >
              {p.image_url && (
                <img src={p.image_url} alt={p.title} loading="lazy" />
              )}
              <span className="eyebrow">
                {p.system_type} · {p.location}
              </span>
              <h3>{p.title}</h3>
              <p>{p.summary}</p>
              <span className="text-link">
                View project <ArrowUpRight size={15} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Images size={40} />
          <h2>
            {projects.length
              ? "No matching projects"
              : "Our next chapter is taking shape."}
          </h2>
          <p>
            {projects.length
              ? "Try a different search or system type."
              : "We’re building our project portfolio. Verified installation stories and authorized photography will appear here as they become available."}
          </p>
          {query || filter !== "all" ? (
            <button
              className="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </button>
          ) : (
            <Link href="/book" className="text-link">
              Explore what’s possible for your property{" "}
              <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      )}
      {selected && (
        <dialog
          ref={dialogRef}
          onCancel={() => setSelected(null)}
          className="project-modal"
          aria-label={selected.title}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelected(null);
          }}
        >
          <button
            autoFocus
            className="close-button"
            aria-label="Close project"
            onClick={() => setSelected(null)}
          >
            <X />
          </button>
          {selected.image_url && (
            <img src={selected.image_url} alt={selected.title} />
          )}
          <h2>{selected.title}</h2>
          <p>
            {selected.location} · {selected.system_type}
          </p>
          <p>{selected.summary}</p>
          <Link className="button" href="/book">
            Plan a similar project <ArrowUpRight size={16} />
          </Link>
        </dialog>
      )}
    </>
  );
}

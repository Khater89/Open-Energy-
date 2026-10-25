"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export default function MotionEffects() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let clean = () => {};
    const setup = () => {
      clean();
      if (preference.matches) return;
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".section-heading,.service-card,.about-visual,.about-copy,.process-card,.faq-grid > div,.page-hero,.service-detail,.values-grid > div,.contact-info,.form-card,.inspiration-heading,.inspiration-card",
        ),
      );
      let observer: IntersectionObserver | undefined;
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries)
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer?.unobserve(entry.target);
              }
          },
          { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
        );
        for (const el of targets) {
          el.classList.add("reveal-target");
          if (el.getBoundingClientRect().top < innerHeight - 24)
            el.classList.add("is-visible");
          else observer.observe(el);
        }
      }
      let frame = 0;
      const hero = document.querySelector<HTMLElement>(".hero-image");
      const update = () => {
        frame = 0;
        const distance = document.documentElement.scrollHeight - innerHeight;
        document.documentElement.style.setProperty(
          "--reading-progress",
          String(distance > 0 ? scrollY / distance : 0),
        );
        if (hero && innerWidth > 600 && scrollY < innerHeight + 600)
          hero.style.setProperty(
            "--hero-shift",
            `${Math.min(scrollY * 0.13, 70)}px`,
          );
      };
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      update();
      clean = () => {
        observer?.disconnect();
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        for (const el of targets)
          el.classList.remove("reveal-target", "is-visible");
        hero?.style.removeProperty("--hero-shift");
        document.documentElement.style.removeProperty("--reading-progress");
      };
    };
    setup();
    preference.addEventListener("change", setup);
    return () => {
      clean();
      preference.removeEventListener("change", setup);
    };
  }, [path]);
  return <div className="reading-progress" aria-hidden="true" />;
}

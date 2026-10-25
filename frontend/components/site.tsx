"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Sun,
  Menu,
  X,
  Grid2X2,
  BatteryCharging,
  MoveUpRight,
  Check,
  Leaf,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
export const Arrow = ArrowUpRight;
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Open Energy home">
      <span className="logo-symbol">
        <Sun size={31} strokeWidth={2.2} />
      </span>
      <span>
        open<span className="logo-light">energy</span>
        <span className="logo-period">.</span>
      </span>
    </Link>
  );
}
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="announcement">
        <span>
          <Leaf size={13} /> A brighter future starts with better energy.
        </span>
        <Link href="/book">
          Let’s make the switch <ArrowUpRight size={13} />
        </Link>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav
            className={open ? "navigation is-open" : "navigation"}
            aria-label="Main navigation"
          >
            {[
              ["Home", "/"],
              ["Our solutions", "/services"],
              ["Our projects", "/projects"],
              ["About us", "/about"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={path === href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
                {path === href && <i />}
              </Link>
            ))}
          </nav>
          <Link href="/book" className="button small header-cta">
            Book a consultation <ArrowUpRight size={16} />
          </Link>
          <button
            className="mobile-menu"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Logo />
            <p>
              Thoughtful design. Reliable installation.
              <br />
              Energy that opens up possibilities.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/services">Our solutions</Link>
            <Link href="/projects">Our projects</Link>
            <Link href="/about">About Open Energy</Link>
          </div>
          <div>
            <h3>Your next step</h3>
            <Link href="/book">Book a consultation</Link>
            <Link href="/contact">Send an inquiry</Link>
            <Link href="/faq">Frequently asked questions</Link>
          </div>
          <div className="footer-message">
            <Sun size={26} />
            <p>
              Good for your space.
              <br />
              <strong>Better for our planet.</strong>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Open Energy. All rights reserved.
          </span>
          <span>Designed for a brighter tomorrow.</span>
          <Link href="/admin">
            Staff access <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
export function ServiceIcon({
  type,
  size = 25,
}: {
  type: string;
  size?: number;
}) {
  return type === "grid" ? (
    <Grid2X2 size={size} />
  ) : type === "battery" ? (
    <BatteryCharging size={size} />
  ) : (
    <Sun size={size} />
  );
}
export function FaqList({ items }: { items: readonly (readonly string[])[] }) {
  return (
    <div className="faq-list">
      {items.map(([question, answer], i) => (
        <details key={question} open={i === 0}>
          <summary>
            {question}
            <ChevronDown size={19} />
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}
export function CTA() {
  return (
    <section className="cta-section">
      <div className="container cta-inner">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER, POWERED BY THE SUN</span>
          <h2>Let’s find your brighter way forward.</h2>
          <p>
            Tell us about your space. We’ll help you explore the possibilities.
          </p>
        </div>
        <Link href="/book" className="button dark">
          Book a consultation <ArrowUpRight size={18} />
        </Link>
        <Sun className="cta-sun" size={210} strokeWidth={0.6} />
      </div>
    </section>
  );
}
export function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <Check size={16} />
      {children}
    </li>
  );
}

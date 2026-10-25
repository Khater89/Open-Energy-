import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Sun,
  Leaf,
  ShieldCheck,
  Settings2,
  Compass,
  ChevronRight,
  Check,
  PlugZap,
} from "lucide-react";
import { services, faqs } from "@/lib/content";
import { ServiceIcon, CTA, FaqList } from "@/components/site";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div
          className="hero-image"
          role="img"
          aria-label="Illustrative view of solar panels in a sunlit landscape"
        />
        <div className="hero-shade" />
        <div className="container hero-content">
          <div className="hero-eyebrow">
            <span /> CLEAN ENERGY. OPEN POSSIBILITIES.
          </div>
          <h1>
            A brighter way
            <br />
            to power <span>your world.</span>
          </h1>
          <p>
            Harness the power of the sun with solar solutions
            <br className="desktop-br" /> designed around your home, your
            business, and your future.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/book">
              Let’s talk solar <ArrowUpRight size={18} />
            </Link>
            <Link className="hero-secondary" href="/services">
              Explore our solutions <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-promise">
            <span>
              <Check size={14} /> Tailored to your needs
            </span>
            <span>
              <Check size={14} /> Built for the long run
            </span>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="container hero-bottom-inner">
            <span>
              <Sun size={23} /> A little sunshine.
              <br />
              <strong>A world of possibilities.</strong>
            </span>
            <span className="hero-image-note">
              Solar landscape illustration
            </span>
            <a href="#solutions" className="scroll-link">
              DISCOVER MORE <span>↓</span>
            </a>
          </div>
        </div>
      </section>
      <section className="value-strip">
        <div className="container value-grid">
          <div>
            <Settings2 />
            <span>
              <strong>Designed around you</strong>
              <small>No one-size-fits-all solutions</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <strong>Quality at every step</strong>
              <small>From design to installation</small>
            </span>
          </div>
          <div>
            <PlugZap />
            <span>
              <strong>Energy, made simple</strong>
              <small>Clear guidance. Confident decisions.</small>
            </span>
          </div>
          <div>
            <Leaf />
            <span>
              <strong>A positive change</strong>
              <small>For your space and the planet</small>
            </span>
          </div>
        </div>
      </section>
      <section id="solutions" className="section solutions-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <i /> ENERGY THAT FITS YOUR LIFE
              </span>
              <h2>
                Different needs.
                <br />
                <span>The right solution.</span>
              </h2>
            </div>
            <div className="section-heading-side">
              <p>
                Connected to the grid, completely independent, or the best of
                both. We help you find your fit.
              </p>
              <Link href="/services" className="text-link">
                Explore all solutions <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <div className="service-grid">
            {services.map((s, i) => (
              <Link
                href={`/services#${s.slug}`}
                key={s.slug}
                className={`service-card service-${s.slug}`}
              >
                <div className="service-card-top">
                  <span className="service-icon">
                    <ServiceIcon type={s.icon} />
                  </span>
                  <span className="service-number">0{i + 1}</span>
                </div>
                <div className="mini-system" aria-hidden="true">
                  <Sun />
                  <span className="mini-line" />
                  <div className="mini-panel">▥</div>
                  <span className="mini-line" />
                  <ServiceIcon type={s.icon} size={29} />
                </div>
                <span className="card-eyebrow">{s.tag}</span>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <div className="service-card-bottom">
                  <span>Discover {s.slug}</span>
                  <span className="circle-arrow">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="solution-help">
            <span>
              <Sun size={17} /> Not sure where to start? That’s what we’re here
              for.
            </span>
            <Link href="/book">
              Find my solution <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section className="about-section section">
        <div className="container about-grid">
          <div className="about-visual">
            <div
              className="about-photo"
              role="img"
              aria-label="Illustrative solar energy landscape"
            />
            <div className="about-stamp">
              <Sun size={32} />
              <span>
                LESS DEPENDENCE.
                <br />
                <strong>MORE POSSIBILITY.</strong>
              </span>
            </div>
            <span className="image-caption">
              Illustrative imagery · not a completed company project
            </span>
          </div>
          <div className="about-copy">
            <span className="eyebrow">
              <i /> MEET OPEN ENERGY
            </span>
            <h2>
              Good energy.
              <br />
              From the very beginning.
            </h2>
            <p>
              We believe switching to renewable energy should feel like a step
              forward, never a leap into the unknown.
            </p>
            <p>
              Open Energy brings system design and installation together,
              helping homeowners and businesses make informed choices about
              on-grid, off-grid and hybrid solar.
            </p>
            <ul className="check-list">
              <li>
                <Check size={17} /> Your needs before our recommendations
              </li>
              <li>
                <Check size={17} /> A clear plan, from concept to connection
              </li>
              <li>
                <Check size={17} /> Thoughtfully designed for your property
              </li>
            </ul>
            <Link href="/about" className="text-link">
              Get to know us <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section process-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <i /> A CLEAR PATH FORWARD
              </span>
              <h2>
                Your solar journey,
                <br />
                <span>made simple.</span>
              </h2>
            </div>
            <p className="heading-description">
              From the first conversation to the final connection.
              <br />
              Here’s how we turn possibility into power.
            </p>
          </div>
          <div className="process-grid">
            {[
              [
                "01",
                "Let’s connect",
                "Tell us about your property, energy needs and what you want to achieve.",
              ],
              [
                "02",
                "Designed for you",
                "We assess your space and develop a system proposal around your needs.",
              ],
              [
                "03",
                "Bring it to life",
                "Once the plan is agreed, we coordinate installation and commissioning.",
              ],
              [
                "04",
                "Enjoy your energy",
                "Get a clear handover so you understand your system and how to use it.",
              ],
            ].map(([n, title, copy]) => (
              <div className="process-card" key={n}>
                <div className="process-step">
                  <span>{n}</span>
                  <ArrowRight size={19} />
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section faq-section">
        <div className="container faq-grid">
          <div>
            <span className="eyebrow">
              <i /> A LITTLE MORE CLARITY
            </span>
            <h2>
              Good questions.
              <br />
              <span>Clear answers.</span>
            </h2>
            <p>Thinking about solar? Start here.</p>
            <Link href="/faq" className="text-link">
              View all questions <ArrowUpRight size={16} />
            </Link>
          </div>
          <FaqList items={faqs.slice(0, 3)} />
        </div>
      </section>
      <CTA />
    </>
  );
}

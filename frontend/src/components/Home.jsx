import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { usePreferences } from "../context/PreferencesContext";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import { PRICING_PLANS, formatPrice, formatTokens } from "../components/PricingPlans";

// ============================================================
//  COMPONENT: ParticleField (canvas particles)
// ============================================================
function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height, particles = [];
    const count = 80;
    let animationFrame;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 1.5 + 0.5;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99,102,241,0.25)";
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      // connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// ============================================================
//  COMPONENT: TypedWord (cycle through words)
// ============================================================
function TypedWord({ words }) {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[index];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentWord.length) {
          setDisplay((prev) => prev + currentWord[charIndex]);
          setCharIndex(charIndex + 1);
        } else {
          setIsDeleting(true);
          setTimeout(() => {}, 1500);
        }
      } else {
        if (charIndex > 0) {
          setDisplay((prev) => prev.slice(0, -1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setIndex((i) => (i + 1) % words.length);
        }
      }
    }, isDeleting ? 30 : 80);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, index, words]);

  return (
    <span className="text-[var(--accent)]">
      {display}
      <span className="inline-block w-[2px] h-[1em] bg-[var(--accent)] ml-0.5 animate-pulse" />
    </span>
  );
}

// ============================================================
//  COMPONENT: CodeVerityLogo
// ============================================================
function CodeVerityLogo() {
  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
      <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg-primary)]" />
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative text-[var(--accent)]"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-[var(--bg-primary)] border border-[var(--border-light)]">
        <span className="text-[6px] font-bold text-[var(--accent)]">&lt;/&gt;</span>
      </div>
      <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
    </div>
  );
}

// ============================================================
//  COMPONENT: Feature
// ============================================================
function Feature({ icon, title, desc, delay }) {
  return (
    <div
      className="group rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 text-center transition-all hover:border-[var(--accent)]/50 hover:-translate-y-1 hover:shadow-[0_0_30px_var(--accent-soft)]"
      style={{ animationDelay: delay }}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{desc}</p>
    </div>
  );
}

// ============================================================
//  ICON COMPONENTS
// ============================================================
function BugIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a8 8 0 0 0 8-8V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a8 8 0 0 0 8 8z" />
      <path d="M18 13h-2" />
      <path d="M8 13H6" />
      <path d="M10 4 8 2" />
      <path d="M14 4 16 2" />
      <path d="M12 22v-4" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function FlaskIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v7.527a2 2 0 0 1-.293 1.086L6.172 16.5a2 2 0 0 0-.276.922L6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l-.104-1.578a2 2 0 0 0-.276-.922l-3.535-5.887A2 2 0 0 1 14 9.527V2" />
      <path d="M8 2h8" />
    </svg>
  );
}

// ============================================================
//  COMPONENT: StatPill (animated count)
// ============================================================
function StatPill({ value, label, delayMs = 0 }) {
  const [display, setDisplay] = useState(0);
  const hasTarget = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      hasTarget.current = true;
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!hasTarget.current) return;
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    const isPct = String(value).includes("%");
    const isPlus = String(value).includes("+");
    const isLt = String(value).includes("<");
    const duration = 800;
    const start = performance.now();

    let raf;
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(num * eased);
      let output = isPct ? `${current}%` : isPlus ? `${current}+` : isLt ? `<${current}s` : String(current);
      setDisplay(output);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delayMs]);

  return (
    <div className="flex flex-col items-center rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-5 py-3 min-w-[110px]">
      <span className="text-xl font-bold text-[var(--text-primary)]">{display}</span>
      <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ============================================================
//  COMPONENT: ScanLine (for button hover)
// ============================================================
function ScanLine() {
  return (
    <span className="absolute inset-0 z-0 overflow-hidden">
      <span className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent-contrast)] to-transparent opacity-40 animate-scan" />
    </span>
  );
}

// ============================================================
//  SECTION: How It Works, Testimonials, Pricing, FAQ, Footer
//  (already defined in your file keep them as they are)
// ============================================================
// ... (the rest of the components remain identical to your version)
// I'll include them below for completeness, but they are unchanged.

/* ---------- How It Works ---------- */
function HowItWorks() {
  const steps = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      title: "Paste your GitHub URL",
      desc: "Enter any public repository link CodeVerity immediately analyses the codebase structure.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: "AI scans every file",
      desc: "Our engine examines architecture, dependencies, security, and potential bugs in seconds.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      title: "Get actionable insights",
      desc: "Receive a clear report with test suggestions, vulnerability fixes, and performance tips.",
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 border-t border-[var(--border-light)]">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          How CodeVerity works
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-10 max-w-xl mx-auto">
          From repository to report three simple steps to code confidence.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 text-center transition-all hover:border-[var(--accent)]/40 hover:-translate-y-1"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                {step.icon}
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">{step.title}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{step.desc}</p>
              <span className="mt-4 inline-block text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full">
                {`0${idx + 1}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
function Testimonials() {
  const testimonials = [
    {
      quote: "CodeVerity caught a critical security flaw our team overlooked. The generated tests saved us hours.",
      author: "Sarah Chen",
      role: "Lead Engineer, Finlytics",
    },
    {
      quote: "I use it before every PR. The bug detection is surprisingly accurate it's like having a senior reviewer.",
      author: "Marcus Rivera",
      role: "Full‑stack Developer, OpenSource Collective",
    },
    {
      quote: "We integrated it into our CI pipeline. Now every commit gets an instant AI audit. Game changer.",
      author: "Dr. Aisha Patel",
      role: "CTO, DevSafe",
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 border-t border-[var(--border-light)] bg-[var(--bg-secondary)]/30">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          Loved by developers
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-10 max-w-xl mx-auto">
          Join hundreds of engineers who ship with confidence.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 text-left transition-all hover:border-[var(--accent)]/30"
            >
              <div className="mb-3 flex items-center gap-1 text-[var(--accent)]">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">“{t.quote}”</p>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{t.author}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing (UPDATED with shared data) ---------- */
function Pricing() {
  const plans = PRICING_PLANS;

  return (
    <section className="py-16 px-4 sm:px-6 border-t border-[var(--border-light)]">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          Simple, transparent pricing
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-10 max-w-xl mx-auto">
          Start for free, upgrade as you grow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const price = plan.monthly.INR;
            const isFree = price === 0;
            const displayPrice = formatPrice(price, "INR");

            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-6 text-left transition-all ${
                  plan.highlight
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]/20 shadow-lg shadow-[var(--accent)]/5"
                    : "border-[var(--border-light)] bg-[var(--bg-card)]"
                } hover:scale-[1.02]`}
              >
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                    {displayPrice}
                  </span>
                  {!isFree && (
                    <span className="ml-1 text-sm text-[var(--text-muted)]">/mo</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[10px] text-[var(--accent)]">
                    {formatTokens(plan.tokensPerMonth)} tokens / mo
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-[var(--text-secondary)]">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      <svg className="mt-0.5 w-3 h-3 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={
                    isFree
                      ? "/register"
                      : `/checkout?plan=${plan.id}&cycle=monthly&currency=INR`
                  }
                  className={`mt-6 block w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-[var(--accent)] text-[var(--accent-contrast,#ffffff)] hover:bg-[var(--accent-hover)]"
                      : "border border-[var(--border-light)] bg-[var(--bg-card)]/75 text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-[10px] text-[var(--text-muted)]">
          * All prices in INR. Yearly plans offer 20% off see full pricing page.
        </p>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "What types of repositories does CodeVerity support?",
      a: "Currently we support public GitHub repositories written in JavaScript, TypeScript, Python, and Java. More languages coming soon.",
    },
    {
      q: "Is my code stored or shared?",
      a: "No. CodeVerity processes your repository in memory and never stores any source code. All analysis is temporary and encrypted.",
    },
    {
      q: "Can I use CodeVerity for private repositories?",
      a: "Yes, with the Pro or Enterprise plan you can scan private repositories with full OAuth security.",
    },
    {
      q: "How accurate is the AI bug detection?",
      a: "Our models are trained on millions of open‑source fixes and achieve over 98% accuracy on common bug patterns, with continuous improvement.",
    },
  ];

  const toggle = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section className="py-16 px-4 sm:px-6 border-t border-[var(--border-light)] bg-[var(--bg-secondary)]/30">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] text-center mb-2">
          Frequently asked questions
        </h2>
        <p className="text-[var(--text-secondary)] text-sm text-center mb-10">
          Everything you need to know about CodeVerity.
        </p>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] overflow-hidden"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-[var(--bg-hover)]/50 transition-colors"
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">{faq.q}</span>
                <span className="text-[var(--accent)] text-lg font-mono">
                  {openIndex === idx ? "−" : "+"}
                </span>
              </button>
              {openIndex === idx && (
                <div className="px-5 pb-4 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-light)] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="border-t border-[var(--border-light)] py-8 px-4 sm:px-6 text-[var(--text-muted)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <CodeVerityLogo />
          <span className="font-mono text-[10px]">CodeVerity © 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-[var(--text-primary)] transition-colors">About</Link>
          <Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
          <a href="mailto:support@codeverity.dev" className="hover:text-[var(--text-primary)] transition-colors">Support</a>
        </div>
        <div className="flex items-center gap-3">
          <span>Built with ❤️ for developers</span>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
//  MAIN HOME COMPONENT (existing + new sections)
// ============================================================

export default function Home() {
  const token = localStorage.getItem("token");
  const [show, setShow] = useState(false);
  const { compact } = usePreferences();

  // Refs for GSAP animation targets (existing)
  const containerRef = useRef(null);
  const brandRef = useRef(null);
  const badgeRef = useRef(null);
  const headingRef = useRef(null);
  const typedRef = useRef(null);
  const descriptionRef = useRef(null);
  const ctasRef = useRef(null);
  const trustRef = useRef(null);
  const statsRef = useRef(null);
  const featureLabelRef = useRef(null);
  const featureCardsRef = useRef([]);
  const bgGlow1Ref = useRef(null);
  const bgGlow2Ref = useRef(null);
  const bgGridRef = useRef(null);

  // Refs for new sections (to be animated on scroll)
  const howRef = useRef(null);
  const testimonialRef = useRef(null);
  const pricingRef = useRef(null);
  const faqRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  // ---- GSAP animations (existing + new) ----
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // --- Existing entrance timeline (unchanged) ---
        const tl = gsap.timeline({
          defaults: { ease: "power3.out", duration: 0.6 },
        });

        gsap.set(
          [
            brandRef.current,
            badgeRef.current,
            headingRef.current,
            typedRef.current,
            descriptionRef.current,
            ctasRef.current,
            trustRef.current,
            statsRef.current,
          ],
          { opacity: 0, y: 20 }
        );

        tl.to(brandRef.current, { opacity: 1, y: 0, duration: 0.5 })
          .to(badgeRef.current, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25")
          .to(headingRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
          .to(typedRef.current, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25")
          .to(descriptionRef.current, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2")
          .to(ctasRef.current, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 }, "-=0.2")
          .to(trustRef.current, { opacity: 1, y: 0, duration: 0.3 }, "-=0.15")
          .to(statsRef.current, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, "-=0.15");

        // --- Existing scroll triggers for feature section ---
        ScrollTrigger.create({
          trigger: featureLabelRef.current,
          start: "top 85%",
          onEnter: () => {
            gsap.fromTo(
              featureLabelRef.current,
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
          },
          once: true,
        });

        ScrollTrigger.create({
          trigger: featureCardsRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.fromTo(
              featureCardsRef.current,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.12,
                ease: "power2.out",
                clearProps: "opacity",
              }
            );
          },
          once: true,
        });

        // --- NEW scroll triggers for new sections ---
        const sections = [
          { ref: howRef, start: "top 80%" },
          { ref: testimonialRef, start: "top 80%" },
          { ref: pricingRef, start: "top 80%" },
          { ref: faqRef, start: "top 80%" },
        ];
        sections.forEach(({ ref, start }) => {
          if (!ref.current) return;
          ScrollTrigger.create({
            trigger: ref.current,
            start,
            onEnter: () => {
              gsap.fromTo(
                ref.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", clearProps: "opacity" }
              );
            },
            once: true,
          });
        });

        // --- Existing parallax glows (unchanged) ---
        const bgGlow1 = bgGlow1Ref.current;
        const bgGlow2 = bgGlow2Ref.current;
        const bgGrid = bgGridRef.current;
        if (bgGlow1) {
          ScrollTrigger.create({
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              gsap.to(bgGlow1, { y: self.progress * 20, duration: 0.1, overwrite: true });
            },
          });
        }
        if (bgGlow2) {
          ScrollTrigger.create({
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              gsap.to(bgGlow2, { y: -self.progress * 25, duration: 0.1, overwrite: true });
            },
          });
        }
        if (bgGrid) {
          ScrollTrigger.create({
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              gsap.to(bgGrid, { y: self.progress * 10, duration: 0.1, overwrite: true });
            },
          });
        }

        return () => {
          ScrollTrigger.getAll().forEach((st) => st.kill());
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // Ensure all elements (including new) are visible immediately
        gsap.set(
          [
            brandRef.current,
            badgeRef.current,
            headingRef.current,
            typedRef.current,
            descriptionRef.current,
            ctasRef.current,
            trustRef.current,
            statsRef.current,
            featureLabelRef.current,
            featureCardsRef.current,
            howRef.current,
            testimonialRef.current,
            pricingRef.current,
            faqRef.current,
          ],
          { opacity: 1, y: 0, clearProps: "all" }
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [] }
  );

  // Compact overrides (unchanged)
  const compactClasses = compact
    ? {
        container: "py-8",
        heading: "text-4xl sm:text-5xl md:text-[3.8rem]",
        subheading: "text-lg sm:text-xl",
        description: "text-xs sm:text-sm",
        brandMargin: "mb-5",
        badgeMargin: "mb-4",
        ctaMargin: "mb-6",
        statsMargin: "mb-8",
        featureGap: "gap-2",
        footerMargin: "mt-6",
        statPill: "px-4 py-2 min-w-[90px]",
        statValue: "text-lg",
        statLabel: "text-[8px]",
      }
    : {
        container: "py-16",
        heading: "text-5xl sm:text-6xl md:text-[4.4rem]",
        subheading: "text-xl sm:text-2xl",
        description: "text-sm sm:text-[15px]",
        brandMargin: "mb-7",
        badgeMargin: "mb-6",
        ctaMargin: "mb-9",
        statsMargin: "mb-12",
        featureGap: "gap-3",
        footerMargin: "mt-8",
        statPill: "px-5 py-3 min-w-[110px]",
        statValue: "text-xl",
        statLabel: "text-[9px]",
      };

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] px-4 text-[var(--text-primary)] sm:px-6">
      {/* Background glows and dot grid unchanged */}
      <div
        ref={bgGlow1Ref}
        className="pointer-events-none absolute left-1/2 top-[25%] h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "rgba(99,102,241,0.10)",
          filter: "blur(110px)",
        }}
      />
      <div
        ref={bgGlow2Ref}
        className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full"
        style={{
          background: "rgba(99,102,241,0.06)",
          filter: "blur(110px)",
        }}
      />
      <div
        ref={bgGridRef}
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <ParticleField />

      {/* MAIN CONTENT existing hero + new sections */}
      <div
        className={`relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center ${compactClasses.container} transition-all duration-700 ease-out ${
          show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="w-full max-w-5xl text-center">
          {/* ---- BRAND ---- */}
          <div ref={brandRef} className={`flex items-center justify-center gap-3 ${compactClasses.brandMargin}`}>
            <CodeVerityLogo />
            <div className="text-left">
              <p className="text-[12px] font-bold tracking-[0.22em] text-[var(--text-primary)] uppercase">
                CodeVerity
              </p>
              <p className="mt-0.5 text-[9px] text-[var(--text-secondary)]">
                AI-powered repository intelligence
              </p>
            </div>
          </div>

          {/* ---- BADGE ---- */}
          <div
            ref={badgeRef}
            className={`mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)]/80 px-3.5 py-1.5 text-[10px] font-medium text-[var(--text-secondary)] backdrop-blur-xl animate-pulse-glow ${compactClasses.badgeMargin}`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            AI-powered GitHub code analysis
          </div>

          {/* ---- HEADING ---- */}
          <h1
            ref={headingRef}
            className={`mb-3 font-extrabold leading-[1.05] tracking-tight ${compactClasses.heading}`}
          >
            <span className="text-[var(--text-primary)]">Code</span>
            <span className="text-[var(--accent)]">Verity</span>
          </h1>

          {/* ---- TYPED SUBTITLE ---- */}
          <p ref={typedRef} className={`mb-5 h-8 font-medium ${compactClasses.subheading}`}>
            <TypedWord
              words={[
                "Finds your bugs.",
                "Flags vulnerabilities.",
                "Generates tests.",
                "Ships confidence.",
              ]}
            />
          </p>

          {/* ---- DESCRIPTION ---- */}
          <p
            ref={descriptionRef}
            className={`mx-auto mb-8 max-w-2xl leading-relaxed text-[var(--text-secondary)] ${compactClasses.description}`}
          >
            Drop any public GitHub URL and get a complete AI-powered repository audit with architecture
            analysis, security findings, bug detection, performance insights, and generated tests.
          </p>

          {/* ---- CTA BUTTONS ---- */}
          <div ref={ctasRef} className={`flex flex-wrap justify-center gap-3 ${compactClasses.ctaMargin}`}>
            {token ? (
              <Link
                to="/dashboard"
                className="group relative overflow-hidden rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--accent-contrast,#ffffff)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:scale-[1.03] active:scale-95"
                style={{ boxShadow: "0 0 30px rgba(99,102,241,0.25)" }}
              >
                <ScanLine />
                <span className="relative z-10">Open Dashboard →</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group relative overflow-hidden rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--accent-contrast,#ffffff)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:scale-[1.03] active:scale-95"
                  style={{ boxShadow: "0 0 30px rgba(99,102,241,0.25)" }}
                >
                  <ScanLine />
                  <span className="relative z-10">Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/75 px-7 py-3 text-sm font-semibold text-[var(--text-primary)]/85 backdrop-blur-sm transition-all duration-200 hover:scale-[1.03] active:scale-95 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"
                >
                  Get Started Free →
                </Link>
              </>
            )}
          </div>

          {/* ---- TRUST LINE ---- */}
          <div
            ref={trustRef}
            className="mb-8 flex items-center justify-center gap-2 text-[9px] text-[var(--text-muted)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            No credit card required
            <span>•</span>
            Works with public GitHub repositories
          </div>

          {/* ---- STATS ---- */}
          <div
            ref={statsRef}
            className={`flex flex-wrap justify-center gap-2.5 ${compactClasses.statsMargin}`}
          >
            <StatPill value="100+" label="Repos Scanned" delayMs={500} />
            <StatPill value="98%" label="Issue Accuracy" delayMs={600} />
            <StatPill value="<60s" label="Avg Audit Time" delayMs={700} />
          </div>

          {/* ---- FEATURE LABEL ---- */}
          <div
            ref={featureLabelRef}
            className="mb-4 flex items-center gap-3"
            style={{ opacity: 0 }}
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border-light)]" />
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              What CodeVerity checks
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border-light)]" />
          </div>

          {/* ---- FEATURE CARDS ---- */}
          <div className={`grid ${compactClasses.featureGap} md:grid-cols-3`}>
            <div ref={(el) => (featureCardsRef.current[0] = el)} style={{ opacity: 0 }}>
              <Feature
                icon={<BugIcon />}
                title="AI Bug Detection"
                desc="Pinpoints logic errors, edge cases, and anti-patterns across your entire codebase."
                delay="0.55s"
              />
            </div>
            <div ref={(el) => (featureCardsRef.current[1] = el)} style={{ opacity: 0 }}>
              <Feature
                icon={<ShieldIcon />}
                title="Security Analysis"
                desc="Scans for OWASP vulnerabilities, exposed secrets, and injection risks instantly."
                delay="0.65s"
              />
            </div>
            <div ref={(el) => (featureCardsRef.current[2] = el)} style={{ opacity: 0 }}>
              <Feature
                icon={<FlaskIcon />}
                title="Smart Test Generation"
                desc="Creates useful test cases from your repository to help verify fixes and prevent regressions."
                delay="0.75s"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  NEW SECTIONS appear below the hero, with scroll reveals    */}
      {/* ============================================================ */}

      <div className="relative z-10 max-w-7xl mx-auto">
        <div ref={howRef} style={{ opacity: 0 }}>
          <HowItWorks />
        </div>
        <div ref={testimonialRef} style={{ opacity: 0 }}>
          <Testimonials />
        </div>
        <div ref={pricingRef} style={{ opacity: 0 }}>
          <Pricing />
        </div>
        <div ref={faqRef} style={{ opacity: 0 }}>
          <FAQ />
        </div>
        <Footer />
      </div>

      {/* ---- Global styles ---- */}
      <style>{`
        @keyframes scanline {
          0% { top: -2px; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(99,102,241,0.1); }
          50% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .animate-scan {
          animation: scanline 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
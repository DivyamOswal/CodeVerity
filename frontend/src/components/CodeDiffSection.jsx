// frontend/src/components/CodeDiffSection.jsx
import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

const BUGGY_CODE = [
  { type: "comment", text: "// Fetch user by ID" },
  { type: "kw",      text: "app.get", rest: "(\"/user/:id\", async (req, res) => {" },
  { type: "plain",   text: "  const user = await db.query(" },
  { type: "bad",     text: "    `SELECT * FROM users WHERE id = ${req.params.id}`" },
  { type: "plain",   text: "  );" },
  { type: "plain",   text: "  res.json(user);" },
  { type: "plain",   text: "});" },
];

const FIXED_CODE = [
  { type: "comment", text: "// Fetch user by ID" },
  { type: "kw",      text: "app.get", rest: "(\"/user/:id\", async (req, res) => {" },
  { type: "plain",   text: "  const user = await db.query(" },
  { type: "good",    text: "    \"SELECT * FROM users WHERE id = $1\"," },
  { type: "good",    text: "    [req.params.id]" },
  { type: "plain",   text: "  );" },
  { type: "plain",   text: "  res.json(user);" },
  { type: "plain",   text: "});" },
];

function CodeLine({ type, text, rest }) {
  const colors = {
    comment: "text-[var(--text-muted)]",
    kw: "text-[var(--accent)]",
    plain: "text-[var(--text-primary)]",
    bad: "text-[var(--color-danger)]",
    good: "text-[var(--color-success)]",
  };
  return (
    <div className="flex gap-3">
      <span className="w-4 shrink-0 select-none text-right font-mono text-[10px] text-[var(--text-muted)]/40">
        ·
      </span>
      <code className={`font-mono text-[11px] leading-[1.75] sm:text-xs ${colors[type]}`}>
        <span>{text}</span>
        {rest && <span className="text-[var(--text-primary)]">{rest}</span>}
      </code>
    </div>
  );
}

export default function CodeDiffSection() {
  const sectionRef = useRef(null);
  const beforeRef = useRef(null);
  const afterRef = useRef(null);
  const arrowRef = useRef(null);
  const prRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      });

      tl.from(beforeRef.current, { opacity: 0, x: -40, duration: 0.7, ease: "power3.out" })
        .from(arrowRef.current, { opacity: 0, scale: 0.6, duration: 0.4, ease: "back.out(2)" }, "-=0.35")
        .from(afterRef.current, { opacity: 0, x: 40, duration: 0.7, ease: "power3.out" }, "-=0.35")
        .from(prRef.current, { opacity: 0, y: 8, duration: 0.4 }, "-=0.2");
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative border-t border-[var(--border-light)] px-4 py-20 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            what ships to your PR
          </p>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Not just a list of problems.
            <br className="hidden sm:block" />
            <span className="text-[var(--accent)]">A working fix.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
            Every finding comes with a suggested patch. Review it, approve it,
            and CodeVerity opens a PR.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
          {/* Before */}
          <div
            ref={beforeRef}
            className="overflow-hidden rounded-xl border border-[var(--color-danger)]/25 bg-[var(--bg-card)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--color-danger-soft)]/30 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
                <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--color-danger)]">
                  vulnerable
                </span>
              </div>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">routes/user.js</span>
            </div>
            <div className="space-y-0.5 p-4 sm:p-5">
              {BUGGY_CODE.map((line, i) => (
                <CodeLine key={i} {...line} />
              ))}
            </div>
            <div className="border-t border-[var(--border-light)] px-4 py-3 sm:px-5">
              <div className="flex items-start gap-2 text-[11px]">
                <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold text-[var(--color-danger)]">
                  CRITICAL
                </span>
                <p className="text-[var(--text-secondary)]">
                  SQL injection via unescaped user input in a template literal.
                </p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div
            ref={arrowRef}
            className="flex items-center justify-center lg:flex-col"
            aria-hidden="true"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="rotate-90 lg:rotate-0"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* After */}
          <div
            ref={afterRef}
            className="overflow-hidden rounded-xl border border-[var(--color-success)]/25 bg-[var(--bg-card)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--color-success-soft)]/30 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--color-success)]">
                  fixed
                </span>
              </div>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">routes/user.js</span>
            </div>
            <div className="space-y-0.5 p-4 sm:p-5">
              {FIXED_CODE.map((line, i) => (
                <CodeLine key={i} {...line} />
              ))}
            </div>
            <div className="border-t border-[var(--border-light)] px-4 py-3 sm:px-5">
              <div className="flex items-start gap-2 text-[11px]">
                <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold text-[var(--color-success)]">
                  RESOLVED
                </span>
                <p className="text-[var(--text-secondary)]">
                  Parameterized query — input is escaped by the driver.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PR callout */}
        <div
          ref={prRef}
          className="mx-auto mt-8 flex max-w-lg items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]/60 px-4 py-3 backdrop-blur-md"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3v12" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              CodeVerity opened PR #482
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              fix/sql-injection-user-route · 1 file changed · ready for review
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
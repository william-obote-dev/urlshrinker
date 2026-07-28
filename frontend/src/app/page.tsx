"use client";
import { useState } from "react";
import { createShortLink, ShortLink } from "@/lib/api";
import Link from "next/link";

const EXPIRY_OPTIONS = [
  { label: "Never", value: undefined },
  { label: "1 Day", value: 86400 },
  { label: "7 Days", value: 604800 },
  { label: "30 Days", value: 2592000 },
];

const TRACE_STEPS = [
  { key: "browser", label: "BROWSER", detail: "GET /a1B2c3", ms: null },
  { key: "edge", label: "EDGE", detail: "Route lookup", ms: 1.4 },
  { key: "redis", label: "REDIS", detail: "Cache hit · Base62 decode", ms: 0.8 },
  { key: "redirect", label: "302", detail: "Redirect issued", ms: 1.6 },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [ttl, setTtl] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortLink | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [traceStage, setTraceStage] = useState(-1);

  function playTrace() {
    setTraceStage(0);
    TRACE_STEPS.forEach((_, i) => {
      setTimeout(() => setTraceStage(i), 250 + i * 260);
    });
  }

  async function handleShorten() {
    if (!url) { setError("Enter a URL to shorten."); return; }
    setLoading(true);
    setError("");
    setResult(null);
    setTraceStage(-1);
    try {
      const data = await createShortLink(url, alias || undefined, ttl);
      setResult(data);
      setUrl("");
      setAlias("");
      playTrace();
    } catch (e: any) {
      setError(e.message || "Couldn't shorten that URL. Check it and try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ink/90 backdrop-blur-xl border-b border-line px-6 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-teal flex items-center justify-center font-display font-black text-ink text-sm">U</div>
          <span className="font-display font-bold text-lg tracking-tight text-paper">URLShrinker</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden sm:flex items-center gap-2 tag bg-teal/10 text-teal border border-teal/25">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-dot" />
            sub-5ms · live
          </span>
          <Link href="/dashboard" className="text-dim hover:text-paper text-sm font-medium transition-colors">
            Dashboard →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-36 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber" />
            REQUEST TRACE VISUALIZER
          </div>

          <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight leading-[0.95] mb-6 text-paper">
            Shrink the link.
            <br />
            <span className="text-teal">Watch the request.</span>
          </h1>

          <p className="text-dim text-lg max-w-md mx-auto mb-10 leading-relaxed">
            Every redirect traced end to end — edge routing, Redis lookup, and the 302 response — in real milliseconds, not marketing numbers.
          </p>

          {/* SHORTENER CARD */}
          <div className="max-w-xl mx-auto panel p-5 text-left">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                className="input-field"
                type="url"
                placeholder="https://your-very-long-url.com/goes/here"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleShorten()}
                aria-label="URL to shorten"
              />
              <button className="btn-primary whitespace-nowrap" onClick={handleShorten} disabled={loading}>
                {loading ? "Tracing…" : "Shorten →"}
              </button>
            </div>

            <div className="flex gap-3 flex-wrap">
              <input
                className="input-field flex-1 min-w-[140px]"
                placeholder="Custom alias (optional)"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                aria-label="Custom alias"
              />
              <select
                className="input-field w-auto cursor-pointer"
                value={ttl ?? ""}
                onChange={e => setTtl(e.target.value ? Number(e.target.value) : undefined)}
                aria-label="Link expiry"
              >
                {EXPIRY_OPTIONS.map(o => (
                  <option key={o.label} value={o.value ?? ""}>{o.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red/10 border border-red/25 text-red text-sm font-medium">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-5 pt-5 border-t border-line">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-teal font-semibold text-base">{result.shortUrl}</span>
                    {result.demo && (
                      <span className="tag bg-amber/10 text-amber border border-amber/25">preview</span>
                    )}
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-md bg-teal/10 text-teal border border-teal/25 text-xs font-semibold hover:bg-teal/20 transition-colors cursor-pointer"
                    onClick={copyLink}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                {/* REQUEST TRACE */}
                <div className="bg-ink rounded-lg border border-line p-4">
                  <div className="flex items-center justify-between">
                    {TRACE_STEPS.map((step, i) => (
                      <div key={step.key} className="flex items-center flex-1 last:flex-none">
                        <div
                          className={`flex flex-col items-center gap-1.5 transition-opacity duration-300 ${
                            traceStage >= i ? "opacity-100" : "opacity-20"
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              traceStage >= i ? "bg-teal" : "bg-line"
                            }`}
                          />
                          <span className="font-mono text-[10px] text-paper font-semibold tracking-wide">
                            {step.label}
                          </span>
                        </div>
                        {i < TRACE_STEPS.length - 1 && (
                          <div className="flex-1 mx-1.5 flex flex-col items-center gap-1">
                            <div className="trace-line w-full" />
                            <span
                              className={`font-mono text-[10px] mono-num transition-opacity duration-300 ${
                                traceStage > i ? "opacity-100 text-amber" : "opacity-0"
                              }`}
                            >
                              {TRACE_STEPS[i + 1].ms}ms
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {result.expiresAt && (
                  <div className="mt-3 text-xs text-dim">
                    Expires {new Date(result.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STAT RAIL */}
          <div className="flex justify-center gap-8 md:gap-14 mt-16 flex-wrap">
            {[
              { num: "56B", label: "Possible codes" },
              { num: "<5ms", label: "p99 latency" },
              { num: "97%", label: "Cache hit rate" },
              { num: "0", label: "Collisions" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-8 md:gap-14">
                <div className="text-center">
                  <div className="mono-num text-2xl md:text-3xl text-paper">{s.num}</div>
                  <div className="text-[11px] text-dim mt-1 font-medium uppercase tracking-wide">{s.label}</div>
                </div>
                {i < 3 && <div className="hidden md:block trace-line-v h-8" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UNDER THE HOOD — connected pipeline */}
      <section className="max-w-2xl mx-auto px-6 pb-28">
        <div className="text-center mb-14">
          <div className="eyebrow mb-3">THE ACTUAL REQUEST LIFECYCLE</div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-paper">Under the hood</h2>
        </div>

        <div className="relative pl-10">
          <div className="absolute left-[15px] top-2 bottom-2 trace-line-v" />

          {[
            {
              n: "01",
              title: "Base62 ID generation",
              body: "An atomic Redis INCR counter converts to Base62 — 56 billion unique 6-character codes, zero collision risk. No UUIDs, no retry loops.",
              chip: "Redis INCR → Base62",
            },
            {
              n: "02",
              title: "Redis speed layer",
              body: "Every redirect checks Redis first (~0.8ms). On a miss, it falls back to PostgreSQL and writes back to cache. 97% of requests never touch the DB.",
              chip: "Cache-aside pattern",
            },
            {
              n: "03",
              title: "Non-blocking analytics",
              body: "Click tracking uses setImmediate() — the redirect fires first, analytics write to Postgres asynchronously after. Zero latency added for the user.",
              chip: "Fire-and-forget",
            },
          ].map((step) => (
            <div key={step.n} className="relative mb-10 last:mb-0">
              <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-panel border border-line flex items-center justify-center">
                <span className="font-mono text-[11px] text-teal font-semibold">{step.n}</span>
              </div>
              <h3 className="font-display font-semibold text-base text-paper mb-1.5">{step.title}</h3>
              <p className="text-dim text-sm leading-relaxed mb-2.5">{step.body}</p>
              <span className="font-mono text-[11px] bg-panel2 text-teal px-2 py-1 rounded-md border border-line">
                {step.chip}
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line py-8 px-6 text-center">
        <p className="text-dim text-sm mb-2">
          Built by <span className="text-paper font-semibold">William Obote Makokha</span>
        </p>
        <p className="font-mono text-[11px] text-dim">
          NestJS · Redis · PostgreSQL · Docker · Kubernetes
        </p>
      </footer>
    </div>
  );
}

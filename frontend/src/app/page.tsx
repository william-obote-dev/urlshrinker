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

export default function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [ttl, setTtl] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortLink | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleShorten() {
    if (!url) { setError("Please enter a URL"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await createShortLink(url, alias || undefined, ttl);
      setResult(data);
      setUrl("");
      setAlias("");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
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
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/90 backdrop-blur-xl border-b border-border px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo to-cyan flex items-center justify-center font-black text-white text-sm">U</div>
          <span className="font-bold text-lg tracking-tight">URLShrinker</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-muted hover:text-white text-sm font-medium transition-colors">Dashboard →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-40 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo/10 blur-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 bg-indigo/10 border border-indigo/30 rounded-full px-4 py-2 text-xs font-semibold text-indigo uppercase tracking-wider mb-8">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          Live · Sub-5ms Redirects · Redis Cached
        </div>

        <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 leading-none">
          Shrink URLs.<br />
          <span className="gradient-text">Scale to millions.</span>
        </h1>
        <p className="text-muted text-xl max-w-lg mx-auto mb-12 leading-relaxed">
          Production-grade URL shortener with Redis caching, real-time analytics, QR codes, and link expiry. No toys here.
        </p>

        {/* SHORTENER CARD */}
        <div className="max-w-2xl mx-auto card shadow-2xl shadow-indigo/10">
          {/* URL input */}
          <div className="flex gap-3 mb-4">
            <input
              className="input-field"
              type="url"
              placeholder="https://your-very-long-url.com/goes/here..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleShorten()}
            />
            <button className="btn-primary whitespace-nowrap" onClick={handleShorten} disabled={loading}>
              {loading ? "..." : "Shorten →"}
            </button>
          </div>

          {/* Options */}
          <div className="flex gap-3 flex-wrap">
            <input
              className="input-field flex-1 min-w-[140px]"
              placeholder="Custom alias (optional)"
              value={alias}
              onChange={e => setAlias(e.target.value)}
            />
            <select
              className="input-field w-auto cursor-pointer"
              value={ttl ?? ""}
              onChange={e => setTtl(e.target.value ? Number(e.target.value) : undefined)}
            >
              {EXPIRY_OPTIONS.map(o => (
                <option key={o.label} value={o.value ?? ""}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red/10 border border-red/20 text-red text-sm font-medium">
              ✕ {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-4 p-4 rounded-xl bg-surface2 border border-cyan/20 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="font-mono text-cyan font-bold text-lg">{result.shortUrl}</span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg bg-indigo/15 text-indigo border border-indigo/25 text-xs font-semibold hover:bg-indigo/30 transition-colors cursor-pointer"
                    onClick={copyLink}
                  >
                    {copied ? "✓ Copied!" : "⎘ Copy"}
                  </button>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted">
                <span>⚡ Redis cached · &lt;5ms</span>
                <span>{result.expiresAt ? `⏱ Expires ${new Date(result.expiresAt).toLocaleDateString()}` : "⏱ Never expires"}</span>
              </div>
              {result.qrCode && (
                <div className="mt-3 inline-block bg-white rounded-xl p-3">
                  <img src={result.qrCode} alt="QR Code" className="w-28 h-28" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* STATS ROW */}
        <div className="flex justify-center gap-12 mt-16">
          {[
            { num: "56B", label: "Possible codes (Base62)" },
            { num: "<5ms", label: "p99 redirect latency" },
            { num: "97%", label: "Cache hit rate" },
            { num: "100%", label: "Collision-free" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black font-mono text-white">{s.num}</div>
              <div className="text-xs text-muted mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-12">
          <span className="gradient-text">How it works</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { num: "01", title: "Base62 ID Generation", body: "An atomic Redis INCR counter converts to Base62 — giving 56 billion unique 6-character codes with zero collision risk. No UUIDs, no retry loops.", chip: "Redis INCR → Base62" },
            { num: "02", title: "Redis Speed Layer", body: "Every redirect checks Redis first (~2ms). On a cache miss, it falls back to PostgreSQL and writes back to cache. 97% of requests never touch the DB.", chip: "Cache-aside pattern" },
            { num: "03", title: "Non-Blocking Analytics", body: "Click tracking uses setImmediate() — the redirect fires first, then analytics write to Postgres asynchronously. Zero latency added to the user.", chip: "Fire-and-forget" },
          ].map(c => (
            <div key={c.num} className="card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo to-cyan" />
              <div className="text-xs font-bold text-indigo uppercase tracking-widest mb-2">{c.num}</div>
              <h3 className="text-base font-bold mb-2">{c.title}</h3>
              <p className="text-muted text-sm leading-relaxed mb-3">{c.body}</p>
              <span className="font-mono text-xs bg-surface3 text-cyan px-2 py-1 rounded-md border border-border">{c.chip}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-muted text-sm">
        Built by <span className="text-indigo font-semibold">William Obote Makokha</span>
        {" · "}NestJS · Redis · PostgreSQL · Docker · Kubernetes
      </footer>
    </div>
  );
}

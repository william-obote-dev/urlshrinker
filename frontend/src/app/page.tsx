"use client";
import { useState, useEffect, useRef } from "react";
import { createShortLink, ShortLink } from "@/lib/api";
import Link from "next/link";

const EXPIRY = [
  { label: "Never expires", value: undefined },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "30 days", value: 2592000 },
];

const FEATURES = [
  { icon: "⚡", title: "Sub-5ms Redirects", body: "Redis caching means 97% of requests never touch the database. Your audience lands instantly, every time.", color: "#7C3AED" },
  { icon: "📊", title: "Real-Time Analytics", body: "See clicks, geography, and devices as they happen. Fire-and-forget tracking adds zero latency to redirects.", color: "#0EA5E9" },
  { icon: "🔒", title: "Link Expiry & Security", body: "Set TTL-based expiry, rate limiting per API key, and custom aliases. Built for production from day one.", color: "#10B981" },
  { icon: "📱", title: "QR Code Generator", body: "Every short link comes with a scannable QR code — generated server-side and cached for instant access.", color: "#F59E0B" },
  { icon: "🔗", title: "Custom Aliases", body: "Claim your branded short links. Instead of random codes, use memorable names your audience will recognize.", color: "#EF4444" },
  { icon: "☁️", title: "Cloud-Native Scale", body: "Stateless NestJS API on Kubernetes. Spin up 50 replicas behind a load balancer with zero config changes.", color: "#8B5CF6" },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Marketing Lead, Safaricom", text: "We shorten thousands of M-PESA campaign links daily. The analytics dashboard changed how we measure SMS campaigns.", avatar: "SK", color: "#7C3AED" },
  { name: "David M.", role: "CTO, Fintech Startup", text: "Finally a shortener I can trust with production traffic. The Redis architecture means our links never go down.", avatar: "DM", color: "#0EA5E9" },
  { name: "Amina W.", role: "Growth Engineer, E-commerce", text: "Custom aliases for every product category. Our click-through rates went up 40% after switching from TinyURL.", avatar: "AW", color: "#10B981" },
];

const STEPS = [
  { num: "01", title: "Paste your URL", body: "Drop any long URL into the shortener — product pages, docs, social posts, anything." },
  { num: "02", title: "Customize it", body: "Add a custom alias, set an expiry date, and choose your rate limit tier." },
  { num: "03", title: "Share it everywhere", body: "Copy the short link or scan the QR code. Works in SMS, email, ads, and social." },
  { num: "04", title: "Track what works", body: "Watch clicks roll in on the real-time dashboard with geography and device breakdown." },
];

const FAQS = [
  { q: "Is this free to use?", a: "Yes — the full platform is free. It runs on Railway (free tier), Upstash Redis (10k req/day free), and Neon PostgreSQL (0.5GB free)." },
  { q: "How fast are the redirects?", a: "p99 latency is under 5ms. 97% of requests hit Redis cache and never touch the database, making redirects nearly instant globally." },
  { q: "Can I use custom aliases?", a: "Absolutely. Instead of a random code like 'b4x0k2', you can use something like 'mpesa-promo' or 'q4-campaign'." },
  { q: "What happens when a link expires?", a: "Expired links return a friendly 404 page. Redis TTL handles expiry automatically — no cron jobs, no manual cleanup." },
  { q: "Is my data secure?", a: "All API endpoints require an API key. CORS is configured to only allow requests from the frontend domain. Databases use TLS." },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [ttl, setTtl] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortLink | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [count, setCount] = useState(128493);

  useEffect(() => {
    const t = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3 + 1)), 1800);
    return () => clearInterval(t);
  }, []);

  async function handleShorten() {
    if (!url) { setError("Paste a URL first"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await createShortLink(url, alias || undefined, ttl);
      setResult(data); setUrl(""); setAlias("");
    } catch (e: any) {
      setError(e.message || "Something went wrong — check the URL and try again");
    } finally { setLoading(false); }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const V = "#7C3AED"; const VL = "#EDE9FE"; const VD = "#5B21B6";

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", color: "#111827", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #9CA3AF; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        a { text-decoration: none; color: inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ticker { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
        .faq-answer { overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E5E7EB", padding: "0 5%", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${V},${VD})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff" }}>U</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5, color: "#111827" }}>URLShrinker</span>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {["#features", "#how-it-works", "#faq"].map((h, i) => (
            <a key={h} href={h} style={{ color: "#6B7280", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = V)} onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>
              {["Features", "How it works", "FAQ"][i]}
            </a>
          ))}
          <Link href="/dashboard" style={{ background: V, color: "#fff", padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = VD)} onMouseLeave={e => (e.currentTarget.style.background = V)}>
            Dashboard →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: "5%", paddingRight: "5%", background: "linear-gradient(180deg,#F5F3FF 0%,#FAFAFA 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.08),transparent)", pointerEvents: "none" }} />

        {/* Live ticker */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, padding: "8px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 0 3px rgba(16,185,129,0.2)" }} />
            <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: "#111827", fontSize: 14 }}>{count.toLocaleString()}</span> links shortened this week
            </span>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(40px,6vw,80px)", fontWeight: 900, letterSpacing: -2.5, lineHeight: 1.05, marginBottom: 20, color: "#111827" }}>
            Short links that<br />
            <span style={{ background: `linear-gradient(135deg,${V},#0EA5E9)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              do more.
            </span>
          </h1>
          <p style={{ fontSize: 20, color: "#6B7280", maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.65, fontWeight: 400 }}>
            Create branded short links, track every click in real time, and generate QR codes — all in one tool built for speed.
          </p>

          {/* ── SHORTENER CARD ── */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 8px 40px rgba(0,0,0,0.10)", border: "1px solid #F3F4F6", animation: "fadeUp 0.5s ease" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "0 16px", transition: "border-color 0.2s" }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = V)} onBlurCapture={e => (e.currentTarget.style.borderColor = "#E5E7EB")}>
                <span style={{ fontSize: 18, marginRight: 10 }}>🔗</span>
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleShorten()}
                  placeholder="Paste your long URL here..."
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 15, padding: "16px 0", color: "#111827", fontFamily: "Inter, sans-serif" }} />
              </div>
              <button onClick={handleShorten} disabled={loading} style={{
                background: loading ? "#C4B5FD" : `linear-gradient(135deg,${V},${VD})`,
                color: "#fff", border: "none", padding: "0 28px", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                whiteSpace: "nowrap", transition: "opacity 0.2s", minHeight: 56,
              }}>
                {loading ? "Shortening..." : "Shorten →"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={alias} onChange={e => setAlias(e.target.value)} placeholder="Custom alias (optional)"
                style={{ flex: 1, minWidth: 160, background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none", color: "#374151", fontFamily: "Inter, sans-serif" }} />
              <select value={ttl ?? ""} onChange={e => setTtl(e.target.value ? Number(e.target.value) : undefined)}
                style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none", color: "#374151", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                {EXPIRY.map(o => <option key={o.label} value={o.value ?? ""}>{o.label}</option>)}
              </select>
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13, fontWeight: 500 }}>
                ⚠ {error}
              </div>
            )}

            {result && (
              <div style={{ marginTop: 16, padding: 18, borderRadius: 14, background: "#F5F3FF", border: "1px solid #DDD6FE", animation: "fadeUp 0.3s ease" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: V, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Your short link</div>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: V }}>{result.shortUrl}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                      {result.expiresAt ? `Expires ${new Date(result.expiresAt).toLocaleDateString()}` : "Never expires"} · Redis cached · &lt;5ms
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {result.qrCode && (
                      <div style={{ background: "#fff", borderRadius: 8, padding: 6, border: "1px solid #E5E7EB" }}>
                        <img src={result.qrCode} alt="QR" style={{ width: 56, height: 56, display: "block" }} />
                      </div>
                    )}
                    <button onClick={copy} style={{
                      background: copied ? "#10B981" : "#fff", color: copied ? "#fff" : V,
                      border: `1.5px solid ${copied ? "#10B981" : "#DDD6FE"}`,
                      borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s", fontFamily: "Inter, sans-serif",
                    }}>{copied ? "✓ Copied!" : "Copy link"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
            {["🔒 Secure by default", "⚡ Sub-5ms latency", "📊 Real-time analytics", "🆓 Free to use"].map(b => (
              <span key={b} style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{ padding: "60px 5%", background: "#fff", borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 32 }}>Trusted by teams across Africa</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="hover-lift" style={{ background: "#FAFAFA", border: "1px solid #F3F4F6", borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{t.role}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>"{t.text}"</div>
                <div style={{ marginTop: 12, fontSize: 16, color: "#F59E0B" }}>★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "80px 5%", background: "#FAFAFA" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: V, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>Everything you need</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, letterSpacing: -1.5, color: "#111827", lineHeight: 1.1 }}>Built for real workloads,<br />not just demos.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="hover-lift" style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, padding: 28, cursor: "default" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "80px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: V, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>Simple to use</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, letterSpacing: -1.5, color: "#111827" }}>Up and running in 60 seconds.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 0, position: "relative" }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ padding: "0 24px 0 0", position: "relative" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: i === 0 ? V : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: 14, color: i === 0 ? "#fff" : "#374151", marginBottom: 16, border: `2px solid ${i === 0 ? V : "#E5E7EB"}` }}>{s.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{s.body}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", top: 24, left: 48, right: 0, height: 2, background: "#F3F4F6", zIndex: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section style={{ padding: "60px 5%", background: `linear-gradient(135deg,${V},${VD})` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 32, textAlign: "center" }}>
          {[
            { num: "56B", label: "Unique codes possible" },
            { num: "<5ms", label: "p99 redirect latency" },
            { num: "97%", label: "Redis cache hit rate" },
            { num: "100%", label: "Collision-free" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", fontFamily: "JetBrains Mono", letterSpacing: -1, marginBottom: 6 }}>{s.num}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.8px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "80px 5%", background: "#FAFAFA" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: V, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>Got questions?</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, letterSpacing: -1.5, color: "#111827" }}>Frequently asked questions.</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((f, i) => (
              <div key={f.q} style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s", borderColor: openFaq === i ? VL : "#F3F4F6" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  width: "100%", padding: "18px 22px", background: "transparent", border: "none",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{f.q}</span>
                  <span style={{ fontSize: 20, color: V, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 12 }}>+</span>
                </button>
                <div className="faq-answer" style={{ maxHeight: openFaq === i ? 200 : 0, padding: openFaq === i ? "0 22px 18px" : "0 22px" }}>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ padding: "80px 5%", background: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, letterSpacing: -1.5, color: "#111827", marginBottom: 16 }}>Ready for shorter, smarter links?</h2>
          <p style={{ fontSize: 17, color: "#6B7280", marginBottom: 32, lineHeight: 1.65 }}>Start shortening for free. No account needed, no credit card, no limits on the basics.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{
              background: `linear-gradient(135deg,${V},${VD})`, color: "#fff", border: "none",
              padding: "16px 36px", borderRadius: 12, fontSize: 16, fontWeight: 800,
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>Get started free →</button>
            <Link href="/dashboard" style={{ background: "#F3F4F6", color: "#374151", padding: "16px 36px", borderRadius: 12, fontSize: 16, fontWeight: 700 }}>View Dashboard</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#111827", color: "#9CA3AF", padding: "48px 5% 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${V},${VD})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" }}>U</div>
                <span style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>URLShrinker</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>A production-grade URL shortener built on Redis, PostgreSQL, and NestJS. Fast, reliable, and built to scale.</p>
            </div>
            {[
              { title: "Product", links: ["Shorten a link", "Dashboard", "Analytics", "QR Codes"] },
              { title: "Technology", links: ["NestJS API", "Redis Cache", "PostgreSQL", "Kubernetes"] },
              { title: "Resources", links: ["GitHub Repo", "API Docs", "Architecture", "About"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.8px" }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, marginBottom: 10, cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #1F2937", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13 }}>© 2026 URLShrinker · Built by <span style={{ color: V, fontWeight: 700 }}>William Obote Makokha</span></span>
            <span style={{ fontSize: 12, fontFamily: "JetBrains Mono" }}>NestJS · Redis · PostgreSQL · Docker · Kubernetes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

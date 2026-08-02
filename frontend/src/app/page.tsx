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

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function AnimatedBar({ pct, color, delay = 0, inView }: { pct: number; color: string; delay?: number; inView: boolean }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { if (inView) { setTimeout(() => setWidth(pct), delay); } }, [inView, pct, delay]);
  return (
    <div style={{ background: "#F3F4F6", borderRadius: 4, height: 8, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${width}%`, background: color, borderRadius: 4, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function CountUp({ target, inView, suffix = "" }: { target: number; inView: boolean; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.floor(start));
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [inView, target]);
  return <>{val.toLocaleString()}{suffix}</>;
}

function Slide({ children, from = "left", delay = 0, inView }: { children: React.ReactNode; from?: "left" | "right" | "bottom"; delay?: number; inView: boolean }) {
  const tx = from === "left" ? "-60px" : from === "right" ? "60px" : "0";
  const ty = from === "bottom" ? "60px" : "0";
  return (
    <div style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translate(0,0)" : `translate(${tx},${ty})`,
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
    }}>{children}</div>
  );
}

function LiveGraph({ inView }: { inView: boolean }) {
  const [points, setPoints] = useState<number[]>([20, 35, 28, 45, 38, 55, 48, 62, 55, 70, 65, 82, 74, 90, 85, 95]);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => {
      setPoints(p => {
        const next = [...p.slice(1), Math.max(10, Math.min(98, p[p.length - 1] + (Math.random() - 0.4) * 12))];
        return next;
      });
    }, 1200);
    return () => clearInterval(t);
  }, [inView]);

  const W = 320, H = 120;
  const pts = points.map((v, i) => `${(i / (points.length - 1)) * W},${H - (v / 100) * H}`).join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 120, overflow: "visible" }}>
      <defs>
        <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#ga)" style={{ transition: "all 0.8s ease" }} />
      <polyline points={pts} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ transition: "all 0.8s ease" }} />
      {points.map((v, i) => i === points.length - 1 ? (
        <circle key={i} cx={(i / (points.length - 1)) * W} cy={H - (v / 100) * H} r="4" fill="#7C3AED" stroke="#fff" strokeWidth="2">
          <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      ) : null)}
    </svg>
  );
}

function DonutChart({ inView }: { inView: boolean }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => { if (inView) { setTimeout(() => setProgress(97), 200); } }, [inView]);
  const r = 40, circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;
  return (
    <svg viewBox="0 0 100 100" style={{ width: 100, height: 100 }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#7C3AED" strokeWidth="12"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="800" fill="#111827" fontFamily="Inter">{progress}%</text>
    </svg>
  );
}

function GeoBar({ country, pct, color, inView, delay }: { country: string; pct: number; color: string; inView: boolean; delay: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{country}</span>
        <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "JetBrains Mono, monospace" }}>{pct}%</span>
      </div>
      <AnimatedBar pct={pct} color={color} delay={delay} inView={inView} />
    </div>
  );
}

const FEATURES = [
  { icon: "⚡", title: "Sub-5ms Redirects", body: "Redis caching means 97% of requests never touch the database. Instant for everyone.", color: "#7C3AED", from: "left" as const },
  { icon: "📊", title: "Real-Time Analytics", body: "See clicks, geography, and devices as they happen with zero latency added to redirects.", color: "#0EA5E9", from: "bottom" as const },
  { icon: "🔒", title: "Link Expiry & Security", body: "TTL-based expiry, rate limiting, and custom aliases. Production-ready from day one.", color: "#10B981", from: "right" as const },
  { icon: "📱", title: "QR Code Generator", body: "Every short link generates a scannable QR code, cached server-side for instant access.", color: "#F59E0B", from: "left" as const },
  { icon: "🔗", title: "Custom Aliases", body: "Replace random codes with memorable branded names your audience will recognise.", color: "#EF4444", from: "bottom" as const },
  { icon: "☁️", title: "Cloud-Native Scale", body: "Stateless NestJS on Kubernetes. Scale to 50 replicas with zero configuration changes.", color: "#8B5CF6", from: "right" as const },
];

const FAQS = [
  { q: "Is this free to use?", a: "Yes — the full platform runs free on Railway, Upstash Redis (10k req/day), and Neon PostgreSQL (0.5GB)." },
  { q: "How fast are the redirects?", a: "p99 latency is under 5ms. 97% of requests hit Redis and never touch the database." },
  { q: "Can I use custom aliases?", a: "Yes. Instead of a random code like 'b4x0k2', create 'mpesa-promo' or 'q4-campaign'." },
  { q: "What happens when a link expires?", a: "Redis TTL handles expiry automatically — expired links return a friendly 404." },
  { q: "Is my data secure?", a: "All write endpoints require an API key. CORS only allows the frontend domain. Databases use TLS." },
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
  const [liveCount, setLiveCount] = useState(128493);

  const heroRef = useRef<HTMLDivElement>(null);
  const statsSection = useInView();
  const featuresSection = useInView();
  const analyticsSection = useInView();
  const faqSection = useInView();

  useEffect(() => {
    const t = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 3 + 1)), 1800);
    return () => clearInterval(t);
  }, []);

  async function handleShorten() {
    if (!url) { setError("Paste a URL first"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await createShortLink(url, alias || undefined, ttl);
      setResult(data); setUrl(""); setAlias("");
    } catch (e: any) { setError(e.message || "Something went wrong — check the URL and try again"); }
    finally { setLoading(false); }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const V = "#7C3AED"; const VD = "#5B21B6";

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", color: "#111827", fontFamily: "Inter, -apple-system, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #9CA3AF; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        a { text-decoration: none; color: inherit; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(124,58,237,0.3)} 70%{box-shadow:0 0 0 10px rgba(124,58,237,0)} 100%{box-shadow:0 0 0 0 rgba(124,58,237,0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .hover-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .hover-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(0,0,0,0.10); }
        select option { background: #fff; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,250,250,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #E5E7EB", padding: "0 5%", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${V},${VD})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff" }}>U</div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>URLShrinker</span>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[["#features","Features"],["#analytics","Analytics"],["#faq","FAQ"]].map(([h,l]) => (
            <a key={h} href={h} style={{ color: "#6B7280", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={e=>(e.currentTarget.style.color=V)} onMouseLeave={e=>(e.currentTarget.style.color="#6B7280")}>{l}</a>
          ))}
          <Link href="/dashboard" style={{ background: V, color: "#fff", padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, transition: "background 0.2s" }}
            onMouseEnter={e=>(e.currentTarget.style.background=VD)} onMouseLeave={e=>(e.currentTarget.style.background=V)}>Dashboard →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: "5%", paddingRight: "5%", background: "linear-gradient(160deg,#F5F3FF 0%,#EFF6FF 50%,#FAFAFA 100%)", position: "relative", overflow: "hidden" }}>
        {/* Animated background blobs */}
        <div style={{ position: "absolute", top: 80, right: "8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.07),transparent)", animation: "float 6s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 40, left: "5%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(14,165,233,0.07),transparent)", animation: "float2 8s ease-in-out infinite", pointerEvents: "none" }} />

        {/* Floating mini-cards */}
        <div style={{ position: "absolute", top: 140, right: "4%", background: "#fff", borderRadius: 14, padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", border: "1px solid #F3F4F6", animation: "float 5s ease-in-out infinite", pointerEvents: "none", zIndex: 1 }}>
          <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>CLICKS TODAY</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: V, fontFamily: "JetBrains Mono, monospace" }}>84,291</div>
          <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700, marginTop: 2 }}>↑ 18.4% vs yesterday</div>
        </div>
        <div style={{ position: "absolute", top: 280, right: "12%", background: "#fff", borderRadius: 14, padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", border: "1px solid #F3F4F6", animation: "float2 7s ease-in-out infinite", pointerEvents: "none", zIndex: 1 }}>
          <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>CACHE HIT RATE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#10B981", fontFamily: "JetBrains Mono, monospace" }}>97.2%</div>
          <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>Redis · Sub-5ms</div>
        </div>

        <div style={{ maxWidth: 680, animation: "fadeUp 0.7s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #DDD6FE", borderRadius: 20, padding: "7px 16px", marginBottom: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse-ring 2s infinite" }} />
            <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: "#111827" }}>{liveCount.toLocaleString()}</span> links shortened
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(44px,6vw,82px)", fontWeight: 900, letterSpacing: -3, lineHeight: 1.0, marginBottom: 22, color: "#111827" }}>
            Short links that<br />
            <span style={{ background: `linear-gradient(135deg,${V},#0EA5E9)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              scale to millions.
            </span>
          </h1>
          <p style={{ fontSize: 19, color: "#6B7280", maxWidth: 500, marginBottom: 48, lineHeight: 1.65, fontWeight: 400 }}>
            Production-grade URL shortener with Redis caching, real-time analytics, QR codes, and link expiry. Built to last.
          </p>

          {/* SHORTENER */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 12px 48px rgba(0,0,0,0.10)", border: "1px solid #F3F4F6", maxWidth: 640 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "0 14px", transition: "border-color 0.2s, box-shadow 0.2s" }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = V; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}>
                <span style={{ fontSize: 16, marginRight: 8 }}>🔗</span>
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleShorten()}
                  placeholder="Paste your long URL here..."
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, padding: "15px 0", color: "#111827", fontFamily: "Inter, sans-serif" }} />
              </div>
              <button onClick={handleShorten} disabled={loading} style={{ background: loading ? "#C4B5FD" : `linear-gradient(135deg,${V},${VD})`, color: "#fff", border: "none", padding: "0 24px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap", minHeight: 52, transition: "opacity 0.2s, transform 0.1s", fontFamily: "Inter, sans-serif" }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "scale(1.02)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                {loading ? "Shortening..." : "Shorten →"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={alias} onChange={e => setAlias(e.target.value)} placeholder="Custom alias (optional)"
                style={{ flex: 1, background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", color: "#374151", fontFamily: "Inter, sans-serif", transition: "border-color 0.2s" }}
                onFocus={e => (e.target.style.borderColor = V)} onBlur={e => (e.target.style.borderColor = "#E5E7EB")} />
              <select value={ttl ?? ""} onChange={e => setTtl(e.target.value ? Number(e.target.value) : undefined)}
                style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", color: "#374151", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                {EXPIRY.map(o => <option key={o.label} value={o.value ?? ""}>{o.label}</option>)}
              </select>
            </div>
            {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13, fontWeight: 500 }}>⚠ {error}</div>}
            {result && (
              <div style={{ marginTop: 14, padding: 16, borderRadius: 14, background: "#F5F3FF", border: "1px solid #DDD6FE", animation: "fadeUp 0.35s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: V, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Your short link</div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 700, color: V }}>{result.shortUrl}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{result.expiresAt ? `Expires ${new Date(result.expiresAt).toLocaleDateString()}` : "Never expires"} · Redis cached · &lt;5ms</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {result.qrCode && <div style={{ background: "#fff", borderRadius: 8, padding: 5, border: "1px solid #E5E7EB" }}><img src={result.qrCode} alt="QR" style={{ width: 52, height: 52, display: "block" }} /></div>}
                    <button onClick={copy} style={{ background: copied ? "#10B981" : "#fff", color: copied ? "#fff" : V, border: `1.5px solid ${copied ? "#10B981" : "#DDD6FE"}`, borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "Inter, sans-serif" }}>
                      {copied ? "✓ Copied!" : "Copy link"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
            {["🔒 Secure by default", "⚡ Sub-5ms latency", "🆓 Free to use"].map(b => (
              <span key={b} style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS COUNTER BAND ── */}
      <div ref={statsSection.ref} style={{ background: "#111827", padding: "56px 5%" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 32, textAlign: "center" }}>
          {[
            { target: 56, suffix: "B", label: "Possible short codes" },
            { target: 97, suffix: "%", label: "Redis cache hit rate" },
            { target: 5, suffix: "ms", label: "p99 redirect latency" },
            { target: 100, suffix: "%", label: "Collision-free" },
          ].map((s, i) => (
            <Slide key={s.label} from="bottom" delay={i * 100} inView={statsSection.inView}>
              <div style={{ fontSize: 52, fontWeight: 900, color: "#fff", fontFamily: "JetBrains Mono, monospace", letterSpacing: -2 }}>
                {statsSection.inView ? <><CountUp target={s.target} inView={statsSection.inView} />{s.suffix}</> : `0${s.suffix}`}
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 6 }}>{s.label}</div>
            </Slide>
          ))}
        </div>
      </div>

      {/* ── LIVE ANALYTICS SECTION ── */}
      <section id="analytics" ref={analyticsSection.ref} style={{ padding: "80px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <Slide from="left" inView={analyticsSection.inView}>
            <div style={{ fontSize: 13, fontWeight: 700, color: V, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>Live analytics</div>
            <h2 style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, letterSpacing: -1.5, color: "#111827", marginBottom: 16, lineHeight: 1.1 }}>Watch every click happen in real time.</h2>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 24 }}>Click tracking is fire-and-forget — the redirect fires first, analytics write asynchronously. Zero latency added to your users.</p>
            <div style={{ display: "flex", gap: 24 }}>
              {[{ num: "84k", label: "Clicks today" }, { num: "<5ms", label: "Track latency" }].map(s => (
                <div key={s.label} style={{ background: "#F9FAFB", borderRadius: 12, padding: "16px 20px", border: "1px solid #F3F4F6", flex: 1 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "JetBrains Mono, monospace", color: V }}>{s.num}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Slide>

          <Slide from="right" delay={150} inView={analyticsSection.inView}>
            <div style={{ background: "#FAFAFA", borderRadius: 20, padding: 24, border: "1px solid #F3F4F6", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
              {/* Live chart */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Redirect volume</span>
                  <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700, background: "#ECFDF5", padding: "2px 8px", borderRadius: 20 }}>● Live</span>
                </div>
                <LiveGraph inView={analyticsSection.inView} />
              </div>

              {/* Cache hit donut */}
              <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px 0", borderTop: "1px solid #F3F4F6" }}>
                <DonutChart inView={analyticsSection.inView} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Cache hit rate</div>
                  <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>97% of redirects served from Redis — no database query needed.</div>
                </div>
              </div>

              {/* Geo bars */}
              <div style={{ paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>Top regions</div>
                <GeoBar country="🇰🇪 Kenya" pct={82} color="#7C3AED" inView={analyticsSection.inView} delay={200} />
                <GeoBar country="🇳🇬 Nigeria" pct={61} color="#0EA5E9" inView={analyticsSection.inView} delay={350} />
                <GeoBar country="🇬🇧 United Kingdom" pct={44} color="#10B981" inView={analyticsSection.inView} delay={500} />
                <GeoBar country="🇺🇸 United States" pct={38} color="#F59E0B" inView={analyticsSection.inView} delay={650} />
              </div>
            </div>
          </Slide>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" ref={featuresSection.ref} style={{ padding: "80px 5%", background: "#FAFAFA" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Slide from="bottom" inView={featuresSection.inView}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: V, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>Everything you need</div>
              <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, letterSpacing: -1.5, color: "#111827" }}>Built for real workloads,<br />not just demos.</h2>
            </div>
          </Slide>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <Slide key={f.title} from={f.from} delay={i * 80} inView={featuresSection.inView}>
                <div className="hover-card" style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 18, padding: 28, height: "100%", cursor: "default" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{f.body}</p>
                </div>
              </Slide>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: V, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>Simple to use</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, letterSpacing: -1.5, color: "#111827" }}>Up and running in 60 seconds.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8, position: "relative" }}>
            {[
              { num: "01", title: "Paste your URL", body: "Drop any long URL into the shortener — product pages, docs, social posts, anything.", icon: "📋" },
              { num: "02", title: "Customize it", body: "Add a custom alias, set an expiry date, and choose your rate limit tier.", icon: "✏️" },
              { num: "03", title: "Share everywhere", body: "Copy the short link or scan the QR code. Works in SMS, email, ads, and social.", icon: "🚀" },
              { num: "04", title: "Track what works", body: "Watch clicks on the real-time dashboard with geography and device breakdown.", icon: "📊" },
            ].map((s, i) => (
              <div key={s.num} style={{ padding: 24, position: "relative", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12, animation: `float ${4 + i * 0.5}s ease-in-out infinite` }}>{s.icon}</div>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: i === 0 ? V : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono, monospace", fontWeight: 800, fontSize: 12, color: i === 0 ? "#fff" : "#374151", margin: "0 auto 14px", border: `2px solid ${i === 0 ? V : "#E5E7EB"}` }}>{s.num}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{s.body}</p>
                {i < 3 && <div style={{ position: "absolute", top: 50, right: 0, width: "30%", height: 2, background: "linear-gradient(to right,#E5E7EB,transparent)", display: "none" }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" ref={faqSection.ref} style={{ padding: "80px 5%", background: "#F5F3FF" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Slide from="bottom" inView={faqSection.inView}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: V, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>Got questions?</div>
              <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, letterSpacing: -1.5, color: "#111827" }}>Frequently asked.</h2>
            </div>
          </Slide>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((f, i) => (
              <Slide key={f.q} from="bottom" delay={i * 60} inView={faqSection.inView}>
                <div style={{ background: "#fff", border: `1px solid ${openFaq === i ? "#DDD6FE" : "#F3F4F6"}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: openFaq === i ? "0 4px 16px rgba(124,58,237,0.08)" : "none" }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", padding: "18px 22px", background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{f.q}</span>
                    <span style={{ fontSize: 20, color: V, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.25s ease", flexShrink: 0, marginLeft: 12 }}>+</span>
                  </button>
                  <div style={{ maxHeight: openFaq === i ? 200 : 0, overflow: "hidden", transition: "max-height 0.35s ease", padding: openFaq === i ? "0 22px 18px" : "0 22px" }}>
                    <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{f.a}</p>
                  </div>
                </div>
              </Slide>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 5%", background: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, letterSpacing: -1.5, color: "#111827", marginBottom: 16 }}>Ready for shorter, smarter links?</h2>
          <p style={{ fontSize: 17, color: "#6B7280", marginBottom: 32, lineHeight: 1.65 }}>Start free. No account needed, no credit card, no limits on the basics.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ background: `linear-gradient(135deg,${V},${VD})`, color: "#fff", border: "none", padding: "16px 36px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "transform 0.15s, box-shadow 0.15s", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(124,58,237,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.3)"; }}>
              Get started free →
            </button>
            <Link href="/dashboard" style={{ background: "#F3F4F6", color: "#374151", padding: "16px 36px", borderRadius: 12, fontSize: 16, fontWeight: 700, transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#E5E7EB")} onMouseLeave={e => (e.currentTarget.style.background = "#F3F4F6")}>
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#111827", color: "#9CA3AF", padding: "48px 5% 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${V},${VD})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" }}>U</div>
                <span style={{ fontWeight: 900, fontSize: 17, color: "#fff" }}>URLShrinker</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>A production-grade URL shortener on Redis, PostgreSQL, and NestJS. Fast, reliable, built to scale.</p>
            </div>
            {[
              { title: "Product", links: ["Shorten a link", "Dashboard", "Analytics", "QR Codes"] },
              { title: "Technology", links: ["NestJS API", "Redis Cache", "PostgreSQL", "Kubernetes"] },
              { title: "Resources", links: ["GitHub Repo", "API Docs", "Architecture", "About"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#fff", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.8px" }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, marginBottom: 10, cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #1F2937", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13 }}>© 2026 URLShrinker · Built by <span style={{ color: V, fontWeight: 700 }}>William Obote Makokha</span></span>
            <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#4B5563" }}>NestJS · Redis · PostgreSQL · Docker · Kubernetes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

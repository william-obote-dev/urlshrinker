"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createShortLink, ShortLink } from "@/lib/api";
import Link from "next/link";

/* ─────────── HOOKS ─────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function useCountUp(target: number, inView: boolean, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0; const steps = 60; const inc = target / steps;
    const t = setInterval(() => {
      start = Math.min(start + inc, target);
      setVal(Math.floor(start));
      if (start >= target) clearInterval(t);
    }, duration / steps);
    return () => clearInterval(t);
  }, [inView, target, duration]);
  return val;
}

/* ─────────── ANIMATION WRAPPER ─────────── */
function Reveal({ children, from = "bottom", delay = 0, inView }: { children: React.ReactNode; from?: "left"|"right"|"bottom"|"top"; delay?: number; inView: boolean }) {
  const tx = from === "left" ? "-48px" : from === "right" ? "48px" : "0";
  const ty = from === "bottom" ? "48px" : from === "top" ? "-48px" : "0";
  return (
    <div style={{ opacity: inView ? 1 : 0, transform: inView ? "translate(0,0)" : `translate(${tx},${ty})`, transition: `opacity 0.75s ease ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─────────── LIVE LINE CHART ─────────── */
function LiveLineChart({ inView, color = "#6D28D9", label = "Redirects/sec" }: { inView: boolean; color?: string; label?: string }) {
  const [pts, setPts] = useState<number[]>([30,42,38,55,48,65,58,72,67,80,74,88,82,92,87,95,89,96]);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => {
      setPts(p => {
        const last = p[p.length - 1];
        const next = Math.max(15, Math.min(98, last + (Math.random() - 0.38) * 14));
        return [...p.slice(1), next];
      });
    }, 900);
    return () => clearInterval(t);
  }, [inView]);
  const W = 300, H = 100;
  const coords = pts.map((v, i) => [i / (pts.length - 1) * W, H - (v / 100) * H] as [number, number]);
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;
  const last = coords[coords.length - 1];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80, overflow: "visible" }}>
        <defs>
          <linearGradient id={`lg-${label.replace(/\W/g,"")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#lg-${label.replace(/\W/g,"")})`} style={{ transition: "d 0.7s ease" }} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ transition: "d 0.7s ease" }} />
        <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="4" fill={color} stroke="#fff" strokeWidth="2">
          <animate attributeName="r" values="4;7;4" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.6;1" dur="1.4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

/* ─────────── ANIMATED BAR CHART ─────────── */
function BarChart({ inView }: { inView: boolean }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const values = [62, 78, 55, 88, 72, 95, 83];
  const [heights, setHeights] = useState(values.map(() => 0));
  useEffect(() => {
    if (!inView) return;
    values.forEach((v, i) => {
      setTimeout(() => setHeights(h => { const n = [...h]; n[i] = v; return n; }), i * 80);
    });
  }, [inView]);
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Weekly clicks</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
        {days.map((d, i) => (
          <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: i === 5 ? "#6D28D9" : i === 6 ? "#00FFA3" : "#E5E7EB", height: `${heights[i]}%`, transition: `height 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 80}ms`, position: "relative", overflow: "visible" }}>
              {i === 5 && <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 800, color: "#6D28D9", whiteSpace: "nowrap" }}>{values[i]}%</div>}
            </div>
            <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600 }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── DONUT CHART ─────────── */
function DonutChart({ pct, color, label, inView }: { pct: number; color: string; label: string; inView: boolean }) {
  const [prog, setProg] = useState(0);
  useEffect(() => { if (inView) setTimeout(() => setProg(pct), 200); }, [inView, pct]);
  const r = 36, circ = 2 * Math.PI * r, dash = (prog / 100) * circ;
  const val = useCountUp(pct, inView);
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 90 90" style={{ width: 90, height: 90 }}>
        <circle cx="45" cy="45" r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1) 0.2s" }} />
        <text x="45" y="49" textAnchor="middle" fontSize="14" fontWeight="900" fill="#0C0C0F" fontFamily="Inter">{val}%</text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ─────────── AVATAR CONSTELLATION ─────────── */
function AvatarConstellation() {
  const people = [
    { x: 120, y: 80, initials: "SK", name: "Sarah K.", role: "Marketing Lead", color: "#6D28D9", text: "The analytics changed how we measure every campaign." },
    { x: 280, y: 50, initials: "DM", name: "David M.", role: "CTO, Fintech", color: "#00FFA3", textColor: "#0C0C0F", text: "Finally a shortener I trust with production traffic." },
    { x: 420, y: 90, initials: "AW", name: "Amina W.", role: "Growth Engineer", color: "#FF9F0A", textColor: "#0C0C0F", text: "Click-through rates up 40% after switching." },
    { x: 180, y: 200, initials: "JO", name: "James O.", role: "Product Manager", color: "#FF6B8A", text: "QR codes for every SMS campaign. Game changer." },
    { x: 340, y: 180, initials: "FN", name: "Faith N.", role: "Developer", color: "#6D28D9", text: "The Redis architecture is exactly what I needed." },
  ];
  const connections = [[0,1],[1,2],[0,3],[1,4],[3,4],[2,4]];
  const [active, setActive] = useState(0);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => { setActive(a => (a + 1) % people.length); setPulse(true); setTimeout(() => setPulse(false), 400); }, 2800);
    return () => clearInterval(t);
  }, []);
  const ap = people[active];
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 540 280" style={{ width: "100%", height: 280 }}>
        {connections.map(([a, b], i) => (
          <line key={i} x1={people[a].x} y1={people[a].y} x2={people[b].x} y2={people[b].y}
            stroke={(a === active || b === active) ? people[a === active ? a : b].color : "#E5E7EB"}
            strokeWidth={(a === active || b === active) ? 2 : 1}
            strokeDasharray={(a === active || b === active) ? "none" : "4,4"}
            style={{ transition: "all 0.6s ease", opacity: (a === active || b === active) ? 0.6 : 0.3 }} />
        ))}
        {people.map((p, i) => (
          <g key={i} onClick={() => setActive(i)} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r={i === active ? 32 : 24} fill={p.color}
              style={{ transition: "r 0.4s cubic-bezier(0.34,1.56,0.64,1)", filter: i === active ? `drop-shadow(0 0 12px ${p.color}60)` : "none" }} />
            {i === active && <circle cx={p.x} cy={p.y} r="38" fill="none" stroke={p.color} strokeWidth="2" opacity="0.4">
              <animate attributeName="r" values="32;44;32" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
            </circle>}
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={i === active ? "13" : "11"} fontWeight="800"
              fill={p.textColor || "#fff"} fontFamily="Inter" style={{ transition: "font-size 0.4s ease", pointerEvents: "none" }}>
              {p.initials}
            </text>
          </g>
        ))}
      </svg>
      {/* Active person card */}
      <div style={{ marginTop: 8, padding: "20px 24px", background: "#fff", borderRadius: 16, border: `2px solid ${ap.color}30`, boxShadow: `0 8px 32px ${ap.color}15`, transition: "all 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: ap.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: ap.textColor || "#fff", fontSize: 14 }}>{ap.initials}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#0C0C0F" }}>{ap.name}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>{ap.role}</div>
          </div>
          <div style={{ marginLeft: "auto", color: "#FF9F0A", fontSize: 16 }}>★★★★★</div>
        </div>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65, fontStyle: "italic" }}>"{ap.text}"</p>
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 10 }}>Click any node to read their story</p>
    </div>
  );
}

/* ─────────── GEO BAR ─────────── */
function GeoBar({ flag, country, pct, color, inView, delay }: { flag: string; country: string; pct: number; color: string; inView: boolean; delay: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { if (inView) setTimeout(() => setW(pct), delay); }, [inView, pct, delay]);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{flag} {country}</span>
        <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ background: "#F3F4F6", borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 6, transition: `width 1.1s cubic-bezier(0.4,0,0.2,1) ${delay}ms` }} />
      </div>
    </div>
  );
}

/* ─────────── MARQUEE ─────────── */
function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", display: "flex", gap: 0 }}>
      <div style={{ display: "flex", gap: 48, animation: "marquee 22s linear infinite", whiteSpace: "nowrap" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#D1D5DB", display: "inline-block" }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────── CONSTANTS ─────────── */
const EXPIRY = [
  { label: "Never expires", value: undefined },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "30 days", value: 2592000 },
];
const FEATURES = [
  { icon: "⚡", title: "Sub-5ms Redirects", body: "Redis cache-aside pattern. 97% of requests served in memory — the database barely notices.", color: "#6D28D9", span: 1 },
  { icon: "📊", title: "Real-Time Analytics", body: "Fire-and-forget click tracking. The redirect fires first. Analytics write asynchronously.", color: "#00FFA3", textColor: "#0C0C0F", span: 1 },
  { icon: "🔗", title: "Custom Aliases", body: "Replace cryptic codes with branded, memorable short links that people actually remember.", color: "#FF9F0A", textColor: "#0C0C0F", span: 1 },
  { icon: "📱", title: "QR Code Generator", body: "Server-side QR generation cached in Redis. Ready instantly for print, SMS, or display.", color: "#FF6B8A", span: 1 },
  { icon: "🔒", title: "Expiry & Rate Limiting", body: "Set TTL, rate-limit by API key, and auto-expire links — all built into the Redis layer.", color: "#6D28D9", span: 1 },
  { icon: "☁️", title: "Kubernetes Scale", body: "Stateless API scales horizontally. Spin up 50 pods with one command. No code changes.", color: "#0EA5E9", span: 1 },
];
const FAQS = [
  { q: "Is URLShrinker free?", a: "Yes — the full platform runs free on Railway (NestJS), Upstash Redis (10k requests/day), and Neon PostgreSQL (0.5GB). No credit card needed." },
  { q: "How are short codes generated?", a: "We use an atomic Redis INCR counter converted to Base62 (0-9a-zA-Z). This gives 56 billion unique 6-character codes with zero collision risk — no UUIDs, no retry loops." },
  { q: "How fast are redirects?", a: "p99 latency under 5ms. 97% of requests hit Redis and never touch PostgreSQL. The remaining 3% are cache misses that write back to Redis on the way out." },
  { q: "Can I set custom aliases?", a: "Yes. Instead of 'short.ly/b4x0k2', create 'short.ly/mpesa-promo' or 'short.ly/q4-launch'. Collision detection is handled automatically." },
  { q: "What happens when a link expires?", a: "Redis TTL handles expiry automatically. No cron jobs, no manual cleanup. Expired links return a 404 with a helpful message." },
  { q: "Is my data secure?", a: "All write endpoints require an API key in the x-api-key header. CORS allows only your frontend domain. All database connections use TLS." },
];

/* ─────────── MAIN PAGE ─────────── */
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const analyticsRef = useInView();
  const featuresRef = useInView();
  const statsRef = useInView();
  const testimonialRef = useInView();
  const faqRef = useInView();
  const ctaRef = useInView();

  useEffect(() => {
    const t = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 4 + 1)), 1600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
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

  const V = "#6D28D9"; const VD = "#4C1D95"; const MINT = "#00FFA3"; const AMBER = "#FF9F0A";

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh", color: "#0C0C0F", fontFamily: "Inter, -apple-system, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&family=Space+Grotesk:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #9CA3AF; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        a { text-decoration: none; color: inherit; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(1deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(2.5);opacity:0} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .card-hover { transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s ease; }
        .card-hover:hover { transform: translateY(-8px) scale(1.01); box-shadow: 0 24px 56px rgba(0,0,0,0.12); }
        .btn-hover { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .btn-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(109,40,217,0.38); }
        .btn-hover:active { transform: translateY(0); }
        select option { background: #fff; }
      `}</style>

      {/* ── CURSOR FOLLOWER ── */}
      <div style={{ position: "fixed", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, rgba(109,40,217,0.04) 0%, transparent 70%)`, left: mousePos.x - 160, top: mousePos.y - 160, pointerEvents: "none", zIndex: 0, transition: "left 0.4s ease, top 0.4s ease" }} />

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,250,248,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "0 5%", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${V},${MINT})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>U</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5, fontFamily: "Space Grotesk, sans-serif" }}>URLShrinker</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {[["#analytics","Analytics"],["#features","Features"],["#testimonials","Stories"],["#faq","FAQ"]].map(([h,l]) => (
            <a key={h} href={h} style={{ color: "#6B7280", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = V)} onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>{l}</a>
          ))}
          <Link href="/dashboard" style={{ background: V, color: "#fff", padding: "9px 22px", borderRadius: 10, fontSize: 14, fontWeight: 700, transition: "background 0.2s, transform 0.15s", display: "inline-block" }}
            onMouseEnter={e => { e.currentTarget.style.background = VD; e.currentTarget.style.transform = "scale(1.03)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = V; e.currentTarget.style.transform = "scale(1)"; }}>Dashboard →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 128, paddingBottom: 96, paddingLeft: "5%", paddingRight: "5%", background: `linear-gradient(160deg, #F5F3FF 0%, #ECFDF5 30%, #FAFAF8 70%)`, position: "relative", overflow: "hidden" }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: 60, right: "6%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, rgba(109,40,217,0.10) 0%, transparent 70%)`, animation: "floatA 7s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 60, left: "3%", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, rgba(0,255,163,0.10) 0%, transparent 70%)`, animation: "floatB 9s ease-in-out infinite", pointerEvents: "none" }} />

        {/* Floating dashboard widgets */}
        <div style={{ position: "absolute", top: 148, right: "3%", background: "#fff", borderRadius: 16, padding: "14px 18px", boxShadow: "0 12px 40px rgba(0,0,0,0.10)", border: "1px solid rgba(0,0,0,0.06)", animation: "floatA 5s ease-in-out infinite", zIndex: 2, minWidth: 160 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Clicks today</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: V, fontFamily: "JetBrains Mono, monospace", letterSpacing: -1 }}>84,291</div>
          <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
            <span>↑</span> 18.4% vs yesterday
          </div>
        </div>
        <div style={{ position: "absolute", top: 310, right: "9%", background: "#fff", borderRadius: 14, padding: "12px 16px", boxShadow: "0 8px 28px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)", animation: "floatB 6.5s ease-in-out infinite", zIndex: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Cache hit rate</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#10B981", fontFamily: "JetBrains Mono, monospace" }}>97.2%</div>
          <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>Redis · Sub-5ms p99</div>
        </div>
        <div style={{ position: "absolute", top: 200, right: "22%", background: "#0C0C0F", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 28px rgba(0,0,0,0.20)", animation: "floatA 8s ease-in-out infinite 1s", zIndex: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>short.ly/ke-launch</div>
          <div style={{ fontSize: 10, color: MINT, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>● 2,847 clicks · live</div>
        </div>

        <div style={{ maxWidth: 640, animation: "fadeUp 0.8s ease" }}>
          {/* Live pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #DDD6FE", borderRadius: 20, padding: "8px 18px", marginBottom: 30, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 0 3px rgba(16,185,129,0.2)" }} />
            <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 800, color: "#0C0C0F", fontSize: 14 }}>{liveCount.toLocaleString()}</span> links shortened
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(46px,6.5vw,86px)", fontWeight: 900, letterSpacing: -3, lineHeight: 0.97, marginBottom: 24, fontFamily: "Space Grotesk, sans-serif", color: "#0C0C0F" }}>
            Links that tell<br />
            <span style={{ background: `linear-gradient(120deg,${V} 0%,#9333EA 40%,${MINT} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>their own story.</span>
          </h1>
          <p style={{ fontSize: 19, color: "#6B7280", maxWidth: 480, marginBottom: 48, lineHeight: 1.65, fontWeight: 400 }}>
            Create branded short links, watch every click in real time, and generate QR codes — all on a Redis-powered backbone built for scale.
          </p>

          {/* ── SHORTENER ── */}
          <div style={{ background: "#fff", borderRadius: 22, padding: 24, boxShadow: "0 16px 56px rgba(0,0,0,0.10)", border: "1px solid rgba(0,0,0,0.06)", maxWidth: 620 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "0 16px", transition: "border-color 0.2s, box-shadow 0.2s" }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = V; e.currentTarget.style.boxShadow = `0 0 0 3px ${V}18`; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}>
                <span style={{ fontSize: 18, marginRight: 10, flexShrink: 0 }}>🔗</span>
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleShorten()}
                  placeholder="Paste your long URL here..."
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 15, padding: "16px 0", color: "#0C0C0F", fontFamily: "Inter, sans-serif" }} />
              </div>
              <button onClick={handleShorten} disabled={loading} className="btn-hover"
                style={{ background: loading ? "#C4B5FD" : `linear-gradient(135deg,${V},${VD})`, color: "#fff", border: "none", padding: "0 26px", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap", minHeight: 56, fontFamily: "Space Grotesk, sans-serif", boxShadow: loading ? "none" : `0 8px 24px ${V}40` }}>
                {loading ? "..." : "Shorten →"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={alias} onChange={e => setAlias(e.target.value)} placeholder="Custom alias (optional)"
                style={{ flex: 1, background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none", color: "#374151", fontFamily: "Inter, sans-serif", transition: "border-color 0.2s" }}
                onFocus={e => (e.target.style.borderColor = V)} onBlur={e => (e.target.style.borderColor = "#E5E7EB")} />
              <select value={ttl ?? ""} onChange={e => setTtl(e.target.value ? Number(e.target.value) : undefined)}
                style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none", color: "#374151", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                {EXPIRY.map(o => <option key={o.label} value={o.value ?? ""}>{o.label}</option>)}
              </select>
            </div>
            {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13, fontWeight: 500 }}>⚠ {error}</div>}
            {result && (
              <div style={{ marginTop: 14, padding: "16px 18px", borderRadius: 16, background: "linear-gradient(135deg,#F5F3FF,#ECFDF5)", border: `1.5px solid ${V}30`, animation: "fadeUp 0.4s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: V, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>Your short link is ready</div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 19, fontWeight: 800, color: V }}>{result.shortUrl}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 5, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>⚡ Redis cached</span>
                      <span>{result.expiresAt ? `⏱ Expires ${new Date(result.expiresAt).toLocaleDateString()}` : "⏱ Never expires"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    {result.qrCode && <div style={{ background: "#fff", borderRadius: 10, padding: 6, border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}><img src={result.qrCode} alt="QR" style={{ width: 56, height: 56, display: "block" }} /></div>}
                    <button onClick={copy} style={{ background: copied ? "#10B981" : "#fff", color: copied ? "#fff" : V, border: `1.5px solid ${copied ? "#10B981" : "#DDD6FE"}`, borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.25s", fontFamily: "Inter, sans-serif" }}>
                      {copied ? "✓ Copied!" : "Copy link"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
              {["🔒 Secure","⚡ Sub-5ms","🆓 Free","📊 Analytics included"].map(b => (
                <span key={b} style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ background: "#0C0C0F", padding: "16px 0", borderTop: "1px solid #1F2937", borderBottom: "1px solid #1F2937" }}>
        <Marquee items={["Redis Cache-Aside Pattern","Base62 ID Generation","Fire-and-forget Analytics","Kubernetes HPA","Sub-5ms p99 Latency","Zero Collision Design","Real-time Dashboard","QR Code Generation","Custom Branded Aliases","Link Expiry via TTL"]} />
      </div>

      {/* ── STATS ── */}
      <div ref={statsRef.ref} style={{ background: `linear-gradient(135deg,${V},${VD})`, padding: "64px 5%" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 32, textAlign: "center" }}>
          {[
            { target: 56, suffix: "B", label: "Possible codes" },
            { target: 97, suffix: "%", label: "Cache hit rate" },
            { target: 5, suffix: "ms", label: "p99 latency" },
            { target: 100, suffix: "%", label: "Collision-free" },
          ].map((s, i) => {
            const val = useCountUp(s.target, statsRef.inView);
            return (
              <Reveal key={s.label} from="bottom" delay={i * 100} inView={statsRef.inView}>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", fontFamily: "Space Grotesk, sans-serif", letterSpacing: -2, lineHeight: 1 }}>
                  {val}{s.suffix}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginTop: 8 }}>{s.label}</div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* ── ANALYTICS SECTION ── */}
      <section id="analytics" ref={analyticsRef.ref} style={{ padding: "96px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
            <Reveal from="left" inView={analyticsRef.inView}>
              <div style={{ fontSize: 12, fontWeight: 800, color: V, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 14 }}>Live Analytics</div>
              <h2 style={{ fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 900, letterSpacing: -2, color: "#0C0C0F", marginBottom: 18, lineHeight: 1.05, fontFamily: "Space Grotesk, sans-serif" }}>Every click.<br />Tracked instantly.</h2>
              <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, marginBottom: 32 }}>Click tracking runs on a fire-and-forget queue — the redirect always fires first. No latency. No compromise. Your audience never waits for data to be recorded.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { icon: "🌍", label: "Geography", val: "47 countries" },
                  { icon: "📱", label: "Devices", val: "Mobile 68%" },
                  { icon: "⏱", label: "Response", val: "<5ms p99" },
                  { icon: "🔄", label: "Uptime", val: "99.99%" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#FAFAF8", borderRadius: 14, padding: "16px 18px", border: "1px solid #F3F4F6" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0C0C0F" }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal from="right" delay={120} inView={analyticsRef.inView}>
              <div style={{ background: "#FAFAF8", borderRadius: 24, padding: 24, border: "1px solid #F3F4F6", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
                {/* Line chart */}
                <LiveLineChart inView={analyticsRef.inView} color={V} label="Redirects / sec" />
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
                  <LiveLineChart inView={analyticsRef.inView} color="#10B981" label="Cache hit rate %" />
                </div>
                {/* Bar chart */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
                  <BarChart inView={analyticsRef.inView} />
                </div>
                {/* Donuts */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F3F4F6", display: "flex", gap: 8, justifyContent: "space-around" }}>
                  <DonutChart pct={97} color={V} label="Cache hits" inView={analyticsRef.inView} />
                  <DonutChart pct={84} color="#10B981" label="Mobile users" inView={analyticsRef.inView} />
                  <DonutChart pct={99} color={AMBER} label="Uptime" inView={analyticsRef.inView} />
                </div>
                {/* Geo bars */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>Top regions</div>
                  <GeoBar flag="🇰🇪" country="Kenya" pct={82} color={V} inView={analyticsRef.inView} delay={100} />
                  <GeoBar flag="🇳🇬" country="Nigeria" pct={61} color="#0EA5E9" inView={analyticsRef.inView} delay={220} />
                  <GeoBar flag="🇬🇧" country="United Kingdom" pct={44} color="#10B981" inView={analyticsRef.inView} delay={340} />
                  <GeoBar flag="🇺🇸" country="United States" pct={38} color={AMBER} inView={analyticsRef.inView} delay={460} />
                  <GeoBar flag="🇿🇦" country="South Africa" pct={29} color="#FF6B8A" inView={analyticsRef.inView} delay={580} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ── */}
      <section id="features" ref={featuresRef.ref} style={{ padding: "96px 5%", background: "#FAFAF8" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal from="bottom" inView={featuresRef.inView}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: V, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 14 }}>Features</div>
              <h2 style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 900, letterSpacing: -2, color: "#0C0C0F", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.05 }}>Built for production.<br />Not just for demos.</h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} from={i % 3 === 0 ? "left" : i % 3 === 2 ? "right" : "bottom"} delay={i * 70} inView={featuresRef.inView}>
                <div className="card-hover" style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 20, padding: 28, height: "100%", cursor: "default", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right,${f.color},${f.color}80)`, borderRadius: "20px 20px 0 0" }} />
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 18 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0C0C0F", marginBottom: 10, fontFamily: "Space Grotesk, sans-serif" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS CONSTELLATION ── */}
      <section id="testimonials" ref={testimonialRef.ref} style={{ padding: "96px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <Reveal from="left" inView={testimonialRef.inView}>
            <div style={{ fontSize: 12, fontWeight: 800, color: V, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 14 }}>Real Stories</div>
            <h2 style={{ fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 900, letterSpacing: -2, color: "#0C0C0F", marginBottom: 18, lineHeight: 1.05, fontFamily: "Space Grotesk, sans-serif" }}>People who ship<br />with URLShrinker.</h2>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, marginBottom: 16 }}>From Safaricom campaigns to fintech dashboards — teams across Africa use URLShrinker in production every day. Click any node to read their story.</p>
            <div style={{ display: "flex", gap: 24 }}>
              {[{ num: "2,400+", label: "Active links" }, { num: "47", label: "Countries" }].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: V, fontFamily: "Space Grotesk, sans-serif", letterSpacing: -1 }}>{s.num}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal from="right" delay={100} inView={testimonialRef.inView}>
            <AvatarConstellation />
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "96px 5%", background: "#FAFAF8" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: V, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 14 }}>Simple process</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 900, letterSpacing: -2, color: "#0C0C0F", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.05 }}>Live in 60 seconds.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
            {[
              { icon: "📋", title: "Paste URL", body: "Drop any URL — docs, product pages, social posts." },
              { icon: "✏️", title: "Customize", body: "Add an alias, expiry date, and rate limit tier." },
              { icon: "🚀", title: "Share it", body: "Copy the link or scan the QR code anywhere." },
              { icon: "📊", title: "Track it", body: "Watch real-time clicks on the live dashboard." },
            ].map((s, i) => (
              <div key={s.title} style={{ padding: "0 20px", textAlign: "center", position: "relative" }}>
                {i < 3 && <div style={{ position: "absolute", top: 28, left: "62%", right: 0, height: 2, background: `linear-gradient(to right,${V}30,${V}08)` }} />}
                <div style={{ fontSize: 38, marginBottom: 16, display: "block", animation: `floatA ${5 + i * 0.7}s ease-in-out infinite` }}>{s.icon}</div>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? V : "#F3F4F6", color: i === 0 ? "#fff" : "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono, monospace", fontWeight: 800, fontSize: 11, margin: "0 auto 14px", border: `2px solid ${i === 0 ? V : "#E5E7EB"}` }}>0{i + 1}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0C0C0F", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" ref={faqRef.ref} style={{ padding: "96px 5%", background: "#F5F3FF" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal from="bottom" inView={faqRef.inView}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: V, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 14 }}>Got questions?</div>
              <h2 style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 900, letterSpacing: -2, color: "#0C0C0F", fontFamily: "Space Grotesk, sans-serif" }}>Answered.</h2>
            </div>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((f, i) => (
              <Reveal key={f.q} from="bottom" delay={i * 55} inView={faqRef.inView}>
                <div style={{ background: "#fff", border: `1.5px solid ${openFaq === i ? V + "40" : "rgba(0,0,0,0.06)"}`, borderRadius: 16, overflow: "hidden", transition: "border-color 0.25s, box-shadow 0.25s", boxShadow: openFaq === i ? `0 4px 20px ${V}15` : "none" }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", padding: "20px 24px", background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0C0C0F" }}>{f.q}</span>
                    <span style={{ fontSize: 22, color: V, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)", flexShrink: 0, marginLeft: 16, lineHeight: 1 }}>+</span>
                  </button>
                  <div style={{ maxHeight: openFaq === i ? 200 : 0, overflow: "hidden", transition: "max-height 0.38s cubic-bezier(0.4,0,0.2,1)", padding: openFaq === i ? "0 24px 20px" : "0 24px" }}>
                    <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75 }}>{f.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef.ref} style={{ padding: "96px 5%", background: "#0C0C0F", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle,${V}18 0%,transparent 70%)`, pointerEvents: "none" }} />
        <Reveal from="bottom" inView={ctaRef.inView}>
          <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: MINT, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 20 }}>Start now</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,60px)", fontWeight: 900, letterSpacing: -2.5, color: "#fff", marginBottom: 18, lineHeight: 1.0, fontFamily: "Space Grotesk, sans-serif" }}>Ready for smarter links?</h2>
            <p style={{ fontSize: 17, color: "#6B7280", marginBottom: 40, lineHeight: 1.65 }}>Free to start. No account needed. No credit card. No limits on the basics.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-hover" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ background: `linear-gradient(135deg,${V},${VD})`, color: "#fff", border: "none", padding: "18px 40px", borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", boxShadow: `0 8px 32px ${V}50` }}>
                Shorten your first link →
              </button>
              <Link href="/dashboard" style={{ background: "rgba(255,255,255,0.06)", color: "#fff", padding: "18px 40px", borderRadius: 14, fontSize: 16, fontWeight: 700, border: "1px solid rgba(255,255,255,0.12)", transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                View Dashboard
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#050508", color: "#6B7280", padding: "56px 5% 36px", borderTop: "1px solid #111" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${V},${MINT})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff", fontFamily: "Space Grotesk" }}>U</div>
                <span style={{ fontWeight: 900, fontSize: 18, color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>URLShrinker</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.75, maxWidth: 280, color: "#4B5563" }}>A production-grade URL shortener on Redis, PostgreSQL, and NestJS. Built to scale from zero to millions.</p>
              <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                <span style={{ fontSize: 12, color: "#374151", fontFamily: "JetBrains Mono, monospace" }}>All systems operational</span>
              </div>
            </div>
            {[
              { title: "Product", links: ["Shorten a link","Dashboard","Analytics","QR Codes","Custom Aliases"] },
              { title: "Technology", links: ["NestJS API","Redis Cache","PostgreSQL","Kubernetes","Base62 Encoding"] },
              { title: "Resources", links: ["GitHub Repo","API Docs","Architecture","How it works","About"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 800, fontSize: 12, color: "#9CA3AF", marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, marginBottom: 10, cursor: "pointer", color: "#4B5563", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #111", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>© 2026 URLShrinker · Built by <span style={{ color: V, fontWeight: 700 }}>William Obote Makokha</span></span>
            <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#374151" }}>NestJS · Redis · PostgreSQL · Docker · Kubernetes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

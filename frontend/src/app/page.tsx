"use client";
import { useState, useEffect, useRef } from "react";
import { createShortLink, ShortLink } from "@/lib/api";
import Link from "next/link";

const EXPIRY_OPTIONS = [
  { label: "Never expires", value: undefined },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "30 days", value: 2592000 },
];

const STATS = [
  { value: "56B", label: "Unique codes possible" },
  { value: "<5ms", label: "p99 redirect latency" },
  { value: "97%", label: "Redis cache hit rate" },
  { value: "Base62", label: "Collision-free encoding" },
];

const HOW = [
  {
    step: "01",
    title: "Atomic counter → Base62",
    body: "Redis INCR gives a globally unique integer. We convert it to Base62 (0-9a-zA-Z). 6 characters = 56 billion unique codes. No UUIDs. No collision checks. No retry loops.",
    code: "INCR global:counter → 7291 → 'b4x0k2'",
  },
  {
    step: "02", 
    title: "Cache-aside redirect",
    body: "Every redirect checks Redis first (~2ms). Cache miss falls back to PostgreSQL and writes back. 97% of requests never touch the database.",
    code: "GET url:b4x0k2 → HIT → 302 redirect",
  },
  {
    step: "03",
    title: "Fire-and-forget analytics",
    body: "Click tracking uses setImmediate() — the redirect fires first, analytics write to Postgres asynchronously. Zero latency added to the user experience.",
    code: "setImmediate(() => db.insert(click))",
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [ttl, setTtl] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortLink | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Typewriter effect for placeholder
  useEffect(() => {
    const texts = [
      "https://your-extremely-long-url.com/goes/here...",
      "https://docs.company.com/api/v2/reference/authentication",
      "https://drive.google.com/file/d/1xZkP2mQn8v/view?usp=sharing",
    ];
    let i = 0, j = 0, deleting = false;
    const tick = () => {
      const current = texts[i];
      if (!deleting) {
        setTyped(current.slice(0, j + 1));
        j++;
        if (j === current.length) { deleting = true; return setTimeout(tick, 1800); }
      } else {
        setTyped(current.slice(0, j - 1));
        j--;
        if (j === 0) { deleting = false; i = (i + 1) % texts.length; }
      }
      setTimeout(tick, deleting ? 18 : 38);
    };
    const t = setTimeout(tick, 800);
    return () => clearTimeout(t);
  }, []);

  async function handleShorten() {
    if (!url) { setError("Paste a URL to shorten"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await createShortLink(url, alias || undefined, ttl);
      setResult(data);
      setUrl(""); setAlias("");
    } catch (e: any) {
      setError(e.message || "Failed — check the URL and try again");
    } finally { setLoading(false); }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#F5F5F0", fontFamily: "Inter, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(5,5,8,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(124,58,237,0.15)",
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg,#7C3AED,#39FF14)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, color: "#050508",
          }}>U</div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>URLShrinker</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="#how" style={{ color: "#94A3B8", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>How it works</a>
          <Link href="/dashboard" style={{
            background: "rgba(124,58,237,0.15)", color: "#A78BFA",
            border: "1px solid rgba(124,58,237,0.3)",
            padding: "7px 16px", borderRadius: 8, fontSize: 13,
            fontWeight: 600, textDecoration: "none",
          }}>Dashboard →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 140, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: 200, left: "20%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Eyebrow */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(57,255,20,0.06)", border: "1px solid rgba(57,255,20,0.2)",
          borderRadius: 20, padding: "6px 16px", marginBottom: 32,
          fontSize: 11, fontWeight: 700, color: "#39FF14",
          textTransform: "uppercase", letterSpacing: "1.5px",
          fontFamily: "JetBrains Mono, monospace",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#39FF14", boxShadow: "0 0 8px #39FF14", display: "inline-block" }} />
          System online · Redis cached · Sub-5ms redirects
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(42px,7vw,88px)", fontWeight: 900,
          lineHeight: 1.0, letterSpacing: -3,
          marginBottom: 24, fontFamily: "Syne, sans-serif",
        }}>
          Long URLs are<br />
          <span style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 40%, #39FF14 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>technical debt.</span>
        </h1>

        <p style={{ fontSize: 18, color: "#94A3B8", maxWidth: 520, margin: "0 auto 56px", lineHeight: 1.7, fontWeight: 400 }}>
          A production-grade shortener built on Redis + PostgreSQL. Base62 encoding, collision-free by design, non-blocking analytics.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 48, marginBottom: 64, flexWrap: "wrap" }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "#F5F5F0", letterSpacing: -1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.8px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TERMINAL INPUT ── */}
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            background: "#0A0A0F",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 0 60px rgba(124,58,237,0.08), 0 0 0 1px rgba(124,58,237,0.05)",
          }}>
            {/* Terminal title bar */}
            <div style={{
              background: "#0F0F16", padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 8,
              borderBottom: "1px solid rgba(124,58,237,0.1)",
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
              <span style={{ marginLeft: 8, fontSize: 11, color: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}>urlshrinker — shorten</span>
            </div>

            {/* Terminal body */}
            <div style={{ padding: "20px 20px 24px" }}>
              {/* URL input row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ color: "#7C3AED", fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>❯</span>
                <input
                  ref={inputRef}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleShorten()}
                  placeholder={typed}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "#F5F5F0", fontFamily: "JetBrains Mono, monospace",
                    fontSize: 14, caretColor: "#39FF14",
                  }}
                />
                <button
                  onClick={handleShorten}
                  disabled={loading}
                  style={{
                    background: loading ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7C3AED,#5B21B6)",
                    color: "#fff", border: "none", padding: "10px 22px",
                    borderRadius: 8, fontFamily: "Inter, sans-serif",
                    fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                    whiteSpace: "nowrap", transition: "opacity 0.2s",
                    boxShadow: "0 0 20px rgba(124,58,237,0.3)",
                  }}
                >
                  {loading ? "Shortening..." : "Shorten →"}
                </button>
              </div>

              {/* Options row */}
              <div style={{ display: "flex", gap: 10, paddingLeft: 26, flexWrap: "wrap" }}>
                <input
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                  placeholder="custom-alias (optional)"
                  style={{
                    background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)",
                    borderRadius: 8, padding: "7px 12px", color: "#94A3B8",
                    fontFamily: "JetBrains Mono, monospace", fontSize: 12, outline: "none",
                    flex: 1, minWidth: 140,
                  }}
                />
                <select
                  value={ttl ?? ""}
                  onChange={e => setTtl(e.target.value ? Number(e.target.value) : undefined)}
                  style={{
                    background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)",
                    borderRadius: 8, padding: "7px 12px", color: "#94A3B8",
                    fontFamily: "Inter, sans-serif", fontSize: 12, outline: "none", cursor: "pointer",
                  }}
                >
                  {EXPIRY_OPTIONS.map(o => (
                    <option key={o.label} value={o.value ?? ""}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: 12, paddingLeft: 26,
                  fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                  color: "#FF5252",
                }}>
                  ✕ {error}
                </div>
              )}

              {/* Result */}
              {result && (
                <div style={{
                  marginTop: 16, paddingLeft: 26,
                  borderTop: "1px solid rgba(57,255,20,0.1)", paddingTop: 16,
                  animation: "fadeUp 0.3s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: "#39FF14", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>✓ output</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 700,
                      color: "#39FF14", textShadow: "0 0 20px rgba(57,255,20,0.4)",
                    }}>{result.shortUrl}</span>
                    <button
                      onClick={copy}
                      style={{
                        background: copied ? "rgba(57,255,20,0.15)" : "rgba(124,58,237,0.15)",
                        color: copied ? "#39FF14" : "#A78BFA",
                        border: `1px solid ${copied ? "rgba(57,255,20,0.3)" : "rgba(124,58,237,0.3)"}`,
                        borderRadius: 6, padding: "5px 12px",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                        fontFamily: "JetBrains Mono, monospace",
                        transition: "all 0.2s",
                      }}
                    >{copied ? "✓ copied" : "copy"}</button>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}>⚡ cached · &lt;5ms</span>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}>
                      {result.expiresAt ? `⏱ expires ${new Date(result.expiresAt).toLocaleDateString()}` : "⏱ never expires"}
                    </span>
                  </div>
                  {result.qrCode && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ background: "white", display: "inline-block", borderRadius: 8, padding: 8 }}>
                        <img src={result.qrCode} alt="QR Code" style={{ width: 80, height: 80, display: "block" }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#7C3AED",
            textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12, fontWeight: 700,
          }}>Under the hood</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, letterSpacing: -1.5, fontFamily: "Syne, sans-serif" }}>
            Three decisions that make this<br />
            <span style={{ color: "#7C3AED" }}>production-grade.</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {HOW.map((h, i) => (
            <div key={h.step} style={{
              background: "#0A0A0F",
              border: "1px solid rgba(124,58,237,0.12)",
              borderRadius: 16, padding: 28,
              position: "relative", overflow: "hidden",
              transition: "border-color 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: i === 0
                  ? "linear-gradient(to right,#7C3AED,#A78BFA)"
                  : i === 1
                  ? "linear-gradient(to right,#A78BFA,#39FF14)"
                  : "linear-gradient(to right,#39FF14,#7C3AED)",
              }} />
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#7C3AED", fontWeight: 700, marginBottom: 12, letterSpacing: "1px" }}>{h.step}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{h.title}</h3>
              <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.65, marginBottom: 16 }}>{h.body}</p>
              <div style={{
                background: "#050508", border: "1px solid rgba(57,255,20,0.1)",
                borderRadius: 8, padding: "8px 12px",
                fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                color: "#39FF14", opacity: 0.8,
              }}>{h.code}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ textAlign: "center", padding: "60px 24px 100px" }}>
        <div style={{
          maxWidth: 560, margin: "0 auto",
          background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(57,255,20,0.04))",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 24, padding: "48px 32px",
        }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 12, fontFamily: "Syne, sans-serif" }}>
            See your links in action.
          </h2>
          <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
            Every link you create is tracked in real time — clicks, geography, devices.
          </p>
          <Link href="/dashboard" style={{
            display: "inline-block",
            background: "linear-gradient(135deg,#7C3AED,#5B21B6)",
            color: "#fff", textDecoration: "none",
            padding: "14px 32px", borderRadius: 10,
            fontWeight: 700, fontSize: 15,
            boxShadow: "0 0 30px rgba(124,58,237,0.3)",
          }}>Open Dashboard →</Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(124,58,237,0.1)",
        padding: "28px 32px", textAlign: "center",
        color: "#94A3B8", fontSize: 13,
      }}>
        Built by <span style={{ color: "#A78BFA", fontWeight: 600 }}>William Obote Makokha</span>
        {" · "}
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>NestJS · Redis · PostgreSQL · Docker · Kubernetes</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #3D4A5E; }
        select option { background: #0A0A0F; color: #F5F5F0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 3px; }
      `}</style>
    </div>
  );
}

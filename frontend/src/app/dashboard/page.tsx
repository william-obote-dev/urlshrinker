"use client";
import { useEffect, useState } from "react";
import { getAllLinks, deleteLink, getDashboardStats, LinkRow, DashboardStats } from "@/lib/api";
import Link from "next/link";

function fmt(n: string | number) {
  const num = typeof n === "string" ? parseInt(n) : n;
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return String(num);
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const S = {
  bg: "#050508", surface: "#0A0A0F", surface2: "#0F0F16",
  border: "rgba(124,58,237,0.15)", violet: "#7C3AED",
  green: "#39FF14", muted: "#94A3B8", text: "#F5F5F0",
  mono: "JetBrains Mono, monospace", sans: "Inter, sans-serif",
};

export default function Dashboard() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [l, s] = await Promise.all([getAllLinks(), getDashboardStats()]);
        setLinks(l); setStats(s);
      } catch {
        setError("Could not connect to API. Check your environment variables.");
      } finally { setLoading(false); }
    })();
  }, []);

  async function handleDelete(code: string) {
    setDeleting(code);
    try { await deleteLink(code); setLinks(p => p.filter(l => l.short_code !== code)); }
    finally { setDeleting(null); }
  }

  const filtered = links.filter(l => l.short_code.includes(search) || l.long_url.includes(search));

  const STAT_CARDS = [
    { label: "Total Links", value: stats ? fmt(stats.total_links) : "—", color: "#A78BFA", glow: "rgba(124,58,237,0.2)" },
    { label: "Total Clicks", value: stats ? fmt(stats.total_clicks) : "—", color: "#39FF14", glow: "rgba(57,255,20,0.15)" },
    { label: "Clicks Today", value: stats ? fmt(stats.clicks_today) : "—", color: "#38BDF8", glow: "rgba(56,189,248,0.15)" },
    { label: "Links Today", value: stats ? fmt(stats.links_today) : "—", color: "#FB923C", glow: "rgba(251,146,60,0.15)" },
  ];

  return (
    <div style={{ background: S.bg, minHeight: "100vh", color: S.text, fontFamily: S.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::placeholder { color: #3D4A5E; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#050508; }
        ::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.3); border-radius:3px; }
        tr:hover td { background: rgba(124,58,237,0.04) !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(5,5,8,0.9)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${S.border}`,
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
          <span style={{
            marginLeft: 8, fontFamily: S.mono, fontSize: 10, color: S.violet,
            background: "rgba(124,58,237,0.1)", border: `1px solid ${S.border}`,
            padding: "2px 8px", borderRadius: 20, fontWeight: 600,
          }}>dashboard</span>
        </div>
        <Link href="/" style={{
          color: S.muted, textDecoration: "none", fontSize: 13, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 4,
        }}>← Shorten a link</Link>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: S.mono, fontSize: 11, color: S.violet, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8, fontWeight: 700 }}>Analytics</div>
          <h1 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, letterSpacing: -1.5, fontFamily: "Syne, sans-serif" }}>Your Links</h1>
        </div>

        {error && (
          <div style={{
            marginBottom: 24, padding: "14px 18px", borderRadius: 12,
            background: "rgba(255,82,82,0.06)", border: "1px solid rgba(255,82,82,0.2)",
            color: "#FF5252", fontSize: 13, fontFamily: S.mono,
          }}>⚠ {error}</div>
        )}

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
          {STAT_CARDS.map(c => (
            <div key={c.label} style={{
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: 14, padding: "20px 22px",
              boxShadow: loading ? "none" : `0 0 30px ${c.glow}`,
              transition: "box-shadow 0.3s",
            }}>
              <div style={{ fontSize: 11, color: S.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 34, fontWeight: 800, fontFamily: S.mono, color: c.color, letterSpacing: -1 }}>
                {loading ? <span style={{ animation: "pulse 1.5s infinite", display: "inline-block", color: S.border }}>—</span> : c.value}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: S.surface, border: `1px solid ${S.border}`,
          borderRadius: 16, overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "18px 24px", borderBottom: `1px solid ${S.border}`,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              All links
              <span style={{
                marginLeft: 8, fontSize: 11, fontFamily: S.mono, color: S.violet,
                background: "rgba(124,58,237,0.1)", padding: "2px 8px",
                borderRadius: 10, border: `1px solid ${S.border}`,
              }}>{filtered.length}</span>
            </div>
            <input
              placeholder="Search links..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: S.surface2, border: `1px solid ${S.border}`,
                borderRadius: 8, padding: "8px 14px", color: S.text,
                fontSize: 12, outline: "none", width: 220,
                fontFamily: S.sans,
              }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Short link", "Original URL", "Clicks", "Status", "Created", ""].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 20px",
                      fontSize: 10, fontWeight: 700, color: S.muted,
                      textTransform: "uppercase", letterSpacing: "0.8px",
                      borderBottom: `1px solid ${S.border}`,
                      fontFamily: S.sans,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} style={{ padding: "16px 20px", borderBottom: `1px solid rgba(124,58,237,0.06)` }}>
                        <div style={{ height: 14, background: "rgba(124,58,237,0.06)", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: S.muted, fontFamily: S.mono, fontSize: 13 }}>
                    {links.length === 0 ? "> no links yet — go shorten something" : "> no results for your search"}
                  </td></tr>
                ) : filtered.map(link => {
                  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                  const isExpiring = link.expires_at && !isExpired && new Date(link.expires_at).getTime() - Date.now() < 86400000 * 2;
                  const statusColor = !link.is_active || isExpired ? "#FF5252" : isExpiring ? "#FB923C" : "#39FF14";
                  const statusLabel = !link.is_active ? "inactive" : isExpired ? "expired" : isExpiring ? "expiring" : "active";
                  const pct = Math.min(100, (link.total_clicks / 1000) * 100);

                  return (
                    <tr key={link.short_code} style={{ transition: "background 0.15s" }}>
                      <td style={{ padding: "14px 20px", borderBottom: `1px solid rgba(124,58,237,0.06)` }}>
                        <span style={{ fontFamily: S.mono, color: "#A78BFA", fontSize: 13, fontWeight: 600 }}>{link.short_code}</span>
                      </td>
                      <td style={{ padding: "14px 20px", borderBottom: `1px solid rgba(124,58,237,0.06)`, maxWidth: 260 }}>
                        <span style={{ fontFamily: S.mono, color: S.muted, fontSize: 11, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.long_url}</span>
                      </td>
                      <td style={{ padding: "14px 20px", borderBottom: `1px solid rgba(124,58,237,0.06)` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 52, height: 3, background: "rgba(124,58,237,0.15)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(to right,#7C3AED,#39FF14)", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: S.mono, fontSize: 12, fontWeight: 700 }}>{fmt(link.total_clicks)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", borderBottom: `1px solid rgba(124,58,237,0.06)` }}>
                        <span style={{
                          fontFamily: S.mono, fontSize: 10, fontWeight: 700,
                          color: statusColor, background: `${statusColor}18`,
                          border: `1px solid ${statusColor}30`,
                          padding: "3px 8px", borderRadius: 20,
                          textTransform: "uppercase", letterSpacing: "0.8px",
                        }}>● {statusLabel}</span>
                      </td>
                      <td style={{ padding: "14px 20px", borderBottom: `1px solid rgba(124,58,237,0.06)` }}>
                        <span style={{ fontSize: 11, color: S.muted }}>{timeAgo(link.created_at)}</span>
                      </td>
                      <td style={{ padding: "14px 20px", borderBottom: `1px solid rgba(124,58,237,0.06)` }}>
                        <button
                          onClick={() => handleDelete(link.short_code)}
                          disabled={deleting === link.short_code}
                          style={{
                            background: "transparent", border: "none",
                            color: "rgba(255,82,82,0.4)", fontSize: 11,
                            fontWeight: 700, cursor: "pointer", fontFamily: S.mono,
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#FF5252")}
                          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,82,82,0.4)")}
                        >{deleting === link.short_code ? "..." : "delete"}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

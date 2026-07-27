"use client";
import { useEffect, useState } from "react";
import { getAllLinks, deleteLink, getDashboardStats, LinkRow, DashboardStats } from "@/lib/api";
import Link from "next/link";

function fmt(n: string | number) {
  const num = typeof n === "string" ? parseInt(n) : n;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return String(num);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [l, s] = await Promise.all([getAllLinks(), getDashboardStats()]);
        setLinks(l);
        setStats(s);
      } catch (e: any) {
        setError("Could not connect to API. Make sure your backend is running and .env is configured.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(code: string) {
    setDeleting(code);
    try {
      await deleteLink(code);
      setLinks(prev => prev.filter(l => l.short_code !== code));
    } finally {
      setDeleting(null);
    }
  }

  const filtered = links.filter(
    l => l.short_code.includes(search) || l.long_url.includes(search),
  );

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/90 backdrop-blur-xl border-b border-border px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo to-cyan flex items-center justify-center font-black text-white text-sm">U</div>
          <span className="font-bold text-lg tracking-tight">URLShrinker</span>
        </div>
        <Link href="/" className="text-muted hover:text-white text-sm font-medium transition-colors">← Shorten a Link</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-4xl font-black tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted mb-10">Real-time analytics for your links</p>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-amber/10 border border-amber/30 text-amber text-sm font-medium">
            ⚠ {error}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Links", value: stats ? fmt(stats.total_links) : "—", color: "text-indigo" },
            { label: "Total Clicks", value: stats ? fmt(stats.total_clicks) : "—", color: "text-cyan" },
            { label: "Clicks Today", value: stats ? fmt(stats.clicks_today) : "—", color: "text-green" },
            { label: "Links Today", value: stats ? fmt(stats.links_today) : "—", color: "text-amber" },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-2">{s.label}</div>
              <div className={`text-3xl font-black font-mono ${s.color}`}>
                {loading ? <span className="animate-pulse text-border">——</span> : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-bold text-base">Your Links</h2>
            <input
              className="input-field w-52"
              placeholder="Search links..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Short Link", "Original URL", "Clicks", "Status", "Created", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 bg-surface3 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      {links.length === 0 ? "No links yet — go shorten something!" : "No results for your search"}
                    </td>
                  </tr>
                ) : (
                  filtered.map(link => {
                    const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                    const isExpiring = link.expires_at && !isExpired &&
                      new Date(link.expires_at).getTime() - Date.now() < 86400000 * 2;
                    const statusColor = !link.is_active || isExpired
                      ? "bg-red/10 text-red border-red/20"
                      : isExpiring
                      ? "bg-amber/10 text-amber border-amber/20"
                      : "bg-green/10 text-green border-green/20";
                    const statusLabel = !link.is_active ? "Inactive" : isExpired ? "Expired" : isExpiring ? "Expiring" : "Active";

                    return (
                      <tr key={link.short_code} className="border-b border-border/40 hover:bg-surface2/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-cyan text-sm font-semibold">{link.short_code}</span>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <span className="font-mono text-xs text-muted truncate block">{link.long_url}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-sm">{fmt(link.total_clicks)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`tag border ${statusColor}`}>{statusLabel}</span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted">{timeAgo(link.created_at)}</td>
                        <td className="px-5 py-4">
                          <button
                            className="text-xs text-red/60 hover:text-red font-semibold transition-colors cursor-pointer"
                            onClick={() => handleDelete(link.short_code)}
                            disabled={deleting === link.short_code}
                          >
                            {deleting === link.short_code ? "..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

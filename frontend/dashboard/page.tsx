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
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function load() {
      const [l, s] = await Promise.all([getAllLinks(), getDashboardStats()]);
      setLinks(l);
      setStats(s);
      setIsDemo(Boolean(s.demo));
      setLoading(false);
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
    <div className="min-h-screen bg-ink">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ink/90 backdrop-blur-xl border-b border-line px-6 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-teal flex items-center justify-center font-display font-black text-ink text-sm">U</div>
          <span className="font-display font-bold text-lg tracking-tight text-paper">URLShrinker</span>
        </div>
        <Link href="/" className="text-dim hover:text-paper text-sm font-medium transition-colors">
          ← Shorten a link
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-display font-black text-3xl md:text-4xl text-paper mb-1.5">Dashboard</h1>
        <p className="text-dim mb-8">Real-time analytics for your links</p>

        {isDemo && !loading && (
          <div className="mb-8 p-3.5 rounded-lg bg-amber/10 border border-amber/25 text-amber text-sm font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber flex-shrink-0" />
            Showing preview data — connect <code className="font-mono text-xs">NEXT_PUBLIC_API_URL</code> to see live analytics.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Links", value: stats ? fmt(stats.total_links) : "—", accentClass: "bg-teal" },
            { label: "Total Clicks", value: stats ? fmt(stats.total_clicks) : "—", accentClass: "bg-amber" },
            { label: "Clicks Today", value: stats ? fmt(stats.clicks_today) : "—", accentClass: "bg-green" },
            { label: "Links Today", value: stats ? fmt(stats.links_today) : "—", accentClass: "bg-teal" },
          ].map(s => (
            <div key={s.label} className="panel p-5 relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.accentClass}`} />
              <div className="text-[11px] text-dim font-semibold uppercase tracking-wider mb-2">{s.label}</div>
              <div className="mono-num text-3xl text-paper">
                {loading ? <span className="animate-pulse text-line">——</span> : s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="panel p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-line">
            <h2 className="font-display font-semibold text-base text-paper">Your links</h2>
            <input
              className="input-field w-52"
              placeholder="Search links…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line bg-panel2">
                  {["Short link", "Original URL", "Clicks", "Status", "Created", ""].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-dim uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-line/50">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 bg-panel2 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-dim">
                      {links.length === 0 ? "No links yet — shorten your first one from the home page." : "No results for that search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map(link => {
                    const isExpired = link.expires_at ? new Date(link.expires_at) < new Date() : false;
                    const isExpiring = link.expires_at && !isExpired &&
                      new Date(link.expires_at).getTime() - Date.now() < 86400000 * 2;
                    const statusColor = !link.is_active || isExpired
                      ? "bg-red/10 text-red border-red/25"
                      : isExpiring
                      ? "bg-amber/10 text-amber border-amber/25"
                      : "bg-green/10 text-green border-green/25";
                    const statusLabel = !link.is_active ? "Inactive" : isExpired ? "Expired" : isExpiring ? "Expiring" : "Active";

                    return (
                      <tr key={link.short_code} className="border-b border-line/60 hover:bg-panel2/60 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-teal text-sm font-semibold">{link.short_code}</span>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <span className="font-mono text-xs text-dim truncate block">{link.long_url}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="mono-num text-sm text-paper">{fmt(link.total_clicks)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`tag border ${statusColor}`}>{statusLabel}</span>
                        </td>
                        <td className="px-5 py-4 text-xs text-dim">{timeAgo(link.created_at)}</td>
                        <td className="px-5 py-4">
                          <button
                            className="text-xs text-red/70 hover:text-red font-semibold transition-colors cursor-pointer"
                            onClick={() => handleDelete(link.short_code)}
                            disabled={deleting === link.short_code}
                          >
                            {deleting === link.short_code ? "…" : "Delete"}
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

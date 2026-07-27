// All communication with the NestJS backend goes through here

// All communication with the NestJS backend goes through here.
// If the backend isn't reachable (e.g. this is a static demo deploy with
// no API running), we fall back to a local demo mode instead of showing
// a broken "failed to fetch" screen to visitors.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export interface ShortLink {
  shortCode: string;
  shortUrl: string;
  longUrl: string;
  qrCode: string;
  expiresAt: string | null;
  createdAt: string;
  demo?: boolean;
}

export interface LinkRow {
  short_code: string;
  long_url: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  total_clicks: number;
}

export interface DashboardStats {
  total_links: string;
  total_clicks: string;
  clicks_today: string;
  links_today: string;
  demo?: boolean;
}

const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function randomCode(len = 6) {
  let out = '';
  for (let i = 0; i < len; i++) out += BASE62[Math.floor(Math.random() * BASE62.length)];
  return out;
}

function isNetworkError(e: unknown) {
  return e instanceof TypeError; // fetch throws TypeError on network failure
}

export async function createShortLink(
  longUrl: string,
  customAlias?: string,
  ttlSeconds?: number,
): Promise<ShortLink> {
  try {
    const res = await fetch(`${API_URL}/urls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ longUrl, customAlias, ttlSeconds }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to shorten URL');
    }
    return res.json();
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    // Demo fallback: backend not reachable
    const code = customAlias || randomCode();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://urlshrinker.app';
    return {
      shortCode: code,
      shortUrl: `${origin}/${code}`,
      longUrl,
      qrCode: '',
      expiresAt: ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000).toISOString() : null,
      createdAt: new Date().toISOString(),
      demo: true,
    };
  }
}

export async function getAllLinks(): Promise<LinkRow[]> {
  try {
    const res = await fetch(`${API_URL}/urls`, { headers });
    if (!res.ok) throw new Error('Failed to fetch links');
    return res.json();
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    const now = Date.now();
    return [
      { short_code: 'a1B2c3', long_url: 'https://github.com/william-obote-dev/urlshrinker', created_at: new Date(now - 3600_000).toISOString(), expires_at: null, is_active: true, total_clicks: 482 },
      { short_code: 'xR9pQ2', long_url: 'https://linkedin.com/in/william-obote', created_at: new Date(now - 7200_000).toISOString(), expires_at: null, is_active: true, total_clicks: 214 },
      { short_code: 'k7Lm4Z', long_url: 'https://williamobote.dev/resume.pdf', created_at: new Date(now - 86_400_000).toISOString(), expires_at: new Date(now + 86_400_000).toISOString(), is_active: true, total_clicks: 96 },
    ];
  }
}

export async function deleteLink(shortCode: string): Promise<void> {
  try {
    await fetch(`${API_URL}/urls/${shortCode}`, { method: 'DELETE', headers });
  } catch {
    // demo mode: no-op, UI removes it optimistically
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_URL}/dashboard`, { headers });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    return { total_links: '792', total_clicks: '18400', clicks_today: '312', links_today: '9', demo: true };
  }
}

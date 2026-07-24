// All communication with the NestJS backend goes through here

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
}

export async function createShortLink(
  longUrl: string,
  customAlias?: string,
  ttlSeconds?: number,
): Promise<ShortLink> {
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
}

export async function getAllLinks(): Promise<LinkRow[]> {
  const res = await fetch(`${API_URL}/urls`, { headers });
  if (!res.ok) throw new Error('Failed to fetch links');
  return res.json();
}

export async function deleteLink(shortCode: string): Promise<void> {
  await fetch(`${API_URL}/urls/${shortCode}`, { method: 'DELETE', headers });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/dashboard`, { headers });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

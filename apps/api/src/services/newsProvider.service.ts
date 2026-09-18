import { config } from '../config';

export interface RawNewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  /** unix seconds */
  datetime: number;
}

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const REQUEST_TIMEOUT_MS = 8000;

function toDateStamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Fetches recent company news for a US-listed equity symbol from Finnhub's
 * free-tier `company-news` endpoint. Deliberately scoped to stocks — that's
 * where per-symbol company news coverage genuinely exists; forex/crypto
 * pairs don't have an equivalent "company news" concept.
 *
 * Fails closed: any missing API key, network error, timeout, non-2xx
 * response, or unexpected payload shape returns an empty array rather than
 * throwing, so a flaky or unconfigured news provider never breaks the rest
 * of the app.
 */
export async function fetchCompanyNews(symbol: string, lookbackDays = 5): Promise<RawNewsItem[]> {
  if (!config.newsApiKey) return [];

  const to = new Date();
  const from = new Date(to.getTime() - lookbackDays * 86_400_000);
  const url = `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${toDateStamp(from)}&to=${toDateStamp(to)}&token=${config.newsApiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return [];

    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        headline: typeof item.headline === 'string' ? item.headline : '',
        summary: typeof item.summary === 'string' ? item.summary : '',
        source: typeof item.source === 'string' ? item.source : 'Unknown',
        url: typeof item.url === 'string' ? item.url : '',
        datetime: typeof item.datetime === 'number' ? item.datetime : 0,
      }))
      .filter((item) => item.headline.length > 0);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

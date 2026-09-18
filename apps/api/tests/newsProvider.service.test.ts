import { describe, expect, it } from 'vitest';
import { fetchCompanyNews } from '../src/services/newsProvider.service';

describe('fetchCompanyNews', () => {
  it('returns an empty array (never throws) when no API key is configured', async () => {
    // config.newsApiKey is '' in the test environment (no FINNHUB_API_KEY set),
    // so this exercises the "fails closed" path without needing network access.
    const result = await fetchCompanyNews('AAPL');
    expect(result).toEqual([]);
  });
});

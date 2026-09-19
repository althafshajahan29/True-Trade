import { AssetClass, NewsHeadline, NewsSentiment, SignalClassification, SignalFactor, SignalScore } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface ScoreRow {
  symbol: string;
  asset_class: string;
  composite_score: number;
  classification: string;
  technical_factor: string;
  explosive_factor: string;
  news_factor: string | null;
  updated_at: string;
}

function mapScoreRow(row: ScoreRow): SignalScore {
  return {
    symbol: row.symbol,
    assetClass: row.asset_class as AssetClass,
    compositeScore: row.composite_score,
    classification: row.classification as SignalClassification,
    technical: JSON.parse(row.technical_factor) as SignalFactor,
    explosiveDemand: JSON.parse(row.explosive_factor) as SignalFactor,
    newsSentiment: row.news_factor ? (JSON.parse(row.news_factor) as SignalFactor) : null,
    updatedAt: row.updated_at,
  };
}

interface HeadlineRow {
  id: string;
  symbol: string;
  headline: string;
  source: string;
  url: string;
  sentiment: string;
  is_controversy: number;
  published_at: string;
}

function mapHeadlineRow(row: HeadlineRow): NewsHeadline {
  return {
    id: row.id,
    symbol: row.symbol,
    headline: row.headline,
    source: row.source,
    url: row.url,
    sentiment: row.sentiment as NewsSentiment,
    isControversy: Boolean(row.is_controversy),
    publishedAt: row.published_at,
  };
}

export const signalRepo = {
  upsertScore(score: SignalScore): void {
    getDb()
      .prepare(
        `INSERT INTO signal_scores (symbol, asset_class, composite_score, classification, technical_factor, explosive_factor, news_factor, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(symbol) DO UPDATE SET
           asset_class = excluded.asset_class,
           composite_score = excluded.composite_score,
           classification = excluded.classification,
           technical_factor = excluded.technical_factor,
           explosive_factor = excluded.explosive_factor,
           news_factor = excluded.news_factor,
           updated_at = excluded.updated_at`,
      )
      .run(
        score.symbol,
        score.assetClass,
        score.compositeScore,
        score.classification,
        JSON.stringify(score.technical),
        JSON.stringify(score.explosiveDemand),
        score.newsSentiment ? JSON.stringify(score.newsSentiment) : null,
        score.updatedAt,
      );
  },

  listScores(): SignalScore[] {
    const rows = getDb().prepare('SELECT * FROM signal_scores ORDER BY composite_score DESC').all() as ScoreRow[];
    return rows.map(mapScoreRow);
  },

  findScore(symbol: string): SignalScore | null {
    const row = getDb().prepare('SELECT * FROM signal_scores WHERE symbol = ?').get(symbol) as ScoreRow | undefined;
    return row ? mapScoreRow(row) : null;
  },

  replaceHeadlines(symbol: string, headlines: NewsHeadline[]): void {
    const db = getDb();
    db.prepare('DELETE FROM news_headlines WHERE symbol = ?').run(symbol);
    const insert = db.prepare(
      `INSERT INTO news_headlines (id, symbol, headline, source, url, sentiment, is_controversy, published_at, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const fetchedAt = new Date().toISOString();
    for (const h of headlines) {
      insert.run(h.id, h.symbol, h.headline, h.source, h.url, h.sentiment, h.isControversy ? 1 : 0, h.publishedAt, fetchedAt);
    }
  },

  listHeadlines(symbol: string, limit = 10): NewsHeadline[] {
    const rows = getDb()
      .prepare('SELECT * FROM news_headlines WHERE symbol = ? ORDER BY published_at DESC LIMIT ?')
      .all(symbol, limit) as HeadlineRow[];
    return rows.map(mapHeadlineRow);
  },

  /** Cross-symbol feed, most recent first — powers the dashboard/Signals news feed rather than one symbol's detail page. */
  listRecentHeadlines(limit = 30): NewsHeadline[] {
    const rows = getDb().prepare('SELECT * FROM news_headlines ORDER BY published_at DESC LIMIT ?').all(limit) as HeadlineRow[];
    return rows.map(mapHeadlineRow);
  },
};

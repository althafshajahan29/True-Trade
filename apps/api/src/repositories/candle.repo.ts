import { Candle, Timeframe } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface CandleRow {
  symbol: string;
  timeframe: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function mapRow(row: CandleRow): Candle {
  return {
    symbol: row.symbol,
    timeframe: row.timeframe as Timeframe,
    timestamp: row.timestamp,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  };
}

export const candleRepo = {
  insertMany(candles: Candle[]): void {
    const db = getDb();
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO candles (symbol, timeframe, timestamp, open, high, low, close, volume)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const c of candles) {
      stmt.run(c.symbol, c.timeframe, c.timestamp, c.open, c.high, c.low, c.close, c.volume);
    }
  },

  findRange(symbol: string, timeframe: Timeframe, startMs: number, endMs: number): Candle[] {
    const rows = getDb()
      .prepare(
        `SELECT * FROM candles WHERE symbol = ? AND timeframe = ? AND timestamp BETWEEN ? AND ?
         ORDER BY timestamp ASC`,
      )
      .all(symbol, timeframe, startMs, endMs) as CandleRow[];
    return rows.map(mapRow);
  },

  findLatest(symbol: string, timeframe: Timeframe): Candle | null {
    const row = getDb()
      .prepare(
        'SELECT * FROM candles WHERE symbol = ? AND timeframe = ? ORDER BY timestamp DESC LIMIT 1',
      )
      .get(symbol, timeframe) as CandleRow | undefined;
    return row ? mapRow(row) : null;
  },

  count(symbol: string, timeframe: Timeframe): number {
    const row = getDb()
      .prepare('SELECT COUNT(*) as count FROM candles WHERE symbol = ? AND timeframe = ?')
      .get(symbol, timeframe) as { count: number };
    return row.count;
  },
};

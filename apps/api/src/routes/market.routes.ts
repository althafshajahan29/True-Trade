import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { marketDataService } from '../services/marketData.service';

export const marketRouter = Router();
marketRouter.use(requireAuth);

marketRouter.get(
  '/instruments',
  asyncHandler(async (_req, res) => {
    res.json({ items: marketDataService.listInstruments() });
  }),
);

const candlesQuerySchema = z.object({
  symbol: z.string(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
  start: z.string(),
  end: z.string(),
});

marketRouter.get(
  '/candles',
  validateQuery(candlesQuerySchema),
  asyncHandler(async (req, res) => {
    const { symbol, timeframe, start, end } = req.query as unknown as z.infer<typeof candlesQuerySchema>;
    const candles = marketDataService.getCandles(symbol, timeframe, Date.parse(start), Date.parse(end));
    res.json({ items: candles });
  }),
);

const quoteQuerySchema = z.object({ symbol: z.string() });

marketRouter.get(
  '/quote',
  validateQuery(quoteQuerySchema),
  asyncHandler(async (req, res) => {
    const { symbol } = req.query as unknown as z.infer<typeof quoteQuerySchema>;
    res.json(marketDataService.getLiveQuote(symbol));
  }),
);

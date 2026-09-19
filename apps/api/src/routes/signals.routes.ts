import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { signalService } from '../services/signal.service';
import { NotFoundError } from '../utils/errors';

export const signalsRouter = Router();
signalsRouter.use(requireAuth);

signalsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ items: signalService.list() });
  }),
);

const explosiveQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).optional(),
});

const newsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

signalsRouter.get(
  '/news',
  validateQuery(newsQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit } = req.query as unknown as z.infer<typeof newsQuerySchema>;
    res.json({ items: signalService.recentNews(limit ?? 30) });
  }),
);

signalsRouter.get(
  '/explosive',
  validateQuery(explosiveQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit } = req.query as unknown as z.infer<typeof explosiveQuerySchema>;
    res.json({ items: signalService.listExplosiveCandidates(limit ?? 5) });
  }),
);

const detailQuerySchema = z.object({ symbol: z.string() });

signalsRouter.get(
  '/detail',
  validateQuery(detailQuerySchema),
  asyncHandler(async (req, res) => {
    const { symbol } = req.query as unknown as z.infer<typeof detailQuerySchema>;
    const detail = await signalService.getDetail(symbol);
    if (!detail) throw new NotFoundError('Symbol');
    res.json(detail);
  }),
);

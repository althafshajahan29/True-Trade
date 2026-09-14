import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { tradeService } from '../services/trade.service';

export const tradesRouter = Router();
tradesRouter.use(requireAuth);

tradesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: tradeService.listTrades(req.userId!) });
  }),
);

export const positionsRouter = Router();
positionsRouter.use(requireAuth);

positionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: tradeService.listOpenPositions(req.userId!) });
  }),
);

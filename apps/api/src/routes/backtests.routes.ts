import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createBacktestSchema } from '../validation/schemas';
import { backtestService } from '../services/backtest.service';

export const backtestsRouter = Router();
backtestsRouter.use(requireAuth);

backtestsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: backtestService.list(req.userId!) });
  }),
);

backtestsRouter.post(
  '/',
  validateBody(createBacktestSchema),
  asyncHandler(async (req, res) => {
    const { run, result } = backtestService.run(req.userId!, req.body);
    res.status(201).json({ run, result });
  }),
);

backtestsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { run, result } = backtestService.get(req.userId!, req.params.id!);
    res.json({ run, result });
  }),
);

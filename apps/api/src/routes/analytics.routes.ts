import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { analyticsService } from '../services/analytics.service';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get(
  '/overview',
  asyncHandler(async (req, res) => {
    res.json(analyticsService.dashboard(req.userId!));
  }),
);

analyticsRouter.get(
  '/performance',
  asyncHandler(async (req, res) => {
    res.json(analyticsService.performance(req.userId!));
  }),
);

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createPriceAlertSchema } from '../validation/schemas';
import { alertService } from '../services/alert.service';

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

alertsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: alertService.list(req.userId!), unreadCount: alertService.unreadCount(req.userId!) });
  }),
);

alertsRouter.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    res.json(alertService.markRead(req.userId!, req.params.id!));
  }),
);

alertsRouter.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    alertService.markAllRead(req.userId!);
    res.status(204).send();
  }),
);

alertsRouter.post(
  '/price-rules',
  validateBody(createPriceAlertSchema),
  asyncHandler(async (req, res) => {
    const rule = alertService.createPriceRule(req.userId!, req.body.symbol, req.body.condition, req.body.targetPrice);
    res.status(201).json(rule);
  }),
);

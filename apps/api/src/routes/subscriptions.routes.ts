import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createCopySubscriptionSchema } from '../validation/schemas';
import { providerService } from '../services/provider.service';

export const subscriptionsRouter = Router();
subscriptionsRouter.use(requireAuth);

subscriptionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: providerService.listSubscriptions(req.userId!) });
  }),
);

subscriptionsRouter.post(
  '/',
  validateBody(createCopySubscriptionSchema),
  asyncHandler(async (req, res) => {
    const sub = providerService.subscribe(req.userId!, req.body.providerId, req.body.allocation);
    res.status(201).json(sub);
  }),
);

subscriptionsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    providerService.unsubscribe(req.userId!, req.params.id!);
    res.status(204).send();
  }),
);

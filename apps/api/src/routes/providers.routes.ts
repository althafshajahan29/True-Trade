import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { providerService } from '../services/provider.service';

export const providersRouter = Router();
providersRouter.use(requireAuth);

providersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: providerService.list() });
  }),
);

providersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(providerService.get(req.params.id!));
  }),
);

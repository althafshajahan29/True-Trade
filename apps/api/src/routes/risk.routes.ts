import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { riskSettingsSchema } from '../validation/schemas';
import { riskService } from '../services/risk.service';

export const riskRouter = Router();
riskRouter.use(requireAuth);

riskRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(riskService.get(req.userId!));
  }),
);

riskRouter.put(
  '/',
  validateBody(riskSettingsSchema),
  asyncHandler(async (req, res) => {
    res.json(riskService.update(req.userId!, req.body));
  }),
);

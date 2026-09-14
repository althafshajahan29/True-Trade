import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { strategyInputSchema } from '../validation/schemas';
import { strategyService } from '../services/strategy.service';

export const strategiesRouter = Router();
strategiesRouter.use(requireAuth);

strategiesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: strategyService.list(req.userId!) });
  }),
);

strategiesRouter.post(
  '/',
  validateBody(strategyInputSchema),
  asyncHandler(async (req, res) => {
    const strategy = strategyService.create(req.userId!, req.body);
    res.status(201).json(strategy);
  }),
);

strategiesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(strategyService.get(req.userId!, req.params.id!));
  }),
);

strategiesRouter.put(
  '/:id',
  validateBody(strategyInputSchema),
  asyncHandler(async (req, res) => {
    res.json(strategyService.update(req.userId!, req.params.id!, req.body));
  }),
);

strategiesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    strategyService.remove(req.userId!, req.params.id!);
    res.status(204).send();
  }),
);

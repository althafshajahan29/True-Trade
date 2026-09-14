import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createBotSchema } from '../validation/schemas';
import { botService } from '../services/bot.service';

export const botsRouter = Router();
botsRouter.use(requireAuth);

botsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: botService.list(req.userId!) });
  }),
);

botsRouter.post(
  '/',
  validateBody(createBotSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(botService.create(req.userId!, req.body));
  }),
);

botsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(botService.getDetail(req.userId!, req.params.id!));
  }),
);

botsRouter.post(
  '/:id/start',
  asyncHandler(async (req, res) => {
    res.json(botService.start(req.userId!, req.params.id!));
  }),
);

botsRouter.post(
  '/:id/pause',
  asyncHandler(async (req, res) => {
    res.json(botService.pause(req.userId!, req.params.id!));
  }),
);

botsRouter.post(
  '/:id/resume',
  asyncHandler(async (req, res) => {
    res.json(botService.resume(req.userId!, req.params.id!));
  }),
);

botsRouter.post(
  '/:id/stop',
  asyncHandler(async (req, res) => {
    res.json(botService.stop(req.userId!, req.params.id!));
  }),
);

botsRouter.post(
  '/:id/clone',
  asyncHandler(async (req, res) => {
    res.status(201).json(botService.clone(req.userId!, req.params.id!));
  }),
);

botsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    botService.remove(req.userId!, req.params.id!);
    res.status(204).send();
  }),
);

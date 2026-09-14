import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { acceptRiskDisclaimerSchema, updateProfileSchema } from '../validation/schemas';
import { authService } from '../services/auth.service';
import { userRepo } from '../repositories/user.repo';
import { userSettingsRepo } from '../repositories/userSettings.repo';
import { z } from 'zod';

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const profile = authService.getProfile(req.userId!);
    res.json({ ...profile, paperBalance: userRepo.getPaperBalance(req.userId!) });
  }),
);

usersRouter.put(
  '/',
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    userRepo.updateProfile(req.userId!, req.body);
    const profile = authService.getProfile(req.userId!);
    res.json(profile);
  }),
);

usersRouter.post(
  '/accept-risk-disclaimer',
  validateBody(acceptRiskDisclaimerSchema),
  asyncHandler(async (req, res) => {
    if (!req.body.accepted) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'You must accept the disclaimer to continue.' } });
      return;
    }
    const profile = authService.acceptRiskDisclaimer(req.userId!);
    res.json(profile);
  }),
);

usersRouter.get(
  '/settings',
  asyncHandler(async (req, res) => {
    res.json(userSettingsRepo.find(req.userId!));
  }),
);

const settingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  notifications: z.object({
    pushEnabled: z.boolean(),
    botErrorAlerts: z.boolean(),
    riskAlerts: z.boolean(),
    tradeExecutionAlerts: z.boolean(),
    priceAlerts: z.boolean(),
  }),
});

usersRouter.put(
  '/settings',
  validateBody(settingsSchema),
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    userSettingsRepo.upsert({
      userId,
      theme: req.body.theme,
      currency: req.body.currency,
      notifications: { userId, ...req.body.notifications },
    });
    res.json(userSettingsRepo.find(userId));
  }),
);

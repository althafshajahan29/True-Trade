import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { signInSchema, signUpSchema } from '../validation/schemas';
import { authService } from '../services/auth.service';

export const authRouter = Router();

authRouter.post(
  '/signup',
  validateBody(signUpSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.signUp(req.body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/signin',
  validateBody(signInSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.signIn(req.body);
    res.json(result);
  }),
);

import bcrypt from 'bcryptjs';
import {
  AuthTokens,
  DEFAULT_RISK_SETTINGS,
  generateId,
  isStrongEnoughPassword,
  isValidEmail,
  SignInRequest,
  SignUpRequest,
  User,
  UserProfile,
} from '@right-trade/shared';
import { userRepo } from '../repositories/user.repo';
import { riskSettingsRepo } from '../repositories/riskSettings.repo';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';
import { signAuthToken, tokenExpiresAtIso } from '../utils/jwt';

const AVATAR_COLORS = ['#5B8DEF', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#14B8A6'];

function toProfile(user: User): UserProfile {
  const { passwordHash: _passwordHash, ...profile } = user;
  return profile;
}

export const authService = {
  async signUp(input: SignUpRequest): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    if (!isValidEmail(input.email)) throw new ValidationError('Enter a valid email address.');
    if (!isStrongEnoughPassword(input.password)) {
      throw new ValidationError('Password must be at least 8 characters.');
    }
    if (!input.displayName || input.displayName.trim().length < 2) {
      throw new ValidationError('Enter a display name.');
    }
    if (userRepo.findByEmail(input.email)) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const now = new Date().toISOString();
    const user: User = {
      id: generateId(),
      email: input.email,
      passwordHash,
      displayName: input.displayName.trim(),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]!,
      baseCurrency: 'USD',
      tradingMode: 'paper',
      riskDisclaimerAcceptedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    userRepo.create(user);
    riskSettingsRepo.upsert({ ...DEFAULT_RISK_SETTINGS, userId: user.id, updatedAt: now });

    const tokens: AuthTokens = { accessToken: signAuthToken(user.id), expiresAt: tokenExpiresAtIso() };
    return { user: toProfile(user), tokens };
  },

  async signIn(input: SignInRequest): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const user = userRepo.findByEmail(input.email);
    if (!user) throw new UnauthorizedError('Invalid email or password.');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid email or password.');

    const tokens: AuthTokens = { accessToken: signAuthToken(user.id), expiresAt: tokenExpiresAtIso() };
    return { user: toProfile(user), tokens };
  },

  getProfile(userId: string): UserProfile {
    const user = userRepo.findById(userId);
    if (!user) throw new UnauthorizedError();
    return toProfile(user);
  },

  acceptRiskDisclaimer(userId: string): UserProfile {
    const acceptedAt = new Date().toISOString();
    userRepo.acceptRiskDisclaimer(userId, acceptedAt);
    return this.getProfile(userId);
  },
};

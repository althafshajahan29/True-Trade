import { AssetClass, CopySubscription, generateId, INSTRUMENTS, ProviderProfile, round, Trade } from '@right-trade/shared';
import { providerRepo } from '../repositories/provider.repo';
import { subscriptionRepo } from '../repositories/subscription.repo';
import { tradeRepo } from '../repositories/trade.repo';
import { userRepo } from '../repositories/user.repo';
import { alertRepo } from '../repositories/alert.repo';
import { getDb } from '../db/connection';

function symbolsForAssetClasses(classes: AssetClass[]): string[] {
  const symbols = INSTRUMENTS.filter((i) => classes.includes(i.assetClass)).map((i) => i.symbol);
  return symbols.length > 0 ? symbols : INSTRUMENTS.map((i) => i.symbol);
}

/**
 * Copy trading simulation layer: on each tick, active subscriptions have a
 * chance of "mirroring" one of their provider's trades. Outcome likelihood
 * and size are derived from the provider's published win rate and risk
 * score, so followers of a stronger/steadier provider see steadier results.
 */
export function tickCopySubscriptions(): void {
  const db = getDb();
  const activeSubs = db
    .prepare("SELECT * FROM copy_subscriptions WHERE status = 'active'")
    .all() as { id: string; user_id: string; provider_id: string; allocation: number; allocation_percent: number; status: string; created_at: string }[];

  for (const row of activeSubs) {
    const sub: CopySubscription = {
      id: row.id,
      userId: row.user_id,
      providerId: row.provider_id,
      allocation: row.allocation,
      allocationPercent: row.allocation_percent,
      status: row.status as CopySubscription['status'],
      createdAt: row.created_at,
    };

    if (Math.random() > 0.12) continue; // most ticks produce no mirrored trade

    const provider = providerRepo.findById(sub.providerId);
    if (!provider) continue;

    mirrorTrade(sub, provider);
  }
}

function mirrorTrade(sub: CopySubscription, provider: ProviderProfile): void {
  const symbols = symbolsForAssetClasses(provider.assetsTraded);
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]!;
  const direction: Trade['direction'] = Math.random() > 0.5 ? 'long' : 'short';

  const isWin = Math.random() * 100 < provider.winRate;
  const riskFactor = 0.4 + provider.riskScore / 10; // 0.5 - 1.4
  const magnitudePercent = (isWin ? 1 : -1) * (0.4 + Math.random() * 1.6) * riskFactor;
  const pnl = round(sub.allocation * (magnitudePercent / 100));

  const entryPrice = 100; // synthetic reference price for the copy-trade ledger entry
  const exitPrice = round(entryPrice * (1 + magnitudePercent / 100));
  const nowIso = new Date().toISOString();
  const id = generateId();

  const trade: Trade = {
    id,
    userId: sub.userId,
    botId: null,
    positionId: null,
    symbol,
    direction,
    quantity: round(sub.allocation / entryPrice, 4),
    entryPrice,
    exitPrice,
    status: 'closed',
    source: 'copy',
    pnl,
    pnlPercent: round(magnitudePercent, 4),
    openedAt: nowIso,
    closedAt: nowIso,
    exitReason: 'signal',
  };
  tradeRepo.create(trade);
  userRepo.adjustPaperBalance(sub.userId, pnl);

  alertRepo.create({
    id: generateId(),
    userId: sub.userId,
    type: 'trade_execution',
    severity: pnl >= 0 ? 'info' : 'warning',
    title: `Copied trade from ${provider.displayName}`,
    message: `Mirrored a ${direction} on ${symbol}: ${pnl >= 0 ? '+' : ''}${pnl} (${round(magnitudePercent, 2)}%).`,
    read: false,
    createdAt: nowIso,
    relatedBotId: null,
    relatedSymbol: symbol,
  });
}

export const copyTradingService = {
  subscribe(userId: string, providerId: string, allocation: number): CopySubscription {
    const provider = providerRepo.findById(providerId);
    if (!provider) throw new Error('Provider not found');

    const balance = userRepo.getPaperBalance(userId);
    const sub: CopySubscription = {
      id: generateId(),
      userId,
      providerId,
      allocation,
      allocationPercent: balance > 0 ? round((allocation / balance) * 100, 2) : 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    subscriptionRepo.create(sub);
    providerRepo.incrementFollowers(providerId, 1);
    return sub;
  },

  unsubscribe(subscriptionId: string, providerId: string): void {
    subscriptionRepo.updateStatus(subscriptionId, 'cancelled');
    providerRepo.incrementFollowers(providerId, -1);
  },
};

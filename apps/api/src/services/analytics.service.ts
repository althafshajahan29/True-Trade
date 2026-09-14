import { average, BotRanking, DashboardOverview, PerformanceMetrics, round, standardDeviation, sum } from '@right-trade/shared';
import { alertRepo } from '../repositories/alert.repo';
import { botRepo } from '../repositories/bot.repo';
import { portfolioSnapshotRepo } from '../repositories/portfolioSnapshot.repo';
import { positionRepo } from '../repositories/position.repo';
import { tradeRepo } from '../repositories/trade.repo';
import { userRepo } from '../repositories/user.repo';

export const analyticsService = {
  dashboard(userId: string): DashboardOverview {
    const balance = userRepo.getPaperBalance(userId);
    const positions = positionRepo.listByUser(userId);
    const unrealizedPnl = round(sum(positions.map((p) => p.unrealizedPnl)));
    const equity = round(balance + unrealizedPnl);
    const closedToday = tradeRepo.listClosedToday(userId);
    const realizedPnlToday = round(sum(closedToday.map((t) => t.pnl ?? 0)));
    const bots = botRepo.listByUser(userId);
    const activeBotCount = bots.filter((b) => b.status === 'running').length;
    const unreadAlertCount = alertRepo.countUnread(userId);
    const snapshots = portfolioSnapshotRepo.listByUser(userId, 200);

    const equityCurve =
      snapshots.length > 0
        ? snapshots.map((s) => ({ timestamp: Date.parse(s.timestamp), equity: s.equity }))
        : [{ timestamp: Date.now(), equity }];

    return {
      balance: round(balance),
      equity,
      unrealizedPnl,
      unrealizedPnlPercent: balance ? round((unrealizedPnl / balance) * 100, 2) : 0,
      realizedPnlToday,
      realizedPnlTodayPercent: balance ? round((realizedPnlToday / balance) * 100, 2) : 0,
      activeBotCount,
      totalBotCount: bots.length,
      unreadAlertCount,
      equityCurve,
    };
  },

  performance(userId: string): PerformanceMetrics {
    const closed = tradeRepo.listAllClosed(userId);
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
    const losses = closed.filter((t) => (t.pnl ?? 0) <= 0);
    const grossProfit = sum(wins.map((t) => t.pnl ?? 0));
    const grossLoss = Math.abs(sum(losses.map((t) => t.pnl ?? 0)));
    const netProfit = sum(closed.map((t) => t.pnl ?? 0));
    const balance = userRepo.getPaperBalance(userId);
    const initial = balance - netProfit || balance;

    const snapshots = portfolioSnapshotRepo.listByUser(userId, 500);
    let peak = initial;
    let maxDrawdown = 0;
    for (const s of snapshots) {
      if (s.equity > peak) peak = s.equity;
      const dd = peak - s.equity;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const returns: number[] = [];
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1]!.equity;
      if (prev) returns.push((snapshots[i]!.equity - prev) / prev);
    }
    const sd = standardDeviation(returns);
    const sharpeRatio = sd === 0 ? 0 : round((average(returns) / sd) * Math.sqrt(252), 2);

    const bots = botRepo.listByUser(userId);
    const rankings: BotRanking[] = bots
      .map((bot) => {
        const botTrades = tradeRepo.listByBot(bot.id, 500).filter((t) => t.status === 'closed');
        const botPnl = sum(botTrades.map((t) => t.pnl ?? 0));
        const returnPercent = bot.allocatedCapital ? round((botPnl / bot.allocatedCapital) * 100, 2) : 0;
        return { botId: bot.id, name: bot.name, returnPercent };
      })
      .sort((a, b) => b.returnPercent - a.returnPercent);

    const monthly = new Map<string, number>();
    for (const t of closed) {
      if (!t.closedAt) continue;
      const month = t.closedAt.slice(0, 7);
      monthly.set(month, (monthly.get(month) ?? 0) + (t.pnl ?? 0));
    }
    const monthlyReturns = Array.from(monthly.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pnl]) => ({ month, returnPercent: initial ? round((pnl / initial) * 100, 2) : 0 }));

    const buckets: { bucket: string; test: (p: number) => boolean }[] = [
      { bucket: '< -2%', test: (p) => p < -2 },
      { bucket: '-2% to 0%', test: (p) => p >= -2 && p < 0 },
      { bucket: '0% to 2%', test: (p) => p >= 0 && p < 2 },
      { bucket: '> 2%', test: (p) => p >= 2 },
    ];
    const tradeDistribution = buckets.map((b) => ({
      bucket: b.bucket,
      count: closed.filter((t) => b.test(t.pnlPercent ?? 0)).length,
    }));

    return {
      totalReturnPercent: initial ? round((netProfit / initial) * 100, 2) : 0,
      winRate: closed.length ? round((wins.length / closed.length) * 100, 2) : 0,
      profitFactor: grossLoss === 0 ? (grossProfit > 0 ? 99.99 : 0) : round(grossProfit / grossLoss, 2),
      maxDrawdownPercent: peak ? round((maxDrawdown / peak) * 100, 2) : 0,
      sharpeRatio,
      bestBot: rankings[0] ?? null,
      worstBot: rankings.length > 1 ? rankings[rankings.length - 1]! : null,
      monthlyReturns,
      tradeDistribution,
    };
  },
};

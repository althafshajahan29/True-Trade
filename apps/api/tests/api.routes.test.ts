import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

let token = '';
let strategyId = '';

describe('Right Trade API', () => {
  it('signs up a new user', async () => {
    const res = await request(app).post('/auth/signup').send({
      email: 'tester@righttrade.app',
      password: 'password123',
      displayName: 'Test Trader',
    });
    expect(res.status).toBe(201);
    expect(res.body.tokens.accessToken).toBeTypeOf('string');
    token = res.body.tokens.accessToken;
  });

  it('rejects signup with a duplicate email', async () => {
    const res = await request(app).post('/auth/signup').send({
      email: 'tester@righttrade.app',
      password: 'password123',
      displayName: 'Test Trader',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });

  it('returns the authenticated profile', async () => {
    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('tester@righttrade.app');
    expect(res.body.paperBalance).toBe(10000);
  });

  it('creates a strategy', async () => {
    const res = await request(app)
      .post('/strategies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Strategy',
        assetClass: 'crypto',
        symbol: 'BTC/USD',
        timeframe: '1h',
        direction: 'long',
        entryRules: [
          {
            id: 'r1',
            type: 'entry',
            conditions: [
              {
                id: 'c1',
                left: { kind: 'indicator', ref: { indicator: 'ema', period: 12 } },
                operator: 'crosses_above',
                right: { kind: 'indicator', ref: { indicator: 'ema', period: 26 } },
              },
            ],
          },
        ],
        exitRules: [
          {
            id: 'r2',
            type: 'exit',
            conditions: [
              {
                id: 'c2',
                left: { kind: 'indicator', ref: { indicator: 'ema', period: 12 } },
                operator: 'crosses_below',
                right: { kind: 'indicator', ref: { indicator: 'ema', period: 26 } },
              },
            ],
          },
        ],
        positionSizing: { method: 'percent_of_equity', value: 10 },
        riskControls: { stopLossPercent: 3, takeProfitPercent: 8 },
        schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startHourUtc: 0, endHourUtc: 23 },
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTypeOf('string');
    strategyId = res.body.id;
  });

  it('rejects an invalid strategy payload', async () => {
    const res = await request(app)
      .post('/strategies')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('runs a backtest against the created strategy', async () => {
    const res = await request(app)
      .post('/backtests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        strategyId,
        startDate: new Date(Date.UTC(2023, 0, 1)).toISOString(),
        endDate: new Date(Date.UTC(2023, 0, 15)).toISOString(),
        initialBalance: 10000,
      });
    expect(res.status).toBe(201);
    expect(res.body.run.status).toBe('completed');
    expect(res.body.result.metrics).toBeDefined();
    expect(res.body.result.equityCurve.length).toBeGreaterThan(0);
  });

  it('creates and starts a paper trading bot', async () => {
    const createRes = await request(app)
      .post('/bots')
      .set('Authorization', `Bearer ${token}`)
      .send({ strategyId, name: 'Test Bot', allocatedCapital: 1000 });
    expect(createRes.status).toBe(201);

    const startRes = await request(app)
      .post(`/bots/${createRes.body.id}/start`)
      .set('Authorization', `Bearer ${token}`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.status).toBe('running');
  });

  it('lists marketplace providers', async () => {
    const res = await request(app).get('/providers').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('returns dashboard analytics', async () => {
    const res = await request(app).get('/analytics/overview').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(10000);
  });
});

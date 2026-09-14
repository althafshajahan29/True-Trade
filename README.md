# Right Trade

A mobile-first trading automation platform: build rule-based strategies, backtest them
against historical data, run them as paper-trading bots, and browse/copy other strategy
providers — all with a dark-mode-first, original UI (not a MetaTrader clone).

This is an MVP built for extensibility: real broker/exchange integrations, live trading,
and richer analytics can be layered on top of the existing service/data-access boundaries
without reworking the app.

## Monorepo structure

```
/apps/api      Node.js + TypeScript REST API (Express, SQLite via node:sqlite)
/apps/mobile   React Native app (Expo, TypeScript, React Navigation, Zustand)
/packages/shared  Shared TypeScript domain types + small cross-platform utilities
```

### Backend (`apps/api`)

- `src/db` — schema (`schema.sql`), connection, and `seed.ts` demo data
- `src/repositories` — data access layer (one file per table/aggregate)
- `src/services` — business logic (auth, strategies, bots, risk, analytics, …)
- `src/engines` — the parts with real logic:
  - `indicators.ts` / `ruleEngine.ts` — SMA/EMA/RSI/MACD/Bollinger/ATR + condition evaluation
  - `backtest.engine.ts` — bar-by-bar backtest simulator (entries, exits, SL/TP/trailing stop, sizing, metrics)
  - `paperTrading.engine.ts` — ticks every running bot against fresh market data and executes paper trades
- `src/services/marketData.service.ts` — deterministic seeded mock market data (swap for a real feed later)
- `src/services/copyTrading.service.ts` — simulated trade mirroring for copy subscriptions
- `src/routes` — REST endpoints, thin controllers over the services above
- `tests/` — Vitest unit tests for the rule engine and backtest engine, plus a Supertest API test

### Mobile (`apps/mobile`)

- `src/theme` — dark/light palettes, spacing/typography tokens, `useTheme()`
- `src/api` — typed fetch client + per-resource endpoint functions
- `src/store` — Zustand stores (auth with persisted token, settings)
- `src/navigation` — bottom tabs (Dashboard, Strategies, Bots, Copy, More), each a themed native-stack
- `src/components/ui` — reusable design-system components (Card, Button, Badge, Input, StatTile, …)
- `src/components/charts` — lightweight SVG equity-curve and bar charts (no external chart lib)
- `src/screens` — one folder per feature area, matching the navigation structure

## Running it

Requires Node 20+ (Node 22 recommended — the API uses the built-in `node:sqlite` module,
so there's no native dependency to compile).

```bash
npm install                 # installs all workspaces
npm run build:shared        # builds the shared types package (needed before the API or mobile app)
npm run seed:api             # creates apps/api/data/right-trade.db and seeds demo data
npm run dev:api               # starts the API on http://localhost:4000
```

Demo login once seeded: **demo@righttrade.app** / **Demo1234!**

In a second terminal:

```bash
npm run start:mobile        # starts the Expo dev server
```

Scan the QR code with Expo Go, or press `i`/`a` for a simulator/emulator. By default the
app talks to `http://localhost:4000`, which works for the iOS simulator or a web build on
the same machine as the API. For a physical device or Android emulator, set
`EXPO_PUBLIC_API_URL` to your machine's LAN IP before starting Expo, e.g.:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 npm run start:mobile
```

## Tests & verification

```bash
npm run test:api            # Vitest: rule engine, backtest engine, and API route tests
npm run typecheck           # tsc --noEmit across shared, api, and mobile
```

The mobile app has also been verified to bundle successfully end-to-end via
`npx expo export` (Metro resolves the `@right-trade/shared` workspace package, Babel
transforms, and the full dependency graph without errors).

## API overview

REST API at `http://localhost:4000`. All endpoints except `/health` and `/auth/*` require
`Authorization: Bearer <token>` from `/auth/signup` or `/auth/signin`.

`/auth/signup`, `/auth/signin`, `/me`, `/me/settings`, `/me/accept-risk-disclaimer`,
`/strategies`, `/strategies/:id`, `/backtests`, `/backtests/:id`, `/bots`, `/bots/:id`,
`/bots/:id/{start,pause,resume,stop,clone}`, `/trades`, `/positions`, `/providers`,
`/providers/:id`, `/copy-subscriptions`, `/risk-settings`, `/alerts`,
`/alerts/:id/read`, `/alerts/price-rules`, `/analytics/overview`, `/analytics/performance`,
`/market/instruments`, `/market/candles`, `/market/quote`.

Errors are returned as `{ "error": { "code": "...", "message": "...", "details": {...} } }`
with an appropriate HTTP status.

## Phase 2 / not in this MVP

- Real broker/exchange connectivity (the market data and execution layers are isolated
  behind `marketDataService` and the paper trading engine specifically so a live adapter
  can be swapped in later without touching routes, services, or the mobile app).
- Background job queue for backtests (currently synchronous, bounded by a max-candles cap).
- Automated parameter optimization (the Backtesting Lab has a placeholder section for it).
- Push notifications (alerts are in-app/API only for now; notification preferences are
  already modeled and stored).
- Two-factor authentication (UI entry point exists in Settings, not wired up).
- Web/desktop responsive layout — the app is designed mobile-first.

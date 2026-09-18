# Right Trade

A mobile-first trading automation platform: build rule-based strategies, backtest them
against historical data, run them as paper-trading bots, and browse/copy other strategy
providers — all with a dark-mode-first, original UI (not a MetaTrader clone).

The same codebase ships as a native app (iOS/Android via Expo) **and** a web app — the
web build compiles the identical screens, navigation, and stores through `react-native-web`,
so there's exactly one UI to maintain.

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
- `src/engines/signalScore.engine.ts` + `newsSentiment.engine.ts` — Market Intelligence: a
  transparent composite score (technical momentum + explosive-demand breakout detection +
  optional news-headline sentiment). See "Market Intelligence" below for what this is and
  isn't.
- `src/routes` — REST endpoints, thin controllers over the services above
- `tests/` — Vitest unit tests for the rule engine, backtest engine, signal-scoring engines,
  and a Supertest API test

### Mobile (`apps/mobile`)

- `src/theme` — dark/light palettes, spacing/typography tokens, `useTheme()`
- `src/api` — typed fetch client + per-resource endpoint functions
- `src/store` — Zustand stores (auth with persisted token, settings)
- `src/navigation` — bottom tabs (Dashboard, Strategies, Bots, Copy, More), each a themed native-stack
- `src/components/ui` — reusable design-system components (Card, Button, Badge, Input, StatTile, …)
- `src/components/charts` — lightweight SVG equity-curve and bar charts (no external chart lib)
- `src/screens` — one folder per feature area, matching the navigation structure
- `src/components/WebAppShell.tsx` — on web only, centers the app into a fixed-width
  framed column above the phone breakpoint instead of stretching full-bleed across a
  desktop browser; a no-op on native

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

### Web

```bash
npm run start:web           # expo start --web — dev server with hot reload, opens a browser tab
# or, for a static production build:
npm run build:web           # outputs to apps/mobile/dist — serve it with any static file host
```

The web build talks to `EXPO_PUBLIC_API_URL` if set at build time; otherwise, on web, it
automatically calls whatever origin served the page (`window.location.origin`). That's what
makes the single-service deploy below need zero configuration.

## Market Intelligence

A "More → Market Intelligence" screen showing a composite score per symbol (-100..+100),
plus an "explosive demand" screener for unusual volume/price/volatility activity. Every
score shows its full breakdown — nothing is a black box.

**What it actually is:** a heuristic research aid, built from three factors:
1. **Technical momentum** — RSI, MACD, and price-vs-50-period-average, computed from our
   own candle data. Always available.
2. **Explosive demand** — flags symbols with recent volume/price/volatility well above their
   own baseline. Always available, computed the same way.
3. **News sentiment** *(optional)* — recent headlines for US-listed stocks, classified by a
   transparent keyword scan (not a black-box model) as positive/negative/neutral, plus a
   lightweight "controversy" flag for lawsuit/recall/investigation-type language. Requires a
   free [Finnhub](https://finnhub.io) API key — without one, this factor is simply omitted
   and the composite score reweights across the remaining two rather than guessing.

**What it is not, and never will be from free data sources:** a system that predicts whether
a price goes up or down. Nothing does that reliably — professional funds included. It also
does not (and cannot, without paid institutional data) include options gamma exposure, short
interest, credit ratings, ETF/index flows, or a real ESG controversy score — see the code
comments in `signalScore.engine.ts` / `newsSentiment.engine.ts` for why each of those was
deliberately left out rather than faked with unreliable scraping.

**To enable news sentiment:** get a free key at finnhub.io (no card required), then set
`FINNHUB_API_KEY` as an environment variable wherever the API runs (locally, or in your
hosting provider's dashboard). Scores refresh automatically every 10 minutes
(`SIGNAL_REFRESH_INTERVAL_MS` to change that); the first request for a symbol computes it
on demand if the background refresh hasn't run yet.

## Deploying (single service, e.g. Render.com free tier)

The API can serve the built web app itself, so one deployment is the whole website —
no separate frontend host, no CORS setup, no API URL to configure.

- **Build command:** `npm install && npm run build:release`
- **Start command:** `npm run start:release`
- **Node version:** 22 (set `NODE_VERSION=22` as an environment variable if the host asks)

`build:release` builds the shared package, the API, and the web app (in that order) into
`apps/mobile/dist`. `start:release` seeds demo data if the database doesn't have it yet
(safe to run every boot — it skips if the demo account already exists) and starts the API,
which serves the API routes **and** the website from the same port.

⚠️ SQLite lives on local disk. On a host with ephemeral storage (most free tiers), the
database resets on every redeploy/restart — fine for trying it out, not for real user data.
For anything persistent, point `DB_PATH` at a mounted volume the host doesn't wipe.

## Tests & verification

```bash
npm run test:api            # Vitest: rule engine, backtest engine, and API route tests
npm run typecheck           # tsc --noEmit across shared, api, and mobile
```

The mobile app has also been verified to bundle successfully end-to-end for native via
`npx expo export` and for web via `npm run build:web` (Metro resolves the
`@right-trade/shared` workspace package, Babel transforms, and the full dependency graph
without errors). The web build was additionally exercised in a real headless browser —
signing in, navigating every tab, running a live backtest, and opening bot/analytics/settings
detail screens — to confirm it actually renders and functions, not just that it compiles.
The single-service deploy path (API serving its own web build on one port, with no
`EXPO_PUBLIC_API_URL` set) was verified the same way.

## API overview

REST API at `http://localhost:4000`. All endpoints except `/health` and `/auth/*` require
`Authorization: Bearer <token>` from `/auth/signup` or `/auth/signin`.

`/auth/signup`, `/auth/signin`, `/me`, `/me/settings`, `/me/accept-risk-disclaimer`,
`/strategies`, `/strategies/:id`, `/backtests`, `/backtests/:id`, `/bots`, `/bots/:id`,
`/bots/:id/{start,pause,resume,stop,clone}`, `/trades`, `/positions`, `/providers`,
`/providers/:id`, `/copy-subscriptions`, `/risk-settings`, `/alerts`,
`/alerts/:id/read`, `/alerts/price-rules`, `/analytics/overview`, `/analytics/performance`,
`/market/instruments`, `/market/candles`, `/market/quote`, `/signals`, `/signals/explosive`,
`/signals/detail`.

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
- Full desktop layout — the web build centers the mobile-first UI in a fixed-width
  column rather than re-flowing it into a true multi-column desktop dashboard.
- SEC Form 4 insider-trading signal — genuinely free, structured, government data (no
  scraping, no paid API), but a distinct chunk of work (ticker→CIK mapping, XML parsing)
  deliberately left out of this pass. Good next addition to Market Intelligence.
- Options gamma exposure, short interest, credit ratings, ETF/index flows, and real ESG
  controversy scores are intentionally not implemented — no free, reliable API exists for
  any of them (see "Market Intelligence" above). They'd require paid institutional data
  providers.

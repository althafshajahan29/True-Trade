import { createApp } from './app';
import { config } from './config';
import { getDb } from './db/connection';
import { tickAllRunningBots } from './engines/paperTrading.engine';
import { tickCopySubscriptions } from './services/copyTrading.service';
import { signalService } from './services/signal.service';

getDb(); // ensure schema is created before serving traffic

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Right Trade API listening on http://localhost:${config.port}`);
  if (!config.newsApiKey) {
    // eslint-disable-next-line no-console
    console.log('FINNHUB_API_KEY not set — Market Intelligence will run on technical + explosive-demand factors only (no news sentiment).');
  }
});

setInterval(() => {
  try {
    tickAllRunningBots();
    tickCopySubscriptions();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Bot tick loop error:', err);
  }
}, config.botTickIntervalMs);

// Market Intelligence: refresh technical/explosive/news signal scores for
// every supported instrument on a slower interval than the bot tick loop —
// this is the part that (optionally) calls an external news API, so it's
// deliberately not run on every bot tick.
signalService.refreshAll().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Initial signal refresh failed:', err);
});
setInterval(() => {
  signalService.refreshAll().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Signal refresh loop error:', err);
  });
}, config.signalRefreshIntervalMs);

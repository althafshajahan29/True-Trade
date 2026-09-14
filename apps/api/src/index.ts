import { createApp } from './app';
import { config } from './config';
import { getDb } from './db/connection';
import { tickAllRunningBots } from './engines/paperTrading.engine';
import { tickCopySubscriptions } from './services/copyTrading.service';

getDb(); // ensure schema is created before serving traffic

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Right Trade API listening on http://localhost:${config.port}`);
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

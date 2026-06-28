import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { attachWebSocket } from './realtime/wsServer.js';
import { tickMarket } from './services/market.js';
import { ensureInstruments } from './bootstrap.js';

const app = createApp();
const server = createServer(app);
attachWebSocket(server);

async function start() {
  // Auto-seed the instruments if the database is empty (one-step deploy).
  await ensureInstruments().catch((err) => console.error('Bootstrap failed:', err));

  server.listen(config.port, () => {
    console.log(`InvestPals API listening on port ${config.port} (WS: /ws)`);
  });

  // Market loop: advances prices + periodically generates news and broadcasts live.
  // In production it starts automatically (15s); locally only if you set MARKET_TICK_MS.
  const tickMs = Number(process.env.MARKET_TICK_MS ?? (config.isProd ? 15000 : 0));
  if (tickMs > 0) {
    let tick = 1;
    setInterval(() => {
      tickMarket(tick++).catch((err) => console.error('Market tick error:', err));
    }, tickMs);
    console.log(`Market loop active: every ${tickMs}ms.`);
  }
}

start();

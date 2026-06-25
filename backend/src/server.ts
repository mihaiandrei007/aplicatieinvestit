import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { attachWebSocket } from './realtime/wsServer.js';
import { tickMarket } from './services/market.js';

const app = createApp();
const server = createServer(app);
attachWebSocket(server);

server.listen(config.port, () => {
  console.log(`InvestPals API ascultă pe http://localhost:${config.port} (WS: /ws)`);
});

// Loop de piață opțional: avansează prețurile periodic și difuzează în timp real.
// Activează cu MARKET_TICK_MS (ex. 15000 pentru o dată la 15s).
const tickMs = Number(process.env.MARKET_TICK_MS ?? 0);
if (tickMs > 0) {
  let tick = 1;
  setInterval(() => {
    tickMarket(tick++).catch((err) => console.error('Eroare la tick de piață:', err));
  }, tickMs);
  console.log(`Loop de piață activ: la fiecare ${tickMs}ms.`);
}

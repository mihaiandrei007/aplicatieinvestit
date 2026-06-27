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
  // Auto-populează instrumentele dacă baza e goală (deploy într-un pas).
  await ensureInstruments().catch((err) => console.error('Bootstrap eșuat:', err));

  server.listen(config.port, () => {
    console.log(`InvestPals API ascultă pe portul ${config.port} (WS: /ws)`);
  });

  // Loop de piață: avansează prețurile + generează știri periodic și difuzează live.
  // În producție pornește automat (15s); local doar dacă setezi MARKET_TICK_MS.
  const tickMs = Number(process.env.MARKET_TICK_MS ?? (config.isProd ? 15000 : 0));
  if (tickMs > 0) {
    let tick = 1;
    setInterval(() => {
      tickMarket(tick++).catch((err) => console.error('Eroare la tick de piață:', err));
    }, tickMs);
    console.log(`Loop de piață activ: la fiecare ${tickMs}ms.`);
  }
}

start();

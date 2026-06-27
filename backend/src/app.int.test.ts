/**
 * Teste de integrare pe stratul HTTP (necesită DATABASE_URL + migrări aplicate).
 * Rulează cu `npm run test:integration`. Folosesc email-uri unice ca să nu depindă de starea DB.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { ensureInstruments } from './bootstrap.js';
import { tickMarket } from './services/market.js';

const app = createApp();
let n = 0;
const uniqueEmail = () => `int_${Date.now()}_${n++}@test.ro`;

async function newUser(): Promise<string> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: uniqueEmail(), password: 'parola123', displayName: 'IntTest' });
  expect(res.status).toBe(201);
  return res.body.token;
}

beforeAll(async () => {
  await ensureInstruments();
});

describe('auth', () => {
  it('înregistrare → token + buget de start', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: uniqueEmail(), password: 'parola123', displayName: 'Ana' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.cash).toBe(10000);
  });

  it('login cu parolă greșită → 401', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send({ email, password: 'parola123', displayName: 'X' });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'gresit' });
    expect(res.status).toBe(401);
  });

  it('rută protejată fără token → 401', async () => {
    expect((await request(app).get('/api/portfolio')).status).toBe(401);
  });
});

describe('trade', () => {
  it('cumpărare scade numerarul și apare în dețineri', async () => {
    const token = await newUser();
    const buy = await request(app)
      .post('/api/portfolio/trade')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'AAPL', side: 'BUY', quantity: 5 });
    expect(buy.status).toBe(201);
    expect(buy.body.cash).toBeLessThan(10000);

    const pf = await request(app).get('/api/portfolio').set('Authorization', `Bearer ${token}`);
    expect(pf.body.holdings.some((h: { symbol: string }) => h.symbol === 'AAPL')).toBe(true);
  });

  it('vânzare descoperită → 400', async () => {
    const token = await newUser();
    const res = await request(app)
      .post('/api/portfolio/trade')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'AAPL', side: 'SELL', quantity: 999 });
    expect(res.status).toBe(400);
  });
});

describe('predicție', () => {
  it('plasează și se rezolvă la tick', async () => {
    const token = await newUser();
    const place = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'NVDA', direction: 'UP', stake: 100 });
    expect(place.status).toBe(201);

    await tickMarket(999);

    const list = await request(app).get('/api/predictions').set('Authorization', `Bearer ${token}`);
    expect(['WON', 'LOST']).toContain(list.body.predictions[0].status);
  });

  it('miză peste buget → 400', async () => {
    const token = await newUser();
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'NVDA', direction: 'UP', stake: 999999 });
    expect(res.status).toBe(400);
  });
});

describe('watchlist + daily', () => {
  it('watchlist toggle', async () => {
    const token = await newUser();
    const add = await request(app).post('/api/watchlist').set('Authorization', `Bearer ${token}`).send({ symbol: 'TSLA' });
    expect(add.body.watching).toBe(true);
    const list = await request(app).get('/api/watchlist').set('Authorization', `Bearer ${token}`);
    expect(list.body.symbols).toContain('TSLA');
  });

  it('provocarea zilei: vot unic', async () => {
    const token = await newUser();
    const day = await request(app).get('/api/daily').set('Authorization', `Bearer ${token}`);
    expect(day.body.symbol).toBeTruthy();
    const vote = await request(app).post('/api/daily').set('Authorization', `Bearer ${token}`).send({ direction: 'UP' });
    expect(vote.status).toBe(201);
    const again = await request(app).post('/api/daily').set('Authorization', `Bearer ${token}`).send({ direction: 'DOWN' });
    expect(again.status).toBe(400);
  });
});

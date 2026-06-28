import { Router } from 'express';
import { prisma } from '../db.js';
import { config, isOwnerEmail } from '../config.js';
import { asyncHandler, forbidden } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';

/** Shared signup row shape for both the web page and the in-app API. */
async function fetchSignups() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      displayName: true,
      email: true,
      createdAt: true,
      cash: true,
      currentStreak: true,
      _count: { select: { transactions: true, predictions: true } },
    },
  });
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

// ---- Web page (opened in a browser; protected by a secret key) ----------
// URL: /admin?key=YOUR_ADMIN_KEY. Disabled (401) when ADMIN_KEY is unset.
export const adminRouter = Router();

adminRouter.get('/', async (req, res) => {
  const key = typeof req.query.key === 'string' ? req.query.key : '';
  if (!config.adminKey || key !== config.adminKey) {
    res.status(401).type('html').send(
      `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">
       <body style="background:#0A0B0D;color:#E8EAED;font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:40px">
       <h2>Unauthorized</h2><p style="color:#9aa0a6">Add <code>?key=YOUR_KEY</code> to the URL.</p></body>`,
    );
    return;
  }

  const users = await fetchSignups();
  const rows = users
    .map((u, i) => {
      const joined = new Date(u.createdAt).toISOString().slice(0, 16).replace('T', ' ');
      return `<tr>
        <td class="muted">${i + 1}</td>
        <td><b>${esc(u.displayName)}</b></td>
        <td class="muted">${esc(u.email)}</td>
        <td class="mono">${joined}</td>
        <td class="mono r">${u._count.transactions}</td>
        <td class="mono r">${u._count.predictions}</td>
        <td class="mono r">${Math.round(u.cash).toLocaleString('en-US')}</td>
        <td class="mono r">${u.currentStreak}</td>
      </tr>`;
    })
    .join('');

  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1"><title>Tickr · users</title>
  <style>
    body{margin:0;background:#0A0B0D;color:#E8EAED;font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:18px}
    h1{font-size:20px;margin:0 0 2px;font-weight:800}
    .sub{color:#6b7178;font-size:13px;margin-bottom:16px}
    .wrap{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{padding:9px 8px;border-bottom:1px solid #1c1f24;text-align:left;white-space:nowrap}
    th{color:#6b7178;font-size:10px;text-transform:uppercase;letter-spacing:1px}
    .muted{color:#9aa0a6}
    .mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,Menlo,monospace}
    .r{text-align:right}.lime{color:#C8FA4B}
  </style></head>
  <body>
    <h1><span class="lime">Tickr</span> · users</h1>
    <div class="sub">${users.length} account${users.length === 1 ? '' : 's'} · newest first · times in UTC</div>
    <div class="wrap"><table>
      <tr><th>#</th><th>Name</th><th>Email</th><th>Joined</th><th>Trades</th><th>Bets</th><th>Cash</th><th>Streak</th></tr>
      ${rows || '<tr><td colspan="8" class="muted">No accounts yet.</td></tr>'}
    </table></div>
  </body></html>`);
});

// ---- In-app API (owner account only; JWT-protected) ---------------------
// Used by the mobile Admin screen. Restricted to the user whose email == OWNER_EMAIL.
export const adminApiRouter = Router();

adminApiRouter.get(
  '/admin/users',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, select: { email: true } });
    if (!isOwnerEmail(me.email)) throw forbidden('Admins only.');

    const users = await fetchSignups();
    res.json({
      users: users.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        createdAt: u.createdAt,
        cash: u.cash,
        currentStreak: u.currentStreak,
        trades: u._count.transactions,
        predictions: u._count.predictions,
      })),
    });
  }),
);

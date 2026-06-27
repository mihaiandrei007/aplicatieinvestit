import { writeFileSync } from 'node:fs';

const CSS = `
:root{
  --bg:#0B1020; --bg2:#121A2E; --card:#16203A; --cardAlt:#1E2A47;
  --text:#EAF0FB; --muted:#8A97B1; --primary:#5B8CFF; --violet:#7C5CFF;
  --green:#2BD67B; --red:#FF5C6C; --gold:#FFCF5C; --border:#26324F;
}
*{margin:0;padding:0;box-sizing:border-box;font-family:'DejaVu Sans','Liberation Sans','Noto Color Emoji',sans-serif;letter-spacing:normal;}
html,body{margin:0;padding:0;height:844px;overflow:hidden;background:#05070d;}
.phone{width:390px;height:844px;background:linear-gradient(180deg,#0B1020 0%,#0E1730 100%);
  color:var(--text);position:relative;overflow:hidden;}
.status{position:absolute;top:0;left:0;right:0;height:46px;display:flex;justify-content:space-between;align-items:center;padding:14px 22px 6px;font-size:14px;font-weight:600;color:var(--text);}
.status .dots{letter-spacing:2px;opacity:.9;font-size:13px;}
.body{position:absolute;top:46px;left:0;right:0;bottom:80px;padding:8px 18px;display:flex;flex-direction:column;gap:14px;overflow:hidden;}
.body.noNav{bottom:0;}
.h1{font-size:27px;font-weight:800;letter-spacing:.2px;}
.h2{font-size:15px;color:var(--muted);}
.sec{font-size:14px;color:var(--muted);font-weight:600;margin-top:2px;}
.card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:16px;
  box-shadow:0 8px 22px rgba(0,0,0,.35);}
.card.accent{border-color:rgba(91,140,255,.5);}
.row{display:flex;align-items:center;justify-content:space-between;}
.muted{color:var(--muted);}.sm{font-size:12px;}.b{font-weight:700;}.b8{font-weight:800;}
.green{color:var(--green);}.red{color:var(--red);}.gold{color:var(--gold);}.primary{color:var(--primary);}
.pill{border-radius:999px;padding:4px 11px;font-size:12px;font-weight:700;display:inline-block;}
.btn{border-radius:14px;padding:14px;text-align:center;font-weight:700;font-size:15px;}
.btn.primary{background:var(--primary);color:#08101f;}
.btn.green{background:var(--green);color:#08101f;}
.btn.red{background:var(--red);color:#08101f;}
.btn.ghost{background:transparent;border:1px solid var(--border);color:var(--text);}
.input{background:var(--cardAlt);border:1px solid var(--border);border-radius:12px;padding:13px;color:var(--text);font-size:15px;}
.input.ph{color:var(--muted);}
.avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;border:1px solid;}
.nav{position:absolute;bottom:0;left:0;right:0;height:80px;display:flex;justify-content:space-around;align-items:flex-start;padding:12px 8px 0;background:var(--card);border-top:1px solid var(--border);}
.nav .item{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;color:var(--muted);}
.nav .item.active{color:var(--primary);}
.nav .ic{font-size:20px;}
.hero{background:linear-gradient(135deg,#5B8CFF 0%,#7C5CFF 100%);border:none;border-radius:22px;padding:18px;
  box-shadow:0 12px 30px rgba(91,140,255,.35);}
.hero .big{font-size:38px;font-weight:800;color:#fff;letter-spacing:.5px;}
.tabs{display:flex;gap:8px;}
.tab{flex:1;text-align:center;padding:9px;border-radius:12px;font-size:12px;font-weight:700;background:var(--card);border:1px solid var(--border);color:var(--text);}
.tab.active{background:var(--primary);color:#08101f;border-color:var(--primary);}
.prog{height:10px;border-radius:999px;background:var(--cardAlt);overflow:hidden;}
.prog>div{height:10px;border-radius:999px;background:var(--green);}
.badge{width:48%;border-radius:14px;padding:12px;border:1px solid var(--border);background:var(--card);}
.badge.on{border-color:var(--primary);background:var(--cardAlt);}
.badge.off{opacity:.45;}
.dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
`;

function page(body){return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="phone">${body}</div></body></html>`;}
const status = `<div class="status"><span>9:41</span><span class="dots">● ● ● &nbsp;100%</span></div>`;

function nav(active){
  const items=[['Portofoliu','💼'],['Piață','📈'],['Grupuri','👥'],['Academie','🎓']];
  return `<div class="nav">${items.map(([l,i])=>`<div class="item ${l===active?'active':''}"><span class="ic">${i}</span>${l}</div>`).join('')}</div>`;
}
function avatar(init,color){return `<div class="avatar" style="background:${color}33;border-color:${color};color:${color}">${init}</div>`;}

// chart svg (upward)
const chart = `<svg width="100%" height="86" viewBox="0 0 300 86" preserveAspectRatio="none">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>
<polygon points="0,70 30,66 60,72 90,55 120,58 150,44 180,48 210,32 240,38 270,20 300,14 300,86 0,86" fill="url(#g)"/>
<polyline points="0,70 30,66 60,72 90,55 120,58 150,44 180,48 210,32 240,38 270,20 300,14" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;

const screens = {};

// 1) LOGIN
screens.login = page(`${status}
<div class="body noNav" style="justify-content:center;gap:16px;">
  <div style="text-align:center;margin-bottom:4px;">
    <div style="font-size:54px;">📈</div>
    <div class="h1" style="font-size:34px;">InvestPals</div>
    <div class="h2" style="margin-top:6px;">Investiții virtuale între prieteni.<br>Zero risc real.</div>
  </div>
  <div class="card" style="gap:14px;display:flex;flex-direction:column;">
    <div><div class="sm muted" style="margin-bottom:6px;">Email</div><div class="input ph">email@exemplu.ro</div></div>
    <div><div class="sm muted" style="margin-bottom:6px;">Parolă</div><div class="input">••••••••</div></div>
    <div class="btn primary">Intră în cont</div>
  </div>
  <div class="card" style="gap:12px;display:flex;flex-direction:column;">
    <div class="sm muted" style="text-align:center;">sau continuă cu</div>
    <div class="btn ghost">🔵&nbsp; Continuă cu Google</div>
    <div class="btn ghost"> &nbsp; Continuă cu Apple</div>
  </div>
  <div class="sm primary" style="text-align:center;">Nu ai cont? Înregistrează-te</div>
</div>`);

// 2) PORTFOLIO
screens.portfolio = page(`${status}
<div class="body">
  <div class="row"><div class="h1">Salut, Ana 👋</div>${avatar('AP','#5B8CFF')}</div>
  <div class="card accent">
    <div class="row">
      <div><div class="b" style="font-size:16px;">🔥 Streak: 7 zile</div>
      <div class="sm muted" style="margin-top:3px;">🎟️ 14 credite · ❄️ 1 freeze</div></div>
      <div class="btn primary" style="padding:11px 16px;font-size:13px;">Check-in ✓</div>
    </div>
  </div>
  <div class="hero">
    <div style="color:#dfe8ff;font-size:13px;font-weight:600;">Capital total (equity)</div>
    <div class="big">112,340.50</div>
    <div style="display:flex;gap:8px;align-items:center;margin:4px 0 8px;">
      <span class="pill" style="background:rgba(255,255,255,.22);color:#fff;">▲ +12.34%</span>
      <span style="color:#e7edff;font-size:12px;">randament</span>
    </div>
    ${chart}
    <div class="row" style="margin-top:10px;">
      <div><div style="color:#dbe5ff;font-size:11px;">Numerar</div><div class="b" style="color:#fff;">38,120.00</div></div>
      <div><div style="color:#dbe5ff;font-size:11px;">P&L nerealizat</div><div class="b" style="color:#fff;">+6,210.50</div></div>
    </div>
  </div>
  <div class="sec">Dețineri</div>
  ${[['AAPL','100 buc · cost 178.42','18,935.00','+1,093.00','green'],
     ['NVDA','60 buc · cost 120.10','7,932.00','+726.00','green'],
     ['TSLA','10 buc · cost 250.00','2,310.60','-189.40','red']]
    .map(([s,sub,val,pnl,c])=>`<div class="card" style="padding:13px 16px;">
      <div class="row"><div class="b" style="font-size:16px;">${s}</div><div class="b">${val}</div></div>
      <div class="row" style="margin-top:3px;"><div class="sm muted">${sub}</div><div class="sm ${c}">${pnl}</div></div>
    </div>`).join('')}
</div>
${nav('Portofoliu')}`);

// 3) MARKET
function instr(sym,name,price,chg,c){return `<div class="card" style="padding:13px 16px;">
  <div class="row"><div><div class="b" style="font-size:16px;">${sym}</div><div class="sm muted">${name}</div></div>
  <div style="text-align:right;"><div class="b">${price}</div><div class="sm ${c}">${chg}</div></div></div></div>`;}
screens.market = page(`${status}
<div class="body">
  <div class="h1">Piață</div>
  <div class="h2">Prețuri simulate (live). 🎟️ 14 credite de tranzacționare.</div>
  ${instr('AAPL','Apple Inc.','189.35','▲ +0.52%','green')}
  ${instr('MSFT','Microsoft Corp.','417.89','▼ -0.27%','red')}
  ${instr('NVDA','NVIDIA Corp.','132.20','▲ +2.10%','green')}
  <div class="card accent" style="gap:12px;display:flex;flex-direction:column;">
    <div class="sec" style="color:var(--text);">Tranzacționează AAPL la 189.35</div>
    <div class="row"><div class="sm muted">Cantitate</div></div>
    <div class="input">10</div>
    <div style="display:flex;gap:10px;"><div class="btn green" style="flex:1;">Cumpără</div><div class="btn red" style="flex:1;">Vinde</div></div>
    <div class="sm muted">Care e părerea ta?</div>
    <div style="display:flex;gap:10px;">
      <div class="btn green" style="flex:1;">📈 Bullish</div>
      <div class="btn ghost" style="flex:1;color:var(--red);border-color:var(--red);">📉 Bearish</div>
    </div>
  </div>
</div>
${nav('Piață')}`);

// 4) GROUP LEADERBOARD
function lbRow(medal,name,init,color,equity,roi,c,me){return `<div class="card ${me?'accent':''}" style="padding:12px 14px;">
  <div style="display:flex;align-items:center;gap:12px;">
    <div class="b8 gold" style="width:26px;text-align:center;font-size:18px;">${medal}</div>
    ${avatar(init,color)}
    <div style="flex:1;"><div class="b" style="font-size:15px;">${name}</div><div class="sm muted">${equity}</div></div>
    <div class="b8 ${c}" style="font-size:16px;">${roi}</div>
  </div></div>`;}
screens.group = page(`${status}
<div class="body">
  <div class="h1" style="font-size:22px;">Prietenii de la liceu</div>
  <div class="tabs"><div class="tab active">Clasament</div><div class="tab">Feed</div><div class="tab">Turnee</div><div class="tab">Sentiment</div></div>
  ${lbRow('🥇','Bogdan','BP','#7C5CFF','130,210.00','+18.20%','green',false)}
  ${lbRow('🥈','Ana · tu','AP','#5B8CFF','112,340.50','+12.34%','green',true)}
  ${lbRow('🥉','Cristi','CM','#2BD67B','95,900.00','-4.10%','red',false)}
  ${lbRow('4','Dana','DI','#FFCF5C','101,250.00','+1.25%','green',false)}
  ${lbRow('5','Mihai','MA','#5B8CFF','88,430.00','-11.57%','red',false)}
</div>
${nav('Grupuri')}`);

// 5) FEED
function feed(av,color,msg,r1,r2,r3,c){return `<div class="card" style="gap:8px;display:flex;flex-direction:column;">
  <div style="display:flex;gap:10px;align-items:center;">${avatar(av,color)}<div class="b" style="font-size:14px;flex:1;">${msg}</div></div>
  <div style="display:flex;gap:16px;align-items:center;padding-left:2px;">
    <span class="sm ${r1?'primary':'muted'}">👍 ${r1}</span><span class="sm ${r2?'primary':'muted'}">🔥 ${r2}</span>
    <span class="sm muted">🚀 ${r3}</span><span class="sm muted" style="margin-left:auto;">💬 ${c}</span>
  </div></div>`;}
screens.feed = page(`${status}
<div class="body">
  <div class="h1" style="font-size:22px;">Prietenii de la liceu</div>
  <div class="tabs"><div class="tab">Clasament</div><div class="tab active">Feed</div><div class="tab">Turnee</div><div class="tab">Sentiment</div></div>
  ${feed('BP','#7C5CFF','<b>Bogdan</b> a cumpărat 30 NVDA la 132.20',2,3,1,4)}
  ${feed('AP','#5B8CFF','<b>Ana</b> a vândut 10 TSLA la 231.06',1,0,0,2)}
  ${feed('CM','#2BD67B','<b>Cristi</b> s-a alăturat grupului',0,1,0,0)}
  ${feed('DI','#FFCF5C','<b>Dana</b> a primit insigna „Diversificat"',4,2,0,1)}
</div>
${nav('Grupuri')}`);

// 6) ACADEMY
screens.academy = page(`${status}
<div class="body">
  <div class="h1">Academie 🎓</div>
  <div class="card accent">
    <div class="row"><div class="sec" style="color:var(--text);">Progresul tău</div><div class="b8" style="font-size:18px;">40%</div></div>
    <div class="prog" style="margin-top:10px;"><div style="width:40%;"></div></div>
  </div>
  <div class="card"><div class="b" style="font-size:16px;">✅ Ce este o acțiune</div><div class="sm muted" style="margin-top:3px;">Înțelegi ce cumperi când cumperi o acțiune.</div>
    <div class="btn ghost" style="margin-top:10px;color:var(--primary);border-color:var(--primary);">Dă quiz-ul</div></div>
  <div class="card"><div class="b" style="font-size:16px;">Diversificarea</div><div class="sm muted" style="margin-top:3px;">De ce „nu pune toate ouăle într-un coș".</div>
    <div style="display:flex;gap:10px;margin-top:10px;"><div class="btn ghost" style="flex:1;color:var(--primary);border-color:var(--primary);">Dă quiz-ul</div><div class="btn primary" style="flex:1;">Finalizează</div></div></div>
  <div class="sec">Insigne</div>
  <div style="display:flex;flex-wrap:wrap;gap:10px;">
    <div class="badge on"><div class="b">🏅 Primul pas</div><div class="sm muted">Prima ta tranzacție.</div></div>
    <div class="badge on"><div class="b">🏅 Diversificat</div><div class="sm muted">5 simboluri diferite.</div></div>
    <div class="badge off"><div class="b">🔒 Două cifre</div><div class="sm muted">Peste +10% randament.</div></div>
    <div class="badge off"><div class="b">🔒 Profit realizat</div><div class="sm muted">Închizi pe profit.</div></div>
  </div>
</div>
${nav('Academie')}`);

for (const [name, html] of Object.entries(screens)) {
  writeFileSync(`/tmp/claude-0/-home-user-aplicatieinvestit/7566bdb7-96e0-54f7-9850-8457803354af/scratchpad/screen-${name}.html`, html);
}
console.log('Generated:', Object.keys(screens).join(', '));

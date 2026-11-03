// كويزاتي: حل فردي بترتيب، لعب لايف على طريقة كاهوت، ولوحة المدرّس.
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const $app = document.getElementById('app');

let store, SEED;
try {
  ({ store } = await import('./store.js'));
  ({ SEED } = await import('./seed.js'));
} catch (e) {
  $app.innerHTML = `<div class="card"><h2>تعذر الاتصال بـ Firebase</h2>
    <p>راجع إعدادات <b>config.js</b>، وتأكد من تفعيل Anonymous و Email/Password في Authentication.</p>
    <p class="hint" dir="ltr">${esc(e && (e.code || e.message) || e)}</p></div>`;
  throw e;
}

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
const T = {
  ar: { dir: 'rtl', letters: LETTERS, exit: 'خروج', next: 'السؤال التالي', result: 'عرض النتيجة', ok: 'أحسنت، إجابة صحيحة!', bad: 'إجابة خاطئة، الصحيحة باللون الأخضر.',
    tip: 'اضغط على أي إجابة أخرى لتعرف لماذا هي خاطئة.', yok: 'إجابتك صحيحة. السبب:', ybad: 'إجابتك خاطئة. السبب:', right: 'هذه هي الصحيحة. السبب:', wrong: 'خاطئة. السبب:',
    dok: 'هذه هي الإجابة الصحيحة.', dbad: 'هذه الإجابة غير صحيحة.', correctIs: 'الإجابة الصحيحة: ',
    m: ['ممتاز، كل الإجابات صحيحة!', 'جيد جدًا، استمر.', 'مقبول، راجع الأسئلة الخاطئة.', 'تحتاج مراجعة، حاول مرة أخرى.'] },
  en: { dir: 'ltr', letters: ['A', 'B', 'C', 'D', 'E', 'F'], exit: 'Exit', next: 'Next question', result: 'See results', ok: 'Correct!', bad: 'Incorrect. The right answer is shown in green.',
    tip: 'Tap any other option to see why it is wrong.', yok: 'Your answer is correct. Why:', ybad: 'Your answer is wrong. Why:', right: 'The correct answer. Why:', wrong: 'Why it is wrong:',
    dok: 'This is the correct answer.', dbad: 'This answer is incorrect.', correctIs: 'Correct answer: ',
    m: ['Excellent, all correct!', 'Very good, keep going.', 'Fair. Review the ones you missed.', 'Needs revision. Try again.'] }
};
const NAME_KEY = 'qz-name';
const rid = (n = 8) => Math.random().toString(36).slice(2, 2 + n);
const clone = o => JSON.parse(JSON.stringify(o));
const fmtTime = ms => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const langOf = z => (z && z.lang === 'en' ? 'en' : 'ar');
const cmpScore = (a, b) => (b.score - a.score) || ((a.timeMs || 0) - (b.timeMs || 0)) || ((a.at || 0) - (b.at || 0));

let S = { view: 'home', quizzes: [], name: localStorage.getItem(NAME_KEY) || '', shuffle: false, err: '', rows: [], installEv: null, confirmDel: null };
let subs = [];
const clearSubs = () => { subs.forEach(f => { try { f(); } catch (e) {} }); subs = []; };
const startTick = fn => { const id = setInterval(fn, 250); subs.push(() => clearInterval(id)); };
function go(view, extra) { clearSubs(); S.err = ''; Object.assign(S, { view }, extra || {}); render(); window.scrollTo(0, 0); }
const views = {};
function render() { (views[S.view] || views.home)(); }
const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'); };

store.watchQuizzes(list => {
  S.quizzes = list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  if (['home', 'quizzes', 'teacher'].includes(S.view) && !typing()) render();
}, e => { S.err = 'تعذر تحميل الكويزات. راجع قواعد Firestore.'; console.error(e); });

const backBar = (title, to = 'home') => `<div class="back"><button class="link" data-act="go" data-v="${to}">‹ رجوع</button><h2>${esc(title)}</h2></div>`;

/* ---------- shared pieces ---------- */
function optsHtml(q, L, o) {
  return q.options.map((op, oi) => {
    let cls = 'opt', why = '';
    const shown = o.reveal && o.reveal.has(oi);
    if (shown) {
      const ok = oi === q.correct, mine = oi === o.mine;
      cls += ok ? ' correct' : ' wrong';
      if (mine) cls += ' chosen';
      const label = mine ? (ok ? L.yok : L.ybad) : (ok ? L.right : L.wrong);
      const txt = (op.e || '').trim() || (ok ? L.dok : L.dbad);
      why = `<div class="why"><b>${label}</b> <span>${esc(txt)}</span></div>`;
    } else if (o.dim) cls += ' dim';
    else if (oi === o.picked) cls += ' picked';
    const mark = shown ? (oi === q.correct ? '✓' : '✗') : L.letters[oi];
    const cnt = o.counts ? `<span class="cnt">${o.counts[oi]}</span>` : '';
    const attrs = o.act ? `data-act="${o.act}" data-oi="${oi}"` : 'disabled';
    return `<button class="${cls}" ${attrs}><div class="line"><span class="letter">${mark}</span><span class="txt">${esc(op.t)}</span>${cnt}</div>${why}</button>`;
  }).join('');
}
function lbHtml(rows, { me, limit = 10, mode = 'solo' } = {}) {
  if (!rows.length) return `<div class="card empty">لا توجد نتائج بعد.</div>`;
  return `<ol class="lb">${rows.slice(0, limit).map((r, i) => `
    <li class="${r.uid === me ? 'me' : ''}"><span class="rk">${i + 1}</span><span class="nm" dir="auto">${esc(r.name)}</span>
    ${mode === 'solo' ? `<span class="tm">${fmtTime(r.timeMs || 0)}</span><span class="sc">${r.score}/${r.total}</span>` : `<span class="sc">${r.score || 0}</span>`}</li>`).join('')}</ol>`;
}

/* ---------- home ---------- */
views.home = () => {
  const ios = /iphone|ipad/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches;
  $app.innerHTML = `
    <header class="top"><div><h1>كويزاتي</h1><p class="sub">اختبر نفسك وقارن ترتيبك بزملائك</p></div>
      ${store.mode === 'demo' ? '<span class="badge">وضع تجريبي: البيانات على جهازك فقط</span>' : ''}</header>
    <div class="tiles">
      <button class="tile" data-act="go" data-v="quizzes"><b>حل كويز</b><span>قارن درجتك النهائية بكل من حلّ الكويز قبلك</span></button>
      <button class="tile alt" data-act="go" data-v="teacher"><b>المدرّس</b><span>إنشاء الكويزات وإدارتها</span></button>
    </div>
    ${S.installEv ? `<button class="btn primary install" data-act="install">ثبّت التطبيق على جهازك</button>` : ''}
    ${ios ? `<p class="hint">على الآيفون والآيباد: زر المشاركة ثم «إضافة إلى الشاشة الرئيسية» لتثبيت التطبيق.</p>` : ''}
    ${S.err ? `<p class="msg err">${esc(S.err)}</p>` : ''}`;
};
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEv = e; if (S.view === 'home') render(); });

/* ---------- quizzes list + solo play ---------- */
views.quizzes = () => {
  const list = S.quizzes.length ? S.quizzes.map(z => `
    <article class="card qitem"><h3 dir="auto">${esc(z.title)}</h3><p class="meta">${z.questions.length} سؤال</p>
      <div class="row"><button class="btn primary small" data-act="start" data-id="${z.id}">ابدأ</button>
      <button class="btn small" data-act="board" data-id="${z.id}">الترتيب</button></div></article>`).join('')
    : `<div class="card empty">لا توجد كويزات بعد.</div>`;
  $app.innerHTML = `${backBar('الكويزات')}
    <label class="hint" for="name">اسمك (يظهر في الترتيب)</label>
    <input class="inp" id="name" maxlength="30" value="${esc(S.name)}" placeholder="اكتب اسمك" autocomplete="nickname">
    <label class="row hint" style="margin-top:8px"><input type="checkbox" id="shuffle" ${S.shuffle ? 'checked' : ''}> خلط ترتيب الإجابات</label>
    <p class="msg err">${esc(S.err)}</p>
    <div class="list">${list}</div>`;
};

function startSolo(z) {
  const qs = z.questions.map(q => {
    const order = q.options.map((_, i) => i).filter(i => q.options[i].t.trim());
    if (S.shuffle) for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return { q: q.q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct) };
  });
  S.play = { quiz: z, lang: langOf(z), qs, i: 0, answered: null, revealed: new Set(), score: 0, log: [], t0: Date.now() };
  go('play');
}
views.play = () => {
  const p = S.play, q = p.qs[p.i], total = p.qs.length, done = p.answered !== null, L = T[p.lang];
  const gotIt = done && p.answered === q.correct;
  $app.innerHTML = `<div dir="${L.dir}">
    <div class="prog"><button class="link" data-act="quit">${L.exit}</button>
      <div class="bar"><i style="width:${((p.i + (done ? 1 : 0)) / total) * 100}%"></i></div><span dir="ltr">${p.i + 1} / ${total}</span></div>
    <div class="question">${esc(q.q)}</div>
    <div class="opts" aria-live="polite">${optsHtml(q, L, { reveal: p.revealed, mine: p.answered, act: 'pick', dim: done })}</div>
    ${done ? `<div class="verdict ${gotIt ? 'ok' : 'bad'}">${gotIt ? L.ok : L.bad}</div><p class="tip">${L.tip}</p>
      <button class="btn primary next" data-act="next">${p.i + 1 < total ? L.next : L.result}</button>` : ''}</div>`;
};
async function finishSolo() {
  const p = S.play, timeMs = Date.now() - p.t0, total = p.qs.length;
  S.result = { quizId: p.quiz.id, title: p.quiz.title, lang: p.lang, score: p.score, total, timeMs };
  go('result', { rows: [] });
  subs.push(store.watchScores(p.quiz.id, rows => { S.rows = rows; if (S.view === 'result') render(); }));
  try {
    const old = await store.getMyScore(p.quiz.id);
    const better = !old || p.score > old.score || (p.score === old.score && timeMs < (old.timeMs || 1e12));
    if (better) await store.submitScore({ quizId: p.quiz.id, name: S.name.trim().slice(0, 30), score: p.score, total, timeMs });
  } catch (e) { console.error(e); S.err = 'تعذر حفظ نتيجتك في الترتيب.'; render(); }
}
views.result = () => {
  const r = S.result, p = S.play, L = T[r.lang], pct = Math.round(r.score / r.total * 100);
  const msg = pct === 100 ? L.m[0] : pct >= 70 ? L.m[1] : pct >= 50 ? L.m[2] : L.m[3];
  const rows = [...S.rows].sort(cmpScore), idx = rows.findIndex(x => x.uid === store.uid);
  $app.innerHTML = `
    <div class="card score"><p class="sub" dir="auto">${esc(r.title)}</p><div class="big" dir="ltr">${r.score} / ${r.total}</div>
      <p style="margin:4px 0 0;font-weight:600">${pct}% | ${esc(msg)} | ${fmtTime(r.timeMs)}</p></div>
    <div class="card rankbox">${idx >= 0 ? `<p class="hint">ترتيبك بين من حلّوا الكويز</p><div class="big">المركز ${idx + 1} من ${rows.length}</div>` : `<p class="hint">جاري حساب ترتيبك…</p>`}</div>
    ${S.err ? `<p class="msg err">${esc(S.err)}</p>` : ''}
    <h3 class="lbt">لوحة الصدارة</h3>${lbHtml(rows, { me: store.uid, limit: 10 })}
    <h3 class="lbt">مراجعة إجاباتك</h3>
    <div dir="${L.dir}"><ul class="rev">${p.log.map((x, i) => `<li class="${x.ok ? 'y' : 'n'}"><span class="ic">${x.ok ? '✓' : '✗'}</span>
      <div>${i + 1}. ${esc(x.q)}<small>${L.correctIs}${esc(x.correct)}</small></div></li>`).join('')}</ul></div>
    <div class="row"><button class="btn primary" data-act="again">إعادة الكويز</button><button class="btn" data-act="go" data-v="home">الرئيسية</button></div>`;
};

views.board = () => {
  const rows = [...S.rows].sort(cmpScore);
  $app.innerHTML = `${backBar('الترتيب', S.boardBack || 'quizzes')}<p class="sub" dir="auto">${esc(S.boardTitle || '')} | ${rows.length} طالب</p>
    ${lbHtml(rows, { me: store.uid, limit: 100 })}`;
};
function openBoard(z, back) {
  go('board', { rows: [], boardTitle: z.title, boardBack: back });
  subs.push(store.watchScores(z.id, rows => { S.rows = rows; if (S.view === 'board') render(); }));
}

/* ---------- live: player ---------- */
views.join = () => {
  $app.innerHTML = `${backBar('انضم للعبة')}
    <label class="hint" for="code">كود اللعبة</label>
    <input class="inp" id="code" inputmode="numeric" maxlength="6" placeholder="123456" style="font-size:28px;text-align:center;letter-spacing:.2em" dir="ltr">
    <label class="hint" for="name" style="display:block;margin-top:10px">اسمك</label>
    <input class="inp" id="name" maxlength="30" value="${esc(S.name)}" placeholder="اكتب اسمك" autocomplete="nickname">
    <p class="msg err">${esc(S.err)}</p>
    <button class="btn primary wide" data-act="joingame">انضم</button>`;
};
function joinGame() {
  const code = (document.getElementById('code').value || '').trim();
  const name = (document.getElementById('name').value || '').trim().slice(0, 30);
  if (!/^\d{6}$/.test(code)) { S.err = 'الكود 6 أرقام.'; render(); return; }
  if (!name) { S.err = 'اكتب اسمك.'; render(); return; }
  S.name = name; localStorage.setItem(NAME_KEY, name);
  clearSubs();
  const L = S.live = { code, game: null, players: [], recv: {}, extra: {} };
  let first = true;
  subs.push(store.watchGame(code, g => {
    if (first) {
      first = false;
      if (!g) { clearSubs(); S.live = null; S.err = 'الكود غير صحيح أو اللعبة انتهت.'; S.view = 'join'; render(); return; }
      store.setPlayer(code, { name, score: 0, answered: -1, choice: -1, ok: false, pts: 0 }).catch(e => { console.error(e); });
      S.view = 'live';
    }
    const prev = L.game; L.game = g;
    if (!g) { clearSubs(); S.live = null; S.err = 'انتهت اللعبة.'; S.view = 'join'; render(); return; }
    if (g.state === 'question' && (!prev || prev.state !== 'question' || prev.qIndex !== g.qIndex)) L.recv[g.qIndex] = Date.now();
    render();
  }));
  subs.push(store.watchPlayers(code, list => { L.players = list; if (S.view === 'live') render(); }));
  startTick(() => {
    const g = L.game; if (S.view !== 'live' || !g || g.state !== 'question') return;
    const el = document.getElementById('tbar'); if (!el) return;
    const lim = g.limit || 20, e = (Date.now() - (L.recv[g.qIndex] || Date.now())) / 1000;
    el.style.width = Math.max(0, 100 - e / lim * 100) + '%';
    const t = document.getElementById('tleft'); if (t) t.textContent = Math.max(0, Math.ceil(lim - e));
  });
}
views.live = () => {
  const L = S.live, g = L.game;
  if (!g) return;
  const lang = langOf(g.quiz), Lx = T[lang], q = g.quiz.questions[g.qIndex];
  const sorted = [...L.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const rank = sorted.findIndex(p => p.uid === store.uid) + 1;
  const me = L.players.find(p => p.uid === store.uid) || { score: 0, answered: -1 };
  const bar = `<div class="livebar"><span>${esc(S.name)}</span><span>${me.score || 0} نقطة${rank ? ` | المركز ${rank} من ${sorted.length}` : ''}</span></div>`;
  let body = '';
  if (g.state === 'lobby') {
    body = `<div class="card center"><h2>انتظر المدرّس يبدأ اللعبة</h2><p class="sub">${L.players.length} لاعب انضموا</p></div>`;
  } else if (g.state === 'question') {
    const answered = me.answered === g.qIndex;
    body = `<div class="timer"><i id="tbar"></i></div><div class="prog"><span dir="ltr">${g.qIndex + 1} / ${g.quiz.questions.length}</span><span id="tleft"></span></div>
      <div dir="${Lx.dir}"><div class="question">${esc(q.q)}</div>
      <div class="opts">${optsHtml(q, Lx, { act: answered ? '' : 'lpick', picked: answered ? me.choice : -1 })}</div></div>
      ${answered ? `<p class="tip center" style="margin-top:12px">تم تسجيل إجابتك. انتظر باقي اللاعبين…</p>` : ''}`;
  } else if (g.state === 'reveal') {
    const answered = me.answered === g.qIndex;
    const set = new Set([q.correct]); if (answered) set.add(me.choice);
    (L.extra[g.qIndex] || []).forEach(i => set.add(i));
    body = `<div class="center"><div class="pts ${answered && me.ok ? 'ok' : 'bad'}">${answered ? (me.ok ? `+${me.pts} نقطة` : 'إجابة خاطئة') : 'لم تجب في الوقت'}</div></div>
      <div dir="${Lx.dir}"><div class="question">${esc(q.q)}</div>
      <div class="opts">${optsHtml(q, Lx, { reveal: set, mine: answered ? me.choice : -1, act: 'lshow', dim: false })}</div></div>
      <p class="tip center" style="margin-top:12px">انتظر السؤال التالي…</p>`;
  } else {
    body = `<div class="card center"><h2>انتهت اللعبة</h2><div class="rankbox" style="border:0"><div class="big">المركز ${rank || '-'} من ${sorted.length}</div>
      <p class="sub">${me.score || 0} نقطة</p></div></div><h3 class="lbt">لوحة الصدارة</h3>${lbHtml(sorted, { me: store.uid, limit: 10, mode: 'live' })}
      <div class="row" style="margin-top:14px"><button class="btn" data-act="leave">الرئيسية</button></div>`;
  }
  $app.innerHTML = bar + body;
};
function livePick(oi) {
  const L = S.live, g = L.game; if (!g || g.state !== 'question') return;
  const q = g.quiz.questions[g.qIndex];
  let me = L.players.find(p => p.uid === store.uid);
  if (!me) { me = { uid: store.uid, name: S.name, score: 0, answered: -1 }; L.players = [...L.players, me]; }
  if (me.answered === g.qIndex) return;
  const lim = (g.limit || 20) * 1000, ms = Date.now() - (L.recv[g.qIndex] || Date.now());
  if (ms > lim + 1500) return;
  const ok = oi === q.correct, pts = ok ? Math.round(1000 - 500 * Math.min(ms, lim) / lim) : 0;
  const patch = { answered: g.qIndex, choice: oi, ok, pts, ms, score: (me.score || 0) + pts };
  L.players = L.players.map(p => p.uid === store.uid ? { ...p, ...patch } : p);
  render();
  store.setPlayer(L.code, patch).catch(e => { console.error(e); });
}

/* ---------- teacher ---------- */
views.teacher = () => {
  if (!store.teacher) {
    $app.innerHTML = `${backBar('دخول المدرّس')}
      <label class="hint" for="email">الإيميل</label><input class="inp" id="email" type="email" dir="ltr" autocomplete="username">
      <label class="hint" for="pw" style="display:block;margin-top:10px">كلمة المرور</label><input class="inp" id="pw" type="password" dir="ltr" autocomplete="current-password">
      ${store.mode === 'demo' ? '<p class="hint">الوضع التجريبي: اكتب أي إيميل وأي كلمة مرور.</p>' : ''}
      <p class="msg err">${esc(S.err)}</p><button class="btn primary wide" data-act="login">دخول</button>`;
    return;
  }
  const list = S.quizzes.length ? S.quizzes.map(z => `
    <article class="card qitem"><h3 dir="auto">${esc(z.title)}</h3><p class="meta">${z.questions.length} سؤال</p>
      <div class="row"><button class="btn small" data-act="tboard" data-id="${z.id}">الترتيب</button>
      <button class="btn small" data-act="edit" data-id="${z.id}">تعديل</button>
      ${S.confirmDel === z.id ? `<button class="btn small danger" data-act="del" data-id="${z.id}">تأكيد الحذف</button>` : `<button class="btn small" data-act="askdel" data-id="${z.id}">حذف</button>`}</div></article>`).join('')
    : `<div class="card empty">لا توجد كويزات بعد. أضف الكويزات الجاهزة أو أنشئ واحدًا.</div>`;
  $app.innerHTML = `${backBar('لوحة المدرّس')}
    <div class="row"><button class="btn primary" data-act="new">+ كويز جديد</button>
      <button class="btn" data-act="seed">إضافة الكويزات الجاهزة</button>
      <button class="btn" data-act="logout">خروج</button></div>
    <p class="msg ${S.err ? 'err' : ''}">${esc(S.err || S.info || '')}</p>
    <div class="list">${list}</div>
    <details><summary class="link">استيراد كويز من كود JSON</summary>
      <textarea class="inp" id="impText" rows="4" placeholder="الصق الكود هنا"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn small" data-act="import">استيراد</button></div></details>`;
};

/* editor */
const blankQ = () => ({ q: '', correct: 0, options: [{ t: '', e: '' }, { t: '', e: '' }, { t: '', e: '' }, { t: '', e: '' }] });
views.edit = () => {
  const d = S.draft;
  const qs = d.questions.map((q, qi) => `
    <section class="card qcard"><div class="qhead"><span class="qnum">سؤال ${qi + 1}</span><button class="link danger" data-act="delq" data-qi="${qi}">حذف السؤال</button></div>
      <textarea class="inp" id="q${qi}" rows="2" dir="auto" data-f="q" data-qi="${qi}" placeholder="اكتب نص السؤال">${esc(q.q)}</textarea>
      <p class="hint">علّم الدائرة بجانب الإجابة الصحيحة، واكتب سبب كون كل إجابة صحيحة أو خاطئة.</p>
      ${q.options.map((o, oi) => `<div class="orow">
        <label class="radio"><input type="radio" name="c${qi}" data-f="correct" data-qi="${qi}" data-oi="${oi}" ${q.correct === oi ? 'checked' : ''}>صحيحة</label>
        <div class="ofields"><input class="inp" dir="auto" id="t${qi}_${oi}" data-f="t" data-qi="${qi}" data-oi="${oi}" value="${esc(o.t)}" placeholder="الإجابة ${LETTERS[oi]}">
          <input class="inp small" dir="auto" id="e${qi}_${oi}" data-f="e" data-qi="${qi}" data-oi="${oi}" value="${esc(o.e)}" placeholder="لماذا هي صحيحة أو خاطئة؟"></div>
        <button class="xbtn" aria-label="حذف الإجابة" data-act="delo" data-qi="${qi}" data-oi="${oi}">×</button></div>`).join('')}
      ${q.options.length < 6 ? `<div><button class="link" data-act="addo" data-qi="${qi}">+ إضافة إجابة</button></div>` : ''}</section>`).join('');
  $app.innerHTML = `<div class="back"><h2>${d.isNew ? 'كويز جديد' : 'تعديل الكويز'}</h2></div>
    <label class="hint" for="title">عنوان الكويز</label><input class="inp" id="title" dir="auto" value="${esc(d.title)}" placeholder="مثال: مراجعة الوحدة الأولى">
    <label class="hint" for="lang" style="display:block;margin-top:10px">لغة الكويز</label>
    <select class="inp" id="lang"><option value="ar" ${d.lang !== 'en' ? 'selected' : ''}>العربية</option><option value="en" ${d.lang === 'en' ? 'selected' : ''}>English</option></select>
    ${qs}<button class="btn" data-act="addq">+ إضافة سؤال</button>
    <div class="savebar"><button class="btn primary" data-act="save">حفظ الكويز</button><button class="btn" data-act="go" data-v="teacher">رجوع</button>
      <span class="msg ${S.derr ? 'err' : ''}" style="align-self:center">${esc(S.derr || '')}</span></div>`;
};
function validateDraft(d) {
  if (!d.title.trim()) return 'اكتب عنوان الكويز.';
  if (!d.questions.length) return 'أضف سؤالًا واحدًا على الأقل.';
  for (let i = 0; i < d.questions.length; i++) {
    const q = d.questions[i];
    if (!q.q.trim()) return `اكتب نص السؤال ${i + 1}.`;
    if (q.options.filter(o => o.t.trim()).length < 2) return `السؤال ${i + 1} يحتاج إجابتين على الأقل.`;
    if (!q.options[q.correct] || !q.options[q.correct].t.trim()) return `حدد إجابة صحيحة غير فارغة في السؤال ${i + 1}.`;
  }
  return '';
}
function normalizeQuiz(o) {
  if (!o || !o.title || !Array.isArray(o.questions) || !o.questions.length) throw new Error('bad');
  return {
    title: String(o.title), lang: o.lang === 'en' ? 'en' : 'ar',
    questions: o.questions.map(q => ({ q: String(q.q || ''), correct: +q.correct || 0, options: (q.options || []).map(x => ({ t: String(x.t || ''), e: String(x.e || '') })) }))
  };
}

/* ---------- live: host ---------- */
let H = null;
views.host = () => {
  const g = H.game; if (!g) { $app.innerHTML = '<p class="empty">جاري تجهيز اللعبة…</p>'; return; }
  const lang = langOf(g.quiz), Lx = T[lang], n = g.quiz.questions.length, q = g.quiz.questions[g.qIndex];
  const players = H.players, sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  let body = '';
  if (g.state === 'lobby') {
    body = `<div class="card center"><p class="sub">ادخل على التطبيق ثم «انضم للعبة لايف» واكتب الكود</p><div class="code">${esc(H.code)}</div>
      <p class="sub">${players.length} لاعب</p><div class="chips">${players.map(p => `<span class="chip" dir="auto">${esc(p.name)}</span>`).join('')}</div></div>
      <button class="btn primary wide" style="margin-top:14px" data-act="hstart" ${players.length ? '' : 'disabled'}>ابدأ اللعبة</button>`;
  } else if (g.state === 'question') {
    const ans = players.filter(p => p.answered === g.qIndex).length;
    body = `<div class="timer"><i id="tbar"></i></div><div class="prog"><span>سؤال <bdi dir="ltr">${g.qIndex + 1} / ${n}</bdi></span><span><span id="tleft"></span> ثانية</span><span>أجاب <bdi dir="ltr">${ans} / ${players.length}</bdi></span></div>
      <div dir="${Lx.dir}"><div class="question hostq">${esc(q.q)}</div><div class="opts">${optsHtml(q, Lx, {})}</div></div>
      <button class="btn primary wide" style="margin-top:14px" data-act="hreveal">إظهار الإجابة</button>`;
  } else if (g.state === 'reveal') {
    const counts = q.options.map((_, oi) => players.filter(p => p.answered === g.qIndex && p.choice === oi).length);
    body = `<div dir="${Lx.dir}"><div class="question">${esc(q.q)}</div>
      <div class="opts">${optsHtml(q, Lx, { reveal: new Set([q.correct]), mine: -1, counts })}</div></div>
      <h3 class="lbt">الترتيب الحالي</h3>${lbHtml(sorted, { limit: 5, mode: 'live' })}
      <button class="btn primary wide" style="margin-top:14px" data-act="hnext">${g.qIndex + 1 < n ? 'السؤال التالي' : 'إنهاء اللعبة'}</button>`;
  } else {
    body = `<div class="card center"><h2>انتهت اللعبة</h2></div><h3 class="lbt">الترتيب النهائي</h3>${lbHtml(sorted, { limit: 30, mode: 'live' })}
      <button class="btn wide" style="margin-top:14px" data-act="hclose">إغلاق</button>`;
  }
  $app.innerHTML = `<div class="livebar"><span dir="auto">${esc(g.quiz.title)}</span><span>كود: <b dir="ltr">${esc(H.code)}</b></span></div>${body}`;
};
async function startHost(z) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  H = { code, game: null, players: [], qStart: 0, pending: false };
  try {
    await store.createGame(code, { code, quiz: { title: z.title, lang: langOf(z), questions: z.questions }, state: 'lobby', qIndex: -1, limit: 20 });
  } catch (e) { console.error(e); S.err = 'تعذر إنشاء اللعبة. تأكد أنك مسجّل كمدرّس وأن قواعد Firestore منشورة.'; render(); return; }
  go('host');
  subs.push(store.watchGame(code, g => { H.game = g; if (g && g.state !== 'question') H.pending = false; if (S.view === 'host') render(); }));
  subs.push(store.watchPlayers(code, list => { H.players = list; if (S.view === 'host') render(); hostCheck(); }));
  startTick(() => {
    const g = H.game; if (S.view !== 'host' || !g || g.state !== 'question') return;
    const lim = g.limit || 20, e = (Date.now() - H.qStart) / 1000;
    const el = document.getElementById('tbar'); if (el) el.style.width = Math.max(0, 100 - e / lim * 100) + '%';
    const t = document.getElementById('tleft'); if (t) t.textContent = Math.max(0, Math.ceil(lim - e));
    hostCheck();
  });
}
function hostSet(p) { store.updateGame(H.code, p).catch(e => { console.error(e); S.err = 'تعذر تحديث اللعبة.'; }); }
function hostCheck() {
  const g = H && H.game; if (!g || g.state !== 'question' || H.pending) return;
  const n = H.players.length, ans = H.players.filter(p => p.answered === g.qIndex).length;
  if ((Date.now() - H.qStart) / 1000 >= (g.limit || 20) || (n > 0 && ans >= n)) { H.pending = true; hostSet({ state: 'reveal' }); }
}

/* ---------- events ---------- */
$app.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id, oi = +b.dataset.oi, qi = +b.dataset.qi;
  const quiz = () => S.quizzes.find(z => z.id === id);
  switch (act) {
    case 'go': go(b.dataset.v); break;
    case 'install': S.installEv.prompt(); S.installEv = null; render(); break;
    case 'start': {
      if (!S.name.trim()) { S.err = 'اكتب اسمك الأول.'; render(); break; }
      localStorage.setItem(NAME_KEY, S.name.trim()); startSolo(quiz()); break; }
    case 'board': openBoard(quiz(), 'quizzes'); break;
    case 'tboard': openBoard(quiz(), 'teacher'); break;
    case 'pick': {
      const p = S.play, q = p.qs[p.i];
      if (p.answered === null) {
        p.answered = oi; p.revealed.add(oi); p.revealed.add(q.correct);
        const ok = oi === q.correct; if (ok) p.score++;
        p.log.push({ q: q.q, ok, correct: q.options[q.correct].t });
      } else p.revealed.add(oi);
      render(); break; }
    case 'next': {
      const p = S.play;
      if (p.i + 1 < p.qs.length) { p.i++; p.answered = null; p.revealed = new Set(); render(); window.scrollTo(0, 0); } else finishSolo();
      break; }
    case 'again': startSolo(S.quizzes.find(z => z.id === S.play.quiz.id) || S.play.quiz); break;
    case 'quit': go('quizzes'); break;
    case 'joingame': joinGame(); break;
    case 'lpick': livePick(oi); break;
    case 'lshow': {
      const L = S.live, g = L.game; (L.extra[g.qIndex] = L.extra[g.qIndex] || []).push(oi); render(); break; }
    case 'leave': clearSubs(); S.live = null; go('home'); break;

    case 'login': {
      const em = document.getElementById('email').value.trim(), pw = document.getElementById('pw').value;
      try { await store.signIn(em, pw); S.err = ''; render(); } catch (err) { S.err = 'الإيميل أو كلمة المرور غير صحيحة.'; render(); }
      break; }
    case 'logout': await store.signOut(); go('home'); break;
    case 'new': S.draft = { id: rid(10), title: '', lang: 'ar', questions: [blankQ()], isNew: true }; S.derr = ''; go('edit', { draft: S.draft, derr: '' }); break;
    case 'edit': go('edit', { draft: clone(quiz()), derr: '' }); break;
    case 'askdel': S.confirmDel = id; render(); break;
    case 'del': S.confirmDel = null; try { await store.deleteQuiz(id); } catch (err) { S.err = 'تعذر الحذف.'; } render(); break;
    case 'seed': {
      try { for (const z of SEED) await store.saveQuiz(z); S.err = ''; S.info = 'تمت إضافة الكويزات الجاهزة.'; } catch (err) { console.error(err); S.err = 'تعذر الحفظ. تأكد أن قواعد Firestore منشورة وأنك مسجّل كمدرّس.'; }
      render(); break; }
    case 'import': {
      try {
        const z = normalizeQuiz(JSON.parse(document.getElementById('impText').value));
        await store.saveQuiz({ id: rid(10), ...z }); S.err = ''; S.info = 'تم الاستيراد.';
      } catch (err) { S.err = 'الكود غير صالح.'; }
      render(); break; }
    case 'addq': S.draft.questions.push(blankQ()); render(); break;
    case 'delq': S.draft.questions.splice(qi, 1); render(); break;
    case 'addo': S.draft.questions[qi].options.push({ t: '', e: '' }); render(); break;
    case 'delo': {
      const q = S.draft.questions[qi];
      if (q.options.length <= 2) { S.derr = 'يلزم إجابتان على الأقل.'; render(); break; }
      q.options.splice(oi, 1);
      if (q.correct === oi) q.correct = 0; else if (q.correct > oi) q.correct--;
      S.derr = ''; render(); break; }
    case 'save': {
      S.derr = validateDraft(S.draft);
      if (S.derr) { render(); break; }
      const out = clone(S.draft); delete out.isNew;
      out.questions.forEach(q => {
        const keep = q.options.map((_, i) => i).filter(i => q.options[i].t.trim());
        q.correct = keep.indexOf(q.correct); q.options = keep.map(i => q.options[i]);
      });
      try { await store.saveQuiz(out); go('teacher'); } catch (err) { console.error(err); S.derr = 'تعذر الحفظ. تأكد من الصلاحيات.'; render(); }
      break; }
    case 'host': startHost(quiz()); break;
    case 'hstart': H.qStart = Date.now(); hostSet({ state: 'question', qIndex: 0 }); break;
    case 'hreveal': if (!H.pending) { H.pending = true; hostSet({ state: 'reveal' }); } break;
    case 'hnext': {
      const g = H.game;
      if (g.qIndex + 1 < g.quiz.questions.length) { H.qStart = Date.now(); hostSet({ state: 'question', qIndex: g.qIndex + 1 }); } else hostSet({ state: 'end' });
      break; }
    case 'hclose': H = null; go('teacher'); break;
  }
});
$app.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'name') { S.name = t.value; localStorage.setItem(NAME_KEY, t.value.trim()); return; }
  if (t.id === 'shuffle') { S.shuffle = t.checked; return; }
  if (S.view !== 'edit' || !S.draft) return;
  if (t.id === 'title') { S.draft.title = t.value; return; }
  if (t.id === 'lang') { S.draft.lang = t.value; return; }
  const f = t.dataset.f; if (!f) return;
  const q = S.draft.questions[+t.dataset.qi], oi = +t.dataset.oi;
  if (f === 'q') q.q = t.value; else if (f === 'correct') q.correct = oi; else q.options[oi][f] = t.value;
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
render();

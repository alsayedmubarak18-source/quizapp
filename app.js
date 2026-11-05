// كويزاتي: حل فردي بترتيب، لعب لايف على طريقة كاهوت، ولوحة المدرّس.
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const $app = document.getElementById('app');

let store, CURRICULUM, GAMES, LINKS, INSTRUCTOR, PG;
try {
  ({ store } = await import('./store.js'));
  ({ CURRICULUM, GAMES, LINKS } = await import('./curriculum.js'));
  ({ INSTRUCTOR } = await import('./instructor.js'));
  PG = await import('./progress.js');
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

const PROFILE = PG.getProfile();
let S = { view: 'home', quizzes: [], profile: PROFILE, att: PROFILE ? PG.loadAttempts(PROFILE.key) : [], name: (PROFILE && PROFILE.name) || localStorage.getItem(NAME_KEY) || '', shuffle: false, err: '', rows: [], installEv: null, confirmDel: null };
let subs = [];
const clearSubs = () => { subs.forEach(f => { try { f(); } catch (e) {} }); subs = []; };
const startTick = fn => { const id = setInterval(fn, 250); subs.push(() => clearInterval(id)); };
function go(view, extra) { clearSubs(); S.err = ''; Object.assign(S, { view }, extra || {}); render(); window.scrollTo(0, 0); }
const views = {};
function render() {
  const gate = !S.profile && (!store.teacher || S.forceLogin) && S.view !== 'teacher';
  (views[gate ? 'login' : S.view] || views.home)();
}
const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'); };

store.watchQuizzes(list => {
  S.quizzes = list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  if (['home', 'quizzes', 'teacher', 'blocks', 'block', 'week', 'lecture'].includes(S.view) && !typing()) render();
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


/* ---------- student login + progress ---------- */
const metaOf = (quizId, qi) => {
  const z = S.quizzes.find(x => x.id === quizId); if (!z) return null;
  const q = z.questions[qi]; if (!q) return null;
  const f = findLec(quizLec(z));
  return { subject: f ? f.it.s : 'Other', lec: f ? f.it.k : 'other', lecName: f ? f.it.c : z.title, week: f ? f.w.n : 0, block: f ? f.b.n : 0, topic: q.topic || (f ? f.it.c : z.title), text: q.q, title: z.title };
};
const stats = () => PG.analyse(S.att, metaOf);
const pc = x => Math.round(x * 100);
const barHtml = (n, c) => { const a = n ? c / n : 0; return `<div class="pbar ${PG.pctColor(a)}"><i style="width:${pc(a)}%"></i></div><span class="pv" dir="ltr">${pc(a)}% <small>(${c}/${n})</small></span>`; };

views.login = () => {
  $app.innerHTML = `
    <header class="top"><div><h1>🩺 كويزاتي</h1><p class="sub">${esc(INSTRUCTOR.course)}</p></div></header>
    <section class="card">
      <h2 style="margin-top:0">أهلاً بيك 👋</h2>
      <p class="sub">اكتب اسمك وكود الكورس. تقدمك هيتسجل باسمك وتقدر تكمل من أي جهاز بنفس الاسم.</p>
      <label class="hint" for="lname">اسمك</label>
      <input class="inp" id="lname" maxlength="30" value="${esc(S.name)}" placeholder="الاسم الثلاثي" autocomplete="name">
      <label class="hint" for="lcode" style="display:block;margin-top:10px">كود الكورس</label>
      <input class="inp" id="lcode" dir="ltr" maxlength="20" placeholder="CODE" autocapitalize="characters" autocomplete="off">
      <p class="msg err">${esc(S.err)}</p>
      <button class="btn primary wide" data-act="slogin">دخول</button>
      <p class="hint" style="margin-top:14px">كود الكورس بتاخده من قناة التليجرام.</p>
    </section>`;
};
async function studentLogin() {
  const name = (document.getElementById('lname').value || '').trim().replace(/\s+/g, ' ');
  const code = (document.getElementById('lcode').value || '').trim().toLowerCase();
  S.name = name;
  if (name.length < 3) { S.err = 'اكتب اسمك (3 حروف على الأقل).'; render(); return; }
  if (code !== String(INSTRUCTOR.courseCode || '').toLowerCase()) { S.err = 'كود الكورس غير صحيح.'; render(); return; }
  S.forceLogin = false; S.profile = PG.setProfile(name); S.name = S.profile.name; localStorage.setItem(NAME_KEY, S.name);
  S.att = PG.loadAttempts(S.profile.key); S.err = '';
  go('home');
  try { const remote = await store.fetchAttemptsByKey(S.profile.key); S.att = PG.mergeAttempts(S.profile.key, remote); if (S.view === 'home' || S.view === 'perf') render(); } catch (e) { console.warn('sync', e); }
}

const todayPlan = () => {
  const st = stats(), items = [];
  if (st.mistakes.length) items.push({ act: 'review', ico: '🔁', t: 'راجع غلطاتك', d: `${st.mistakes.length} سؤال غلطت فيهم آخر مرة` });
  st.weak.slice(0, 2).forEach(w => items.push({ act: 'practice', ico: '🎯', t: `تدرّب على: ${w.topic}`, d: `${w.subject} · دقتك ${pc(w.c / w.n)}٪`, subject: w.subject, topic: w.topic }));
  const doneIds = new Set(S.att.map(a => a.quizId));
  const nextQ = orderedQuizzes().find(z => !doneIds.has(z.id));
  if (nextQ) items.push({ act: 'startq', ico: '🆕', t: 'كويز جديد لسه ما حلّيتوش', d: nextQ.title, id: nextQ.id });
  return { st, items: items.slice(0, 4) };
};
const orderedQuizzes = () => {
  const out = [];
  CURRICULUM.forEach(b => b.weeks.forEach(w => w.items.forEach(i => quizzesOf(i.k).forEach(z => out.push(z)))));
  return out;
};
const planHtml = (pl, full) => {
  const { st, items } = pl;
  const gate = st.A < PG.MIN_TOTAL ? `<p class="hint">حلّ ${PG.MIN_TOTAL - st.A} سؤال كمان على الأقل عشان نحلل نقاط ضعفك بدقة.</p>` : '';
  const proj = st.proj ? `<p class="proj">لو رفعت أضعف ${st.proj.topics.length} مواضيع لـ ${pc(PG.TARGET)}%، متوسطك ممكن يتحسن من <b dir="ltr">${pc(st.proj.now)}%</b> إلى حوالي <b dir="ltr">${pc(st.proj.next)}%</b> <small>(تقدير حسابي مش وعد)</small></p>` : '';
  return `${gate}<div class="list">${items.length ? items.map(it => `
    <button class="tile plan" data-act="${it.act}" ${it.id ? `data-id="${esc(it.id)}"` : ''} ${it.topic ? `data-subject="${esc(it.subject)}" data-topic="${esc(it.topic)}"` : ''}>
      ${ico(it.ico, '#e1f4ee')}<div class="tx"><b>${esc(it.t)}</b><span dir="auto">${esc(it.d)}</span></div></button>`).join('') : `<div class="card empty">ابدأ بأي كويز وهنجهز لك خطة مخصصة.</div>`}</div>${full ? proj : ''}`;
};

function buildPractice(kind, subject, topic) {
  const st = stats(), bad = new Set(st.mistakes.map(m => m.quizId + '#' + m.qi)), seen = st.qMap, marked = PG.loadMarks(S.profile.key);
  const pool = [];
  S.quizzes.forEach(z => z.questions.forEach((q, qi) => {
    const m = metaOf(z.id, qi), id = z.id + '#' + qi;
    if (kind === 'review' ? bad.has(id) : kind === 'marked' ? marked.has(id) : (m.subject === subject && m.topic === topic)) {
      const o = seen.get(id);
      pool.push({ ...q, ref: [z.id, qi], pr: bad.has(id) ? 0 : (o ? 2 : 1), lang: z.lang });
    }
  }));
  pool.sort((a, b) => a.pr - b.pr || Math.random() - 0.5);
  const qs = pool.slice(0, kind === 'review' || kind === 'marked' ? 20 : 12);
  if (!qs.length) return null;
  const en = qs.filter(q => q.lang === 'en').length * 2 >= qs.length;
  return { id: 'custom-' + kind + '-' + rid(5), custom: true, title: kind === 'review' ? 'Review your mistakes' : kind === 'marked' ? 'Marked questions' : 'Practice: ' + topic, lang: en ? 'en' : 'ar', questions: qs.map(({ pr, lang, ...q }) => q) };
}


const chartSvg = pts => {
  if (pts.length < 2) return '<p class="hint">حلّ كويزين على الأقل عشان يظهر منحنى تقدمك.</p>';
  const W = 320, H = 120, P = 18, last = pts.slice(-30), x = i => P + i * (W - 2 * P) / (last.length - 1), y = v => H - P - v * (H - 2 * P);
  const line = last.map((q, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(q.p).toFixed(1)).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Performance over time">
    ${[0, .5, .8, 1].map(v => `<line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" class="${v === .8 ? 'tg' : 'gl'}"/><text x="2" y="${y(v) + 3}" class="ax">${v * 100}</text>`).join('')}
    <path d="${line}" class="ln"/>${last.map((q, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(q.p).toFixed(1)}" r="3" class="${q.p >= .8 ? 'g' : q.p >= .6 ? 'y' : 'r'}"/>`).join('')}</svg>`;
};
const weakCards = st => {
  const bySubj = new Map();
  st.weak.forEach(t => { const o = bySubj.get(t.subject) || { subject: t.subject, topics: [], wrong: 0 }; o.topics.push(t); o.wrong += t.n - t.c; bySubj.set(t.subject, o); });
  const cards = [...bySubj.values()].map(o => ({ ...o, acc: st.subj.get(o.subject) ? st.subj.get(o.subject).c / st.subj.get(o.subject).n : 0 })).sort((a, b) => a.acc - b.acc).slice(0, 4);
  if (!cards.length) return '';
  return `<h3 class="lbt">Weak areas · نقاط الضعف</h3><div class="weak">${cards.map(c => `<div class="card wk"><div class="row" style="justify-content:space-between"><b dir="ltr">${esc(c.subject)}</b><span class="pill ${PG.pctColor(c.acc)}" dir="ltr">${pc(c.acc)}%</span></div>
    <small>${c.wrong} غلطة في ${c.topics.length} مواضيع</small>
    ${c.topics.slice(0, 3).map(t => `<button class="btn small" dir="ltr" data-act="practice" data-subject="${esc(t.subject)}" data-topic="${esc(t.topic)}">${esc(t.topic)}</button>`).join('')}</div>`).join('')}</div>`;
};
const readyHtml = st => {
  const r = PG.readiness(S.att, st.unique, S.quizzes.reduce((n, z) => n + z.questions.length, 0));
  if (!r || st.A < PG.MIN_TOTAL) return '';
  const lvl = r.score >= .8 ? ['جاهز تقريبًا', 'g'] : r.score >= .6 ? ['في الطريق', 'y'] : ['محتاج مجهود أكتر', 'r'];
  return `<div class="card ready"><div class="row" style="justify-content:space-between"><b>Readiness · الجاهزية</b><span class="pill ${lvl[1]}" dir="ltr">${pc(r.score)}%</span></div>
    <p class="sub" style="margin:4px 0 0">${lvl[0]} — آخر 5 محاولات <b dir="ltr">${pc(r.recent)}%</b> وغطّيت <b dir="ltr">${pc(r.cover)}%</b> من الأسئلة. <small>(تقدير حسابي مش درجة الامتحان)</small></p></div>`;
};
const examHtml = st => {
  const ex = PG.getExam(S.profile.key), total = S.quizzes.reduce((n, z) => n + z.questions.length, 0);
  const left = ex ? Math.ceil((new Date(ex.date + 'T23:59:59') - Date.now()) / 864e5) : 0;
  let info = '';
  if (ex && left > 0) {
    const rest = Math.max(0, total - st.unique), perDay = Math.ceil(rest / Math.max(1, left)), review = Math.min(st.mistakes.length, Math.ceil(st.mistakes.length / Math.max(1, left)));
    info = `<p class="proj">فاضل <b>${left}</b> يوم على الامتحان. هدفك اليومي: <b>${perDay}</b> سؤال جديد${review ? ` + <b>${review}</b> سؤال من غلطاتك` : ''}.</p>`;
  } else if (ex) info = '<p class="hint">ميعاد الامتحان عدّى، حدّد ميعاد جديد.</p>';
  return `<h3 class="lbt">Study planner · خطة لحد الامتحان</h3><div class="card"><label class="hint" for="exd">ميعاد امتحانك</label>
    <div class="row"><input class="inp" id="exd" type="date" dir="ltr" value="${ex ? esc(ex.date) : ''}" style="flex:1"><button class="btn small" data-act="setexam">حفظ</button>${ex ? '<button class="btn small" data-act="clearexam">مسح</button>' : ''}</div>${info}</div>`;
};

const PTABS = [['ov', '🏠', 'ملخص'], ['plan', '🎯', 'الخطة'], ['weak', '⚠️', 'الضعف'], ['prog', '📈', 'التقدم'], ['subj', '📚', 'المواد']];
views.perf = () => {
  const pl = todayPlan(), st = pl.st, sk = PG.streak(S.att), tr = PG.trend(S.att), marks = PG.loadMarks(S.profile.key);
  const total = S.quizzes.reduce((n, z) => n + z.questions.length, 0), tab = S.ptab || 'ov';
  const bySubj = [...st.subj.values()].sort((a, b) => a.c / a.n - b.c / b.n);
  const lecBy = {}; [...st.lec.values()].forEach(l => (lecBy[l.subject] = lecBy[l.subject] || []).push(l));
  const topBy = {}; [...st.topic.values()].forEach(t => (topBy[t.subject] = topBy[t.subject] || []).push(t));
  const byBlock = {}; [...st.lec.values()].forEach(l => { const b = byBlock[l.block] = byBlock[l.block] || { n: 0, c: 0 }; b.n += l.n; b.c += l.c; });
  const empty = '<div class="card empty">لسه ما حلّيتش أي كويز. بعد أول كويز هتظهر نتايجك هنا.</div>';
  let body = '';
  if (tab === 'ov') body = `<div class="stats s2">
      <div class="stat"><b dir="ltr">${st.A ? pc(st.C / st.A) + '%' : '-'}</b><span>دقتك الكلية</span></div>
      <div class="stat"><b dir="ltr">${st.A}</b><span>إجابة</span></div>
      <div class="stat"><b dir="ltr">${st.unique}/${total}</b><span>أسئلة مختلفة</span></div>
      <div class="stat"><b>🔥 ${sk}</b><span>أيام متتالية</span></div></div>
    ${readyHtml(st)}
    <div class="qa"><button class="btn" data-act="cardsopen">🃏 Flashcards <small>(${dueCount()})</small></button><button class="btn" data-act="lbopen">🏆 Leaderboard</button>${marks.size ? `<button class="btn" data-act="practicemarked">⚑ المعلّمة (${marks.size})</button>` : ''}</div>
    ${examHtml(st)}
    <p class="center" style="margin:4px 0 0"><button class="link" data-act="slogout">تغيير الطالب</button></p>`;
  else if (tab === 'plan') body = `<h3 class="lbt">مطلوب منك النهاردة</h3>${planHtml(pl, true)}`;
  else if (tab === 'weak') body = st.A ? (weakCards(st).replace(/<h3 class="lbt">.*?<\/h3>/, '') || '<div class="card empty">مفيش نقاط ضعف واضحة لحد دلوقتي. كمّل حل وهنحللها بعد 20 إجابة.</div>') : empty;
  else if (tab === 'prog') body = S.att.length ? `<div class="card">${chartSvg(tr.pts)}<p class="sub" style="margin:6px 0 0">${tr.delta === null ? 'محتاج 4 محاولات عشان نقارن بداياتك بمستواك الحالي.' : `متوسطك ${tr.delta >= 0 ? 'اتحسّن' : 'قلّ'} بـ <b dir="ltr">${tr.delta >= 0 ? '+' : ''}${tr.delta.toFixed(1)}</b> نقطة بين النصف الأول والتاني من محاولاتك.`}${tr.secPerQ ? ` متوسط وقتك <b dir="ltr">${Math.round(tr.secPerQ)}s</b> للسؤال.` : ''}</p></div>
    <h3 class="lbt">By block</h3><div class="list">${Object.keys(byBlock).sort().map(b => `<div class="card prow"><b dir="ltr">Block ${b}</b>${barHtml(byBlock[b].n, byBlock[b].c)}</div>`).join('')}</div>` : empty;
  else if (tab === 'subj') {
    const cur = S.psub && st.subj.get(S.psub);
    if (!st.A) body = empty;
    else if (cur) body = `<button class="link" data-act="psub" data-id="">‹ كل المواد</button><h3 class="lbt" dir="ltr">${esc(cur.subject)}</h3><div class="card prow">${barHtml(cur.n, cur.c)}</div>
      <div class="scr"><h4 dir="ltr">Topics</h4>${(topBy[cur.subject] || []).sort((a, b) => a.c / a.n - b.c / b.n).map(t => `<div class="prow sm"><span dir="ltr">${esc(t.topic)}</span>${barHtml(t.n, t.c)}${t.c / t.n < PG.TARGET ? `<button class="btn small" data-act="practice" data-subject="${esc(t.subject)}" data-topic="${esc(t.topic)}">تدرّب</button>` : ''}</div>`).join('')}
      <h4 dir="ltr">Lectures</h4>${(lecBy[cur.subject] || []).sort((a, b) => a.c / a.n - b.c / b.n).map(l => `<div class="prow sm"><span dir="ltr">W${l.week} · ${esc(l.name)}</span>${barHtml(l.n, l.c)}</div>`).join('')}</div>`;
    else body = `<p class="hint" style="margin:0 0 6px">مرتبة من الأضعف. اضغط على مادة تشوف مواضيعها ومحاضراتها.</p><div class="list">${bySubj.map(s => `<button class="card prow subj" data-act="psub" data-id="${esc(s.subject)}"><b dir="ltr">${esc(s.subject)}</b>${barHtml(s.n, s.c)}</button>`).join('')}</div>`;
  }
  $app.innerHTML = `${backBar('Performance')}
    <nav class="ptabs" role="tablist">${PTABS.map(([k, e, t]) => `<button role="tab" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}" data-act="ptab" data-id="${k}"><i>${e}</i><span>${t}</span></button>`).join('')}</nav>
    <div class="pbody">${body}</div>`;
};


/* ---------- exam mode ---------- */
const mmss = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
function startExam(z) {
  const qs = z.questions.map(q => {
    const order = q.options.map((_, i) => i).filter(i => q.options[i].t.trim());
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return { q: q.q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct), ref: q.ref || [z.id, z.questions.indexOf(q)] };
  });
  S.play = { quiz: z, lang: langOf(z), qs, i: 0, exam: true, ans: qs.map(() => null), confirm: false, limitMs: qs.length * 72000, score: 0, log: [], t0: Date.now() };
  go('exam');
  startTick(() => {
    const p = S.play; if (!p || !p.exam || S.view !== 'exam') return;
    const left = p.limitMs - (Date.now() - p.t0), el = document.getElementById('xt');
    if (el) { el.textContent = mmss(left); el.classList.toggle('low', left < 120000); }
    if (left <= 0) finishExam();
  });
}
views.exam = () => {
  const p = S.play, q = p.qs[p.i], L = T[p.lang], total = p.qs.length, left = p.limitMs - (Date.now() - p.t0);
  const marks = S.profile ? PG.loadMarks(S.profile.key) : new Set(), unans = p.ans.filter(a => a === null).length;
  $app.innerHTML = `<div dir="${L.dir}">
    <div class="xbar"><span class="xtimer ${left < 120000 ? 'low' : ''}" id="xt" dir="ltr">${mmss(left)}</span><span dir="ltr">Item ${p.i + 1} of ${total}</span>
      ${S.profile ? `<button class="mark ${marks.has(q.ref[0] + '#' + q.ref[1]) ? 'on' : ''}" data-act="mark" aria-label="Mark">⚑</button>` : ''}
      <button class="btn small" data-act="xend">End Block</button></div>
    <div class="xnav" dir="ltr">${p.qs.map((x, i) => `<button class="xn ${i === p.i ? 'cur' : ''} ${p.ans[i] !== null ? 'done' : ''}" data-act="xgo" data-oi="${i}">${i + 1}</button>`).join('')}</div>
    <div class="question">${esc(q.q)}</div>
    <div class="opts">${optsHtml(q, L, { picked: p.ans[p.i], act: 'xpick' })}</div>
    ${p.confirm ? `<div class="card" style="border:2px solid #e0a526"><p style="margin:0 0 8px">${unans ? `لسه ${unans} سؤال من غير إجابة.` : 'جاوبت كل الأسئلة.'} تنهي الامتحان وتشوف النتيجة؟</p>
      <div class="row"><button class="btn primary" data-act="xend2">إنهاء وعرض النتيجة</button><button class="btn" data-act="xcancel">كمّل</button></div></div>` : ''}
    <div class="row xfoot"><button class="btn" data-act="xprev" ${p.i === 0 ? 'disabled' : ''}>Previous</button><button class="btn primary" data-act="xnext" ${p.i === total - 1 ? 'disabled' : ''}>Next</button></div>
    <p class="hint">وضع امتحان: مفيش إجابات ولا شرح لحد ما تنهي. تقدر تغيّر إجاباتك وترجع لأي سؤال.</p></div>`;
};
async function finishExam() {
  const p = S.play; if (!p || !p.exam) return;
  p.exam = false;
  p.log = p.qs.map((q, i) => ({ q: q.q, ok: p.ans[i] === q.correct, correct: q.options[q.correct].t, ref: q.ref }));
  p.score = p.log.filter(x => x.ok).length;
  await finishSolo();
}

/* ---------- flashcards ---------- */
const GAPS = [['10 دقايق', 6e5], ['ساعة', 36e5], ['6 ساعات', 216e5], ['يوم', 864e5], ['3 أيام', 3 * 864e5], ['أسبوع', 7 * 864e5], ['أسبوعين', 14 * 864e5], ['شهر', 30 * 864e5]];
const qOf = id => { const [zid, qi] = [id.slice(0, id.lastIndexOf('#')), +id.slice(id.lastIndexOf('#') + 1)]; const z = S.quizzes.find(x => x.id === zid); return z && z.questions[qi] ? { z, q: z.questions[qi] } : null; };
const knownIds = () => { const c = PG.loadCards(S.profile.key); return Object.keys(c).filter(id => PG.cardKnown(c[id]) && qOf(id)).sort((a, b) => c[a].due - c[b].due); };
const cardIds = () => {
  const st = stats(), set = new Set(st.mistakes.map(m => m.quizId + '#' + m.qi));
  PG.loadMarks(S.profile.key).forEach(id => set.add(id));
  knownIds().forEach(id => set.add(id));
  return [...set].filter(id => qOf(id));
};
const dueIds = () => { const c = PG.loadCards(S.profile.key); return cardIds().filter(id => PG.isDue(c, id)); };
const dueCount = () => dueIds().length;
const fmtDue = ms => { const d = ms - Date.now(); if (d <= 0) return 'مستحقة الآن'; const m = Math.round(d / 6e4); if (m < 60) return `بعد ${m} دقيقة`; const h = Math.round(m / 60); if (h < 24) return `بعد ${h} ساعة`; return `بعد ${Math.round(h / 24)} يوم`; };
function openFc(tab) { go('fc', { fctab: tab || S.fctab || 'due' }); }
function runDeck(ids, shuffle = true) {
  const deck = ids.slice(0, 40);
  if (shuffle) for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  go('cards', { cd: { deck, i: 0, flip: false, known: 0 } });
}
views.fc = () => {
  const due = dueIds(), kn = knownIds(), c = PG.loadCards(S.profile.key), tab = S.fctab || 'due';
  let body;
  if (tab === 'due') body = due.length ? `<div class="card center"><div class="big">${due.length}</div><p class="sub" style="margin:0 0 10px">كارت مستحق للمراجعة دلوقتي</p><button class="btn primary wide" data-act="fcstart">ابدأ المراجعة</button></div>
      <p class="hint">الكروت بتتعمل من الأسئلة اللي غلطت فيها أو علّمتها ⚑. لما تضغط «عرفتها» انت اللي بتحدد ترجع لك امتى.</p>`
    : `<div class="card center"><h3>مفيش كروت مستحقة دلوقتي 🎉</h3><p class="sub">ارجع بعدين، أو راجع اللي عرفته من خانة «عرفتها».</p></div>`;
  else body = kn.length ? `<button class="btn primary wide" data-act="fcknown">🔁 راجع كل اللي عرفته دلوقتي (${kn.length})</button>
      <div class="scr kl">${kn.map(id => { const o = qOf(id), m = metaOf(o.z.id, +id.slice(id.lastIndexOf('#') + 1)); return `<button class="card kc" data-act="fcone" data-id="${esc(id)}"><span class="kq" dir="auto">${esc(o.q.q)}</span><small dir="auto">${esc(m ? m.topic : '')} · ${fmtDue(c[id].due)}</small></button>`; }).join('')}</div>`
    : `<div class="card center"><h3>لسه ما عرفتش كروت</h3><p class="sub">أي كارت تضغط عليه «عرفتها» هيتحفظ هنا، وتقدر تراجعه في أي وقت.</p></div>`;
  $app.innerHTML = `${backBar('Flashcards', 'perf')}
    <div class="seg" style="display:flex"><button style="flex:1" class="${tab === 'due' ? 'on' : ''}" data-act="fctab" data-id="due">🃏 المستحقة (${due.length})</button><button style="flex:1" class="${tab === 'known' ? 'on' : ''}" data-act="fctab" data-id="known">✅ عرفتها (${kn.length})</button></div>
    <div class="pbody" style="margin-top:10px">${body}</div>`;
};
views.cards = () => {
  const d = S.cd;
  if (!d.deck.length || d.i >= d.deck.length) {
    $app.innerHTML = `${backBar('Flashcards', 'fc')}<div class="card center"><h2>خلّصت الدفعة 🎉</h2>
      <p class="sub">عرفت ${d.known} من ${d.deck.length}. الكروت اللي ما عرفتهاش هترجع لك فورًا.</p>
      <button class="btn primary" data-act="fcback">رجوع للكروت</button></div>`; return;
  }
  const id = d.deck[d.i], { z, q } = qOf(id), m = metaOf(z.id, +id.slice(id.lastIndexOf('#') + 1)), ok = q.options[q.correct], L = T[langOf(z)];
  $app.innerHTML = `${backBar('Flashcards', 'fc')}<div dir="${L.dir}"><p class="sub" dir="ltr">${d.i + 1} / ${d.deck.length} · ${esc(m ? m.subject + ' · ' + m.topic : '')}</p>
    <div class="card fcard" data-act="flip" role="button" tabindex="0"><div class="question" style="margin:0">${esc(q.q)}</div>
    ${d.flip ? `<hr><p style="margin:0 0 6px"><b>✓ ${esc(ok.t)}</b></p><p class="sub" style="margin:0">${esc(ok.e || '')}</p>` : '<p class="hint" style="margin-top:12px">اضغط على الكارت عشان تشوف الإجابة</p>'}</div>
    ${d.flip ? `<div class="row"><button class="btn" data-act="cardno">😅 لسه، رجّعه فورًا</button></div>
      <p class="hint" style="margin:8px 0 4px">✅ عرفتها، رجّعه لي بعد:</p>
      <div class="gaps">${GAPS.map(([t, ms]) => `<button class="btn small" data-act="cardyes" data-id="${ms}">${t}</button>`).join('')}</div>` : ''}</div>`;
};

/* ---------- leaderboard (week / month) ---------- */
function openLb(period) {
  go('lb', { lbPeriod: period || S.lbPeriod || 'week', lbRows: null });
  store.fetchRecentAttempts(Date.now() - 30 * 864e5).then(r => { S.lbRows = r; if (S.view === 'lb') render(); })
    .catch(e => { console.error(e); S.lbRows = []; S.err = 'تعذر تحميل الترتيب. تأكد من نشر قواعد Firestore.'; if (S.view === 'lb') render(); });
}
views.lb = () => {
  const days = S.lbPeriod === 'month' ? 30 : 7, hide = PG.getHide(), me = S.profile && S.profile.key;
  const rows = S.lbRows ? PG.leaderboard(S.lbRows, Date.now() - days * 864e5) : null;
  const mine = rows ? rows.findIndex(r => r.key === me) : -1;
  $app.innerHTML = `${backBar('Leaderboard')}
    <div class="row" style="justify-content:space-between"><div class="seg"><button class="${days === 7 ? 'on' : ''}" data-act="lbp" data-id="week">Week</button><button class="${days === 30 ? 'on' : ''}" data-act="lbp" data-id="month">Month</button></div>
      <button class="btn small" data-act="lbhide">${hide ? '👁 أظهر اسمي' : '🙈 أخفي اسمي'}</button></div>
    ${S.err ? `<p class="msg err">${esc(S.err)}</p>` : ''}
    ${!rows ? '<div class="card empty">جاري التحميل…</div>' : !rows.length ? '<div class="card empty">لسه محدش وصل لـ 10 إجابات في الفترة دي.</div>' : `
    ${mine >= 0 ? `<div class="card rankbox"><p class="hint">ترتيبك</p><div class="big">#${mine + 1} من ${rows.length}</div></div>` : '<p class="hint">حلّ 10 أسئلة على الأقل في الفترة دي عشان تظهر في الترتيب.</p>'}
    <div class="lbt2 hint" dir="ltr"><span>#</span><span>Student</span><span>Quizzes</span><span>Qs</span><span>Acc</span><span>Smart</span></div>
    <ol class="lb lb2">${rows.slice(0, 50).map((r, i) => { const isMe = r.key === me, hid = isMe ? hide : r.hide;
      return `<li class="${isMe ? 'me' : ''}" dir="ltr"><span class="rk">${i + 1}</span><span class="nm" dir="auto">${hid ? (isMe ? esc(r.name) + ' 🙈' : 'مجهول') : esc(r.name)}</span><span>${r.quizzes}</span><span>${r.n}</span><span class="${PG.pctColor(r.acc)}t">${pc(r.acc)}%</span><span class="sc">${r.smart}</span></li>`; }).join('')}</ol>`}
    <p class="hint">Smart Score = عدد الإجابات الصح × الدقة، فبيكافئ الكمية والدقة مع بعض. بيظهر اللي حلّ 10 أسئلة+ في الفترة. إخفاء الاسم بيتطبّق على باقي الطلبة من أول كويز تحلّه بعد الضغط.</p>`;
};


/* ---------- usage guide ---------- */
const GUIDE = [
  { c: '#23a094', e: '📚', t: 'الكويزات', open: true, items: [
    'من الرئيسية: <b>Semester 1</b> ← البلوك ← الأسبوع ← المحاضرة، وكل محاضرة لها كويز <b>20 سؤال</b>. وكمان «كل الكويزات» فيها كل الكويزات في مكان واحد.',
    'بعد ما تجاوب: الإجابة الصح <b>خضرا</b> والغلط <b>حمرا</b> مع السبب. اضغط على أي اختيار تاني تعرف ليه هو غلط.',
    'علّم أي سؤال بـ <b>⚑</b> وهتلاقيه بعدين في زر «⚑ المعلّمة» وفي الـ Flashcards.',
    'من «كل الكويزات» تقدر تفعّل <b>خلط ترتيب الإجابات</b> عشان ما تحفظش مكان الإجابة.' ] },
  { c: '#e8a33d', e: '🕒', t: 'وضع الامتحان (Exam)', items: [
    'زر <b>🕒 Exam</b> موجود جنب «ابدأ» في كل كويز (من المحاضرة أو من «كل الكويزات»).',
    'عدّاد تنازلي بحساب <b>72 ثانية للسؤال</b>، ولما يخلص الوقت الامتحان بيتسلّم لوحده.',
    'مفيش إجابات ولا شرح لحد ما تنهي. تقدر <b>تغيّر إجابتك</b> وترجع لأي سؤال من شريط الأرقام فوق.',
    'اضغط <b>End Block</b> لما تخلّص، وهتشوف نتيجتك والإجابات الصح. ابدأ بالكويز العادي وبعدين جرّب Exam.' ] },
  { c: '#4a7de0', e: '📊', t: 'أدائي (Performance)', items: [
    'الصفحة مقسّمة لأقسام فوق، اضغط على القسم اللي عايزه: <b>🏠 ملخص</b> · <b>🎯 الخطة</b> · <b>⚠️ الضعف</b> · <b>📈 التقدم</b> · <b>📚 المواد</b>.',
    '<b>الملخص:</b> دقتك، وإجاباتك، وأيامك المتتالية 🔥، والجاهزية، وميعاد امتحانك.',
    '<b>الضعف:</b> بيبدأ بعد <b>20 إجابة</b>. أي موضوع حليت منه 3 أسئلة ودقتك فيه أقل من 80٪ بيظهر هنا مع زر تدريب.',
    '<b>التقدم:</b> منحنى أدائك مع الوقت والنتيجة لكل بلوك. <b>المواد:</b> اضغط على مادة تشوف مواضيعها ومحاضراتها.',
    'الألوان: <span class="gd r">أحمر</span> أقل من 60٪، <span class="gd y">أصفر</span> 60–80٪، <span class="gd g">أخضر</span> فوق 80٪.' ] },
  { c: '#7b5ad8', e: '🎯', t: 'خطة المذاكرة والتدريب', items: [
    'قسم <b>«الخطة»</b> بيرتّب لك النهاردة: راجع غلطاتك ← تدرّب على أضعف مواضيعك ← كويز جديد.',
    'زر <b>تدرّب</b> جنب أي موضوع ضعيف بيعمل لك كويز مخصوص منه (حتى 12 سؤال)، و«راجع غلطاتك» بيجمع أسئلتك الغلط في كويز واحد.',
    'من قسم <b>الملخص</b> اكتب <b>ميعاد امتحانك</b>، وهيحسب لك هدفك اليومي من الأسئلة الجديدة وأسئلة الغلطات.',
    '<b>الجاهزية</b> تقدير حسابي من آخر 5 محاولات وتغطيتك للأسئلة، مش درجة الامتحان الحقيقية.' ] },
  { c: '#e0699a', e: '🃏', t: 'Flashcards', items: [
    'الكروت بتتعمل من الأسئلة اللي <b>غلطت فيها</b> أو علّمتها <b>⚑</b>. تلاقيها من الرئيسية أو من «الملخص».',
    'اقرا السؤال وفكّر، واضغط على الكارت تشوف الإجابة والسبب.',
    '<b>عرفتها ✅</b> وانت اللي بتحدد ترجع لك امتى: 10 دقايق، ساعة، 6 ساعات، يوم، 3 أيام، أسبوع، أسبوعين، شهر. و<b>لسه 😅</b> بترجع فورًا.',
    'كل اللي عرفته في خانة <b>«✅ عرفتها»</b>، وتقدر تراجعه في أي وقت: كارت واحد أو كلهم مرة واحدة.' ] },
  { c: '#d9822b', e: '🏆', t: 'Leaderboard', items: [
    'الترتيب <b>أسبوعي</b> أو <b>شهري</b>، ويظهر فيه اللي حلّ 10 أسئلة أو أكتر في الفترة.',
    '<b>Smart Score</b> = الإجابات الصح × الدقة، فبيكافئ الكمية والدقة مع بعض.',
    'مش عايز اسمك يظهر؟ اضغط <b>🙈 أخفي اسمي</b> وهتظهر لزمايلك «مجهول» من أول كويز تحلّه بعد كده.' ] },
  { c: '#2f9e6b', e: '💡', t: 'نصايح عشان تستفيد أكتر', items: [
    'ادخل بنفس الاسم وكود الكورس دايمًا، وده اللي بيخلي تقدمك يرجع لك من أي جهاز.',
    'حلّ كويز واحد على الأقل كل يوم، وراجع غلطاتك وفلاش كاردز قبل ما تبدأ جديد.',
    'بعد ما تخلّص محاضرة: كويزها العادي ثم Exam بعد كام يوم، عشان تقيس ثباتك.',
    'ركّز أول حاجة على قسم <b>الضعف</b>، التحسّن فيه هو أسرع طريق لرفع متوسطك.' ] },
  { c: '#3b9ad9', e: '📲', t: 'تثبيت التطبيق على موبايلك', items: [
    '<b>أندرويد (Chrome):</b> قايمة ⋮ ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».',
    '<b>آيفون وآيباد (Safari):</b> زر المشاركة ← «إضافة إلى الشاشة الرئيسية».',
    'بعد التثبيت بيفتح زي أي تطبيق ومن غير شريط المتصفح.' ] },
  { c: '#a2699b', e: '❓', t: 'أسئلة شائعة', items: [
    '<b>تقدمي مش ظاهر على جهاز تاني؟</b> ادخل بنفس الاسم بالظبط وبنفس كود الكورس، وتأكد إن النت شغّال.',
    '<b>مفيش نقاط ضعف عندي؟</b> لازم تحل 20 سؤال على الأقل، ويكون حليت من الموضوع 3 أسئلة.',
    '<b>عايز أغيّر اسمي؟</b> من «الملخص» في Performance اضغط «تغيير الطالب» وادخل باسم جديد.',
    '<b>التطبيق شكله قديم أو مش بيتحدّث؟</b> اقفله تمامًا وافتحه مرتين، ولو فضل امسح بيانات الموقع من إعدادات المتصفح.',
    '<b>الجاهزية رقم حقيقي؟</b> لأ، تقدير بيساعدك تتابع تحسّنك، مش بديل لنتيجة الامتحان.' ] },
];
views.help = () => {
  $app.innerHTML = `${backBar('تعليمات الاستخدام')}
    <section class="card gh"><div class="gh-e">👋</div><h3>ابدأ في 3 خطوات</h3>
      <ol class="steps"><li><b>1</b><span>ادخل باسمك وكود الكورس</span></li><li><b>2</b><span>حلّ كويز من Semester 1</span></li><li><b>3</b><span>افتح <em>Performance</em> وشوف خطتك</span></li></ol></section>
    <div class="gl">${GUIDE.map(g => `<details class="gs" name="guide" style="--c:${g.c}" ${g.open ? 'open' : ''}><summary><i class="gi">${g.e}</i><b>${g.t}</b><span class="chev" aria-hidden="true">›</span></summary>
      <ul>${g.items.map(x => `<li>${x}</li>`).join('')}</ul></details>`).join('')}</div>
    <p class="hint center" style="margin-top:14px">عندك سؤال أو مشكلة؟ كلّم الدكتور من قناة التليجرام.</p>`;
};

/* ---------- teacher dashboard ---------- */
views.tdash = () => {
  const rows = S.tatt || [];
  const byKey = new Map();
  rows.forEach(a => { const k = a.key; let o = byKey.get(k); if (!o) { o = { name: a.name, att: [], n: 0, c: 0, last: 0 }; byKey.set(k, o); } o.att.push(a); o.last = Math.max(o.last, a.at); o.name = a.name || o.name; (a.ans || []).forEach(x => { o.n++; if (x[2]) o.c++; }); });
  const studs = [...byKey.values()].sort((a, b) => b.last - a.last);
  const now = Date.now(), days = t => Math.floor((now - t) / 864e5);
  const allN = studs.reduce((s, x) => s + x.n, 0), allC = studs.reduce((s, x) => s + x.c, 0);
  const qs = new Map();
  rows.forEach(a => (a.ans || []).forEach(([qz, qi, ok]) => { const k = qz + '#' + qi; const o = qs.get(k) || { qz, qi, n: 0, c: 0 }; o.n++; if (ok) o.c++; qs.set(k, o); }));
  const hard = [...qs.values()].filter(o => o.n >= 5).sort((a, b) => a.c / a.n - b.c / b.n).slice(0, 10);
  $app.innerHTML = `${backBar('لوحة المتابعة', 'teacher')}
    ${S.derr ? `<p class="msg err">${esc(S.derr)}</p>` : ''}
    <div class="stats"><div class="stat"><b>${studs.length}</b><span>طالب</span></div>
      <div class="stat"><b dir="ltr">${allN ? pc(allC / allN) + '%' : '-'}</b><span>متوسط الكورس</span></div>
      <div class="stat"><b>${studs.filter(x => days(x.last) >= 5).length}</b><span>غايبين 5 أيام+</span></div></div>
    <div class="row"><button class="btn" data-act="csv">⬇️ تصدير Excel (CSV)</button></div>
    <h3 class="lbt">الطلاب</h3>
    <div class="list">${studs.length ? studs.map(x => { const d = days(x.last), a = x.n ? x.c / x.n : 0; return `<div class="card prow"><b dir="auto">${esc(x.name)}${d >= 5 ? ' ⚠️' : ''}</b>${barHtml(x.n, x.c)}<small>${x.att.length} محاولة · آخر نشاط ${d === 0 ? 'النهاردة' : 'من ' + d + ' يوم'}</small></div>`; }).join('') : '<div class="card empty">لا توجد محاولات بعد.</div>'}</div>
    <h3 class="lbt">أصعب الأسئلة (5 إجابات+)</h3>
    <div class="list">${hard.length ? hard.map(o => { const m = metaOf(o.qz, o.qi); return `<div class="card prow"><span dir="auto">${esc(m ? m.text : o.qz + ' #' + (o.qi + 1))}</span><small dir="auto">${esc(m ? m.title + ' · ' + m.topic : '')}</small>${barHtml(o.n, o.c)}</div>`; }).join('') : '<div class="card empty">محتاج بيانات أكتر.</div>'}</div>`;
};
function exportCsv() {
  const rows = S.tatt || [], by = new Map();
  rows.forEach(a => { const o = by.get(a.key) || { name: a.name, att: 0, n: 0, c: 0, last: 0 }; o.att++; o.last = Math.max(o.last, a.at); (a.ans || []).forEach(x => { o.n++; if (x[2]) o.c++; }); by.set(a.key, o); });
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const lines = [['Name', 'Attempts', 'Answers', 'Correct', 'Accuracy %', 'Last active'].map(q).join(',')];
  by.forEach(o => lines.push([o.name, o.att, o.n, o.c, o.n ? Math.round(o.c / o.n * 100) : 0, new Date(o.last).toISOString().slice(0, 10)].map(q).join(',')));
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'students-progress.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------- home ---------- */
const avatar = (cls = '') => INSTRUCTOR.photo
  ? `<img class="avatar ph ${cls}" src="${esc(INSTRUCTOR.photo)}" alt="${esc(INSTRUCTOR.name)}">`
  : `<span class="avatar ${cls}" aria-hidden="true">${esc(INSTRUCTOR.initials)}</span>`;
views.about = () => {
  const I = INSTRUCTOR, L = I.links;
  $app.innerHTML = `${backBar('About')}
    <section class="card about">
      ${avatar('lg')}
      <h1 dir="ltr">${esc(I.name)}</h1>
      <p class="sub" dir="ltr">${esc(I.title)}</p>
      <p class="course">${esc(I.course)}</p>
      ${I.bio ? `<p class="bio">${esc(I.bio)}</p>` : ''}
      <div class="links">
        <a class="btn primary wide" href="${esc(L.telegram)}" target="_blank" rel="noopener">✈️ انضم لقناة الكورس على تليجرام</a>
        <a class="btn wide" href="${esc(L.youtube)}" target="_blank" rel="noopener">▶️ قناة اليوتيوب</a>
        <a class="btn wide" href="${esc(L.whatsapp)}" target="_blank" rel="noopener">💬 تواصل واتساب</a>
        <a class="btn wide" href="${esc(L.x)}" target="_blank" rel="noopener" dir="ltr">𝕏 @DrMubarak184647</a>
      </div>
    </section>`;
};
const homeToday = () => {
  const pl = todayPlan(), sk = PG.streak(S.att), st = pl.st;
  return `<section class="card today"><div class="row" style="justify-content:space-between"><b dir="auto">أهلاً ${esc(S.profile.name)}</b><span>🔥 ${sk} ${sk === 1 ? 'يوم' : 'أيام'}</span></div>
    <p class="sub" style="margin:2px 0 8px">${st.A ? `دقتك الكلية <b dir="ltr">${pc(st.C / st.A)}%</b> من ${st.A} إجابة` : 'ابدأ أول كويز عشان نبدأ نتابع مستواك'}</p>
    <h4 style="margin:6px 0">مطلوب منك النهاردة</h4>${planHtml({ st, items: pl.items.slice(0, 2) }, false)}</section>`;
};
views.home = () => {
  const ios = /iphone|ipad/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches;
  $app.innerHTML = `
    <header class="top"><div><h1>🩺 كويزاتي</h1><p class="sub">اختبر نفسك وقارن ترتيبك بزملائك</p></div>
      ${store.mode === 'demo' ? '<span class="badge">وضع تجريبي: البيانات على جهازك فقط</span>' : ''}</header>
    ${S.profile ? homeToday() : ''}
    <button class="tile instr" data-act="go" data-v="about">${avatar()}<div class="tx"><b dir="ltr">${esc(INSTRUCTOR.name)}</b><span dir="ltr">${esc(INSTRUCTOR.title)}</span><span>${esc(INSTRUCTOR.course)}</span></div></button>
    <div class="tiles">
      <button class="tile help" data-act="go" data-v="help">${ico('📖', '#e6e0ff')}<div class="tx"><b>تعليمات الاستخدام</b><span>إزاي تستخدم التطبيق خطوة بخطوة</span></div></button>
      <button class="tile" data-act="go" data-v="blocks">${ico('📚', '#d5f3ea')}<div class="tx"><b>Semester 1</b><span>كويزات كل محاضرة حسب البلوك والأسبوع</span></div></button>
      <button class="tile" data-act="go" data-v="perf">${ico('📊', '#dde7ff')}<div class="tx"><b>Performance &amp; Study Plan</b><span>مستواك، نقاط ضعفك، وخطة مذاكرة مخصصة</span></div></button>
      ${S.profile ? `<button class="tile" data-act="lbopen">${ico('🏆', '#fff0c9')}<div class="tx"><b>Leaderboard</b><span>ترتيب الأسبوع والشهر بـ Smart Score</span></div></button>
      <button class="tile" data-act="cardsopen">${ico('🃏', '#fde0ee')}<div class="tx"><b>Flashcards</b><span>${dueCount()} كارت مستحق من غلطاتك</span></div></button>` : ''}
      ${!S.profile && store.teacher ? `<button class="tile" data-act="lbopen">${ico('🏆', '#fff0c9')}<div class="tx"><b>Leaderboard</b><span>ترتيب الأسبوع والشهر بـ Smart Score</span></div></button>
      <button class="tile" data-act="asstudent">${ico('👁', '#fde0ee')}<div class="tx"><b>ادخل كطالب (معاينة)</b><span>جرّب الخطة والفلاش كاردز والامتحان زي الطالب</span></div></button>` : ''}
      <button class="tile" data-act="go" data-v="quizzes">${ico('📝', '#ffecc9')}<div class="tx"><b>كل الكويزات</b><span>قارن درجتك النهائية بكل من حلّ الكويز قبلك</span></div></button>
      ${store.teacher ? `<button class="tile alt" data-act="go" data-v="teacher">${ico('🧑‍🏫', '#ece0ff')}<div class="tx"><b>المدرّس</b><span>إنشاء الكويزات وإدارتها</span></div></button>` : ''}
    </div>
    ${S.installEv ? `<button class="btn primary install" data-act="install">ثبّت التطبيق على جهازك</button>` : ''}
    ${ios ? `<p class="hint">على الآيفون والآيباد: زر المشاركة ثم «إضافة إلى الشاشة الرئيسية» لتثبيت التطبيق.</p>` : ''}
    ${S.err ? `<p class="msg err">${esc(S.err)}</p>` : ''}`;
};
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEv = e; if (S.view === 'home') render(); });

/* ---------- curriculum navigation: Block > Week > Subject > Lecture ---------- */
const SUBICO = { Pathology: ['🔬', '#ffe0e0'], Microbiology: ['🦠', '#dff6d2'], Parasitology: ['🪱', '#ffecc9'], Pharmacology: ['💊', '#dde7ff'], Immunology: ['🛡️', '#d9f0ff'], Genetics: ['🧬', '#f0e0ff'], Physiology: ['🫀', '#ffdfe8'], Theme: ['💡', '#fff3bf'], Embryology: ['👶', '#ffe6d6'], Histology: ['🔍', '#e6deff'], Clinical: ['🩺', '#d5f3ea'], Biochemistry: ['⚗️', '#e3f7c9'], Radiology: ['🩻', '#e1e8f0'], Anatomy: ['🦴', '#f5e8d3'] };
const ico = (e, bg, cls = '') => `<i class="ico ${cls}" style="background:${bg}">${e}</i>`;
const subIco = (s, cls) => { const [e, bg] = SUBICO[s] || ['📘', '#e5ecff']; return ico(e, bg, cls); };
const BLKICO = { 1: ['🌱', '#dff6d2'], 2: ['🌿', '#d5f3ea'], 3: ['🌳', '#ffecc9'] };
const SUBCOL = ['#e8590c', '#1c7ed6', '#2f9e44', '#9c36b5', '#c2255c', '#0c8599', '#e67700', '#5f3dc4', '#d6336c', '#087f5b', '#495057', '#a61e4d', '#3b5bdb'];
const subColor = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return SUBCOL[h % SUBCOL.length]; };
const quizLec = z => z.lec || LINKS[z.id] || '';
const quizzesOf = key => S.quizzes.filter(z => quizLec(z) === key);
const findBlock = n => CURRICULUM.find(b => b.n === n);
const findWeek = n => { for (const b of CURRICULUM) { const w = b.weeks.find(x => x.n === n); if (w) return w; } return null; };
const findLec = key => { for (const b of CURRICULUM) for (const w of b.weeks) { const it = w.items.find(x => x.k === key); if (it) return { it, w, b }; } return null; };
const blockQuizCount = b => quizzesOf('block-' + b.n).length + b.weeks.reduce((s, w) => s + w.items.reduce((t, i) => t + quizzesOf(i.k).length, 0), 0);
const weekQuizCount = w => w.items.reduce((t, i) => t + quizzesOf(i.k).length, 0);
const quizCard = (z, ret) => `
  <article class="card qitem"><h3 dir="auto">${esc(z.title)}</h3><p class="meta">${z.questions.length} سؤال</p>
    <div class="row"><button class="btn primary small" data-act="start" data-id="${z.id}" data-ret="${ret}">ابدأ</button>
    <button class="btn small" data-act="startexam" data-id="${z.id}" data-ret="${ret}" dir="ltr">🕒 Exam</button>
    <button class="btn small" data-act="board" data-id="${z.id}" data-ret="${ret}">الترتيب</button>
    <button class="btn small" data-act="pdf" data-id="${z.id}" dir="ltr">📄 PDF</button></div></article>`;

views.blocks = () => {
  $app.innerHTML = `${backBar('Semester 1')}<div class="tiles">${CURRICULUM.map(b => {
    const lecs = b.weeks.reduce((s, w) => s + w.items.length, 0), nq = blockQuizCount(b);
    return `<button class="tile" data-act="blk" data-n="${b.n}">${ico(BLKICO[b.n][0], BLKICO[b.n][1])}<div class="tx"><b dir="ltr">Block ${b.n}</b><span dir="ltr">Weeks ${b.weeks[0].n}–${b.weeks[b.weeks.length - 1].n} · ${lecs} lectures · ${nq} quiz${nq === 1 ? '' : 'zes'}</span></div></button>`;
  }).join('')}</div>`;
};
views.block = () => {
  const b = findBlock(S.blk), comp = quizzesOf('block-' + b.n);
  $app.innerHTML = `${backBar('Block ' + b.n, 'blocks')}
    <label class="hint" for="name">اسمك (يظهر في الترتيب)</label>
    <input class="inp" id="name" maxlength="30" value="${esc(S.name)}" placeholder="اكتب اسمك" autocomplete="nickname">
    <p class="msg err">${esc(S.err)}</p>
    ${comp.length ? `<h3 class="lbt" dir="ltr">Comprehensive</h3><div class="list">${comp.map(z => quizCard(z, 'block')).join('')}</div>` : ''}
    <h3 class="lbt" dir="ltr">Weeks</h3>
    <div class="tiles">${b.weeks.map(w => {
      const nq = weekQuizCount(w), subs = [...new Set(w.items.map(i => i.s))];
      return `<button class="tile" data-act="wk" data-n="${w.n}">${ico('📅', BLKICO[b.n][1])}<div class="tx"><b dir="ltr">Week ${w.n}</b><span dir="ltr">${w.items.length} lectures · ${nq} quiz${nq === 1 ? '' : 'zes'}</span><span class="chipsub" dir="ltr">${subs.map(s => (SUBICO[s] || ['📘'])[0]).join(' ')}</span></div></button>`;
    }).join('')}</div>`;
};
views.week = () => {
  const w = findWeek(S.wk), groups = {};
  w.items.forEach(i => (groups[i.s] = groups[i.s] || []).push(i));
  $app.innerHTML = `${backBar('Week ' + w.n, 'block')}` + Object.keys(groups).map(s => `
    <h3 class="lbt subh" dir="ltr">${subIco(s, 'sm')}<span>${esc(s)}</span></h3>
    <div class="list">${groups[s].map(i => {
      const nq = quizzesOf(i.k).length, g = GAMES[i.k];
      return `<button class="tile lec" data-act="lec" data-k="${i.k}">${subIco(i.s)}<div class="tx"><b dir="ltr">${esc(i.c)}</b>
        <span dir="ltr">${g ? '🎮 Game' + (nq ? ' · ' : '') : ''}${nq ? nq + ' quiz' + (nq === 1 ? '' : 'zes') : (g ? '' : 'Coming soon')}</span></div></button>`;
    }).join('')}</div>`).join('');
};
views.lecture = () => {
  const f = findLec(S.lec), qz = quizzesOf(S.lec), g = GAMES[S.lec];
  $app.innerHTML = `${backBar(f.it.c, 'week')}
    <p class="sub" dir="ltr"><b>${esc(f.it.s)}</b> · Block ${f.b.n} · Week ${f.w.n}</p>
    <label class="hint" for="name">اسمك (يظهر في الترتيب)</label>
    <input class="inp" id="name" maxlength="30" value="${esc(S.name)}" placeholder="اكتب اسمك" autocomplete="nickname">
    <p class="msg err">${esc(S.err)}</p>
    ${g ? `<a class="tile" href="${g.url}" style="text-decoration:none;color:inherit;margin-bottom:12px">${ico('🎮', '#ffe0e0')}<div class="tx"><b>${esc(g.title)}</b><span>مراجعة بالتفاعل وبدون ضغط</span></div></a>` : ''}
    ${qz.length ? `<div class="list">${qz.map(z => quizCard(z, 'lecture')).join('')}</div>` : ''}
    ${!g && !qz.length ? `<div class="card empty" dir="ltr">Coming soon. Quizzes for this lecture will appear here automatically.</div>` : ''}`;
};

/* ---------- quizzes list + solo play ---------- */
views.quizzes = () => {
  const list = S.quizzes.length ? S.quizzes.map(z => `
    <article class="card qitem"><h3 dir="auto">${esc(z.title)}</h3><p class="meta">${z.questions.length} سؤال</p>
      <div class="row"><button class="btn primary small" data-act="start" data-id="${z.id}">ابدأ</button>
      <button class="btn small" data-act="startexam" data-id="${z.id}" dir="ltr">🕒 Exam</button>
      <button class="btn small" data-act="board" data-id="${z.id}">الترتيب</button>
      <button class="btn small" data-act="pdf" data-id="${z.id}" dir="ltr">📄 PDF</button></div></article>`).join('')
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
    return { q: q.q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct), ref: q.ref || [z.id, z.questions.indexOf(q)] };
  });
  S.play = { quiz: z, lang: langOf(z), qs, i: 0, answered: null, revealed: new Set(), score: 0, log: [], t0: Date.now() };
  go('play');
}
views.play = () => {
  const p = S.play, q = p.qs[p.i], total = p.qs.length, done = p.answered !== null, L = T[p.lang];
  const gotIt = done && p.answered === q.correct;
  $app.innerHTML = `<div dir="${L.dir}">
    <div class="prog"><button class="link" data-act="quit">${L.exit}</button>
      <div class="bar"><i style="width:${((p.i + (done ? 1 : 0)) / total) * 100}%"></i></div><span dir="ltr">${p.i + 1} / ${total}</span>${S.profile ? `<button class="mark ${PG.loadMarks(S.profile.key).has(q.ref[0] + '#' + q.ref[1]) ? 'on' : ''}" data-act="mark" aria-label="Mark">⚑</button>` : ''}</div>
    <div class="question">${esc(q.q)}</div>
    <div class="opts" aria-live="polite">${optsHtml(q, L, { reveal: p.revealed, mine: p.answered, act: 'pick', dim: done })}</div>
    ${done ? `<div class="verdict ${gotIt ? 'ok' : 'bad'}">${gotIt ? L.ok : L.bad}</div><p class="tip">${L.tip}</p>
      <button class="btn primary next" data-act="next">${p.i + 1 < total ? L.next : L.result}</button>` : ''}</div>`;
};
async function finishSolo() {
  const p = S.play, timeMs = Date.now() - p.t0, total = p.qs.length;
  S.result = { quizId: p.quiz.id, title: p.quiz.title, lang: p.lang, score: p.score, total, timeMs, custom: !!p.quiz.custom };
  if (S.profile) {
    const at = { key: S.profile.key, name: S.profile.name, at: Date.now(), quizId: p.quiz.id, custom: !!p.quiz.custom, score: p.score, total, timeMs, hide: PG.getHide() ? 1 : 0, ans: p.log.map(x => [x.ref[0], x.ref[1], x.ok ? 1 : 0]) };
    S.att = PG.addAttempt(S.profile.key, at);
    try { store.saveAttempt(at).catch(e => console.warn('attempt sync', e)); } catch (e) { console.warn('attempt sync', e); }
  }
  go('result', { rows: [] });
  if (p.quiz.custom) return;
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
    ${r.custom ? '' : `<div class="card rankbox">${idx >= 0 ? `<p class="hint">ترتيبك بين من حلّوا الكويز</p><div class="big">المركز ${idx + 1} من ${rows.length}</div>` : `<p class="hint">جاري حساب ترتيبك…</p>`}</div>`}
    ${S.err ? `<p class="msg err">${esc(S.err)}</p>` : ''}
    ${r.custom ? '' : `<h3 class="lbt">لوحة الصدارة</h3>${lbHtml(rows, { me: store.uid, limit: 10 })}`}
    <h3 class="lbt">مراجعة إجاباتك</h3>
    <div dir="${L.dir}"><ul class="rev">${p.log.map((x, i) => `<li class="${x.ok ? 'y' : 'n'}"><span class="ic">${x.ok ? '✓' : '✗'}</span>
      <div>${i + 1}. ${esc(x.q)}<small>${L.correctIs}${esc(x.correct)}</small></div></li>`).join('')}</ul></div>
    <div class="row"><button class="btn primary" data-act="again">إعادة الكويز</button>${S.profile ? '<button class="btn" data-act="go" data-v="perf">📊 تقدمك</button>' : ''}<button class="btn" data-act="go" data-v="home">الرئيسية</button></div>`;
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
    : `<div class="card empty">لا توجد كويزات بعد. أنشئ كويزًا جديدًا أو استورده من كود JSON.</div>`;
  $app.innerHTML = `${backBar('لوحة المدرّس')}
    <div class="row"><button class="btn primary" data-act="new">+ كويز جديد</button>
      <button class="btn" data-act="loadready">تحميل الكويزات الجاهزة</button>
      <button class="btn" data-act="tdash">📈 لوحة المتابعة</button>
      ${S.quizzes.length ? (S.confirmAll ? '<button class="btn danger" data-act="delall">تأكيد: حذف كل الكويزات</button>' : '<button class="btn" data-act="askall">حذف كل الكويزات</button>') : ''}
      <button class="btn" data-act="logout">خروج</button></div>
    <p class="msg ${S.err ? 'err' : ''}">${esc(S.err || S.info || '')}</p>
    <div class="list">${list}</div>
    <details><summary class="link">استيراد كويز من كود JSON</summary>
      <textarea class="inp" id="impText" rows="4" placeholder="الصق الكود هنا"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn small" data-act="import">استيراد</button></div></details>`;
};

/* editor */
const lecOptions = sel => '<option value="">Not linked</option>' + CURRICULUM.map(b => `<optgroup label="Block ${b.n}"><option value="block-${b.n}" ${sel === 'block-' + b.n ? 'selected' : ''}>Block ${b.n}: Comprehensive</option>` +
  b.weeks.map(w => w.items.map(i => `<option value="${i.k}" ${sel === i.k ? 'selected' : ''}>W${w.n} · ${esc(i.s)} · ${esc(i.c)}</option>`).join('')).join('') + '</optgroup>').join('');
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
    <label class="hint" for="lec" style="display:block;margin-top:10px">المحاضرة المرتبط بها (تظهر للطلبة في المنهج)</label>
    <select class="inp" id="lec" dir="ltr">${lecOptions(d.lec || LINKS[d.id] || '')}</select>
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
    title: String(o.title), lang: o.lang === 'en' ? 'en' : 'ar', lec: o.lec ? String(o.lec) : '',
    questions: o.questions.map(q => ({ q: String(q.q || ''), ...(q.topic ? { topic: String(q.topic) } : {}), correct: +q.correct || 0, options: (q.options || []).map(x => ({ t: String(x.t || ''), e: String(x.e || '') })) }))
  };
}

/* ---------- printable study sheet (Save as PDF) ---------- */
function quizPdf(z) {
  if (!z) return;
  const L = 'ABCDEFGH';
  const body = z.questions.map((q, i) => {
    const opts = q.options.filter(o => o.t.trim()).map((o, k) => {
      const ok = q.options[q.correct] === o;
      return `<div class="o ${ok ? 'ok' : 'no'}"><div class="ot"><span class="lt">${L[k]}</span><span class="tx">${esc(o.t)}</span><span class="tag">${ok ? '&#10003; Correct' : '&#10007; Wrong'}</span></div>${o.e ? `<div class="ex">${esc(o.e)}</div>` : ''}</div>`;
    }).join('');
    return `<section class="q"><h2><span class="n">${i + 1}</span>${esc(q.q)}</h2>${opts}</section>`;
  }).join('');
  const html = `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><title>${esc(z.title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><style>
@page{size:A4;margin:14mm}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#23332c;margin:0;padding:18px;background:#fff;max-width:820px;margin-inline:auto}
header{border-bottom:3px solid #4fb58a;padding-bottom:10px;margin-bottom:16px}
header h1{margin:0;font-size:22px;color:#1f6b4d}header p{margin:4px 0 0;color:#5d7268}header .by{font-weight:700;color:#1f6b4d}footer{margin-top:18px;padding:12px 14px;border-top:3px solid #4fb58a;background:#eaf7f0;border-radius:10px;font-size:12.5px;color:#2b5b45;break-inside:avoid;word-break:break-all}
.bar{background:#eaf7f0;border:1px solid #c9e9d9;border-radius:10px;padding:8px 12px;margin-bottom:16px;font-size:13px;color:#2b5b45}
.q{break-inside:avoid;page-break-inside:avoid;margin:0 0 18px;padding:12px 14px;border:1px solid #e1ebe6;border-radius:14px;background:#fcfefd}
h2{font-size:15px;margin:0 0 10px;display:flex;gap:10px;align-items:flex-start}
.n{flex:none;background:#4fb58a;color:#fff;border-radius:50%;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-size:13px}
.o{margin:6px 0;padding:8px 10px;border-radius:10px;border:1px solid #e6ece9;background:#f7f9f8}
.o.ok{background:#dff5e8;border:1.5px solid #3aa876}
.o.no{background:#fdf1f0;border-color:#f2d3d0}
.ot{display:flex;gap:8px;align-items:baseline}
.lt{font-weight:700;color:#5d7268;flex:none}.ok .lt{color:#1f7a52}
.tx{flex:1;font-weight:600}.ok .tx{color:#14603f}
.tag{flex:none;font-size:12px;font-weight:700}.ok .tag{color:#1f7a52}.no .tag{color:#c0524a}
.ex{margin:4px 0 0 22px;font-size:13px;color:#42554c}
.pbtn{position:fixed;top:10px;right:10px;background:#4fb58a;color:#fff;border:0;border-radius:12px;padding:10px 16px;font-size:14px;font-weight:700;cursor:pointer}
@media print{.pbtn,.bar{display:none}body{padding:0}}
</style></head><body>
<button class="pbtn" onclick="window.print()">Save as PDF</button>
<header><h1>${esc(z.title)}</h1><p>${z.questions.length} questions · correct answers in green · every choice explained</p><p class="by">By ${esc(INSTRUCTOR.name)} · ${esc(INSTRUCTOR.title)}</p></header>
<div class="bar">Tip: tap <b>Save as PDF</b> and choose "Save as PDF" as the printer.</div>
${body}
<footer><b>${esc(INSTRUCTOR.name)}</b> · ${esc(INSTRUCTOR.title)}<br>${esc(INSTRUCTOR.course)}<br>Telegram: ${esc(INSTRUCTOR.links.telegram)}<br>YouTube: ${esc(INSTRUCTOR.links.youtube)}<br>WhatsApp: ${esc(INSTRUCTOR.links.whatsapp)}<br>X: ${esc(INSTRUCTOR.links.x)}</footer>
<script>setTimeout(function(){try{window.print()}catch(e){}},500)<\/script>
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) { S.err = 'اسمح بالنوافذ المنبثقة عشان يتفتح ملف الـ PDF.'; render(); return; }
  w.document.open(); w.document.write(html); w.document.close();
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
    case 'go': S.confirmAll = false; go(b.dataset.v); break;
    case 'install': S.installEv.prompt(); S.installEv = null; render(); break;
    case 'blk': go('block', { blk: +b.dataset.n }); break;
    case 'wk': go('week', { wk: +b.dataset.n }); break;
    case 'lec': go('lecture', { lec: b.dataset.k }); break;
    case 'start': {
      S.ret = b.dataset.ret || 'quizzes';
      if (!S.name.trim()) { S.err = 'اكتب اسمك الأول.'; render(); break; }
      localStorage.setItem(NAME_KEY, S.name.trim()); startSolo(quiz()); break; }
    case 'board': S.ret = b.dataset.ret || 'quizzes'; openBoard(quiz(), S.ret); break;
    case 'pdf': quizPdf(quiz()); break;
    case 'tboard': openBoard(quiz(), 'teacher'); break;
    case 'pick': {
      const p = S.play, q = p.qs[p.i];
      if (p.answered === null) {
        p.answered = oi; p.revealed.add(oi); p.revealed.add(q.correct);
        const ok = oi === q.correct; if (ok) p.score++;
        p.log.push({ q: q.q, ok, correct: q.options[q.correct].t, ref: q.ref });
      } else p.revealed.add(oi);
      render(); break; }
    case 'next': {
      const p = S.play;
      if (p.i + 1 < p.qs.length) { p.i++; p.answered = null; p.revealed = new Set(); render(); window.scrollTo(0, 0); } else finishSolo();
      break; }
    case 'again': startSolo(S.quizzes.find(z => z.id === S.play.quiz.id) || S.play.quiz); break;
    case 'quit': go(S.ret || 'quizzes'); break;
    case 'slogin': await studentLogin(); break;
    case 'slogout': PG.clearProfile(); S.profile = null; S.att = []; S.name = ''; go('home'); break;
    case 'startq': { const z = S.quizzes.find(x => x.id === id); if (z) { S.ret = 'perf'; startSolo(z); } break; }
    case 'startexam': { const z = S.quizzes.find(x => x.id === id); if (z) { S.ret = b.dataset.ret || 'quizzes'; startExam(z); } break; }
    case 'xpick': { const p = S.play; p.ans[p.i] = oi; render(); break; }
    case 'xprev': S.play.i = Math.max(0, S.play.i - 1); render(); window.scrollTo(0, 0); break;
    case 'xnext': S.play.i = Math.min(S.play.qs.length - 1, S.play.i + 1); render(); window.scrollTo(0, 0); break;
    case 'xgo': S.play.i = oi; render(); window.scrollTo(0, 0); break;
    case 'xend': S.play.confirm = true; render(); break;
    case 'xcancel': S.play.confirm = false; render(); break;
    case 'xend2': await finishExam(); break;
    case 'ptab': S.ptab = id; S.psub = ''; render(); window.scrollTo(0, 0); break;
    case 'psub': S.psub = id; render(); window.scrollTo(0, 0); break;
    case 'cardsopen': openFc('due'); break;
    case 'fctab': S.fctab = id; render(); break;
    case 'fcstart': runDeck(dueIds()); break;
    case 'fcknown': runDeck(knownIds()); break;
    case 'fcone': runDeck([id], false); break;
    case 'fcback': openFc(); break;
    case 'asstudent': S.forceLogin = true; render(); break;
    case 'flip': S.cd.flip = !S.cd.flip; render(); break;
    case 'cardyes': case 'cardno': { const d = S.cd; PG.rateCard(S.profile.key, d.deck[d.i], act === 'cardyes', +id); if (act === 'cardyes') d.known++; d.i++; d.flip = false; render(); window.scrollTo(0, 0); break; }
    case 'lbopen': openLb('week'); break;
    case 'lbp': openLb(id); break;
    case 'lbhide': PG.setHide(!PG.getHide()); render(); break;
    case 'mark': { if (S.profile) { const q = S.play.qs[S.play.i]; PG.toggleMark(S.profile.key, q.ref[0] + '#' + q.ref[1]); render(); } break; }
    case 'setexam': { const d = document.getElementById('exd').value; if (d) PG.setExam(S.profile.key, { date: d }); render(); break; }
    case 'clearexam': PG.setExam(S.profile.key, null); render(); break;
    case 'practicemarked': case 'practice': case 'review': {
      const z = buildPractice(act === 'practicemarked' ? 'marked' : act, b.dataset.subject, b.dataset.topic);
      if (!z) { S.err = 'لا توجد أسئلة كافية لهذا الموضوع بعد.'; render(); break; }
      S.ret = 'perf'; startSolo(z); break; }
    case 'tdash':
      go('tdash', { tatt: [], derr: '' });
      subs.push(store.watchAttempts(r => { S.tatt = r; if (S.view === 'tdash') render(); }, e => { console.error(e); S.derr = 'تعذر قراءة المحاولات. انشر قواعد Firestore الجديدة من ملف firestore.rules.'; if (S.view === 'tdash') render(); }));
      break;
    case 'csv': exportCsv(); break;
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
    case 'loadready': {
      S.info = 'جاري التحميل…'; S.err = ''; render();
      try {
        const idx = await (await fetch('quizzes/index.json', { cache: 'no-cache' })).json();
        let n = 0;
        for (const f of idx) {
          const z = await (await fetch('quizzes/' + f, { cache: 'no-cache' })).json();
          if (!z.id) continue;
          await store.saveQuiz({ id: String(z.id), ...normalizeQuiz(z) }); n++;
        }
        S.info = n ? `تم تحميل ${n} كويز (الموجود بنفس الرقم اتحدّث).` : 'لا توجد كويزات جاهزة بعد.';
      } catch (err) { console.error(err); S.info = ''; S.err = 'تعذر التحميل. تأكد أنك مسجّل كمدرّس وأن ملفات quizzes/ سليمة.'; }
      render(); break; }
    case 'askall': S.confirmAll = true; render(); break;
    case 'delall': {
      S.confirmAll = false;
      try { for (const z of [...S.quizzes]) await store.deleteQuiz(z.id); S.err = ''; S.info = 'تم حذف كل الكويزات.'; } catch (err) { console.error(err); S.err = 'تعذر الحذف. تأكد أنك مسجّل كمدرّس.'; }
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
      const out = clone(S.draft); delete out.isNew; if (!out.lec) delete out.lec;
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
  if (t.id === 'lec') { S.draft.lec = t.value; return; }
  const f = t.dataset.f; if (!f) return;
  const q = S.draft.questions[+t.dataset.qi], oi = +t.dataset.oi;
  if (f === 'q') q.q = t.value; else if (f === 'correct') q.correct = oi; else q.options[oi][f] = t.value;
});

// دخول المدرّس مخفي عن الطلبة: افتح الرابط مع #teacher، أو اضغط 5 مرات سريعة على عنوان «كويزاتي»
const openTeacher = () => { if (S.view !== 'teacher') go('teacher'); };
if (location.hash === '#teacher') S.view = 'teacher';
window.addEventListener('hashchange', () => { if (location.hash === '#teacher') openTeacher(); });
let taps = [];
$app.addEventListener('click', e => {
  if (!e.target.closest('h1')) return;
  const now = Date.now(); taps = taps.filter(t => now - t < 2500); taps.push(now);
  if (taps.length >= 5) { taps = []; openTeacher(); }
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
render();

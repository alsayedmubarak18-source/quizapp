// تتبع التقدم: كل المحاولات محفوظة على الجهاز أولًا، وبتتزامن مع Firebase (لو متاح) عشان تظهر على أي جهاز ولوحة المدرّس.
const PKEY = 'qz-profile', AKEY = k => 'qz-attempts:' + k;
export const TARGET = 0.8, MIN_TOPIC = 3, MIN_TOTAL = 20;

export const normKey = name => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
export function getProfile() { try { return JSON.parse(localStorage.getItem(PKEY)) || null; } catch (e) { return null; } }
export function setProfile(name) {
  const p = { name: name.trim().slice(0, 30), key: normKey(name) };
  localStorage.setItem(PKEY, JSON.stringify(p)); return p;
}
export function clearProfile() { localStorage.removeItem(PKEY); }

export function loadAttempts(key) { try { return JSON.parse(localStorage.getItem(AKEY(key))) || []; } catch (e) { return []; } }
function persist(key, list) { try { localStorage.setItem(AKEY(key), JSON.stringify(list.slice(-400))); } catch (e) {} }
const same = (a, b) => a.at === b.at && a.quizId === b.quizId;
export function addAttempt(key, a) { const l = loadAttempts(key); l.push(a); persist(key, l); return l; }
export function mergeAttempts(key, remote) {
  const l = loadAttempts(key);
  remote.forEach(r => { if (!l.some(x => same(x, r))) l.push(r); });
  l.sort((a, b) => a.at - b.at); persist(key, l); return l;
}

/* ---- analytics ---- */
// meta(quizId, qi) => { subject, lec, lecName, topic, week, block, text } أو null
export function analyse(attempts, meta) {
  const q = new Map(), subj = new Map(), topic = new Map(), lec = new Map();
  let A = 0, C = 0;
  const bump = (m, k, init, ok) => { let o = m.get(k); if (!o) { o = { ...init, n: 0, c: 0 }; m.set(k, o); } o.n++; if (ok) o.c++; return o; };
  attempts.slice().sort((a, b) => a.at - b.at).forEach(at => (at.ans || []).forEach(([quizId, qi, ok]) => {
    const m = meta(quizId, qi); if (!m) return;
    const ok1 = !!ok; A++; if (ok1) C++;
    const id = quizId + '#' + qi, o = bump(q, id, { quizId, qi }, ok1); o.last = ok1; o.lastAt = at.at;
    bump(subj, m.subject, { subject: m.subject }, ok1);
    bump(lec, m.lec, { lec: m.lec, name: m.lecName, subject: m.subject, week: m.week, block: m.block }, ok1);
    bump(topic, m.subject + '|' + m.topic, { subject: m.subject, topic: m.topic }, ok1);
  }));
  const acc = o => (o.n ? o.c / o.n : 0);
  const weak = [...topic.values()].filter(t => t.n >= MIN_TOPIC && acc(t) < TARGET).sort((a, b) => acc(a) - acc(b) || b.n - a.n);
  const mistakes = [...q.values()].filter(x => !x.last);
  let proj = null;
  if (A >= MIN_TOTAL && weak.length) {
    const top = weak.slice(0, 3);
    const gain = top.reduce((s, t) => s + t.n * (TARGET - acc(t)), 0);
    proj = { now: C / A, next: Math.min(1, (C + gain) / A), topics: top };
  }
  return { A, C, acc, qMap: q, subj, topic, lec, weak, mistakes, proj, unique: q.size };
}

export function streak(attempts) {
  const day = t => { const d = new Date(t); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); };
  const days = new Set(attempts.map(a => day(a.at)));
  let n = 0, d = new Date();
  if (!days.has(day(d))) d.setDate(d.getDate() - 1);
  while (days.has(day(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const pctColor = p => (p >= 0.8 ? 'g' : p >= 0.6 ? 'y' : 'r');

/* ---- marked questions + exam planner + trend ---- */
const MKEY = k => 'qz-marks:' + k, EKEY = k => 'qz-exam:' + k;
export function loadMarks(key) { try { return new Set(JSON.parse(localStorage.getItem(MKEY(key))) || []); } catch (e) { return new Set(); } }
export function toggleMark(key, id) {
  const s = loadMarks(key); s.has(id) ? s.delete(id) : s.add(id);
  try { localStorage.setItem(MKEY(key), JSON.stringify([...s])); } catch (e) {}
  return s;
}
export function getExam(key) { try { return JSON.parse(localStorage.getItem(EKEY(key))) || null; } catch (e) { return null; } }
export function setExam(key, e) { try { e ? localStorage.setItem(EKEY(key), JSON.stringify(e)) : localStorage.removeItem(EKEY(key)); } catch (x) {} }

// نقاط الأداء بمرور الوقت (نسبة كل محاولة) + الفرق بين النصف الأول والتاني
export function trend(attempts) {
  const pts = attempts.filter(a => a.total).map(a => ({ at: a.at, p: a.score / a.total, ms: a.timeMs || 0, n: a.total }));
  let delta = null;
  if (pts.length >= 4) {
    const h = Math.floor(pts.length / 2), avg = l => l.reduce((s, x) => s + x.p, 0) / l.length;
    delta = (avg(pts.slice(h)) - avg(pts.slice(0, h))) * 100;
  }
  const secs = pts.filter(x => x.ms).reduce((s, x) => s + x.ms, 0), qn = pts.filter(x => x.ms).reduce((s, x) => s + x.n, 0);
  return { pts, delta, secPerQ: qn ? secs / qn / 1000 : 0 };
}
// الجاهزية: آخر 5 محاولات (70%) + نسبة الأسئلة اللي غطيتها (30%). تقدير مش توقع حقيقي.
export function readiness(attempts, unique, total) {
  const last = attempts.slice(-5).filter(a => a.total);
  if (!last.length || !total) return null;
  const recent = last.reduce((s, a) => s + a.score, 0) / last.reduce((s, a) => s + a.total, 0);
  const cover = Math.min(1, unique / total);
  return { score: 0.7 * recent + 0.3 * cover, recent, cover };
}

/* ---- flashcards (Leitner مبسّط) + إخفاء الاسم ---- */
const CKEY = k => 'qz-cards:' + k, HKEY = 'qz-hide';
const GAPS = [0, 1, 3, 7, 14, 30]; // أيام الانتظار حسب الصندوق
export function loadCards(key) { try { return JSON.parse(localStorage.getItem(CKEY(key))) || {}; } catch (e) { return {}; } }
export function rateCard(key, id, knew, gapMs) {
  const c = loadCards(key), now = Date.now();
  c[id] = { known: knew ? 1 : 0, gap: knew ? gapMs : 0, due: now + (knew ? gapMs : 0), at: now };
  try { localStorage.setItem(CKEY(key), JSON.stringify(c)); } catch (e) {}
  return c;
}
export const cardKnown = o => !!o && (o.known !== undefined ? !!o.known : o.box > 0);
export const isDue = (cards, id) => !cards[id] || cards[id].due <= Date.now();
export const getHide = () => localStorage.getItem(HKEY) === '1';
export const setHide = v => { try { localStorage.setItem(HKEY, v ? '1' : '0'); } catch (e) {} };

// الترتيب: Smart Score = الصح × الدقة (يكافئ الكمية والدقة معًا)
export function leaderboard(rows, sinceMs, minAnswers = 10) {
  const by = new Map();
  rows.filter(a => a.at >= sinceMs).sort((a, b) => a.at - b.at).forEach(a => {
    const o = by.get(a.key) || { key: a.key, name: a.name, quizzes: 0, n: 0, c: 0, hide: false };
    o.quizzes++; o.name = a.name || o.name; o.hide = !!a.hide;
    (a.ans || []).forEach(x => { o.n++; if (x[2]) o.c++; }); by.set(a.key, o);
  });
  return [...by.values()].filter(o => o.n >= minAnswers).map(o => ({ ...o, acc: o.c / o.n, smart: Math.round(o.c * o.c / o.n) }))
    .sort((a, b) => b.smart - a.smart || b.acc - a.acc);
}

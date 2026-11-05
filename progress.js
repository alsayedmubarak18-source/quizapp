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

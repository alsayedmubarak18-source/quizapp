// طبقة البيانات: Firebase لو الإعدادات موجودة في config.js، وإلا وضع تجريبي على الجهاز نفسه.
import { firebaseConfig } from './config.js';
import { SEED } from './seed.js';

const FB_VERSION = '10.12.2';

async function makeFirebase(cfg) {
  const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
  const [{ initializeApp }, A, F] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-firestore.js')
  ]);
  const app = initializeApp(cfg);
  const auth = A.getAuth(app);
  const fs = F.getFirestore(app);
  let user = null;
  const cbs = new Set();

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('auth-timeout')), 10000);
    let done = false;
    A.onAuthStateChanged(auth, async u => {
      if (!u) {
        try { await A.signInAnonymously(auth); } catch (e) { clearTimeout(timer); reject(e); }
        return;
      }
      user = u;
      cbs.forEach(f => f());
      if (!done) { done = true; clearTimeout(timer); resolve(); }
    });
  });

  const col = (...p) => F.collection(fs, ...p);
  const clean = o => JSON.parse(JSON.stringify(o)); // يشيل undefined

  return {
    mode: 'firebase',
    get uid() { return user.uid; },
    get teacher() { return !!user.email; },
    get email() { return user.email; },
    onAuth(cb) { cbs.add(cb); return () => cbs.delete(cb); },
    signIn: (email, pw) => A.signInWithEmailAndPassword(auth, email, pw),
    signOut: () => A.signOut(auth),

    watchQuizzes(cb, err) {
      return F.onSnapshot(col('quizzes'), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), err);
    },
    saveQuiz(z) { const { id, ...rest } = z; return F.setDoc(F.doc(fs, 'quizzes', id), clean({ ...rest, updatedAt: Date.now() })); },
    deleteQuiz(id) { return F.deleteDoc(F.doc(fs, 'quizzes', id)); },

    async getMyScore(quizId) {
      const d = await F.getDoc(F.doc(fs, 'scores', quizId + '_' + user.uid));
      return d.exists() ? d.data() : null;
    },
    submitScore(s) { return F.setDoc(F.doc(fs, 'scores', s.quizId + '_' + user.uid), clean({ ...s, uid: user.uid, at: Date.now() })); },
    watchScores(quizId, cb) {
      return F.onSnapshot(F.query(col('scores'), F.where('quizId', '==', quizId), F.limit(1000)), s => cb(s.docs.map(d => d.data())));
    },

    saveAttempt(a) { return F.addDoc(col('attempts'), clean({ ...a, uid: user.uid })); },
    async fetchAttemptsByKey(key) {
      const s = await F.getDocs(F.query(col('attempts'), F.where('key', '==', key), F.limit(500)));
      return s.docs.map(d => d.data());
    },
    watchAttempts(cb, err) {
      return F.onSnapshot(F.query(col('attempts'), F.limit(5000)), s => cb(s.docs.map(d => d.data())), err);
    },

    createGame(code, g) { return F.setDoc(F.doc(fs, 'games', code), clean({ ...g, hostUid: user.uid, createdAt: Date.now() })); },
    updateGame(code, p) { return F.updateDoc(F.doc(fs, 'games', code), clean(p)); },
    watchGame(code, cb) { return F.onSnapshot(F.doc(fs, 'games', code), s => cb(s.exists() ? s.data() : null)); },
    setPlayer(code, p) { return F.setDoc(F.doc(fs, 'games', code, 'players', user.uid), clean(p), { merge: true }); },
    watchPlayers(code, cb) {
      return F.onSnapshot(col('games', code, 'players'), s => cb(s.docs.map(d => ({ uid: d.id, ...d.data() }))));
    }
  };
}

function makeDemo() {
  const KEY = 'qz-demo-db';
  const bc = 'BroadcastChannel' in self ? new BroadcastChannel('qz-demo') : null;
  const listeners = new Set();
  const bump = () => listeners.forEach(f => f());
  const read = () => {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    d.quizzes = d.quizzes || {}; d.scores = d.scores || {}; d.games = d.games || {}; d.players = d.players || {};
    return d;
  };
  const write = fn => {
    const d = read(); fn(d);
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
    if (bc) bc.postMessage(1);
    bump();
  };
  if (bc) bc.onmessage = bump;
  window.addEventListener('storage', bump);

  let uid = sessionStorage.getItem('qz-uid');
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('qz-uid', uid); }
  const st = { teacher: sessionStorage.getItem('qz-teacher') === '1', email: sessionStorage.getItem('qz-email') };

  if (!Object.keys(read().quizzes).length) write(d => SEED.forEach(z => { d.quizzes[z.id] = z; }));

  const watch = (sel, cb) => {
    let last = null;
    const f = () => { const v = sel(read()); const s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } };
    listeners.add(f); setTimeout(f, 0);
    return () => listeners.delete(f);
  };
  const clone = o => JSON.parse(JSON.stringify(o));

  return {
    mode: 'demo',
    get uid() { return uid; },
    get teacher() { return st.teacher; },
    get email() { return st.email; },
    onAuth() { return () => {}; },
    async signIn(email) { st.teacher = true; st.email = email; sessionStorage.setItem('qz-teacher', '1'); sessionStorage.setItem('qz-email', email); },
    async signOut() { st.teacher = false; st.email = null; sessionStorage.removeItem('qz-teacher'); sessionStorage.removeItem('qz-email'); },

    watchQuizzes(cb) { return watch(d => Object.entries(d.quizzes).map(([id, z]) => ({ ...z, id })), cb); },
    async saveQuiz(z) { write(d => { d.quizzes[z.id] = clone(z); }); },
    async deleteQuiz(id) { write(d => { delete d.quizzes[id]; }); },

    async getMyScore(quizId) { return read().scores[quizId + '_' + uid] || null; },
    async submitScore(s) { write(d => { d.scores[s.quizId + '_' + uid] = { ...s, uid, at: Date.now() }; }); },
    watchScores(quizId, cb) { return watch(d => Object.values(d.scores).filter(s => s.quizId === quizId), cb); },

    async saveAttempt(a) { write(d => { (d.attempts = d.attempts || []).push({ ...clone(a), uid }); }); },
    async fetchAttemptsByKey(key) { return (read().attempts || []).filter(a => a.key === key); },
    watchAttempts(cb) { return watch(d => d.attempts || [], cb); },

    async createGame(code, g) { write(d => { d.games[code] = clone({ ...g, hostUid: uid, createdAt: Date.now() }); d.players[code] = {}; }); },
    async updateGame(code, p) { write(d => { if (d.games[code]) Object.assign(d.games[code], clone(p)); }); },
    watchGame(code, cb) { return watch(d => d.games[code] || null, cb); },
    async setPlayer(code, p) { write(d => { d.players[code] = d.players[code] || {}; d.players[code][uid] = { ...(d.players[code][uid] || {}), ...clone(p) }; }); },
    watchPlayers(code, cb) { return watch(d => Object.entries(d.players[code] || {}).map(([u, p]) => ({ uid: u, ...p })), cb); }
  };
}

export const store = firebaseConfig ? await makeFirebase(firebaseConfig) : makeDemo();

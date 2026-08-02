// auth.js — 登入 / 登出 / 登入狀態監聽（Firebase Modular Auth v10）
// 最小修改：本檔案為新增，不更動既有 Firestore / Storage / Dashboard 邏輯。
// SDK 無法載入時 available=false，所有守衛自動放行，不影響現有功能與測試。
window.T1 = window.T1 || {};

window.T1.auth = {
  available: false,
  _auth: null,
  _init: null,
  _listeners: [],
  _lastUser: null,
  _initialized: false,

  // 初始化 Auth 並開始監聽登入狀態；回傳 Promise
  init: function() {
    var self = this;
    if (self._init) return self._init;
    if (!window.T1.ensureFirebaseApp) { self.available = false; return Promise.resolve(); }
    self._init = window.T1.ensureFirebaseApp().then(function(r) {
      if (!r) { self.available = false; return; }
      self._auth = r.auth;
      self.available = true;
      // onAuthStateChanged 會等待 session 從 persistence 恢復完成後才回呼，
      // 因此回呼的 user 才是正確狀態（不可用同步 currentUser() 判斷）
      r.authMod.onAuthStateChanged(r.auth, function(user) {
        console.log('[T1 Auth] Auth State Changed:', user ? user.email : 'null');
        self._lastUser = user;
        self._initialized = true;
        self._notify(user);
      });
    });
    return self._init;
  },

  _notify: function(user) {
    var self = this;
    this._listeners.forEach(function(cb) { try { cb(user); } catch(e) {} });
  },

  // 訂閱登入狀態；若 onAuthStateChanged 已回呼過，補發「最後已知狀態」
  onAuthChange: function(cb) {
    this._listeners.push(cb);
    if (this._initialized) cb(this._lastUser);
  },

  currentUser: function() {
    return this._auth ? this._auth.currentUser : null;
  },

  // Email/Password 登入；保持登入（browserLocalPersistence）
  // 回傳 Promise<null | errorMessage>；成功時已導向 index.html
  handleLogin: function(email, password) {
    var self = this;
    return window.T1.ensureFirebaseApp().then(function(r) {
      if (!r) return 'Firebase Auth 無法載入，請稍後再試';
      return r.authMod.setPersistence(r.auth, r.authMod.browserLocalPersistence).then(function() {
        return r.authMod.signInWithEmailAndPassword(r.auth, email, password);
      }).then(function(userCred) {
        var u = userCred && userCred.user;
        console.log('[T1 Auth] Login Success:', u ? u.email : '');
        console.log('[T1 Auth] Current User:', self.currentUser() ? self.currentUser().email : 'null');
        console.log('[T1 Auth] Redirecting to index.html');
        window.location.href = 'index.html';
        return null;
      }).catch(function(err) {
        return err && err.message ? err.message : '登入失敗，請再試一次';
      });
    });
  },

  // 登出 → 返回 login.html
  signOut: function() {
    var self = this;
    return window.T1.ensureFirebaseApp().then(function(r) {
      if (!r) { window.location.href = 'login.html'; return; }
      return r.authMod.signOut(r.auth).then(function() {
        window.location.href = 'login.html';
      });
    }).catch(function(e) {
      console.warn('[T1 Auth] signOut failed:', e && e.message ? e.message : e);
      window.location.href = 'login.html';
    });
  }
};

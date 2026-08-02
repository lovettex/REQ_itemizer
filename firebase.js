// firebase.js — Firebase 設定與 Modular SDK 載入（v10，僅供 Auth 使用）
// 原則：最小修改。Firestore / Storage 仍由既有 firestore-db.js（compat SDK）負責，
// 本檔案只為 auth.js 提供 Firebase app 與 Auth 實例，不更動既有初始化流程。
window.T1 = window.T1 || {};

// 與 firestore-db.js 相同的 Firebase config（集中於此，之後可統一來源）
window.T1.firebaseConfig = {
  apiKey: "AIzaSyAseVgwwu17wyrh40k-2Pk6TGli-aPwAR0",
  authDomain: "rfq-itemizer.firebaseapp.com",
  projectId: "rfq-itemizer",
  storageBucket: "rfq-itemizer.firebasestorage.app",
  messagingSenderId: "127721074883",
  appId: "1:127721074883:web:a83cfaeae424d9680bf276"
};

// 動態載入 Firebase Modular SDK（透過 <script type="importmap"> 對應 gstatic CDN v10）
// 回傳 Promise<{ app, auth } | null>；SDK 無法載入時回傳 null（auth 停用，不影響其他功能）
window.T1.ensureFirebaseApp = function() {
  if (window.T1._appPromise) return window.T1._appPromise;
  window.T1._appPromise = (async function() {
    var mod = await import('firebase/app');
    var authMod = await import('firebase/auth');
    // compat 的 firestore-db.js 若已 initializeApp，直接取用既有 app；否則這裡建立
    var app = mod.getApps().length ? mod.getApp() : mod.initializeApp(window.T1.firebaseConfig);
    return { app: app, auth: authMod.getAuth(app), authMod: authMod };
  })().catch(function(err) {
    console.warn('[T1 Auth] Firebase Modular SDK 載入失敗（auth 停用）:', err && err.message ? err.message : err);
    window.T1._appPromise = null; // 允許之後重試
    return null;
  });
  return window.T1._appPromise;
};

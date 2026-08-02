// firestore-db.js — RFQ ITEMIZER 的 Firestore 抽象層
// 双写模式：localStorage 同步写（UI 即時） + Firestore 异步写（雲端備份）
(function() {
  'use strict';

  var LS_PAIRS = 't1-product-pairs';
  var LS_PROJECTS = 't1-projects';
  var COLLECTION = 't1_data';

  function lsRead(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
  }
  function lsWrite(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
  }

  var fs = {
    db: null,
    ready: false,
    config: {
      apiKey: "AIzaSyAseVgwwu17wyrh40k-2Pk6TGli-aPwAR0",
      authDomain: "rfq-itemizer.firebaseapp.com",
      projectId: "rfq-itemizer",
      storageBucket: "rfq-itemizer.firebasestorage.app",
      messagingSenderId: "127721074883",
      appId: "1:127721074883:web:a83cfaeae424d9680bf276"
    },

    init: function() {
      var self = this;
      if (typeof firebase === 'undefined') {
        console.warn('[T1 Firestore] Firebase SDK not loaded; using localStorage only.');
        return Promise.resolve(self._fallback());
      }
      try {
        if (!firebase.apps.length) firebase.initializeApp(self.config);
        this.db = firebase.firestore();
        this.ready = true;
      } catch(e) {
        console.warn('[T1 Firestore] init failed, using localStorage only:', e.message);
        return Promise.resolve(self._fallback());
      }
      return self.loadAll();
    },

    loadAll: function() {
      var self = this;
      if (!self.db) return Promise.resolve(self._fallback());
      return Promise.all([
        self.db.collection(COLLECTION).doc('pairs').get(),
        self.db.collection(COLLECTION).doc('projects').get()
      ]).then(function(results) {
        // 雲端為權威：doc 存在 → 用雲端資料；不存在 → 保留 localStorage 現有資料
        // （絕不以空陣列覆寫本地，避免 commit/push 後重新載入造成資料消失）
        var localPairs = lsRead(LS_PAIRS);
        var localProjects = lsRead(LS_PROJECTS);
        var out = { pairs: localPairs, projects: localProjects, cloud: { pairs: false, projects: false } };
        if (results[0].exists) {
          out.pairs = results[0].data().items || [];
          out.cloud.pairs = true;
        }
        if (results[1].exists) {
          out.projects = results[1].data().items || [];
          out.cloud.projects = true;
        }
        lsWrite(LS_PAIRS, out.pairs);
        lsWrite(LS_PROJECTS, out.projects);
        return out;
      }).catch(function(err) {
        console.warn('[T1 Firestore] loadAll failed, falling back to localStorage:', err.message);
        return self._fallback();
      });
    },

    // 網頁唯讀雲端：save 只寫 localStorage，不寫 Firestore（雲端資料以 Firebase 端為主）
    savePairs: function(pairs) {
      lsWrite(LS_PAIRS, pairs);
    },

    saveProjects: function(projects) {
      lsWrite(LS_PROJECTS, projects);
    },

    _fallback: function() {
      return { pairs: lsRead(LS_PAIRS), projects: lsRead(LS_PROJECTS) };
    }
  };

  window.T1 = window.T1 || {};
  window.T1.firestore = fs;

  // === T1.storage — Firebase Storage 抽象層（ZIP 上傳/下載）===
  var st = {
    ref: null,
    ready: false,

    init: function() {
      if (typeof firebase === 'undefined' || !firebase.storage) {
        console.warn('[T1 Storage] Firebase Storage SDK not loaded; upload disabled.');
        return false;
      }
      try {
        this.ref = firebase.storage();
        this.ready = true;
      } catch(e) {
        console.warn('[T1 Storage] init failed, upload disabled:', e.message);
        return false;
      }
      return true;
    },

    // 上傳 ZIP → Promise<{ storagePath, downloadUrl }>
    uploadZip: function(projectId, file) {
      var self = this;
      if (!self.ready || !self.ref) return Promise.reject(new Error('[T1 Storage] not ready'));
      var path = 'uploads/' + projectId + '/' + file.name;
      return self.ref.ref(path).put(file).then(function(snapshot) {
        return snapshot.ref.getDownloadURL().then(function(url) {
          return { storagePath: path, downloadUrl: url };
        });
      });
    },

    // 依 storagePath 取得下載 URL
    getDownloadUrl: function(storagePath) {
      var self = this;
      if (!self.ready || !self.ref) return Promise.reject(new Error('[T1 Storage] not ready'));
      return self.ref.ref(storagePath).getDownloadURL();
    }
  };
  st.init();
  window.T1.storage = st;
})();

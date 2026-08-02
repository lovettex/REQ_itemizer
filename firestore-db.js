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

  // 合併本地與雲端兩份陣列（以 id 去重）：
  // - 同 id 衝突 → 本地優先（本地為最近操作的一方）
  // - 雲端有而本地沒有的 → 補進來（不丟失雲端資料）
  // - 任一來源非陣列則忽略該來源
  function _mergeById(localArr, cloudArr) {
    var local = Array.isArray(localArr) ? localArr : [];
    var cloud = Array.isArray(cloudArr) ? cloudArr : [];
    var map = {};
    var order = [];
    function put(item) {
      if (!item || typeof item !== 'object') return;
      var key = item.id != null ? String(item.id) : null;
      if (key == null) { order.push(item); return; } // 無 id：直接保留
      if (!(key in map)) order.push(item);
      map[key] = item;
    }
    // 本地先（衝突時本地優先），雲端後（補缺）
    local.forEach(put);
    cloud.forEach(put);
    return order;
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
        // Storage 需在 initializeApp 之後才能初始化（firebase.storage() 需要已建立的 app）
        st.init();
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
        // 合併模式：本地（最近操作）與雲端（先前快照）以 id 合併，
        // 同 id 本地優先、雲端補缺 —— 任何一方的資料都不因重新載入而丟失
        var localPairs = lsRead(LS_PAIRS);
        var localProjects = lsRead(LS_PROJECTS);
        var cloudPairs = results[0].exists ? (results[0].data().items || []) : [];
        var cloudProjects = results[1].exists ? (results[1].data().items || []) : [];
        var out = {
          pairs: _mergeById(localPairs, cloudPairs),
          projects: _mergeById(localProjects, cloudProjects),
          cloud: { pairs: results[0].exists, projects: results[1].exists }
        };
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
  window.T1.storage = st;
})();

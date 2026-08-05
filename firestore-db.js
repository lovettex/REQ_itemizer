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
        self.db.collection(COLLECTION).doc('projects').get(),
        self.db.collection(COLLECTION).doc('mixmatch').get(),
        self.db.collection(COLLECTION).doc('viewerPos').get(),
        self.db.collection(COLLECTION).doc('wiki').get()
      ]).then(function(results) {
        // 合併模式：本地（最近操作）與雲端（先前快照）以 id 合併，
        // 同 id 本地優先、雲端補缺 —— 任何一方的資料都不因重新載入而丟失
        var localPairs = lsRead(LS_PAIRS);
        var localProjects = lsRead(LS_PROJECTS);
        var localMixNotes = (function(){ try { return JSON.parse(localStorage.getItem('t1-mixmatch-notes') || '{}'); } catch(e) { return {}; } })();
        var localViewerPos = (function(){ try { return JSON.parse(localStorage.getItem('t1-viewer-positions') || '{}'); } catch(e) { return {}; } })();
        var localWiki = (function(){ try { return JSON.parse(localStorage.getItem('t1-wiki-entries') || '[]'); } catch(e) { return []; } })();
        var cloudPairs = results[0].exists ? (results[0].data().items || []) : [];
        var cloudProjects = results[1].exists ? (results[1].data().items || []) : [];
        var cloudMixNotes = results[2].exists ? (results[2].data().items || {}) : {};
        var cloudViewerPos = results[3].exists ? (results[3].data().items || {}) : {};
        var cloudWiki = results[4].exists ? (results[4].data().items || []) : [];
        var out = {
          pairs: _mergeById(localPairs, cloudPairs),
          projects: _mergeById(localProjects, cloudProjects),
          mixNotes: Object.assign({}, cloudMixNotes, localMixNotes), // 備註：本地優先、雲端補缺
          viewerPos: Object.assign({}, cloudViewerPos, localViewerPos), // 檢視位置：本地優先、雲端補缺
          wiki: _mergeById(localWiki, cloudWiki), // wiki：本地優先、雲端補缺
          cloud: { pairs: results[0].exists, projects: results[1].exists, mixmatch: results[2].exists, viewerPos: results[3].exists, wiki: results[4].exists }
        };
        lsWrite(LS_PAIRS, out.pairs);
        lsWrite(LS_PROJECTS, out.projects);
        localStorage.setItem('t1-mixmatch-notes', JSON.stringify(out.mixNotes));
        localStorage.setItem('t1-viewer-positions', JSON.stringify(out.viewerPos));
        localStorage.setItem('t1-wiki-entries', JSON.stringify(out.wiki));
        return out;
      }).catch(function(err) {
        console.warn('[T1 Firestore] loadAll failed, falling back to localStorage:', err.message);
        return self._fallback();
      });
    },

    // save：localStorage 同步寫（UI 即時） + Firestore 異步寫（雲端備份，與 localStorage 同時觸發）
    savePairs: function(pairs) {
      lsWrite(LS_PAIRS, pairs);
      if (!this.db) return;
      this.db.collection(COLLECTION).doc('pairs')
        .set({ items: pairs, updatedAt: new Date().toISOString() })
        .catch(function(e) { console.warn('[T1 Firestore] savePairs failed:', e.message); if (typeof toast === 'function') toast('雲端同步失敗，資料僅存本機'); });
    },

    saveProjects: function(projects) {
      lsWrite(LS_PROJECTS, projects);
      if (!this.db) return;
      this.db.collection(COLLECTION).doc('projects')
        .set({ items: projects, updatedAt: new Date().toISOString() })
        .catch(function(e) { console.warn('[T1 Firestore] saveProjects failed:', e.message); if (typeof toast === 'function') toast('雲端同步失敗，資料僅存本機'); });
    },

    // Awaitable variant of saveProjects — returns the .set() Promise so callers
    // can wait for the Firestore write to complete (e.g. before sending email).
    // Does NOT modify the existing saveProjects behaviour.
    saveProjectsAwait: function(projects) {
      if (!this.db) return Promise.reject(new Error('[T1 Firestore] db not ready'));
      return this.db.collection(COLLECTION).doc('projects')
        .set({ items: projects, updatedAt: new Date().toISOString() });
    },

    // Mix & Match 備註 → Firestore（doc 'mixmatch'，雲端備份）
    saveMixNotes: function(notes) {
      if (!this.db) return;
      this.db.collection(COLLECTION).doc('mixmatch')
        .set({ items: notes || {}, updatedAt: new Date().toISOString() })
        .catch(function(e) { console.warn('[T1 Firestore] saveMixNotes failed:', e.message); });
    },

    // 檢視器儲存位置 → Firestore（doc 'viewerPos'，雲端備份，跨設備保留）
    saveViewerPos: function(positions) {
      if (!this.db) return;
      this.db.collection(COLLECTION).doc('viewerPos')
        .set({ items: positions || {}, updatedAt: new Date().toISOString() })
        .catch(function(e) { console.warn('[T1 Firestore] saveViewerPos failed:', e.message); });
    },

    // RFQ Wiki entries → Firestore（doc 'wiki'，雲端備份，跨設備保留）
    saveWiki: function(entries) {
      if (!this.db) return;
      this.db.collection(COLLECTION).doc('wiki')
        .set({ items: entries || [], updatedAt: new Date().toISOString() })
        .catch(function(e) { console.warn('[T1 Firestore] saveWiki failed:', e.message); if (typeof toast === 'function') toast('雲端同步失敗，資料僅存本機'); });
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

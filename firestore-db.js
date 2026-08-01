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
        var pairs = results[0].exists ? (results[0].data().items || []) : [];
        var projects = results[1].exists ? (results[1].data().items || []) : [];
        lsWrite(LS_PAIRS, pairs);
        lsWrite(LS_PROJECTS, projects);
        return { pairs: pairs, projects: projects };
      }).catch(function(err) {
        console.warn('[T1 Firestore] loadAll failed, falling back to localStorage:', err.message);
        return self._fallback();
      });
    },

    savePairs: function(pairs) {
      lsWrite(LS_PAIRS, pairs);
      if (!this.db) return;
      this.db.collection(COLLECTION).doc('pairs')
        .set({ items: pairs, updatedAt: new Date().toISOString() })
        .catch(function(e) { console.warn('[T1 Firestore] savePairs failed:', e.message); });
    },

    saveProjects: function(projects) {
      lsWrite(LS_PROJECTS, projects);
      if (!this.db) return;
      this.db.collection(COLLECTION).doc('projects')
        .set({ items: projects, updatedAt: new Date().toISOString() })
        .catch(function(e) { console.warn('[T1 Firestore] saveProjects failed:', e.message); });
    },

    _fallback: function() {
      return { pairs: lsRead(LS_PAIRS), projects: lsRead(LS_PROJECTS) };
    }
  };

  window.T1 = window.T1 || {};
  window.T1.firestore = fs;
})();

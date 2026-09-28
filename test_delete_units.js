// Unit: 刪除 Project 後重新整理不得被雲端舊資料加回來。
// 以假的 compat firebase 驅動真正的 firestore-db.js（含 tombstone 機制）。
const assert = require('assert');

function makeLocalStorage() {
  const m = {};
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
    _dump: () => m
  };
}

/** 假的 firebase compat SDK：把「雲端」文件存在物件裡；可設定寫入失敗 */
function makeFakeFirebase(cloud, opts) {
  const failWrites = opts && opts.failWrites;
  function docRef(id) {
    return {
      get() {
        const d = cloud[id];
        return Promise.resolve({ exists: !!d, data: () => JSON.parse(JSON.stringify(d || {})) });
      },
      set(obj, o) {
        if (failWrites) return Promise.reject(new Error('simulated offline / permission denied'));
        cloud[id] = Object.assign({}, (o && o.merge) ? cloud[id] : {}, JSON.parse(JSON.stringify(obj)));
        return Promise.resolve();
      }
    };
  }
  return {
    apps: [1],
    initializeApp() {},
    firestore() { return { collection: () => ({ doc: docRef }) }; }
  };
}

function loadModule(cloud, opts) {
  global.window = global;
  global.firebase = makeFakeFirebase(cloud, opts);
  global.localStorage = makeLocalStorage();
  global.console.warn = () => {};
  delete require.cache[require.resolve('./firestore-db.js')];
  require('./firestore-db.js');
  return global.T1.firestore;
}

const P1 = { id: 'P1', name: 'Alpha' };
const P2 = { id: 'P2', name: 'Beta' };

(async () => {
  // --- 1. 刪除後（雲端寫入失敗）重新整理：不得復活 ---
  {
    const cloud = { projects: { items: [P1, P2] } };
    const fsdb = loadModule(cloud);
    await fsdb.init();
    // app.js 的 deleteProject：本機移除 + 記錄 tombstone + save()
    global.localStorage.setItem('t1-projects', JSON.stringify([P1]));
    global.localStorage.setItem('t1-projects-deleted', JSON.stringify(['P2']));
    const after = await fsdb.loadAll();
    console.log('1) 雲端寫入失敗後重新整理:', JSON.stringify(after.projects.map(p => p.id)), 'tombstone:', JSON.stringify(after.deletedProjects));
    assert.deepStrictEqual(after.projects.map(p => p.id), ['P1'], '已刪除的 P2 不應被雲端舊資料加回來');
    assert.deepStrictEqual(after.deletedProjects, ['P2'], 'tombstone 應保留');
  }

  // --- 2. 正常刪除：雲端文件會收到 items（不含被刪者）與 deleted 清單 ---
  {
    const cloud = { projects: { items: [P1, P2] } };
    const fsdb = loadModule(cloud);
    await fsdb.init();
    await fsdb.saveProjectsAwait([P1], ['P2']);
    console.log('2) 雲端文件:', JSON.stringify(cloud.projects));
    assert.deepStrictEqual(cloud.projects.items.map(p => p.id), ['P1'], '雲端 items 應只剩 P1');
    assert.deepStrictEqual(cloud.projects.deleted, ['P2'], '雲端應記錄 deleted');
    const after = await fsdb.loadAll();
    assert.deepStrictEqual(after.projects.map(p => p.id), ['P1'], '重新載入仍不得復活');
  }

  // --- 3. 刪除後本機快取仍是舊的（例如另一個分頁／裝置）：也要被 tombstone 擋住 ---
  {
    const cloud = { projects: { items: [P1] } };
    const fsdb = loadModule(cloud);
    await fsdb.init();
    global.localStorage.setItem('t1-projects', JSON.stringify([P1, P2])); // 本機舊快取含已刪除的 P2
    global.localStorage.setItem('t1-projects-deleted', JSON.stringify(['P2']));
    const after = await fsdb.loadAll();
    console.log('3) 本機舊快取 + tombstone:', JSON.stringify(after.projects.map(p => p.id)));
    assert.deepStrictEqual(after.projects.map(p => p.id), ['P1'], '本機舊快取也不應補回已刪除項目');
  }

  // --- 4. 雲端 tombstone（別台裝置刪除）→ 本機也要跟著移除 ---
  {
    const cloud = { projects: { items: [P1, P2], deleted: ['P2'] } };
    const fsdb = loadModule(cloud);
    const data = await fsdb.init();
    console.log('4) 雲端 tombstone:', JSON.stringify(data.projects.map(p => p.id)), 'tombstone:', JSON.stringify(data.deletedProjects));
    assert.deepStrictEqual(data.projects.map(p => p.id), ['P1'], '應依雲端 tombstone 移除');
    assert.deepStrictEqual(data.deletedProjects, ['P2'], 'tombstone 應同步回本機');
  }

  // --- 5. 沒刪除時行為不變（雲端優先、本機補缺） ---
  {
    const cloud = { projects: { items: [P1] } };
    const fsdb = loadModule(cloud);
    await fsdb.init();
    global.localStorage.setItem('t1-projects', JSON.stringify([P1, P2])); // 離線建立的新 project
    const after = await fsdb.loadAll();
    console.log('5) 未刪除（本機補缺）:', JSON.stringify(after.projects.map(p => p.id)));
    assert.deepStrictEqual(after.projects.map(p => p.id), ['P1', 'P2'], '離線新資料仍要被保留');
  }

  // --- 6. Firebase SDK 不可用時（_fallback）也要濾掉已刪除項目 ---
  {
    const cloud = {};
    const fsdb = loadModule(cloud);
    fsdb.db = null; // 模擬 SDK 未載入
    global.localStorage.setItem('t1-projects', JSON.stringify([P1, P2]));
    global.localStorage.setItem('t1-projects-deleted', JSON.stringify(['P2']));
    const data = await fsdb.init();
    console.log('6) 無 SDK fallback:', JSON.stringify(data.projects.map(p => p.id)));
    assert.deepStrictEqual(data.projects.map(p => p.id), ['P1'], 'fallback 也要濾掉已刪除項目');
  }

  console.log('\nDELETE PROJECT UNIT TESTS PASSED');
})().catch(e => { console.error('DELETE PROJECT UNIT TESTS FAILED:', e.message); process.exit(1); });

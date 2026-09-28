// E2E: 「刪除 Project」要真的刪除（含重新整理後不得被雲端舊資料加回來）。
// 以假的 compat firebase 模擬雲端（資料存在 localStorage.__fakeCloud），驅動真正的 firestore-db.js。
const { chromium } = require('playwright');

const CLOUD_KEY = '__fakeCloud';
const P1 = { id: 'p1', name: 'Alpha Project', items: [], workLogs: [], confirmSummary: [] };
const P2 = { id: 'p2', name: 'Beta Project', items: [], workLogs: [], confirmSummary: [] };

// 假的 firebase compat SDK（雲端文件存 localStorage，可用 __failWrites 模擬寫入失敗）
const FAKE_FIREBASE = `(function(){
  if (window.firebase) return;
  function read(){ try { return JSON.parse(localStorage.getItem('${CLOUD_KEY}') || '{}'); } catch(e) { return {}; } }
  function write(c){ try { localStorage.setItem('${CLOUD_KEY}', JSON.stringify(c)); } catch(e) {} }
  function docRef(id){
    return {
      get: function(){ var c = read(); return Promise.resolve({ exists: Object.prototype.hasOwnProperty.call(c, id), data: function(){ return c[id] || {}; } }); },
      set: function(obj, opts){
        var c = read();
        if (c.__failWrites) return Promise.reject(new Error('simulated write failure'));
        c[id] = Object.assign({}, (opts && opts.merge) ? c[id] : {}, JSON.parse(JSON.stringify(obj)));
        write(c);
        return Promise.resolve();
      }
    };
  }
  window.firebase = { apps: [1], initializeApp: function(){}, firestore: function(){ return { collection: function(){ return { doc: docRef }; } }; } };
})();`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.route('**/firebasejs/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_FIREBASE }));
  await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));

  await page.addInitScript(({ key, p1, p2 }) => {
    if (localStorage.getItem(key)) return; // 只在第一次載入時鋪雲端資料
    localStorage.setItem(key, JSON.stringify({ projects: { items: [p1, p2] } }));
    localStorage.removeItem('t1-projects');
    localStorage.removeItem('t1-projects-deleted');
  }, { key: CLOUD_KEY, p1: P1, p2: P2 });

  const state = () => page.evaluate((key) => ({
    local: JSON.parse(localStorage.getItem('t1-projects') || '[]').map(p => p.id),
    deleted: JSON.parse(localStorage.getItem('t1-projects-deleted') || '[]'),
    cloud: (JSON.parse(localStorage.getItem(key) || '{}').projects || {}),
    toast: (document.getElementById('toast') || {}).textContent || ''
  }), CLOUD_KEY);

  const selectProject = async (name) => {
    await page.click('#projectSearch');
    await page.waitForTimeout(250);
    await page.click(`#projectDropdown .ps-item:has-text("${name}")`);
    await page.waitForTimeout(300);
  };

  // --- 1. 初次載入：雲端兩個 project 都要出現 ---
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const first = await state();
  console.log('1) 初次載入:', JSON.stringify(first));
  if (JSON.stringify(first.local) !== JSON.stringify(['p1', 'p2'])) throw new Error('初次載入應有兩個 project：' + JSON.stringify(first.local));

  // --- 2. 用畫面上的「刪除 Project」按鈕刪除 Beta ---
  await page.click('.project-tab[data-project-tab="saved"]');
  await page.waitForTimeout(200);
  await selectProject('Beta Project');
  const hasCard = await page.evaluate((id) => !!document.querySelector(`.project-card[data-project-card="${id}"]`), 'p2');
  if (!hasCard) throw new Error('選取後應顯示 Beta Project 卡片');
  await page.click('.project-card[data-project-card="p2"] [data-project-delete]');
  await page.waitForTimeout(800);
  const afterDelete = await state();
  console.log('2) 刪除後:', JSON.stringify(afterDelete));
  if (afterDelete.local.indexOf('p2') !== -1) throw new Error('本機應已移除 p2：' + JSON.stringify(afterDelete.local));
  if (afterDelete.deleted.indexOf('p2') === -1) throw new Error('應記錄刪除標記（tombstone）：' + JSON.stringify(afterDelete.deleted));
  if ((afterDelete.cloud.items || []).some(p => p.id === 'p2')) throw new Error('雲端 items 應已不含 p2：' + JSON.stringify(afterDelete.cloud));
  if (JSON.stringify(afterDelete.cloud.deleted) !== JSON.stringify(['p2'])) throw new Error('雲端應記錄 deleted：' + JSON.stringify(afterDelete.cloud));
  if (afterDelete.toast.indexOf('刪除') === -1) throw new Error('應提示已刪除：' + afterDelete.toast);

  // --- 3. 重新整理：刪除的 project 不得再出現 ---
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const afterReload = await state();
  console.log('3) 重新整理後:', JSON.stringify(afterReload));
  if (afterReload.local.indexOf('p2') !== -1) throw new Error('重新整理後 p2 不得復活：' + JSON.stringify(afterReload.local));
  const listedAfterReload = await page.evaluate(() => {
    document.querySelector('.project-tab[data-project-tab="saved"]').click();
    return true;
  });
  await page.waitForTimeout(300);
  await page.click('#projectSearch');
  await page.waitForTimeout(300);
  const ddItems = await page.evaluate(() => [...document.querySelectorAll('#projectDropdown .ps-item')].map(el => el.textContent.trim()));
  console.log('3) 檢索下拉可選項目:', JSON.stringify(ddItems), listedAfterReload);
  if (ddItems.some(t => t.indexOf('Beta Project') !== -1)) throw new Error('下拉選單不應再有已刪除的 project：' + JSON.stringify(ddItems));

  // --- 4. 雲端寫入失敗時：刪除仍要生效，且重新整理後不得復活 ---
  await page.evaluate((key) => {
    const c = JSON.parse(localStorage.getItem(key) || '{}');
    c.__failWrites = true;
    localStorage.setItem(key, JSON.stringify(c));
  }, CLOUD_KEY);
  await selectProject('Alpha Project');
  await page.click('.project-card[data-project-card="p1"] [data-project-delete]');
  await page.waitForTimeout(900);
  const failDel = await state();
  console.log('4) 雲端寫入失敗時刪除:', JSON.stringify({ local: failDel.local, deleted: failDel.deleted, toast: failDel.toast }));
  if (failDel.local.length !== 0) throw new Error('本機應已清空：' + JSON.stringify(failDel.local));
  if (failDel.deleted.indexOf('p1') === -1) throw new Error('雲端失敗時仍要記錄 tombstone：' + JSON.stringify(failDel.deleted));
  if (!(failDel.toast.indexOf('刪除') !== -1 || failDel.toast.indexOf('雲端同步失敗') !== -1)) throw new Error('應提示刪除或雲端失敗：' + failDel.toast);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const failReload = await state();
  console.log('4) 失敗後重新整理:', JSON.stringify({ local: failReload.local, deleted: failReload.deleted, cloudItems: (failReload.cloud.items || []).map(p => p.id) }));
  if (failReload.local.length !== 0) throw new Error('雲端寫入失敗時，重新整理後已刪除的 project 仍不得復活：' + JSON.stringify(failReload.local));

  await page.screenshot({ path: 'delete_check.png' }); // 供人工檢視（已列入 .gitignore）

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }
  console.log('\nDELETE PROJECT E2E PASSED');
  await browser.close();
})().catch(e => { console.error('DELETE PROJECT E2E FAILED:', e.message); process.exit(1); });

// E2E: Listed Projects → 每個 project 卡片的 "Kickoff" 分頁
// 內容：Project number（旁邊 All Clear 按鈕）、Work Log 摘要、
// Ironmongery Sign Off / SHOP DRAWING / PROJECT ADMIN / PICKLIST (DO) / PICKLIST (DO) — 下單 R、下方 Summary。
// All Clear：按下後該 project 以 #DFFF69 呈現（再按一次取消）。
const { chromium } = require('playwright');

const PID = 'proj-kickoff';
const ALL_CLEAR_RGB = 'rgb(223, 255, 105)'; // #DFFF69

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.context().route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));

  await page.addInitScript((pid) => {
    if (localStorage.getItem('t1-projects')) return; // reload 後保留資料
    localStorage.setItem('t1-projects', JSON.stringify([{
      id: pid, name: 'Kickoff Test', projectNumber: 'PJ-123', sales: 'Glen Tew', assignedQs: 'Ben',
      priority: 'URGENT', status: 'Processing',
      items: [{ id: 'it1', pair: { name: 'Item 1' }, type: 'PARTITION', extra: {} }],
      workLogs: [
        { id: 'w1', summary: 'A2VO3R3', qtnNum: 'QTN-77', status: 'confirmed', createdAt: '2026-09-10T00:00:00.000Z' },
        { id: 'w2', summary: 'B1', note: '備註內容', status: 'submited', createdAt: '2026-09-11T00:00:00.000Z' }
      ],
      confirmSummary: [{ id: 's1', label: 'PROJECT ADMIN', value: 'UPDATED', r: '', createdAt: '2026-09-12T00:00:00.000Z' }]
    }]));
  }, PID);

  const openKickoff = async () => {
    await page.click('.project-tab[data-project-tab="saved"]');
    await page.waitForTimeout(200);
    await page.click('#projectSearch');
    await page.waitForTimeout(250);
    await page.click(`#projectDropdown .ps-item[data-pid="${PID}"]`);
    await page.waitForTimeout(300);
    await page.click(`[data-ptab="${PID}"][data-ptab-panel="kickoff"]`);
    await page.waitForTimeout(250);
  };

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // 0. 上方只剩 NEW PROJECT / LISTED PROJECTS 兩個 tab（PROJECT CONFIRMED 已移除）
  const mainTabs = await page.evaluate(() => [...document.querySelectorAll('.project-tab')].map(b => b.dataset.projectTab));
  console.log('Main tabs:', JSON.stringify(mainTabs));
  if (JSON.stringify(mainTabs) !== JSON.stringify(['new', 'saved'])) throw new Error('上方式樣應只剩 new / saved：' + JSON.stringify(mainTabs));
  const gonePanel = await page.evaluate(() => ({
    panel: !!document.querySelector('[data-project-tab-panel="confirmed"]'),
    search: !!document.getElementById('confirmedSearch'),
    listing: !!document.getElementById('confirmedListingList')
  }));
  console.log('Removed tab leftovers:', JSON.stringify(gonePanel));
  if (gonePanel.panel || gonePanel.search || gonePanel.listing) throw new Error('PROJECT CONFIRMED 的 DOM 應完全移除');

  await openKickoff();

  // 1. Kickoff 分頁排在 Work Log 旁邊，點了才顯示
  const tabs = await page.evaluate((pid) => {
    const bar = document.querySelector(`[data-ptab-panel="${pid}|info"]`).closest('.project-card').querySelector('.p-inner-tabs');
    return [...bar.querySelectorAll('.p-inner-tab')].map(b => ({ panel: b.dataset.ptabPanel, label: b.textContent.trim() }));
  }, PID);
  console.log('Inner tabs:', JSON.stringify(tabs));
  const labels = tabs.map(t => t.label);
  if (labels[labels.length - 1] !== 'Kickoff') throw new Error('Kickoff 應加在內部分頁列最後：' + labels.join(' | '));
  if (labels.indexOf('Work Log') !== labels.length - 2) throw new Error('Kickoff 應緊鄰 Work Log');

  const panel = await page.evaluate((pid) => {
    const el = document.querySelector(`[data-ptab-panel="${pid}|kickoff"]`);
    const others = [...document.querySelectorAll(`.project-card[data-project-card="${pid}"] .p-inner-panel`)].filter(p => p !== el);
    return {
      visible: getComputedStyle(el).display !== 'none',
      othersHidden: others.every(p => getComputedStyle(p).display === 'none'),
      activeTab: document.querySelector(`[data-ptab="${pid}"].active`).dataset.ptabPanel,
      name: (el.querySelector('.kickoff-name') || {}).textContent,
      logs: el.querySelector('.confirmed-card-logs').textContent.replace(/\s+/g, ' ').trim(),
      selectLabels: [...el.querySelectorAll('.confirmed-select > span')].map(s => s.textContent.trim()),
      summaryItems: [...el.querySelectorAll('.confirmed-summary-item')].map(i => i.querySelector('.cs-label').textContent + '=' + i.querySelector('.cs-value').textContent)
    };
  }, PID);
  console.log('Kickoff panel:', JSON.stringify(panel, null, 1));
  if (!panel.visible || !panel.othersHidden) throw new Error('Kickoff 面板應顯示、其他面板應隱藏');
  if (panel.activeTab !== 'kickoff') throw new Error('Kickoff 分頁按鈕應為 active');
  if (panel.name !== 'Kickoff Test') throw new Error('Kickoff 應顯示專案名稱');
  const expectTasks = ['Ironmongery Sign Off (4DWGS)', 'SHOP DRAWING', 'PROJECT ADMIN', 'PICKLIST (DO)'];
  if (JSON.stringify(panel.selectLabels) !== JSON.stringify(expectTasks)) throw new Error('任務下拉不正確：' + JSON.stringify(panel.selectLabels));
  if (panel.logs.indexOf('A2VO3R3') === -1 || panel.logs.indexOf('QTN-77') === -1) throw new Error('Kickoff 應顯示 Work Log 摘要：' + panel.logs);
  if (panel.summaryItems.join() !== 'PROJECT ADMIN=UPDATED') throw new Error('Kickoff 下方 Summary 應顯示既有記錄：' + JSON.stringify(panel.summaryItems));

  // 2. Project number 欄位 = 該 project 的編號，可直接編輯
  const numValue = await page.inputValue(`[data-ptab-panel="${PID}|kickoff"] .confirmed-number`);
  if (numValue !== 'PJ-123') throw new Error('Project number 應為 PJ-123，實際 ' + numValue);
  await page.fill(`[data-ptab-panel="${PID}|kickoff"] .confirmed-number`, 'PJ-999');
  await page.dispatchEvent(`[data-ptab-panel="${PID}|kickoff"] .confirmed-number`, 'change');
  await page.waitForTimeout(400);
  const savedNumber = await page.evaluate((pid) => JSON.parse(localStorage.getItem('t1-projects')).find(p => p.id === pid).projectNumber, PID);
  if (savedNumber !== 'PJ-999') throw new Error('Project number 未寫回資料：' + savedNumber);

  // 3. PICKLIST (DO) 選 DO1 → 出現 "PICKLIST (DO) — 下單 R"，且 Kickoff 分頁保持開啟
  await page.selectOption(`[data-ptab-panel="${PID}|kickoff"] [data-confirmed-select][data-confirmed-type="PICKLIST (DO)"]`, 'DO1');
  await page.waitForTimeout(500);
  const afterPick = await page.evaluate((pid) => {
    const el = document.querySelector(`[data-ptab-panel="${pid}|kickoff"]`);
    return {
      stillVisible: getComputedStyle(el).display !== 'none',
      activeTab: document.querySelector(`[data-ptab="${pid}"].active`).dataset.ptabPanel,
      subLabels: [...el.querySelectorAll('.confirmed-sub-select > span')].map(s => s.textContent.trim()),
      summaryItems: [...el.querySelectorAll('.confirmed-summary-item')].map(i => i.querySelector('.cs-label').textContent + '=' + i.querySelector('.cs-value').textContent)
    };
  }, PID);
  console.log('After PICKLIST DO1:', JSON.stringify(afterPick));
  if (!afterPick.stillVisible || afterPick.activeTab !== 'kickoff') throw new Error('重新渲染後 Kickoff 分頁應保持開啟');
  if (afterPick.subLabels.join() !== 'PICKLIST (DO) — 下單 R') throw new Error('應出現「PICKLIST (DO) — 下單 R」下拉：' + JSON.stringify(afterPick.subLabels));
  if (afterPick.summaryItems.indexOf('PICKLIST (DO)=DO1') === -1) throw new Error('Summary 應新增 PICKLIST (DO)=DO1：' + JSON.stringify(afterPick.summaryItems));

  // 4. 下單 R 選 R3 → Summary 表格的「下單 R」欄顯示 R3
  await page.selectOption(`[data-ptab-panel="${PID}|kickoff"] [data-confirmed-sub]`, 'R3');
  await page.waitForTimeout(500);
  const afterR = await page.evaluate((pid) => {
    const el = document.querySelector(`[data-ptab-panel="${pid}|kickoff"]`);
    return [...el.querySelectorAll('.confirmed-summary-item')].map(i => i.querySelector('.cs-label').textContent + '=' + i.querySelector('.cs-value').textContent + '|' + i.querySelector('.cs-r').textContent);
  }, PID);
  console.log('After R3:', JSON.stringify(afterR));
  if (afterR.indexOf('PICKLIST (DO)=DO1|R3') === -1) throw new Error('Summary 表格應顯示 DO1 / R3：' + JSON.stringify(afterR));

  // 5. All Clear 按鈕在 Project number 旁邊；按下後該 project 呈現 #DFFF69
  const clearBtn = await page.evaluate((pid) => {
    const el = document.querySelector(`[data-ptab-panel="${pid}|kickoff"]`);
    const btn = el.querySelector('[data-kickoff-clear]');
    const num = el.querySelector('.confirmed-number');
    const head = el.querySelector('.kickoff-head');
    const kids = [...head.children];
    return {
      exists: !!btn,
      text: btn ? btn.textContent.trim() : null,
      rightAfterNumber: !!btn && kids.indexOf(btn) === kids.indexOf(num) + 1,
      pressed: btn ? btn.getAttribute('aria-pressed') : null,
      gap: btn ? getComputedStyle(btn).marginLeft : null
    };
  }, PID);
  console.log('All Clear button:', JSON.stringify(clearBtn));
  if (!clearBtn.exists) throw new Error('Kickoff 應有 All Clear 按鈕');
  if (!clearBtn.rightAfterNumber) throw new Error('All Clear 按鈕應緊接在 Project number 輸入欄後面');
  if (clearBtn.pressed !== 'false') throw new Error('初始 aria-pressed 應為 false');

  await page.click(`[data-ptab-panel="${PID}|kickoff"] [data-kickoff-clear]`);
  await page.waitForTimeout(500);
  const cleared = await page.evaluate((pid) => ({
    headBg: getComputedStyle(document.querySelector(`.project-card[data-project-card="${pid}"] > summary`)).backgroundColor,
    stored: JSON.parse(localStorage.getItem('t1-projects')).find(p => p.id === pid).allClear,
    pressed: document.querySelector(`[data-ptab-panel="${pid}|kickoff"] [data-kickoff-clear]`).getAttribute('aria-pressed'),
    btnActive: document.querySelector(`[data-ptab-panel="${pid}|kickoff"] [data-kickoff-clear]`).classList.contains('active'),
    cardFlag: document.querySelector(`.project-card[data-project-card="${pid}"]`).dataset.allClear,
    kickoffStillOpen: getComputedStyle(document.querySelector(`[data-ptab-panel="${pid}|kickoff"]`)).display !== 'none'
  }), PID);
  console.log('After All Clear:', JSON.stringify(cleared));
  if (cleared.headBg !== ALL_CLEAR_RGB) throw new Error(`按下 All Clear 後卡片應為 #DFFF69（${ALL_CLEAR_RGB}），實際 ${cleared.headBg}`);
  if (cleared.stored !== true) throw new Error('allClear 應寫入資料');
  if (cleared.pressed !== 'true' || !cleared.btnActive) throw new Error('All Clear 按鈕應呈現已標記狀態');
  if (cleared.cardFlag !== '1') throw new Error('卡片應帶 data-all-clear 標記');
  if (!cleared.kickoffStillOpen) throw new Error('標記後 Kickoff 分頁應保持開啟');
  await page.screenshot({ path: 'kickoff_check.png' }); // 供人工檢視（已列入 .gitignore）

  // 展開模式下 ALL PROJECTS 清單也要呈現 #DFFF69
  const browseCleared = await page.evaluate((pid) => {
    window.T1.setProjectExpanded(true);
    const row = document.querySelector(`#projectBrowseList [data-browse-project="${pid}"]`);
    return row ? getComputedStyle(row).backgroundColor : null;
  }, PID);
  await page.waitForTimeout(300);
  console.log('Browse row (All Clear):', browseCleared);
  if (browseCleared !== ALL_CLEAR_RGB) throw new Error(`展開清單的 project 也應為 #DFFF69，實際 ${browseCleared}`);
  await page.evaluate(() => window.T1.setProjectExpanded(false));
  await page.waitForTimeout(300);

  // 6. Summary 記錄可刪除
  const delBefore = await page.evaluate((pid) => JSON.parse(localStorage.getItem('t1-projects')).find(p => p.id === pid).confirmSummary.length, PID);
  await page.click(`[data-ptab-panel="${PID}|kickoff"] [data-confirmed-del^="${PID}|"]`);
  await page.waitForTimeout(400);
  const afterDel = await page.evaluate((pid) => ({
    stored: JSON.parse(localStorage.getItem('t1-projects')).find(p => p.id === pid).confirmSummary.map(r => r.label),
    rows: [...document.querySelectorAll(`[data-ptab-panel="${pid}|kickoff"] .confirmed-summary-item`)].length
  }), PID);
  console.log('After delete:', JSON.stringify(afterDel));
  if (delBefore !== 2) throw new Error('刪除前應有 2 筆 Summary，實際 ' + delBefore);
  if (afterDel.stored.length !== 1 || afterDel.rows !== 1) throw new Error('刪除後應剩 1 筆 Summary：' + JSON.stringify(afterDel));

  // 7. 重新載入後：Project number、Summary、All Clear 都保留
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await openKickoff();
  const reloadState = await page.evaluate((pid) => ({
    number: JSON.parse(localStorage.getItem('t1-projects')).find(p => p.id === pid).projectNumber,
    allClear: JSON.parse(localStorage.getItem('t1-projects')).find(p => p.id === pid).allClear,
    summaryRows: [...document.querySelectorAll(`[data-ptab-panel="${pid}|kickoff"] .confirmed-summary-item`)].map(i => i.querySelector('.cs-label').textContent),
    headBg: getComputedStyle(document.querySelector(`.project-card[data-project-card="${pid}"] > summary`)).backgroundColor,
    pressed: document.querySelector(`[data-ptab-panel="${pid}|kickoff"] [data-kickoff-clear]`).getAttribute('aria-pressed')
  }), PID);
  console.log('After reload:', JSON.stringify(reloadState));
  if (reloadState.number !== 'PJ-999') throw new Error('重新載入後 Project number 應保留：' + reloadState.number);
  if (reloadState.allClear !== true || reloadState.pressed !== 'true') throw new Error('重新載入後 All Clear 應保留');
  if (reloadState.headBg !== ALL_CLEAR_RGB) throw new Error('重新載入後卡片仍應為 #DFFF69：' + reloadState.headBg);
  if (JSON.stringify(reloadState.summaryRows) !== JSON.stringify(['PICKLIST (DO)'])) throw new Error('重新載入後 Summary 應只剩 PICKLIST (DO)：' + JSON.stringify(reloadState.summaryRows));

  // 8. 再按一次 All Clear → 取消標記
  await page.click(`[data-ptab-panel="${PID}|kickoff"] [data-kickoff-clear]`);
  await page.waitForTimeout(500);
  const uncleared = await page.evaluate((pid) => ({
    headBg: getComputedStyle(document.querySelector(`.project-card[data-project-card="${pid}"] > summary`)).backgroundColor,
    stored: !!JSON.parse(localStorage.getItem('t1-projects')).find(p => p.id === pid).allClear,
    pressed: document.querySelector(`[data-ptab-panel="${pid}|kickoff"] [data-kickoff-clear]`).getAttribute('aria-pressed')
  }), PID);
  console.log('After un-clear:', JSON.stringify(uncleared));
  if (uncleared.headBg === ALL_CLEAR_RGB) throw new Error('取消 All Clear 後不應再是 #DFFF69');
  if (uncleared.stored || uncleared.pressed !== 'false') throw new Error('取消 All Clear 應清除標記');

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }
  console.log('\nKICKOFF + ALL CLEAR E2E PASSED');
  await browser.close();
})().catch(e => { console.error('KICKOFF + ALL CLEAR E2E FAILED:', e.message); process.exit(1); });

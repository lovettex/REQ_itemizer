// E2E: Listed Projects → 每個 project 的 PARTITION / DOOR / OW 分頁
// 1) 沒有資料時仍顯示表格欄位標題，並可「＋ 手動新增」
// 2) 「🖼️ Image scan」可貼上截圖（Ctrl+V）→ OCR.Space → 填入目前開啟項目的輸入框；
//    沒有開啟的項目時自動新增一筆並展開輸入框
const { chromium } = require('playwright');

const PID = 'proj-item-scan';

const PART_TEXT = [
  'T1 SINGLE GLAZED PARTITION',
  'LEGEND: P-01',
  'FRAME FINISHES: Powder Coat Black',
  'HEIGHT: 3000mm',
  'VERTICAL SECTION: GF - 5',
  'HORIZONTAL SECTION: GF - A',
  'GLASS 1: 10mm Clear Tempered',
  'REMARK IF ANY: Provide 2H transom'
].join('\n');

const PART_TEXT_2 = ['LEGEND: P-02', 'HEIGHT: 2700mm', 'MULLION: MU - 3'].join('\n');

const DOOR_TEXT = [
  'DOOR SCHEDULE',
  'LEGEND: D-01',
  'NO OF LEAF: 1',
  'DOOR FRAME: SWING DF - A',
  'DOOR PANEL: SWING DP - A1',
  'HW FINISHES: SSS'
].join('\n');

const EXPECTED_PARTITION_HEADERS = ['LEGEND', 'FRAME FINISHES', 'HEIGHT', 'VERTICAL SECTION', 'HORIZONTAL SECTION', 'TRANSOM', 'MULLION', 'GLASS 1', 'GLASS 2', 'SQUARE POST', 'POWER COLUMN', 'SIZE PC', 'REMARK IF ANY'];
const EXPECTED_DOOR_HEADERS = ['LEGEND', 'FRAME FINISHES', 'HEIGHT', 'NO OF LEAF', 'DOOR FRAME', 'DOOR PANEL', 'TRANSOM', 'MULLION', 'GLASS 1', 'GLASS 2', 'HARDWARE', 'LOCK', 'DOOR CLOSER', 'HW FINISHES', 'REMARK IF ANY'];
const EXPECTED_OW_HEADERS = ['LEGEND (Manual)', 'FINISHES', 'HEIGHT', 'TYPE', 'OPERATE', 'COUNTRY', 'HW FINISHES', 'REMARK IF ANY'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.context().route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));

  let ocrText = PART_TEXT;
  let ocrCalls = 0;
  await page.route('**/api.ocr.space/parse/image', async (route) => {
    ocrCalls++;
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ ParsedResults: [{ FileParseExitCode: '1', ParsedText: ocrText, ErrorMessage: null }], OCRExitCode: '1', IsErroredOnProcessing: false, ErrorMessage: null })
    });
  });

  await page.addInitScript((pid) => {
    if (localStorage.getItem('t1-projects')) return;
    localStorage.setItem('t1-projects', JSON.stringify([{
      id: pid, name: 'Item Scan Project', sales: 'Glen Tew', assignedQs: 'Ben', status: 'Processing',
      items: [], workLogs: [], confirmSummary: []
    }]));
  }, PID);

  const pasteShot = () => page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 520; c.height = 200;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 520, 200);
    x.fillStyle = '#000'; x.font = '15px sans-serif';
    x.fillText('LEGEND: P-01', 12, 32);
    x.fillText('HEIGHT: 3000mm', 12, 58);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'spec.png', { type: 'image/png' }));
    const ev = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'clipboardData', { value: dt });
    document.dispatchEvent(ev);
  });

  const tabPanel = (suffix) => `[data-ptab-panel="${PID}|${suffix}"]`;
  const headers = (suffix) => page.evaluate((sel) => {
    const panel = document.querySelector(sel);
    return panel ? [...panel.querySelectorAll('.item-table thead th')].map(th => th.textContent.trim()) : null;
  }, tabPanel(suffix));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.click('.project-tab[data-project-tab="saved"]');
  await page.waitForTimeout(200);
  await page.click('#projectSearch');
  await page.waitForTimeout(250);
  await page.click(`#projectDropdown .ps-item[data-pid="${PID}"]`);
  await page.waitForTimeout(300);

  // 1. 三個分頁在「沒有資料」時仍要看得到表頭 + 工具列
  for (const [suffix, expect] of [['partition', EXPECTED_PARTITION_HEADERS], ['door', EXPECTED_DOOR_HEADERS], ['ow', EXPECTED_OW_HEADERS]]) {
    await page.click(`[data-ptab="${PID}"][data-ptab-panel="${suffix}"]`);
    await page.waitForTimeout(200);
    const th = await headers(suffix);
    const extra = await page.evaluate((sel) => {
      const panel = document.querySelector(sel);
      return {
        rows: panel.querySelectorAll('.item-table tbody tr').length,
        empty: (panel.querySelector('.item-table-empty td') || {}).textContent || '',
        excel: !!panel.querySelector('[data-scan-items]'),
        image: !!panel.querySelector('[data-item-image-scan]'),
        add: !!panel.querySelector('[data-item-add]'),
        status: !!panel.querySelector('[data-item-image-status]')
      };
    }, tabPanel(suffix));
    console.log(`Empty ${suffix}:`, JSON.stringify({ headers: th ? th.slice(1, -2) : null, ...extra }));
    if (!th) throw new Error(suffix + ' 分頁找不到表格');
    if (th[0] !== '#') throw new Error(suffix + ' 表頭第一欄應為 #');
    if (JSON.stringify(th.slice(1, -2)) !== JSON.stringify(expect)) throw new Error(suffix + ' 表頭不正確：' + JSON.stringify(th));
    if (extra.rows !== 1 || extra.empty.indexOf('尚無') === -1) throw new Error(suffix + ' 沒有資料時應顯示空狀態列');
    if (!extra.excel || !extra.image || !extra.add || !extra.status) throw new Error(suffix + ' 工具列缺少按鈕');
  }

  // 2. ＋ 手動新增 → 新增一筆並展開輸入框
  await page.click(`[data-ptab="${PID}"][data-ptab-panel="partition"]`);
  await page.waitForTimeout(200);
  await page.click(`[data-item-add="${PID}|PARTITION"]`);
  await page.waitForTimeout(500);
  const added = await page.evaluate((pid) => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid);
    const items = p.items.filter(i => i.type === 'PARTITION');
    const forms = [...document.querySelectorAll(`[data-ptab-panel="${pid}|partition"] .project-extra`)]
      .filter(f => f.style.display !== 'none');
    return {
      count: items.length,
      name: items[0] ? items[0].pair.name : null,
      extra: items[0] ? items[0].extra : null,
      openForms: forms.length,
      rows: document.querySelectorAll(`[data-ptab-panel="${pid}|partition"] .item-table tbody tr`).length,
      status: document.querySelector(`[data-item-image-status="${pid}|PARTITION"]`).textContent
    };
  }, PID);
  console.log('Manual add:', JSON.stringify(added));
  if (added.count !== 1) throw new Error('手動新增應建立 1 筆項目');
  if (added.openForms !== 1) throw new Error('手動新增後應展開該筆的輸入框');
  if (added.rows !== 1) throw new Error('表格應變成 1 筆資料列');
  if (added.status.indexOf('已手動新增') === -1) throw new Error('狀態應提示已手動新增：' + added.status);

  // 3. 貼上截圖 → 填入「目前開啟」那筆的輸入框（尚未寫入資料）
  await pasteShot();
  await page.waitForTimeout(1200);
  const filled = await page.evaluate((pid) => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid);
    const item = p.items.filter(i => i.type === 'PARTITION')[0];
    const form = document.querySelector(`[data-item-extra-key="${pid}|${item.id}"]`);
    const val = (n) => (form.querySelector(`[name="${n}"]`) || {}).value;
    return {
      values: { legend: val('legend'), finishes: val('finishes'), height: val('height'), verticalSection: val('verticalSection'), horizontalSection: val('horizontalSection'), glass1: val('glass1'), remark: val('remark') },
      storedExtra: item.extra,
      itemCount: p.items.filter(i => i.type === 'PARTITION').length,
      status: document.querySelector(`[data-item-image-status="${pid}|PARTITION"]`).textContent,
      statusClass: document.querySelector(`[data-item-image-status="${pid}|PARTITION"]`).className,
      highlight: form.querySelector('[name="legend"]').classList.contains('item-scan-filled')
    };
  }, PID);
  console.log('Filled into open item:', JSON.stringify(filled, null, 1));
  if (ocrCalls !== 1) throw new Error('應呼叫 OCR 一次，實際 ' + ocrCalls);
  if (filled.values.legend !== 'P-01' || filled.values.height !== '3000mm' || filled.values.verticalSection !== 'GF - 5') throw new Error('欄位未正確填入：' + JSON.stringify(filled.values));
  if (filled.values.finishes !== 'Powder Coat Black') throw new Error('FRAME FINISHES 未填入');
  if (filled.values.glass1 !== '10mm Clear Tempered') throw new Error('GLASS 1 未填入');
  if (filled.itemCount !== 1) throw new Error('已有開啟項目時不應新增項目');
  if (JSON.stringify(filled.storedExtra) !== '{}') throw new Error('尚未按儲存前不應寫入資料：' + JSON.stringify(filled.storedExtra));
  if (filled.statusClass.indexOf('ok') === -1) throw new Error('狀態應為成功樣式：' + filled.statusClass);
  if (!filled.highlight) throw new Error('填入的欄位應有高亮');

  // 4. 按「儲存項目資料」→ 寫入 item.extra
  await page.evaluate((pid) => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid);
    const item = p.items.filter(i => i.type === 'PARTITION')[0];
    const form = document.querySelector(`[data-item-extra-key="${pid}|${item.id}"]`);
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }, PID);
  await page.waitForTimeout(600);
  const saved = await page.evaluate((pid) => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid);
    const item = p.items.filter(i => i.type === 'PARTITION')[0];
    const row = document.querySelector(`[data-ptab-panel="${pid}|partition"] .item-table tbody tr`);
    return { extra: item.extra, rowText: row ? row.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null };
  }, PID);
  console.log('Saved item:', JSON.stringify(saved));
  if (saved.extra.legend !== 'P-01' || saved.extra.height !== '3000mm') throw new Error('儲存後 item.extra 應有辨識結果：' + JSON.stringify(saved.extra));

  // 5. 沒有開啟的項目 → 貼上截圖自動新增一筆並填入（資料同時寫入）
  ocrText = PART_TEXT_2;
  await pasteShot();
  await page.waitForTimeout(1500);
  const created = await page.evaluate((pid) => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid);
    const items = p.items.filter(i => i.type === 'PARTITION');
    const last = items[items.length - 1];
    const form = document.querySelector(`[data-item-extra-key="${pid}|${last.id}"]`);
    return {
      count: items.length,
      name: last.pair.name,
      extra: last.extra,
      formOpen: form ? form.style.display !== 'none' : false,
      formHeight: form ? (form.querySelector('[name="height"]') || {}).value : null,
      status: document.querySelector(`[data-item-image-status="${pid}|PARTITION"]`).textContent
    };
  }, PID);
  console.log('Auto-created item:', JSON.stringify(created));
  if (created.count !== 2) throw new Error('沒有開啟項目時應自動新增一筆，實際 ' + created.count);
  if (created.extra.legend !== 'P-02' || created.extra.mullion !== 'MU - 3') throw new Error('新項目應寫入辨識結果：' + JSON.stringify(created.extra));
  if (created.name !== 'P-02') throw new Error('新項目名稱應沿用 LEGEND：' + created.name);
  if (!created.formOpen || created.formHeight !== '2700mm') throw new Error('新項目的輸入框應展開並帶入值');
  if (created.status.indexOf('已新增 1 筆') === -1) throw new Error('狀態應說明已新增：' + created.status);

  // 6. 貼上時若不在 PARTITION / DOOR / OW 分頁 → 不呼叫 OCR，只提示
  await page.click(`[data-ptab="${PID}"][data-ptab-panel="info"]`);
  await page.waitForTimeout(250);
  const callsBefore = ocrCalls;
  await pasteShot();
  await page.waitForTimeout(800);
  const wrongTab = await page.evaluate(() => {
    const t = document.getElementById('toast');
    return { toast: t ? t.textContent : '', toastShown: t ? t.classList.contains('show') : false };
  });
  console.log('Wrong tab paste:', JSON.stringify(wrongTab), 'calls', callsBefore, '->', ocrCalls);
  if (ocrCalls !== callsBefore) throw new Error('非規格分頁貼上不應呼叫 OCR');
  if (wrongTab.toast.indexOf('PARTITION') === -1) throw new Error('應提示先切到 PARTITION / DOOR / OW：' + wrongTab.toast);

  // 7. DOOR 分頁：不同欄位組合
  ocrText = DOOR_TEXT;
  await page.click(`[data-ptab="${PID}"][data-ptab-panel="door"]`);
  await page.waitForTimeout(250);
  await pasteShot();
  await page.waitForTimeout(1500);
  const door = await page.evaluate((pid) => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid);
    const items = p.items.filter(i => i.type === 'DOOR');
    return { count: items.length, extra: items[0] ? items[0].extra : null, name: items[0] ? items[0].pair.name : null };
  }, PID);
  console.log('DOOR scan:', JSON.stringify(door));
  if (door.count !== 1) throw new Error('DOOR 應新增 1 筆');
  if (door.extra.doorFrame !== 'SWING DF - A' || door.extra.doorPanel !== 'SWING DP - A1' || door.extra.hwFinishes !== 'SSS' || door.extra.noOfLeaf !== '1') {
    throw new Error('DOOR 欄位未正確填入：' + JSON.stringify(door.extra));
  }

  // 8. 辨識不到欄位 → 不新增、狀態為 warn
  ocrText = 'Hello, please find attached.';
  await page.click(`[data-ptab="${PID}"][data-ptab-panel="ow"]`);
  await page.waitForTimeout(250);
  const beforeOw = await page.evaluate((pid) => JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid).items.filter(i => i.type === 'OPERABLE_WALL').length, PID);
  await pasteShot();
  await page.waitForTimeout(1200);
  const owNone = await page.evaluate((pid) => ({
    count: JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid).items.filter(i => i.type === 'OPERABLE_WALL').length,
    status: document.querySelector(`[data-item-image-status="${pid}|OPERABLE_WALL"]`).textContent,
    cls: document.querySelector(`[data-item-image-status="${pid}|OPERABLE_WALL"]`).className
  }), PID);
  console.log('OW no match:', JSON.stringify(owNone));
  if (owNone.count !== beforeOw) throw new Error('辨識不到欄位時不應新增項目');
  if (owNone.cls.indexOf('warn') === -1) throw new Error('辨識不到欄位應為 warn 狀態');
  if (owNone.status.indexOf('LEGEND (Manual)') === -1) throw new Error('warn 訊息應列出該分頁的欄位範例：' + owNone.status);

  await page.click(`[data-ptab="${PID}"][data-ptab-panel="partition"]`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'itemscan_check.png' }); // 供人工檢視（已列入 .gitignore）

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }
  console.log('\nITEM IMAGE SCAN E2E PASSED');
  await browser.close();
})().catch(e => { console.error('ITEM IMAGE SCAN E2E FAILED:', e.message); process.exit(1); });

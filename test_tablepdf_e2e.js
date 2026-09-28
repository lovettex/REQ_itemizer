// E2E: WORK LOG / KICKOFF SUMMARY 表格化 + 匯出 PDF（列印）+ Kickoff 每個 DO 的 NOTE 輸入
const { chromium } = require('playwright');

const PID = 'proj-table-pdf';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.context().route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));

  await page.addInitScript((pid) => {
    if (localStorage.getItem('t1-projects')) return;
    localStorage.setItem('t1-projects', JSON.stringify([{
      id: pid, name: 'Table PDF Project', projectNumber: 'PJ-777', sales: 'Glen Tew', assignedQs: 'Ben', status: 'Processing',
      items: [],
      workLogs: [
        { id: 'w1', summary: 'A2VO3R3', qtnNum: 'QTN-77', note: '第一次送審', status: 'confirmed', createdAt: '2026-09-10T00:00:00.000Z' },
        { id: 'w2', summary: 'B1VO2', qtnNum: '', note: '', status: 'submited', createdAt: '2026-09-11T00:00:00.000Z' }
      ],
      confirmSummary: [
        { id: 's1', label: 'PICKLIST (DO)', value: 'DO1', r: 'R3', note: 'DO1 已下單：玻璃', createdAt: '2026-09-12T00:00:00.000Z' },
        { id: 's2', label: 'PROJECT ADMIN', value: 'UPDATED', r: '', note: '', createdAt: '2026-09-13T00:00:00.000Z' }
      ]
    }]));
  }, PID);

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.click('.project-tab[data-project-tab="saved"]');
  await page.waitForTimeout(200);
  await page.click('#projectSearch');
  await page.waitForTimeout(250);
  await page.click(`#projectDropdown .ps-item[data-pid="${PID}"]`);
  await page.waitForTimeout(300);
  // 攔截 window.print（headless 不開列印對話框），只記錄呼叫次數
  await page.evaluate(() => { window.__printCalls = 0; window.print = function () { window.__printCalls++; }; });

  // 1. Work Log 以表格呈現
  await page.click(`[data-ptab="${PID}"][data-ptab-panel="notes"]`);
  await page.waitForTimeout(300);
  const wl = await page.evaluate((pid) => {
    const panel = document.querySelector(`[data-ptab-panel="${pid}|notes"]`);
    const table = panel.querySelector('table.worklog-table');
    const rows = [...panel.querySelectorAll('.worklog-item')];
    return {
      isTable: !!table && table.tagName === 'TABLE',
      headers: table ? [...table.querySelectorAll('thead th')].map(th => th.textContent.trim()) : null,
      rowCount: rows.length,
      row1: rows[0] ? {
        tag: rows[0].tagName,
        display: getComputedStyle(rows[0]).display,
        summary: rows[0].querySelector('.worklog-item-summary').textContent,
        qtn: rows[0].querySelector('.worklog-item-qtn').textContent,
        note: rows[0].querySelector('[data-wlog-note]').value,
        status: rows[0].querySelector('.worklog-status').value,
        bg: rows[0].style.background
      } : null,
      row2note: rows[1] ? rows[1].querySelector('[data-wlog-note]').value : null,
      pdfBtn: !!panel.querySelector('[data-print-worklog]')
    };
  }, PID);
  console.log('Work Log table:', JSON.stringify(wl, null, 1));
  if (!wl.isTable) throw new Error('Work Log 應以 table 呈現');
  if (JSON.stringify(wl.headers) !== JSON.stringify(['#', 'SUMMARY', 'QTN', 'NOTE', 'DATE', 'STATUS', ''])) throw new Error('Work Log 表頭不正確：' + JSON.stringify(wl.headers));
  if (wl.rowCount !== 2) throw new Error('Work Log 應有 2 列，實際 ' + wl.rowCount);
  if (wl.row1.tag !== 'TR' || wl.row1.display !== 'table-row') throw new Error('每筆 Log 應為表格列（tr/table-row）');
  if (wl.row1.summary !== 'A2VO3R3' || wl.row1.qtn !== 'QTN-77' || wl.row1.status !== 'confirmed') throw new Error('Log 欄位內容不正確：' + JSON.stringify(wl.row1));
  if (wl.row1.note !== '第一次送審') throw new Error('NOTE 欄應顯示原本的備註');
  if (wl.row1.bg.indexOf('F0FF45') === -1 && wl.row1.bg.indexOf('rgb(240, 255, 69)') === -1) throw new Error('confirmed 列底色應保留：' + wl.row1.bg);
  if (!wl.pdfBtn) throw new Error('Work Log 應有匯出 PDF 按鈕');
  await page.screenshot({ path: 'tablepdf_worklog.png' }); // 供人工檢視（已列入 .gitignore）

  // 2. 在表格內直接編輯 Log NOTE → 寫回資料、不重新渲染
  await page.fill(`[data-wlog-note="w2"]`, '第二批送審');
  await page.dispatchEvent(`[data-wlog-note="w2"]`, 'change');
  await page.waitForTimeout(300);
  const wlNote = await page.evaluate((pid) => ({
    stored: JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid).workLogs.find(l => l.id === 'w2').note,
    inputValue: document.querySelector('[data-wlog-note="w2"]').value,
    rows: document.querySelectorAll(`[data-ptab-panel="${pid}|notes"] .worklog-item`).length
  }), PID);
  console.log('Work Log note saved:', JSON.stringify(wlNote));
  if (wlNote.stored !== '第二批送審') throw new Error('Log NOTE 未寫回資料：' + JSON.stringify(wlNote));
  if (wlNote.inputValue !== '第二批送審' || wlNote.rows !== 2) throw new Error('編輯 NOTE 不應重建表格（焦點會跳掉）：' + JSON.stringify(wlNote));

  // 3. 匯出 WORK LOG PDF
  await page.click(`[data-print-worklog="${PID}"]`);
  await page.waitForTimeout(400);
  const wlPdf = await page.evaluate(() => {
    const area = document.getElementById('printArea');
    const table = area.querySelector('table.print-table');
    return {
      printing: document.body.classList.contains('printing'),
      printCalls: window.__printCalls,
      hasTable: !!table,
      headers: table ? [...table.querySelectorAll('thead th')].map(th => th.textContent.trim()) : null,
      bodyRows: table ? table.querySelectorAll('tbody tr').length : 0,
      html: area.innerHTML
    };
  });
  console.log('Work Log PDF:', JSON.stringify({ printing: wlPdf.printing, printCalls: wlPdf.printCalls, headers: wlPdf.headers, bodyRows: wlPdf.bodyRows }));
  if (!wlPdf.printing || wlPdf.printCalls !== 1) throw new Error('應叫用列印（輸出 PDF）一次：' + JSON.stringify({ p: wlPdf.printing, c: wlPdf.printCalls }));
  if (!wlPdf.hasTable) throw new Error('列印區應有表格');
  if (JSON.stringify(wlPdf.headers) !== JSON.stringify(['#', 'SUMMARY', 'QTN', 'NOTE', 'DATE', 'STATUS'])) throw new Error('PDF 表頭不正確：' + JSON.stringify(wlPdf.headers));
  if (wlPdf.bodyRows !== 2) throw new Error('PDF 應有 2 列資料');
  if (wlPdf.html.indexOf('WORK LOG') === -1 || wlPdf.html.indexOf('Table PDF Project') === -1) throw new Error('PDF 應有標題與專案名稱');
  if (wlPdf.html.indexOf('第二批送審') === -1 || wlPdf.html.indexOf('第一次送審') === -1) throw new Error('PDF 應包含每筆 Log 的 NOTE');

  // 4. Kickoff Summary 以表格呈現（含每個 DO 的 NOTE 輸入）
  await page.click(`[data-ptab="${PID}"][data-ptab-panel="kickoff"]`);
  await page.waitForTimeout(300);
  const sum = await page.evaluate((pid) => {
    const panel = document.querySelector(`[data-ptab-panel="${pid}|kickoff"]`);
    const table = panel.querySelector('table.summary-table');
    const rows = [...panel.querySelectorAll('.confirmed-summary-item')];
    const doRow = rows.find(r => r.querySelector('.cs-label').textContent === 'PICKLIST (DO)');
    return {
      isTable: !!table && table.tagName === 'TABLE',
      headers: table ? [...table.querySelectorAll('thead th')].map(th => th.textContent.trim()) : null,
      rowCount: rows.length,
      display: rows[0] ? getComputedStyle(rows[0]).display : null,
      doNote: doRow ? doRow.querySelector('[data-confirmed-note]').value : null,
      doNoteClass: doRow ? doRow.querySelector('[data-confirmed-note]').className : null,
      doNotePlaceholder: doRow ? doRow.querySelector('[data-confirmed-note]').placeholder : null,
      doR: doRow ? doRow.querySelector('.cs-r').textContent : null,
      pdfBtn: !!panel.querySelector('[data-print-summary]')
    };
  }, PID);
  console.log('Kickoff summary table:', JSON.stringify(sum, null, 1));
  if (!sum.isTable) throw new Error('Kickoff Summary 應以 table 呈現');
  if (JSON.stringify(sum.headers) !== JSON.stringify(['#', 'TASK', 'VALUE', '下單 R', 'NOTE（每個 DO 已發出的內容）', 'DATE', ''])) throw new Error('Summary 表頭不正確：' + JSON.stringify(sum.headers));
  if (sum.rowCount !== 2 || sum.display !== 'table-row') throw new Error('Summary 應有 2 列且為表格列：' + JSON.stringify(sum));
  if (sum.doNote !== 'DO1 已下單：玻璃') throw new Error('DO 的 NOTE 應顯示既有內容：' + sum.doNote);
  if (sum.doNoteClass.indexOf('is-do') === -1) throw new Error('DO 的 NOTE 輸入框應標示為 DO');
  if (sum.doNotePlaceholder.indexOf('DO') === -1) throw new Error('DO 的 NOTE 提示應說明是 DO 下單內容：' + sum.doNotePlaceholder);
  if (sum.doR !== 'R3') throw new Error('下單 R 應獨立為一欄：' + sum.doR);
  if (!sum.pdfBtn) throw new Error('Summary 應有匯出 PDF 按鈕');
  await page.screenshot({ path: 'tablepdf_summary.png' }); // 供人工檢視（已列入 .gitignore）

  // 5. 編輯 DO 的 NOTE → 寫回資料、不重新渲染
  await page.fill(`[data-confirmed-note="${PID}|s1"]`, 'DO1 已下單：玻璃、五金');
  await page.dispatchEvent(`[data-confirmed-note="${PID}|s1"]`, 'change');
  await page.waitForTimeout(300);
  const doNote = await page.evaluate((pid) => ({
    stored: JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid).confirmSummary.find(r => r.id === 's1').note,
    inputValue: document.querySelector(`[data-confirmed-note="${pid}|s1"]`).value,
    rows: document.querySelectorAll(`[data-ptab-panel="${pid}|kickoff"] .confirmed-summary-item`).length
  }), PID);
  console.log('DO note saved:', JSON.stringify(doNote));
  if (doNote.stored !== 'DO1 已下單：玻璃、五金') throw new Error('DO 的 NOTE 未寫回資料：' + JSON.stringify(doNote));
  if (doNote.inputValue !== 'DO1 已下單：玻璃、五金' || doNote.rows !== 2) throw new Error('編輯 DO NOTE 不應重建表格：' + JSON.stringify(doNote));

  // 6. 匯出 KICKOFF SUMMARY PDF（含 DO 的 R 與 NOTE）
  await page.click(`[data-print-summary="${PID}"]`);
  await page.waitForTimeout(400);
  const sumPdf = await page.evaluate(() => {
    const area = document.getElementById('printArea');
    const table = area.querySelector('table.print-table');
    return {
      printCalls: window.__printCalls,
      headers: table ? [...table.querySelectorAll('thead th')].map(th => th.textContent.trim()) : null,
      html: area.innerHTML,
      rows: table ? [...table.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => td.textContent)) : []
    };
  });
  console.log('Summary PDF:', JSON.stringify({ printCalls: sumPdf.printCalls, headers: sumPdf.headers, rows: sumPdf.rows }, null, 1));
  if (sumPdf.printCalls !== 2) throw new Error('應叫用列印第二次，實際 ' + sumPdf.printCalls);
  if (JSON.stringify(sumPdf.headers) !== JSON.stringify(['#', 'TASK', 'VALUE', '下單 R', 'NOTE', 'DATE'])) throw new Error('Summary PDF 表頭不正確：' + JSON.stringify(sumPdf.headers));
  if (sumPdf.html.indexOf('KICKOFF SUMMARY') === -1 || sumPdf.html.indexOf('PJ-777') === -1) throw new Error('PDF 應有標題與 Project No');
  const doPdfRow = sumPdf.rows.find(r => r[1] === 'PICKLIST (DO)');
  if (!doPdfRow) throw new Error('PDF 應包含 PICKLIST (DO) 列');
  if (doPdfRow[2] !== 'DO1' || doPdfRow[3] !== 'R3' || doPdfRow[4] !== 'DO1 已下單：玻璃、五金') {
    throw new Error('PDF 的 DO 列應含 VALUE / 下單 R / NOTE：' + JSON.stringify(doPdfRow));
  }

  await page.screenshot({ path: 'tablepdf_pdf_preview.png' }); // 列印區內容（螢幕上不顯示，僅供檢查）

  // 7. 列印樣式：模擬 print media → 只顯示表格（即 PDF 的內容）
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(250);
  const printView = await page.evaluate(() => {
    const area = document.getElementById('printArea');
    const table = area.querySelector('table.print-table');
    return {
      areaDisplay: getComputedStyle(area).display,
      topbarHidden: !document.querySelector('.topbar').checkVisibility(),
      appHidden: !document.querySelector('.project-wide').checkVisibility(),
      tableWidth: table ? table.offsetWidth : 0,
      pageSize: [...document.styleSheets].length > 0
    };
  });
  console.log('Print media view:', JSON.stringify(printView));
  if (printView.areaDisplay === 'none') throw new Error('列印時應顯示 #printArea');
  if (!printView.topbarHidden || !printView.appHidden) throw new Error('列印時應隱藏畫面其餘部分');
  if (!printView.tableWidth) throw new Error('列印時表格應有寬度');
  await page.screenshot({ path: 'tablepdf_print.png' }); // 供人工檢視（已列入 .gitignore）
  await page.emulateMedia({ media: 'screen' });

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }
  console.log('\nTABLE + PDF EXPORT E2E PASSED');
  await browser.close();
})().catch(e => { console.error('TABLE + PDF EXPORT E2E FAILED:', e.message); process.exit(1); });

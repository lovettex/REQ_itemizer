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
        { id: 's2', label: 'PROJECT ADMIN', value: 'UPDATED', r: '', note: '', createdAt: '2026-09-13T00:00:00.000Z' },
        { id: 's3', label: 'PICKLIST (DO)', value: 'DO2', r: 'R5', note: 'DO2 已下單：門', createdAt: '2026-09-14T00:00:00.000Z' }
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
      // NOTE 必須是可換行、可自行調整大小的 textarea，且內容過長時會自動長高
      noteTag: rows[0] ? rows[0].querySelector('[data-wlog-note]').tagName : null,
      noteResize: rows[0] ? getComputedStyle(rows[0].querySelector('[data-wlog-note]')).resize : null,
      noteWrap: rows[0] ? getComputedStyle(rows[0].querySelector('[data-wlog-note]')).whiteSpace : null,
      handle: !!panel.querySelector('.drag-handle[draggable="true"]'),
      rowDraggable: rows[0] ? !!rows[0].querySelector('[data-drag-row]') : false,
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
  if (wl.noteTag !== 'TEXTAREA') throw new Error('NOTE 應為 textarea（才能換行與調整大小）：' + wl.noteTag);
  if (wl.noteResize !== 'vertical') throw new Error('NOTE 應可自行調整大小（resize:vertical）：' + wl.noteResize);
  if (wl.noteWrap !== 'pre-wrap') throw new Error('NOTE 應自動換行（white-space:pre-wrap）：' + wl.noteWrap);
  if (!wl.handle || !wl.rowDraggable) throw new Error('Work Log 列應可用拖曳把手調整順序');
  if (!wl.pdfBtn) throw new Error('Work Log 應有匯出 PDF 按鈕');
  await page.screenshot({ path: 'tablepdf_worklog.png' }); // 供人工檢視（已列入 .gitignore）

  // 1b. 多行 NOTE：輸入框要長高到完整顯示，且每一行都保留
  const MULTILINE = '第一次送審\n• 玻璃 10mm 強化\n• 五金 SSS\n• 收邊鋁料';
  await page.fill('[data-wlog-note="w1"]', MULTILINE);
  await page.dispatchEvent('[data-wlog-note="w1"]', 'input');
  await page.waitForTimeout(250);
  const multi = await page.evaluate(() => {
    const el = document.querySelector('[data-wlog-note="w1"]');
    return { lines: el.value.split('\n').length, h: el.clientHeight, scroll: el.scrollHeight, wrap: getComputedStyle(el).whiteSpace };
  });
  console.log('Multi-line note:', JSON.stringify(multi));
  if (multi.lines !== 4) throw new Error('NOTE 應保留 4 行：' + multi.lines);
  if (multi.h < 60) throw new Error('多行 NOTE 的輸入框應長高：' + multi.h);
  if (multi.scroll > multi.h + 3) throw new Error('多行 NOTE 不應被裁掉：' + JSON.stringify(multi));
  await page.dispatchEvent('[data-wlog-note="w1"]', 'change');
  await page.waitForTimeout(250);

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
      widths: table ? [...table.querySelectorAll('colgroup col')].map(c => c.style.width) : null,
      rowStyles: table ? [...table.querySelectorAll('tbody tr')].map(tr => tr.getAttribute('style') || '') : [],
      bodyRows: table ? table.querySelectorAll('tbody tr').length : 0,
      html: area.innerHTML
    };
  });
  console.log('Work Log PDF:', JSON.stringify({ printing: wlPdf.printing, printCalls: wlPdf.printCalls, headers: wlPdf.headers, widths: wlPdf.widths, rowStyles: wlPdf.rowStyles, bodyRows: wlPdf.bodyRows }));
  if (!wlPdf.printing || wlPdf.printCalls !== 1) throw new Error('應叫用列印（輸出 PDF）一次：' + JSON.stringify({ p: wlPdf.printing, c: wlPdf.printCalls }));
  if (!wlPdf.hasTable) throw new Error('列印區應有表格');
  // PDF 不含 QTN / DATE 欄
  if (JSON.stringify(wlPdf.headers) !== JSON.stringify(['#', 'SUMMARY', 'NOTE', 'STATUS'])) throw new Error('Work Log PDF 表頭應為 #/SUMMARY/NOTE/STATUS：' + JSON.stringify(wlPdf.headers));
  if (wlPdf.html.indexOf('QTN-77') !== -1) throw new Error('Work Log PDF 不應再出現 QTN 內容');
  if (JSON.stringify(wlPdf.widths) !== JSON.stringify(['6%', '26%', '52%', '16%'])) throw new Error('Work Log PDF 欄寬比例不正確：' + JSON.stringify(wlPdf.widths));
  if (wlPdf.rowStyles[0].indexOf('#F0FF45') === -1) throw new Error('PDF 應標示 confirmed 列（黃底）：' + wlPdf.rowStyles[0]);
  if (wlPdf.rowStyles[1]) throw new Error('非 confirmed 列不應有底色：' + wlPdf.rowStyles[1]);
  if (wlPdf.bodyRows !== 2) throw new Error('PDF 應有 2 列資料');
  if (wlPdf.html.indexOf('WORK LOG') === -1 || wlPdf.html.indexOf('Table PDF Project') === -1) throw new Error('PDF 應有標題與專案名稱');
  if (wlPdf.html.indexOf('第二批送審') === -1 || wlPdf.html.indexOf('第一次送審') === -1) throw new Error('PDF 應包含每筆 Log 的 NOTE');
  // 多行 NOTE：PDF 必須保留所有換行（資料條列顯示），且儲存格要完整顯示不被裁掉
  if (wlPdf.html.indexOf('第一次送審\n• 玻璃 10mm 強化\n• 五金 SSS\n• 收邊鋁料') === -1) throw new Error('PDF 的 NOTE 應保留原始換行：' + JSON.stringify(wlPdf.html.match(/第一次送審[^<]*/)));
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(250);
  const pdfNoteCell = await page.evaluate(() => {
    const cell = [...document.querySelectorAll('#printArea .print-table tbody td')].find(td => td.textContent.indexOf('第一次送審') !== -1);
    if (!cell) return null;
    return { wrap: getComputedStyle(cell).whiteSpace, h: cell.clientHeight, scroll: cell.scrollHeight, text: cell.textContent };
  });
  console.log('PDF NOTE cell:', JSON.stringify(pdfNoteCell));
  if (!pdfNoteCell) throw new Error('找不到 PDF 的 NOTE 儲存格');
  if (pdfNoteCell.wrap !== 'pre-wrap') throw new Error('PDF NOTE 儲存格應保留換行（white-space:pre-wrap）：' + pdfNoteCell.wrap);
  if (pdfNoteCell.text.split('\n').length !== 4) throw new Error('PDF NOTE 儲存格應有 4 行：' + JSON.stringify(pdfNoteCell.text));
  if (pdfNoteCell.scroll > pdfNoteCell.h + 3) throw new Error('PDF NOTE 儲存格高度應隨內容長高（不裁切）：' + JSON.stringify(pdfNoteCell));
  await page.screenshot({ path: 'tablepdf_print_worklog.png' });
  await page.emulateMedia({ media: 'screen' });
  await page.waitForTimeout(150);

  // 3b. Work Log 列拖曳排序（把第 2 列拖到第 1 列之前）
  const wlDrag = await page.evaluate((pid) => {
    const panel = document.querySelector(`[data-ptab-panel="${pid}|notes"]`);
    const handle = panel.querySelector('[data-drag-row="wlog|w2"]');
    const target = panel.querySelector('tr[data-wlog-row="w1"]');
    if (!handle || !target) return { ok: false, reason: 'handle/target missing' };
    const dt = new DataTransfer();
    const rect = target.getBoundingClientRect();
    const y = rect.top + 2; // 目標列上半部 → 放到它前面
    const fire = (el, type) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientY: y }));
    fire(handle, 'dragstart');
    fire(target, 'dragover');
    fire(target, 'drop');
    fire(handle, 'dragend');
    return { ok: true };
  }, PID);
  await page.waitForTimeout(400);
  const wlOrder = await page.evaluate((pid) => ({
    stored: JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid).workLogs.map(l => l.summary),
    ui: [...document.querySelectorAll(`[data-ptab-panel="${pid}|notes"] .worklog-item-summary`)].map(el => el.textContent)
  }), PID);
  console.log('Work Log after drag:', JSON.stringify({ drag: wlDrag, order: wlOrder }));
  if (!wlDrag.ok) throw new Error('找不到 Work Log 拖曳把手或目標列：' + wlDrag.reason);
  if (JSON.stringify(wlOrder.stored) !== JSON.stringify(['B1VO2', 'A2VO3R3'])) throw new Error('拖曳後 Log 順序應改變：' + JSON.stringify(wlOrder.stored));
  if (JSON.stringify(wlOrder.ui) !== JSON.stringify(['B1VO2', 'A2VO3R3'])) throw new Error('拖曳後畫面順序應同步：' + JSON.stringify(wlOrder.ui));

  // 4. Kickoff Summary 以表格呈現（含每個 DO 的 NOTE 輸入）
  await page.click(`[data-ptab="${PID}"][data-ptab-panel="kickoff"]`);
  await page.waitForTimeout(300);
  // 4a. Kickoff 的 WORK LOG SUMMARY 也是表格，且不含任何 icon／emoji
  const klog = await page.evaluate((pid) => {
    const panel = document.querySelector(`[data-ptab-panel="${pid}|kickoff"]`);
    const table = panel.querySelector('table.klog-table');
    const noteCell = table ? table.querySelector('.klog-note') : null;
    return {
      isTable: !!table,
      headers: table ? [...table.querySelectorAll('thead th')].map(th => th.textContent.trim()) : null,
      rows: panel.querySelectorAll('.klog-row').length,
      noteText: noteCell ? noteCell.textContent : null,
      noteWrap: noteCell ? getComputedStyle(noteCell).whiteSpace : null,
      tableEmoji: table ? /[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}]/u.test(table.textContent) : null,
      oldIcons: panel.querySelectorAll('.pc-log,.wl-entry,.wl-entry-note').length
    };
  }, PID);
  console.log('Kickoff WORK LOG table:', JSON.stringify(klog, null, 1));
  if (!klog.isTable) throw new Error('Kickoff 的 WORK LOG SUMMARY 應以 table 呈現');
  if (JSON.stringify(klog.headers) !== JSON.stringify(['#', 'SUMMARY', 'QTN', 'NOTE', 'DATE', 'STATUS'])) throw new Error('Kickoff WORK LOG 表頭不正確：' + JSON.stringify(klog.headers));
  if (klog.rows !== 1) throw new Error('只應列出 confirmed 的 Log（1 筆），實際 ' + klog.rows);
  if (klog.noteWrap !== 'pre-wrap') throw new Error('Kickoff WORK LOG 的 NOTE 應保留換行：' + klog.noteWrap);
  if (klog.noteText.split('\n').length !== 4) throw new Error('Kickoff WORK LOG 的 NOTE 應完整顯示 4 行：' + JSON.stringify(klog.noteText));
  if (klog.tableEmoji) throw new Error('Kickoff WORK LOG 表格不應有 icon／emoji');
  if (klog.oldIcons !== 0) throw new Error('Kickoff WORK LOG 不應再用舊的 icon 樣式：' + klog.oldIcons);

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
      noteTag: doRow ? doRow.querySelector('[data-confirmed-note]').tagName : null,
      noteResize: doRow ? getComputedStyle(doRow.querySelector('[data-confirmed-note]')).resize : null,
      handle: !!panel.querySelector('.confirmed-summary-item .drag-handle[draggable="true"]'),
      upDown: panel.querySelectorAll('[data-confirmed-up]').length === 3 && panel.querySelectorAll('[data-confirmed-down]').length === 3,
      pdfBtn: !!panel.querySelector('[data-print-summary]')
    };
  }, PID);
  console.log('Kickoff summary table:', JSON.stringify(sum, null, 1));
  if (!sum.isTable) throw new Error('Kickoff Summary 應以 table 呈現');
  if (JSON.stringify(sum.headers) !== JSON.stringify(['#', 'TASK', 'VALUE', '下單 R', 'NOTE（每個 DO 已發出的內容）', 'DATE', ''])) throw new Error('Summary 表頭不正確：' + JSON.stringify(sum.headers));
  if (sum.rowCount !== 3 || sum.display !== 'table-row') throw new Error('Summary 應有 3 列且為表格列：' + JSON.stringify(sum));
  if (sum.doNote !== 'DO1 已下單：玻璃') throw new Error('DO 的 NOTE 應顯示既有內容：' + sum.doNote);
  if (sum.doNoteClass.indexOf('is-do') === -1) throw new Error('DO 的 NOTE 輸入框應標示為 DO');
  if (sum.doNotePlaceholder.indexOf('DO') === -1) throw new Error('DO 的 NOTE 提示應說明是 DO 下單內容：' + sum.doNotePlaceholder);
  if (sum.doR !== 'R3') throw new Error('下單 R 應獨立為一欄：' + sum.doR);
  if (sum.noteTag !== 'TEXTAREA') throw new Error('Summary NOTE 應為 textarea（換行＋可調整大小）：' + sum.noteTag);
  if (sum.noteResize !== 'vertical') throw new Error('Summary NOTE 應可自行調整大小：' + sum.noteResize);
  if (!sum.handle) throw new Error('Summary 列應有拖曳把手');
  if (!sum.upDown) throw new Error('Summary 列應有 ▲▼ 可調整順序');
  if (!sum.pdfBtn) throw new Error('Summary 應有匯出 PDF 按鈕');
  await page.screenshot({ path: 'tablepdf_summary.png' }); // 供人工檢視（已列入 .gitignore）

  // 4b. Kickoff Summary 拖曳排序：把 DO2（第 3 列）拖到 PROJECT ADMIN（第 2 列）之前
  const sumDrag = await page.evaluate((pid) => {
    const panel = document.querySelector(`[data-ptab-panel="${pid}|kickoff"]`);
    const handle = panel.querySelector('[data-drag-row="summary|s3"]');
    const target = panel.querySelector('tr[data-sum-row="s2"]');
    if (!handle || !target) return { ok: false, reason: 'handle/target missing' };
    const dt = new DataTransfer();
    const rect = target.getBoundingClientRect();
    const y = rect.top + 2;
    const fire = (el, type) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientY: y }));
    fire(handle, 'dragstart');
    fire(target, 'dragover');
    fire(target, 'drop');
    fire(handle, 'dragend');
    return { ok: true };
  }, PID);
  await page.waitForTimeout(400);
  const sumOrder = await page.evaluate((pid) => ({
    stored: JSON.parse(localStorage.getItem('t1-projects')).find(x => x.id === pid).confirmSummary.map(r => r.value || r.label),
    ui: [...document.querySelectorAll(`[data-ptab-panel="${pid}|kickoff"] .confirmed-summary-item .cs-value`)].map(el => el.textContent)
  }), PID);
  console.log('Summary after drag:', JSON.stringify({ drag: sumDrag, order: sumOrder }));
  if (!sumDrag.ok) throw new Error('找不到 Summary 拖曳把手或目標列：' + sumDrag.reason);
  if (JSON.stringify(sumOrder.stored) !== JSON.stringify(['DO1', 'DO2', 'UPDATED'])) throw new Error('拖曳後 Summary 順序應改變：' + JSON.stringify(sumOrder.stored));
  if (JSON.stringify(sumOrder.ui) !== JSON.stringify(['DO1', 'DO2', 'UPDATED'])) throw new Error('拖曳後畫面順序應同步：' + JSON.stringify(sumOrder.ui));

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
  if (doNote.inputValue !== 'DO1 已下單：玻璃、五金' || doNote.rows !== 3) throw new Error('編輯 DO NOTE 不應重建表格：' + JSON.stringify(doNote));

  // 6. 匯出 KICKOFF SUMMARY PDF（不含 DATE；DO 全部集中成群組）
  await page.click(`[data-print-summary="${PID}"]`);
  await page.waitForTimeout(400);
  const sumPdf = await page.evaluate(() => {
    const area = document.getElementById('printArea');
    const table = area.querySelector('table.print-table');
    return {
      printCalls: window.__printCalls,
      headers: table ? [...table.querySelectorAll('thead th')].map(th => th.textContent.trim()) : null,
      widths: table ? [...table.querySelectorAll('colgroup col')].map(c => c.style.width) : null,
      rowStyles: table ? [...table.querySelectorAll('tbody tr')].map(tr => tr.getAttribute('style') || '') : [],
      html: area.innerHTML,
      rows: table ? [...table.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => td.textContent)) : []
    };
  });
  console.log('Summary PDF:', JSON.stringify({ printCalls: sumPdf.printCalls, headers: sumPdf.headers, widths: sumPdf.widths, rows: sumPdf.rows }, null, 1));
  if (sumPdf.printCalls !== 2) throw new Error('應叫用列印第二次，實際 ' + sumPdf.printCalls);
  if (JSON.stringify(sumPdf.headers) !== JSON.stringify(['#', 'TASK', 'VALUE', '下單 R', 'NOTE'])) throw new Error('Summary PDF 表頭應為 #/TASK/VALUE/下單 R/NOTE：' + JSON.stringify(sumPdf.headers));
  if (JSON.stringify(sumPdf.widths) !== JSON.stringify(['5%', '16%', '14%', '10%', '55%'])) throw new Error('Summary PDF 欄寬比例不正確：' + JSON.stringify(sumPdf.widths));
  if (sumPdf.html.indexOf('KICKOFF SUMMARY') === -1 || sumPdf.html.indexOf('PJ-777') === -1) throw new Error('PDF 應有標題與 Project No');
  // DO 群組：其他任務在前，兩個 DO 連續排列，第二筆 DO 的 TASK 留空以呈現群組
  const labels = sumPdf.rows.map(r => r[1]);
  console.log('PDF TASK column:', JSON.stringify(labels));
  if (labels[0] !== 'PROJECT ADMIN') throw new Error('非 DO 任務應排在前面：' + JSON.stringify(labels));
  if (labels.filter(l => l === 'PICKLIST (DO)').length !== 1) throw new Error('PICKLIST (DO) 標題只應出現一次（群組）：' + JSON.stringify(labels));
  if (labels[labels.length - 1] !== '') throw new Error('第二筆 DO 的 TASK 應留空以呈現群組：' + JSON.stringify(labels));
  const doRows = sumPdf.rows.filter(r => r[2] === 'DO1' || r[2] === 'DO2');
  if (doRows.length !== 2) throw new Error('PDF 應含兩筆 DO：' + JSON.stringify(sumPdf.rows));
  if (doRows[0][3] !== 'R3' || doRows[1][3] !== 'R5') throw new Error('DO 的 下單 R 應正確：' + JSON.stringify(doRows));
  if (doRows[0][4] !== 'DO1 已下單：玻璃、五金' || doRows[1][4] !== 'DO2 已下單：門') throw new Error('DO 的 NOTE 應正確：' + JSON.stringify(doRows));
  if (sumPdf.rowStyles.filter(s => s.indexOf('#EDF7D6') !== -1).length !== 2) throw new Error('DO 群組列應有底色標示：' + JSON.stringify(sumPdf.rowStyles));

  // 6b. NOTE 內容超過可視範圍時要自動換行並讓輸入框長高（也可自行拖曳調整大小）
  await page.click(`[data-ptab="${PID}"][data-ptab-panel="notes"]`);
  await page.waitForTimeout(250);
  const growBefore = await page.evaluate(() => document.querySelector('[data-wlog-note="w2"]').clientHeight);
  const longNote = '這是一段很長的備註內容，用來確認 NOTE 欄位會自動換行、輸入框也會隨著內容長高，不會被截掉。'.repeat(4);
  await page.fill('[data-wlog-note="w2"]', longNote);
  await page.dispatchEvent('[data-wlog-note="w2"]', 'input');
  await page.waitForTimeout(250);
  const grow = await page.evaluate(() => {
    const el = document.querySelector('[data-wlog-note="w2"]');
    const cs = getComputedStyle(el);
    return { h: el.clientHeight, scroll: el.scrollHeight, resize: cs.resize, wrap: cs.whiteSpace };
  });
  console.log('Long note growth:', JSON.stringify({ before: growBefore, after: grow }));
  if (grow.h <= growBefore) throw new Error('NOTE 內容變長時輸入框應自動長高：' + JSON.stringify({ before: growBefore, after: grow }));
  if (grow.scroll > grow.h + 3) throw new Error('NOTE 內容不應被截掉（要換行並長高）：' + JSON.stringify(grow));
  if (grow.resize !== 'vertical') throw new Error('NOTE 輸入框應可自行調整大小：' + grow.resize);
  await page.screenshot({ path: 'tablepdf_longnote.png' }); // 供人工檢視（已列入 .gitignore）

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

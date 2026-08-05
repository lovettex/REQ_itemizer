// End-to-end test: RFQ Wiki Excel multi-cell copy/paste.
// Requires serve.js running on port 3000.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

await page.context().route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // Open the RFQ Wiki tab (independent top-level tab)
  const wikiTab = await page.evaluate(() => {
    const btn = document.querySelector('.project-tab[data-project-tab="wiki"]');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Wiki tab clicked:', wikiTab);
  await page.waitForTimeout(300);

  // Verify category dropdown now shows OVERSEA A / OVERSEA B (RFQ panel is up)
  const cats = await page.evaluate(() => {
    const sel = document.getElementById('wikiCategorySelect');
    return sel ? Array.from(sel.options).map(o => o.value) : [];
  });
  console.log('Categories:', JSON.stringify(cats));
  if (!cats.includes('OVERSEA A') || !cats.includes('OVERSEA B') || cats.includes('OS.PARTITION')) {
    throw new Error('Category rename not applied: ' + JSON.stringify(cats));
  }

  // Create a new inquiry entry (RFQ sub-tab)
  await page.evaluate(() => {
    const addBtn = document.getElementById('wikiAddBtn');
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const form = document.getElementById('wikiInquiryForm');
    if (!form) return;
    const cat = document.getElementById('wikiCategorySelect');
    if (cat) { cat.value = 'DOOR'; cat.dispatchEvent(new Event('change')); }
    const title = form.querySelector('input[name="title"]');
    if (title) title.value = 'E2E Paste Test';
    const checkboxes = form.querySelectorAll('input[name="linkTab"]');
    checkboxes.forEach(cb => { if (cb.value === 'BOQ') cb.checked = true; });
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  await page.waitForTimeout(500);

  // Debug: what state did the submit leave behind?
  const debug = await page.evaluate(() => {
    const entries = JSON.parse(localStorage.getItem('t1-wiki-entries') || '[]');
    const form = document.getElementById('wikiInquiryForm');
    const addBtn = document.getElementById('wikiAddBtn');
    return {
      entryCount: entries.length,
      titles: entries.map(e => e.title),
      formExists: !!form,
      formDisplay: form ? form.style.display : null,
      addBtnExists: !!addBtn,
      hasOnsubmit: !!(form && form.onsubmit),
      checkboxCount: form ? form.querySelectorAll('input[name="linkTab"]').length : -1,
      checkedCount: form ? form.querySelectorAll('input[name="linkTab"]:checked').length : -1,
      catValue: form ? (document.getElementById('wikiCategorySelect') || {}).value : null,
      titleValue: form ? (form.querySelector('input[name="title"]') || {}).value : null,
      gridExists: !!document.querySelector('.wiki-grid'),
      gridAreaExists: !!document.querySelector('.wiki-grid-area'),
      currentSubTabButtons: Array.from(document.querySelectorAll('[data-wikisub]')).map(b => b.textContent),
    };
  });
  console.log('Debug after submit:', JSON.stringify(debug));
  if (debug.entryCount < 1) throw new Error('Entry was not created');

  // Switch to BOQ grid tab and click cell A1
  await page.evaluate(() => {
    const sub = document.querySelector('[data-wikisub="BOQ"]');
    if (sub) sub.click();
  });
  await page.waitForTimeout(300);

  const colHeaders = await page.evaluate(() =>
    Array.from(document.querySelectorAll('thead .wiki-col-header')).map(th => th.textContent)
  );
  console.log('Column headers:', JSON.stringify(colHeaders));
  if (colHeaders[0] !== 'A' || colHeaders[1] !== 'B' || colHeaders[2] !== 'C') {
    throw new Error('Column headers not A,B,C... got ' + JSON.stringify(colHeaders));
  }

  // Focus cell A1 then paste 3×4 Excel TSV
  await page.evaluate(() => {
    const cell = document.querySelector('.wiki-cell-editable[data-key="A1"]');
    cell.focus();
  });
  await page.evaluate(() => {
    const tsv = 'H1\tW1\tD1\r\nH2\tW2\tD2\r\nH3\tW3\tD3\r\nH4\tW4\tD4';
    const cell = document.querySelector('.wiki-cell-editable[data-key="A1"]');
    const dt = new DataTransfer();
    dt.setData('text/plain', tsv);
    const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    cell.dispatchEvent(ev);
  });
  await page.waitForTimeout(500);

  // Verify stored cells + rendered table
  const result = await page.evaluate(() => {
    const raw = localStorage.getItem('t1-wiki-entries');
    const entries = JSON.parse(raw || '[]');
    const e = entries.find(x => x.title === 'E2E Paste Test');
    const cells = e ? (e.cells.BOQ || {}) : {};
    const rendered = {};
    document.querySelectorAll('.wiki-cell-editable').forEach(td => { rendered[td.dataset.key] = td.textContent; });
    return {
      storedA1: cells['A1'], storedB1: cells['B1'], storedC1: cells['C1'], storedC4: cells['C4'],
      storedCount: Object.keys(cells).length,
      renderedA1: rendered['A1'], renderedC4: rendered['C4'],
      pastedCellsHighlighted: document.querySelectorAll('.wiki-cell-selected').length,
      rowsRendered: document.querySelectorAll('.wiki-grid tbody tr').length,
    };
  });
  console.log('Paste result:', JSON.stringify(result));
  if (result.storedA1 !== 'H1' || result.storedB1 !== 'W1' || result.storedC1 !== 'D1' || result.storedC4 !== 'D4') {
    throw new Error('Pasted cells not stored under correct keys');
  }
  if (result.renderedA1 !== 'H1' || result.renderedC4 !== 'D4') {
    throw new Error('Pasted cells not visible in rendered table');
  }
  if (result.storedCount !== 12) throw new Error('Expected 12 stored cells, got ' + result.storedCount);
  if (result.pastedCellsHighlighted < 12) throw new Error('Pasted region not highlighted');
  if (result.rowsRendered < 14) throw new Error('Grid did not grow rows, got ' + result.rowsRendered);

  // Copy 2×2 region back to clipboard → verify TSV + HTML
  await page.evaluate(() => {
    // select B1..C2 range via shift-drag simulation on mousedown/mouseover
    const b1 = document.querySelector('.wiki-cell-editable[data-key="B1"]');
    const c2 = document.querySelector('.wiki-cell-editable[data-key="C2"]');
    const grid = document.querySelector('.wiki-grid-area');
    const shiftEv = new MouseEvent('mousedown', { bubbles: true, cancelable: true, shiftKey: true });
    b1.dispatchEvent(shiftEv);
    const overEv = new MouseEvent('mouseover', { bubbles: true, cancelable: true });
    c2.dispatchEvent(overEv);
  });
  await page.waitForTimeout(200);
  const copy = await page.evaluate(() => {
    const dt = new DataTransfer();
    const ev = new ClipboardEvent('copy', { clipboardData: dt, bubbles: true, cancelable: true });
    const cell = document.querySelector('.wiki-cell-editable[data-key="C2"]');
    cell.dispatchEvent(ev);
    return { tsv: dt.getData('text/plain'), html: dt.getData('text/html') };
  });
  console.log('Copy TSV:', JSON.stringify(copy.tsv));
  console.log('Copy HTML:', JSON.stringify(copy.html));
  if (copy.tsv !== 'W1\tD1\r\nW2\tD2') throw new Error('Copy TSV mismatch: ' + JSON.stringify(copy.tsv));
  if (!copy.html.includes('<table>') || !copy.html.includes('<td>W1</td>')) {
    throw new Error('Copy HTML table mismatch');
  }

  // Delete key clears the selected region
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(300);
  const afterDel = await page.evaluate(() => {
    const raw = localStorage.getItem('t1-wiki-entries');
    const e = JSON.parse(raw).find(x => x.title === 'E2E Paste Test');
    return { b1: e.cells.BOQ['B1'], c2: e.cells.BOQ['C2'], a1: e.cells.BOQ['A1'] };
  });
  console.log('After Delete:', JSON.stringify(afterDel));
  if (afterDel.b1 !== '' || afterDel.c2 !== '' || afterDel.a1 !== 'H1') {
    throw new Error('Delete key did not clear selected cells');
  }

  // Legacy data migration check: inject old-style keys, reload, verify
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('t1-wiki-entries'));
    const e = raw.find(x => x.title === 'E2E Paste Test');
    localStorage.removeItem('t1-wiki-cols-migrated');
    e.cells.BOQ['AB1'] = 'legacy-y';
    e.cells.BOQ['AC2'] = 'legacy-z';
    localStorage.setItem('t1-wiki-entries', JSON.stringify(raw));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const migrated = await page.evaluate(() => {
    const e = JSON.parse(localStorage.getItem('t1-wiki-entries')).find(x => x.title === 'E2E Paste Test');
    const c = e.cells.BOQ;
    return { b1: c['B1'], c2: c['C2'], ab1: c['AB1'] };
  });
  console.log('After legacy migration:', JSON.stringify(migrated));
  if (migrated.b1 !== 'legacy-y' || migrated.c2 !== 'legacy-z' || migrated.ab1 !== undefined) {
    throw new Error('Legacy column migration failed');
  }

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }

  console.log('\nE2E WIKI EXCEL COPY-PASTE TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

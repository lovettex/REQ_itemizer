// E2E: PROJECT CONFIRMED — per-project drop-downs append records to a collapsible
// Summary block (collapsed by default) with delete + persistence.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Create project with a confirmed log so it appears in PROJECT CONFIRMED
  await page.evaluate(() => {
    document.querySelector('.project-tab[data-project-tab="new"]').click();
    const form = document.getElementById('projectForm');
    form.querySelector('input[name="name"]').value = 'Confirm Summary Proj';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  await page.waitForTimeout(400);
  const pid = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === 'Confirm Summary Proj');
    return p ? p.id : null;
  });
  await page.evaluate((id) => {
    document.querySelector('.project-tab[data-project-tab="saved"]').click();
    const card = document.querySelector(`.project-card[data-project-card="${id}"]`);
    card.open = true;
    document.querySelector(`[data-ptab="${id}"][data-ptab-panel="notes"]`).click();
  }, pid);
  await page.waitForTimeout(250);
  await page.evaluate((id) => {
    const card = document.querySelector(`.project-card[data-project-card="${id}"]`);
    const form = card.querySelector('[data-worklog]');
    form.querySelector('select[name="wl5"]').value = 'VO1';
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }, pid);
  await page.waitForTimeout(400);
  await page.evaluate((id) => {
    const card = document.querySelector(`.project-card[data-project-card="${id}"]`);
    const sel = card.querySelector('[data-wlog-status]');
    sel.value = 'confirmed';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }, pid);
  await page.waitForTimeout(500);

  // Open PROJECT CONFIRMED
  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="confirmed"]').click());
  await page.waitForTimeout(300);

  const cardUI = await page.evaluate(() => {
    const card = document.querySelector('.confirmed-card');
    const selects = Array.from(card.querySelectorAll('[data-confirmed-select]')).map(s => ({
      type: s.dataset.confirmedType,
      options: Array.from(s.options).map(o => o.value),
    }));
    return {
      selects,
      toggleText: card.querySelector('.confirmed-toggle').textContent,
      summaryDisplay: card.querySelector('[data-confirmed-summary]').style.display,
    };
  });
  console.log('Card UI:', JSON.stringify(cardUI));
  if (cardUI.selects.length !== 3) throw new Error('Expected 3 drop-downs');
  if (cardUI.selects[0].type !== 'Ironmongery Sign Off (4DWGS)') throw new Error('DD1 label wrong');
  if (JSON.stringify(cardUI.selects[0].options) !== JSON.stringify(['','TO DO','DONE'])) throw new Error('DD1 options wrong');
  if (JSON.stringify(cardUI.selects[1].options) !== JSON.stringify(['','UPDATED','PENDING'])) throw new Error('DD2 options wrong');
  if (JSON.stringify(cardUI.selects[2].options) !== JSON.stringify(['','NOT YET','DO1','DO2','DO3','DO4','DO5','DO6','D07','DO8','DO9','DO10','D011'])) {
    throw new Error('DD3 options wrong: ' + JSON.stringify(cardUI.selects[2].options));
  }
  if (cardUI.summaryDisplay !== 'none') throw new Error('Summary must be collapsed by default');
  if (cardUI.toggleText.indexOf('▶') !== 0) throw new Error('Toggle should start collapsed');

  // Pick PICKLIST (DO)=DO5 → summary record added
  await page.evaluate(() => {
    const sel = document.querySelector('[data-confirmed-type="PICKLIST (DO)"]');
    sel.value = 'DO5';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(400);
  // Pick Ironmongery = DONE
  await page.evaluate(() => {
    const sel = document.querySelector('[data-confirmed-type="Ironmongery Sign Off (4DWGS)"]');
    sel.value = 'DONE';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(400);

  const afterPick = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === 'Confirm Summary Proj');
    const card = document.querySelector('.confirmed-card');
    return {
      records: (p.confirmSummary || []).map(r => ({ label: r.label, value: r.value })),
      toggleText: card.querySelector('.confirmed-toggle').textContent,
      summaryDisplay: card.querySelector('[data-confirmed-summary]').style.display,
    };
  });
  console.log('After picks:', JSON.stringify(afterPick));
  if (afterPick.records.length !== 2) throw new Error('Expected 2 summary records');
  if (afterPick.records[0].label !== 'PICKLIST (DO)' || afterPick.records[0].value !== 'DO5') throw new Error('Record 1 wrong: ' + JSON.stringify(afterPick.records[0]));
  if (afterPick.records[1].label !== 'Ironmongery Sign Off (4DWGS)' || afterPick.records[1].value !== 'DONE') throw new Error('Record 2 wrong: ' + JSON.stringify(afterPick.records[1]));
  if (afterPick.summaryDisplay !== 'none') throw new Error('Summary should stay collapsed after adding');

  // Expand toggle
  await page.evaluate(() => document.querySelector('[data-confirmed-toggle]').click());
  await page.waitForTimeout(200);
  const expanded = await page.evaluate(() => {
    const card = document.querySelector('.confirmed-card');
    return {
      display: card.querySelector('[data-confirmed-summary]').style.display,
      toggleText: card.querySelector('.confirmed-toggle').textContent,
      items: Array.from(card.querySelectorAll('.confirmed-summary-item')).map(it => it.textContent.replace(/\s+/g, ' ').trim()),
    };
  });
  console.log('Expanded:', JSON.stringify(expanded));
  if (expanded.display === 'none') throw new Error('Summary should be visible after toggle');
  if (expanded.items.length !== 2) throw new Error('Summary items != 2');
  if (expanded.items[0].indexOf('PICKLIST (DO)') === -1 || expanded.items[0].indexOf('DO5') === -1) throw new Error('Item 1 content wrong: ' + expanded.items[0]);
  if (expanded.items[1].indexOf('Ironmongery Sign Off (4DWGS)') === -1 || expanded.items[1].indexOf('DONE') === -1) throw new Error('Item 2 content wrong: ' + expanded.items[1]);

  // Delete one record
  await page.evaluate(() => {
    const card = document.querySelector('.confirmed-card');
    const del = card.querySelector('[data-confirmed-del]');
    del.click();
  });
  await page.waitForTimeout(400);
  const afterDel = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === 'Confirm Summary Proj');
    return (p.confirmSummary || []).map(r => r.value);
  });
  console.log('After delete:', JSON.stringify(afterDel));
  if (afterDel.length !== 1 || afterDel[0] !== 'DONE') throw new Error('Delete failed: ' + JSON.stringify(afterDel));

  // Reload → record persisted, summary still collapsed by default
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const reloaded = await page.evaluate(() => {
    document.querySelector('.project-tab[data-project-tab="confirmed"]').click();
    return true;
  });
  await page.waitForTimeout(300);
  const reloadState = await page.evaluate(() => {
    const card = document.querySelector('.confirmed-card');
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === 'Confirm Summary Proj');
    return {
      records: (p.confirmSummary || []).map(r => r.value),
      summaryDisplay: card ? card.querySelector('[data-confirmed-summary]').style.display : null,
      toggleText: card ? card.querySelector('.confirmed-toggle').textContent : null,
    };
  });
  console.log('After reload:', JSON.stringify(reloadState));
  if (JSON.stringify(reloadState.records) !== JSON.stringify(['DONE'])) throw new Error('Records not persisted: ' + JSON.stringify(reloadState.records));
  if (reloadState.summaryDisplay !== 'none') throw new Error('Summary should be collapsed by default after reload');

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }

  console.log('\nE2E CONFIRMED SUMMARY DROP-DOWNS TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

// E2E: Work Log — cumulative logs, per-log status (submited/Considering/confirmed)
// with background colors, delete/reorder management, and title badges showing
// only confirmed logs. Requires serve.js on :3000.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Create a project
  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="new"]').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const form = document.getElementById('projectForm');
    form.querySelector('input[name="name"]').value = 'WL Multi Log';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  await page.waitForTimeout(400);

  // Open card → Work Log tab
  await page.evaluate(() => {
    document.querySelector('.project-tab[data-project-tab="saved"]').click();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const card = document.querySelector('.project-card');
    card.open = true;
    document.querySelector('[data-ptab-panel="notes"]').click();
  });
  await page.waitForTimeout(300);

  const submitWL = async (sets) => {
    await page.evaluate((sets) => {
      const form = document.querySelector('[data-worklog]');
      const set = (name, val) => { form.querySelector(`select[name="${name}"]`).value = val; };
      set('wl1', '-'); set('wl2', '-'); set('wl3', '-'); set('wl4', '-'); set('wl5', '-'); set('wl6', '-');
      Object.keys(sets).forEach(k => set(k, sets[k]));
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, sets);
    await page.waitForTimeout(400);
  };

  // Generate 3 logs: A2VO3R3, B1VO2, VO5R9
  await submitWL({ wl1: 'A2', wl5: 'VO3', wl6: 'R3' });
  await submitWL({ wl2: 'B1', wl5: 'VO2' });
  await submitWL({ wl5: 'VO5', wl4: 'R9' });

  const list1 = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === 'WL Multi Log');
    const items = Array.from(document.querySelectorAll('.worklog-item')).map(el => ({
      summary: el.querySelector('.worklog-item-summary').textContent,
      status: el.querySelector('.worklog-status').value,
      bg: el.style.background || el.style.backgroundColor,
      id: el.querySelector('[data-wlog-status]').dataset.wlogStatus,
    }));
    return { workLogs: p.workLogs.map(l => l.summary), items };
  });
  console.log('After 3 logs:', JSON.stringify(list1));
  if (list1.workLogs.length !== 3) throw new Error('Logs should accumulate, got ' + list1.workLogs.length);
  if (JSON.stringify(list1.workLogs) !== JSON.stringify(['R9VO5','B1VO2','A2VO3R3'])) {
    throw new Error('Log order/content mismatch: ' + JSON.stringify(list1.workLogs));
  }
  if (list1.items.length !== 3) throw new Error('UI items != 3');
  if (list1.items.every(i => i.status !== 'submited')) throw new Error('New logs should default to submited');

  // Set log #1 (A2VO3R3) → confirmed, log #2 (B1VO2) → Considering
  const logIds = list1.items.map(i => i.id); // [VO5R9, B1VO2, A2VO3R3] order
  await page.evaluate((ids) => {
    const statusSel = document.querySelector(`[data-wlog-status="${ids[2]}"]`);
    statusSel.value = 'confirmed';
    statusSel.dispatchEvent(new Event('change', { bubbles: true }));
  }, logIds);
  await page.waitForTimeout(300);
  await page.evaluate((ids) => {
    const statusSel = document.querySelector(`[data-wlog-status="${ids[1]}"]`);
    statusSel.value = 'Considering';
    statusSel.dispatchEvent(new Event('change', { bubbles: true }));
  }, logIds);
  await page.waitForTimeout(300);

  const colors = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.worklog-item'));
    const get = (idx) => {
      const el = items[idx];
      return { summary: el.querySelector('.worklog-item-summary').textContent, bg: el.style.background, color: el.style.color };
    };
    return { confirmed: get(0), considering: get(1), submited: get(2) };
  });
  console.log('Backgrounds:', JSON.stringify(colors));
  const allItems = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.worklog-item')).map(el => ({
      summary: el.querySelector('.worklog-item-summary').textContent,
      bg: el.style.background,
      color: el.style.color,
    }))
  );
  console.log('All items now:', JSON.stringify(allItems));
  const bySummary = {}; allItems.forEach(i => bySummary[i.summary] = i);
  if (!bySummary['A2VO3R3'] || (bySummary['A2VO3R3'].bg.indexOf('F0FF45') === -1 && bySummary['A2VO3R3'].bg.indexOf('rgb(240, 255, 69)') === -1)) throw new Error('confirmed bg missing #F0FF45');
  if (!bySummary['B1VO2'] || (bySummary['B1VO2'].bg.indexOf('406B28') === -1 && bySummary['B1VO2'].bg.indexOf('rgb(64, 107, 40)') === -1)) throw new Error('Considering bg missing #406B28');
  if (bySummary['B1VO2'].color !== 'rgb(255, 255, 255)') throw new Error('Considering text should be white');
  if (bySummary['R9VO5'].bg !== '') throw new Error('submited should have default background');

  // Title badge: only confirmed (A2VO3R3) shown
  const badges = await page.evaluate(() => {
    const card = document.querySelector('.project-card');
    return Array.from(card.querySelectorAll('.pc-log')).map(b => b.textContent);
  });
  console.log('Badges:', JSON.stringify(badges));
  if (JSON.stringify(badges) !== JSON.stringify(['A2VO3R3'])) {
    throw new Error('Badges should show only confirmed: ' + JSON.stringify(badges));
  }

  // Reorder: move VO5R9 (first) down one → B1VO2 becomes first
  const firstId = await page.evaluate(() => document.querySelector('[data-wlog-down]').dataset.wlogDown);
  await page.evaluate((id) => {
    document.querySelector(`[data-wlog-down="${id}"]`).click();
  }, firstId);
  await page.waitForTimeout(300);
  const orderAfter = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.worklog-item-summary')).map(s => s.textContent)
  );
  console.log('Order after move-down:', JSON.stringify(orderAfter));
  if (orderAfter[0] !== 'B1VO2' || orderAfter[1] !== 'R9VO5') {
    throw new Error('Reorder failed: ' + JSON.stringify(orderAfter));
  }

  // Delete the Considering log (B1VO2)
  const delId = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.worklog-item'));
    const target = items.find(el => el.querySelector('.worklog-item-summary').textContent === 'B1VO2');
    return target.querySelector('[data-wlog-del]').dataset.wlogDel;
  });
  await page.evaluate((id) => {
    document.querySelector(`[data-wlog-del="${id}"]`).click();
  }, delId);
  await page.waitForTimeout(300);
  const afterDelete = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === 'WL Multi Log');
    return { count: p.workLogs.length, summaries: p.workLogs.map(l => l.summary) };
  });
  console.log('After delete:', JSON.stringify(afterDelete));
  if (afterDelete.count !== 2 || afterDelete.summaries.includes('B1VO2')) {
    throw new Error('Delete failed: ' + JSON.stringify(afterDelete));
  }

  // Reload → persisted (badges only confirmed; still 2 logs)
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const afterReload = await page.evaluate(() => {
    document.querySelector('.project-card').open = true;
    document.querySelector('[data-ptab-panel="notes"]').click();
    return true;
  });
  await page.waitForTimeout(400);
  const reloadState = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === 'WL Multi Log');
    return {
      count: p.workLogs.length,
      statuses: p.workLogs.map(l => l.status),
      badges: Array.from(document.querySelector('.project-card').querySelectorAll('.pc-log')).map(b => b.textContent),
      items: Array.from(document.querySelectorAll('.worklog-item-summary')).map(s => s.textContent),
    };
  });
  console.log('After reload:', JSON.stringify(reloadState));
  if (reloadState.count !== 2) throw new Error('Reload lost logs');
  if (!reloadState.statuses.includes('confirmed')) throw new Error('confirmed status not persisted');
  if (JSON.stringify(reloadState.badges) !== JSON.stringify(['A2VO3R3'])) throw new Error('Badges wrong after reload');

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }

  console.log('\nE2E WORK LOG MULTI / STATUS / MANAGE TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

// E2E: PROJECT CONFIRMED tab — shows only projects with confirmed Work Log summaries.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

await page.context().route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const tabExists = await page.evaluate(() => {
    const btn = document.querySelector('.project-tab[data-project-tab="confirmed"]');
    const panel = document.querySelector('.project-tab-panel[data-project-tab-panel="confirmed"]');
    return { btn: !!btn, panel: !!panel, label: btn ? btn.textContent.trim() : null };
  });
  console.log('Confirmed tab:', JSON.stringify(tabExists));
  if (!tabExists.btn || !tabExists.panel) throw new Error('PROJECT CONFIRMED tab missing');
  if (tabExists.label !== 'PROJECT CONFIRMED') throw new Error('Tab label wrong: ' + tabExists.label);

  const createProject = async (name) => {
    await page.evaluate((n) => {
      document.querySelector('.project-tab[data-project-tab="new"]').click();
      const form = document.getElementById('projectForm');
      form.querySelector('input[name="name"]').value = n;
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }, name);
    await page.waitForTimeout(400);
    return page.evaluate((n) => {
      const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === n);
      return p ? p.id : null;
    }, name);
  };
  const addWorkLog = async (pid, sets, status) => {
    await page.evaluate((id) => {
      document.querySelector('.project-tab[data-project-tab="saved"]').click();
      const card = document.querySelector(`.project-card[data-project-card="${id}"]`);
      card.open = true;
      document.querySelector(`[data-ptab="${id}"][data-ptab-panel="notes"]`).click();
    }, pid);
    await page.waitForTimeout(250);
    await page.evaluate(({ id, sets }) => {
      const card = document.querySelector(`.project-card[data-project-card="${id}"]`);
      const form = card.querySelector('[data-worklog]');
      const set = (nm, val) => { form.querySelector(`select[name="${nm}"]`).value = val; };
      set('wl1', '-'); set('wl2', '-'); set('wl3', '-'); set('wl4', '-'); set('wl5', '-'); set('wl6', '-');
      Object.keys(sets).forEach(k => set(k, sets[k]));
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, { id: pid, sets });
    await page.waitForTimeout(400);
    if (status === 'confirmed') {
      await page.evaluate((id) => {
        const card = document.querySelector(`.project-card[data-project-card="${id}"]`);
        const sel = card.querySelector('[data-wlog-status]');
        sel.value = 'confirmed';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }, pid);
      await page.waitForTimeout(400);
    }
  };
  const setLogStatus = async (pid, status) => {
    await page.evaluate(({ id, st }) => {
      document.querySelector('.project-tab[data-project-tab="saved"]').click();
      const card = document.querySelector(`.project-card[data-project-card="${id}"]`);
      card.open = true;
      const sel = card.querySelector('[data-wlog-status]');
      sel.value = st;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, { id: pid, st: status });
    await page.waitForTimeout(400);
  };

  const idA = await createProject('Conf Project A');
  const idB = await createProject('Conf Project B');
  await addWorkLog(idA, { wl1: 'A2', wl5: 'VO3' }, 'confirmed'); // A2VO3
  await addWorkLog(idB, { wl5: 'VO9' }, 'submited');            // VO9 (not confirmed)

  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="confirmed"]').click());
  await page.waitForTimeout(300);
  const confirmedList = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.confirmed-card')).map(card => ({
      name: card.querySelector('.confirmed-card-name').textContent,
      logs: Array.from(card.querySelectorAll('.pc-log')).map(b => b.textContent),
    }));
  });
  console.log('Confirmed list:', JSON.stringify(confirmedList));
  if (confirmedList.length !== 1) throw new Error('Expected 1 confirmed project, got ' + confirmedList.length);
  if (confirmedList[0].name !== 'Conf Project A') throw new Error('Wrong project shown: ' + confirmedList[0].name);
  if (JSON.stringify(confirmedList[0].logs) !== JSON.stringify(['A2VO3'])) {
    throw new Error('Confirmed summary wrong: ' + JSON.stringify(confirmedList[0].logs));
  }

  // Demote A's log → tab empties
  await setLogStatus(idA, 'submited');
  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="confirmed"]').click());
  await page.waitForTimeout(200);
  const emptyState = await page.evaluate(() => ({
    cards: document.querySelectorAll('.confirmed-card').length,
    empty: !!document.querySelector('.confirmed-list .project-empty'),
  }));
  console.log('After demote:', JSON.stringify(emptyState));
  if (emptyState.cards !== 0 || !emptyState.empty) throw new Error('Confirmed tab should be empty');

  // Re-confirm A, click its card → jump to LISTED + open Work Log tab of that project
  await setLogStatus(idA, 'confirmed');
  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="confirmed"]').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('[data-confirmed-open]').click());
  await page.waitForTimeout(500);
  const jump = await page.evaluate((id) => {
    const activeTab = document.querySelector('.project-tab.active');
    const card = document.querySelector(`.project-card[data-project-card="${id}"]`);
    const notesPanel = document.querySelector(`[data-ptab-panel="${id}|notes"]`);
    return {
      activeTab: activeTab ? activeTab.dataset.projectTab : null,
      cardOpen: card ? card.open : null,
      notesVisible: notesPanel ? notesPanel.style.display !== 'none' : null,
      notesTabActive: !!document.querySelector(`[data-ptab="${id}"][data-ptab-panel="notes"].active`),
    };
  }, idA);
  console.log('Jump result:', JSON.stringify(jump));
  if (jump.activeTab !== 'saved') throw new Error('Should jump to LISTED PROJECTS');
  if (!jump.cardOpen) throw new Error('Card should be open');
  if (!jump.notesTabActive) throw new Error('Work Log tab should be active');
  if (!jump.notesVisible) throw new Error('Work Log panel should be visible');

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }

  console.log('\nE2E PROJECT CONFIRMED TAB TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

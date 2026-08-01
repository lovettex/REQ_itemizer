// E2E: Project Briefing in NEW PROJECT form (General briefing / Layout & file highlight
// + hint line), persisted to project data and editable in Listed Projects.
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

  // NEW PROJECT form should contain the briefing block
  const formUI = await page.evaluate(() => {
    const f = document.getElementById('projectForm');
    return {
      hasTitle: !!f.querySelector('.briefing-title') && f.querySelector('.briefing-title').textContent.trim() === 'Project Briefing',
      hint: f.querySelector('.briefing-hint') ? f.querySelector('.briefing-hint').textContent.trim() : null,
      fields: Array.from(f.querySelectorAll('.briefing-field label, .briefing-field')).map(x => x.textContent.trim()),
      hasGeneral: !!f.querySelector('textarea[name="briefingGeneral"]'),
      hasLayout: !!f.querySelector('textarea[name="briefingLayout"]'),
    };
  });
  console.log('New Project form:', JSON.stringify(formUI));
  if (!formUI.hasTitle) throw new Error('Project Briefing title missing');
  if (!formUI.hint || formUI.hint.indexOf('Please sorted out your files into folders') === -1) {
    throw new Error('Briefing hint missing: ' + formUI.hint);
  }
  if (!formUI.hasGeneral || !formUI.hasLayout) throw new Error('Briefing textareas missing');
  if (formUI.fields.length !== 2) throw new Error('Expected 2 briefing fields');

  // Create project with briefing content
  await page.evaluate(() => {
    document.querySelector('.project-tab[data-project-tab="new"]').click();
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const form = document.getElementById('projectForm');
    form.querySelector('input[name="name"]').value = 'Briefing Test Project';
    form.querySelector('textarea[name="briefingGeneral"]').value = 'General notes here';
    form.querySelector('textarea[name="briefingLayout"]').value = 'Highlight main door layouts';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  await page.waitForTimeout(500);

  // Verify persisted
  const stored = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === 'Briefing Test Project');
    return p ? p.briefing : null;
  });
  console.log('Stored briefing:', JSON.stringify(stored));
  if (!stored || stored.general !== 'General notes here' || stored.layout !== 'Highlight main door layouts') {
    throw new Error('Briefing not persisted: ' + JSON.stringify(stored));
  }

  // Edit form (Listed Projects → Client info) should show the briefing values
  await page.evaluate(() => {
    document.querySelector('.project-tab[data-project-tab="saved"]').click();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const card = document.querySelector('.project-card');
    card.open = true;
  });
  await page.waitForTimeout(300);
  const dbg = await page.evaluate(() => ({
    forms: document.querySelectorAll('[data-project-edit]').length,
    cards: document.querySelectorAll('.project-card').length,
    names: Array.from(document.querySelectorAll('.project-card summary > span:first-child')).map(s => s.textContent.slice(0, 30)),
  }));
  console.log('DBG edit:', JSON.stringify(dbg));
  const editUI = await page.evaluate(() => {
    const form = document.querySelector('[data-project-edit]');
    const g = form.querySelector('textarea[name="briefingGeneral"]');
    const l = form.querySelector('textarea[name="briefingLayout"]');
    return {
      general: g ? g.value : null,
      layout: l ? l.value : null,
      hint: form.querySelector('.briefing-hint') ? form.querySelector('.briefing-hint').textContent.trim() : null,
    };
  });
  console.log('Edit form:', JSON.stringify(editUI));
  if (editUI.general !== 'General notes here' || editUI.layout !== 'Highlight main door layouts') {
    throw new Error('Edit form does not show briefing values');
  }
  if (!editUI.hint || editUI.hint.indexOf('pinpoint the main target content') === -1) {
    throw new Error('Edit form hint missing');
  }

  // Edit + save briefing
  await page.evaluate(() => {
    const form = document.querySelector('[data-project-edit]');
    form.querySelector('textarea[name="briefingGeneral"]').value = 'Updated general';
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await page.waitForTimeout(500);
  const afterEdit = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects')).find(x => x.name === 'Briefing Test Project');
    return p.briefing;
  });
  console.log('After edit:', JSON.stringify(afterEdit));
  if (afterEdit.general !== 'Updated general' || afterEdit.layout !== 'Highlight main door layouts') {
    throw new Error('Briefing edit not saved');
  }

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }

  console.log('\nE2E PROJECT BRIEFING TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

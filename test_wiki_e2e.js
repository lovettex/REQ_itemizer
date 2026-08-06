// E2E: ACCESS MANAGEMENT tab (replaces RFQ Wiki) — ADD FLOW GROUP create/display/toggle.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await context.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await context.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: `window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };` }));
  await context.addInitScript(() => {
    window.firebase = { apps: [], initializeApp: () => { window.firebase.apps.push({}); }, firestore: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: false }), set: async () => {} }) }) }) };
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1) Tab is renamed ACCESS MANAGEMENT
  const tabName = await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="wiki"]').textContent.trim());
  console.log('Tab name:', tabName);
  if (tabName !== 'ACCESS MANAGEMENT') throw new Error('tab should be ACCESS MANAGEMENT');

  // 2) Open the tab → ADD FLOW GROUP button + hidden form with 5 fields
  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="wiki"]').click());
  await page.waitForTimeout(400);
  const ui = await page.evaluate(() => ({
    addBtn: !!document.getElementById('accessAddBtn'),
    formHidden: document.getElementById('accessForm') ? document.getElementById('accessForm').style.display : null,
    labels: Array.from(document.querySelectorAll('#accessForm label')).map(l => l.textContent),
    eofSubmit: !!document.querySelector('#accessForm button[type="submit"]')
  }));
  console.log('AM UI:', JSON.stringify(ui));
  if (!ui.addBtn || ui.formHidden !== 'none') throw new Error('ADD FLOW GROUP button missing');
  const expected = ['NAME YOUR FLOW', 'SAVE SHAREPOINT QUICK ACCESS LINK', 'DESCRIPTION TITLE', 'SUB TASK', 'REFERENCE FOLDER'];
  if (JSON.stringify(ui.labels) !== JSON.stringify(expected)) throw new Error('form labels wrong: ' + JSON.stringify(ui.labels));
  if (!ui.eofSubmit) throw new Error('END OF FLOW submit button missing');

  // 3) Add a flow group via END OF FLOW submit
  await page.evaluate(() => document.getElementById('accessAddBtn').click());
  await page.waitForTimeout(200);
  await page.fill('#accessForm input[name="name"]', 'RFQ 提交流程');
  await page.fill('#accessForm input[name="link"]', 'https://t1glass.sharepoint.com/rfq');
  await page.fill('#accessForm input[name="description"]', '報價提交');
  await page.fill('#accessForm input[name="subTask"]', '整理 BOM');
  await page.fill('#accessForm input[name="refFolder"]', '/Projects/2026/RFQ');
  await page.click('#accessForm button[type="submit"]');
  await page.waitForTimeout(400);

  const r = await page.evaluate(() => {
    const flows = JSON.parse(localStorage.getItem('t1-access-mgmt') || '[]');
    const card = document.querySelector('.access-flow');
    return {
      count: flows.length,
      flow: flows[0],
      shown: card ? card.textContent : '',
      eofBtn: !!document.querySelector('[data-flow-end]'),
      delBtn: !!document.querySelector('[data-flow-del]')
    };
  });
  console.log('Flow saved:', JSON.stringify({ count: r.count, name: r.flow && r.flow.name, endOfFlow: r.flow && r.flow.endOfFlow }));
  if (r.count !== 1 || !r.flow || r.flow.name !== 'RFQ 提交流程') throw new Error('flow not saved');
  if (r.flow.link !== 'https://t1glass.sharepoint.com/rfq' || r.flow.subTask !== '整理 BOM' || r.flow.refFolder !== '/Projects/2026/RFQ') throw new Error('flow fields not persisted');
  if (r.shown.indexOf('RFQ 提交流程') === -1 || r.shown.indexOf('整理 BOM') === -1 || r.shown.indexOf('/Projects/2026/RFQ') === -1) throw new Error('flow fields not displayed');
  if (!r.eofBtn || !r.delBtn) throw new Error('END OF FLOW / delete buttons missing');

  // 4) END OF FLOW toggle
  await page.click('[data-flow-end]');
  await page.waitForTimeout(300);
  const eof = await page.evaluate(() => JSON.parse(localStorage.getItem('t1-access-mgmt'))[0].endOfFlow);
  if (eof !== true) throw new Error('END OF FLOW not toggled');
  console.log('END OF FLOW toggled:', eof);

  // 5) Delete flow group
  await page.click('[data-flow-del]');
  await page.waitForTimeout(300);
  const afterDel = await page.evaluate(() => JSON.parse(localStorage.getItem('t1-access-mgmt') || '[]').length);
  if (afterDel !== 0) throw new Error('flow not deleted');
  console.log('Flow deleted:', afterDel);

  await browser.close();
  console.log('\nE2E ACCESS MANAGEMENT (ADD FLOW GROUP) TEST PASSED');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });

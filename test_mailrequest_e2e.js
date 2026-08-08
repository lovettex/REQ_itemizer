// E2E: Mail Request 分頁已移除 — project 內部不應有 Mail Request tab。
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await context.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await context.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: `window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };` }));
  await context.addInitScript(() => {
    localStorage.setItem('t1-projects', JSON.stringify([{ id: 'p1', name: '移除測試', status: 'Processing', items: [], workLogs: [], confirmSummary: [] }]));
    window.firebase = { apps: [], initializeApp: () => { window.firebase.apps.push({}); }, firestore: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: false }), set: async () => {} }) }) }) };
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="saved"]').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => { const s = document.querySelector('.ps-search-inner input'); s.dispatchEvent(new Event('focus')); });
  await page.waitForTimeout(200);
  await page.click('.ps-item');
  await page.waitForTimeout(300);
  await page.evaluate(() => { const card = document.querySelector('.project-card'); card.open = true; });
  await page.waitForTimeout(300);

  const innerTabs = await page.evaluate(() => Array.from(document.querySelectorAll('.p-inner-tab')).map(t => t.textContent.trim()));
  console.log('Project inner tabs:', JSON.stringify(innerTabs));
  if (innerTabs.indexOf('Mail Request') !== -1) throw new Error('Mail Request tab should be removed');
  if (innerTabs.indexOf('Work Log') === -1 || innerTabs.indexOf('PARTITION') === -1) throw new Error('Work Log / PARTITION should remain');

  await browser.close();
  console.log('\nE2E MAIL REQUEST REMOVED CHECK PASSED');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });

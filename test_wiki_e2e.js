// E2E: ACCESS MANAGEMENT 區塊已移除 — 主 tab 不應存在。
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

  const tabs = await page.evaluate(() => Array.from(document.querySelectorAll('.project-tab')).map(t => t.textContent.trim()));
  console.log('Main tabs:', JSON.stringify(tabs));
  if (tabs.indexOf('ACCESS MANAGEMENT') !== -1 || tabs.indexOf('RFQ Wiki') !== -1) throw new Error('ACCESS MANAGEMENT tab should be removed');
  if (tabs.indexOf('PROJECT CONFIRMED') === -1) throw new Error('PROJECT CONFIRMED should remain');

  await browser.close();
  console.log('\nE2E ACCESS MANAGEMENT REMOVED CHECK PASSED');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });

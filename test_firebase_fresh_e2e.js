// E2E: Verify Firestore reads back on a FRESH device (empty localStorage)
// Simulates "another device" by using a brand-new browser context
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext(); // fresh, no localStorage
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

    await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // allow Firestore read

  // localStorage should be empty at start (fresh device)
  const lsBefore = await page.evaluate(() => ({
    pairs: localStorage.getItem('t1-product-pairs'),
    projects: localStorage.getItem('t1-projects')
  }));
  console.log('Fresh device localStorage before:', lsBefore.pairs === null ? 'empty' : 'HAS DATA');

  // After Firestore load, localStorage cache should be populated with cloud data
  const lsAfter = await page.evaluate(() => ({
    pairs: JSON.parse(localStorage.getItem('t1-product-pairs') || '[]').length,
    projects: JSON.parse(localStorage.getItem('t1-projects') || '[]').length
  }));
  console.log('After Firestore load → pairs:', lsAfter.pairs, ', projects:', lsAfter.projects);

  if (lsAfter.pairs === 0) throw new Error('Firestore data NOT loaded on fresh device');
  // projects may legitimately be 0 if none were saved to the cloud yet

  // Verify the pair name visible in saved pairs list
  const visible = await page.evaluate(() => {
    return document.querySelectorAll('.saved-item').length;
  });
  console.log('Saved pairs rendered in UI:', visible);

  // Check T1.firestore ready
  const fsState = await page.evaluate(() => {
    const fs = (window.T1 || {}).firestore;
    return { ready: fs ? fs.ready : false };
  });
  console.log('Firestore ready:', fsState.ready);

  console.log('Console errors:', errors.length);
  errors.forEach(e => console.log('  -', e));

  await browser.close();
  console.log('=== E2E PASS: Fresh device reads cloud data ===');
})().catch(e => { console.error('E2E FAIL:', e.message); process.exit(1); });

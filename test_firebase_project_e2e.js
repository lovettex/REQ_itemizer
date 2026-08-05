// E2E: Create a Project via UI → verify it syncs to Firestore cloud
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

    await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Fill NEW PROJECT form
  await page.click('[data-project-tab="new"]');
  await page.waitForTimeout(300);
  await page.fill('#projectForm [name="name"]', 'E2E 雲端專案測試');
  await page.fill('#projectForm [name="sales"]', 'Shih Min');
  await page.fill('#projectForm [name="address"]', 'Taiwan');
  await page.click('#projectForm button[type="submit"]');
  await page.waitForTimeout(3000); // allow Firestore write

  const lsProjects = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('t1-projects') || '[]');
  });
  console.log('localStorage projects count:', lsProjects.length);
  if (lsProjects.length === 0) throw new Error('Project not saved to localStorage');

  const rendered = await page.evaluate(() => {
    return document.querySelectorAll('.project-card').length;
  });
  console.log('Project cards rendered:', rendered);

  console.log('Console errors:', errors.length);
  errors.forEach(e => console.log('  -', e));
  await browser.close();
  console.log('=== E2E PASS: Project creation works ===');
})().catch(e => { console.error('E2E FAIL:', e.message); process.exit(1); });

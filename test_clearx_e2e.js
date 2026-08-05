// E2E: clicking the search-box × fully clears (query + category) → nothing shown
// until a category is clicked or a keyword is typed.
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
  await page.waitForTimeout(1000);

  // 1. Click category → cards shown
  await page.evaluate(() => {
    const btn = document.querySelector('#filters .filter[data-cat="Bifold door"]');
    btn.click();
  });
  await page.waitForTimeout(200);
  const afterCat = await page.evaluate(() => document.querySelectorAll('#results .card').length);
  console.log('After category:', afterCat);
  if (afterCat === 0) throw new Error('category should show cards');

  // 2. Click × → completely empty (category deselected, no cards)
  await page.evaluate(() => document.getElementById('clearSearch').click());
  await page.waitForTimeout(200);
  const afterX = await page.evaluate(() => ({
    cards: document.querySelectorAll('#results .card').length,
    activeFilter: document.querySelector('#filters .filter.active') ? document.querySelector('#filters .filter.active').textContent : null,
    emptyVisible: !document.getElementById('empty').hidden,
    query: document.getElementById('search').value,
  }));
  console.log('After X (master):', JSON.stringify(afterX));
  if (afterX.cards !== 0) throw new Error('X should clear all cards');
  if (afterX.activeFilter !== null) throw new Error('X should deselect category, got ' + afterX.activeFilter);
  if (!afterX.emptyVisible) throw new Error('empty hint should show after X');
  if (afterX.query !== '') throw new Error('query should be cleared');

  // 3. Type keyword → cards shown again
  await page.evaluate(() => {
    const input = document.getElementById('search');
    input.value = 'door';
    input.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(200);
  const afterType = await page.evaluate(() => document.querySelectorAll('#results .card').length);
  console.log('After typing:', afterType);
  if (afterType === 0) throw new Error('typing should show cards');

  // 4. X again → empty
  await page.evaluate(() => document.getElementById('clearSearch').click());
  await page.waitForTimeout(200);
  const afterX2 = await page.evaluate(() => document.querySelectorAll('#results .card').length);
  console.log('After X again:', afterX2);
  if (afterX2 !== 0) throw new Error('X should clear again');

  // 5. Profile: category → X → empty
  await page.evaluate(() => {
    const btn = document.querySelector('#profileFilters .filter');
    btn.click();
  });
  await page.waitForTimeout(200);
  const profCat = await page.evaluate(() => document.querySelectorAll('#profileResults .card').length);
  console.log('Profile after category:', profCat);
  if (profCat === 0) throw new Error('profile category should show cards');
  await page.evaluate(() => document.getElementById('clearProfileSearch').click());
  await page.waitForTimeout(200);
  const profX = await page.evaluate(() => ({
    cards: document.querySelectorAll('#profileResults .card').length,
    activeFilter: document.querySelector('#profileFilters .filter.active') ? document.querySelector('#profileFilters .filter.active').textContent : null,
  }));
  console.log('Profile after X:', JSON.stringify(profX));
  if (profX.cards !== 0 || profX.activeFilter !== null) throw new Error('profile X should fully clear');

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }
  console.log('\nE2E CLEAR-X FULL RESET TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

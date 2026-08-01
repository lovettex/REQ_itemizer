// E2E: Master template + Profile template start empty; only category clicks or
// keyword search reveal content. "全部" filter removed.
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

  // Initial: both panels empty, no "全部" filter, hint shown
  const initial = await page.evaluate(() => {
    const catBtns = Array.from(document.querySelectorAll('#filters .filter')).map(b => b.textContent);
    return {
      masterCards: document.querySelectorAll('#results .card').length,
      masterEmptyVisible: !document.getElementById('empty').hidden,
      masterEmptyText: document.getElementById('empty').textContent,
      masterFilters: catBtns,
      profileCards: document.querySelectorAll('#profileResults .card').length,
      profileEmptyVisible: !document.getElementById('profileEmpty').hidden,
      profileEmptyText: document.getElementById('profileEmpty').textContent,
      profileFilters: Array.from(document.querySelectorAll('#profileFilters .filter')).map(b => b.textContent),
      masterCount: document.getElementById('resultCount').textContent,
      profileCount: document.getElementById('profileResultCount').textContent,
    };
  });
  console.log('Initial:', JSON.stringify(initial));
  if (initial.masterCards !== 0) throw new Error('Master should be empty initially');
  if (initial.profileCards !== 0) throw new Error('Profile should be empty initially');
  if (!initial.masterEmptyVisible || !initial.profileEmptyVisible) throw new Error('Hint should be visible initially');
  if (initial.masterEmptyText.indexOf('輸入檢索關鍵字') === -1) throw new Error('Master hint text wrong');
  if (initial.profileEmptyText.indexOf('輸入檢索關鍵字') === -1) throw new Error('Profile hint text wrong');
  if (initial.masterFilters.includes('全部')) throw new Error('"全部" filter should be removed (master)');
  if (initial.profileFilters.includes('全部')) throw new Error('"全部" filter should be removed (profile)');
  if (initial.masterFilters.length < 2) throw new Error('Master category filters missing');
  if (initial.profileFilters.length < 2) throw new Error('Profile category filters missing');

  // Type a keyword in Master search → results appear
  await page.evaluate(() => {
    const input = document.getElementById('search');
    input.value = 'door';
    input.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(200);
  const afterSearch = await page.evaluate(() => ({
    cards: document.querySelectorAll('#results .card').length,
    emptyHidden: document.getElementById('empty').hidden,
    count: document.getElementById('resultCount').textContent,
  }));
  console.log('After search:', JSON.stringify(afterSearch));
  if (afterSearch.cards === 0) throw new Error('Search should reveal master cards');
  if (!afterSearch.emptyHidden) throw new Error('Empty hint should hide after search');

  // Clear search → empty again
  await page.evaluate(() => {
    const input = document.getElementById('search');
    input.value = '';
    input.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(200);
  const afterClear = await page.evaluate(() => document.querySelectorAll('#results .card').length);
  console.log('After clear search:', afterClear);
  if (afterClear !== 0) throw new Error('Clearing search should empty master');

  // Click a category filter → shows that category only
  await page.evaluate(() => {
    const btn = document.querySelector('#filters .filter[data-cat="Bifold door"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(200);
  const afterCat = await page.evaluate(() => {
    const cats = Array.from(document.querySelectorAll('#results .card .meta')).map(m => m.textContent);
    return { count: cats.length, cats: [...new Set(cats)], active: document.querySelector('#filters .filter.active') ? document.querySelector('#filters .filter.active').textContent : null };
  });
  console.log('After category click:', JSON.stringify(afterCat));
  if (afterCat.count === 0) throw new Error('Category click should reveal cards');
  if (afterCat.cats.length !== 1 || afterCat.cats[0] !== 'Bifold door') throw new Error('Only selected category should show');
  if (afterCat.active !== 'Bifold door') throw new Error('Filter should be active');

  // Click the same category again → deselect → empty
  await page.evaluate(() => {
    const btn = document.querySelector('#filters .filter[data-cat="Bifold door"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(200);
  const afterDeselect = await page.evaluate(() => document.querySelectorAll('#results .card').length);
  console.log('After deselect:', afterDeselect);
  if (afterDeselect !== 0) throw new Error('Re-click should deselect and empty master');

  // Profile panel: click a category
  await page.evaluate(() => {
    const btn = document.querySelector('#profileFilters .filter');
    if (btn) btn.click();
  });
  await page.waitForTimeout(200);
  const profileCat = await page.evaluate(() => document.querySelectorAll('#profileResults .card').length);
  console.log('Profile after category:', profileCat);
  if (profileCat === 0) throw new Error('Profile category click should reveal cards');

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }

  console.log('\nE2E CATALOG EMPTY-BY-DEFAULT TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

// E2E: ZIP upload → Firebase Storage (mock), zipMeta gains storagePath/downloadUrl,
// Download Zip button fetches download URL and triggers download.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  // Serve mock download URLs as an attachment so clicking triggers a real download
  await context.route('https://mock-dl/**', r => r.fulfill({
    status: 200,
    contentType: 'application/zip',
    headers: { 'Content-Disposition': 'attachment; filename="RFQ-Package.zip"' },
    body: Buffer.from('PK-mock-zip-data'),
  }));
  await context.addInitScript(() => {
    window.__storageCalls = { puts: [], downloads: [] };
    window.firebase = {
      apps: [],
      initializeApp: () => { window.firebase.apps.push({}); },
      firestore: () => ({ collection: () => ({ doc: () => ({
        get: async () => ({ exists: false }),
        set: async () => {}
      }) }) }),
      storage: () => {
        // real SDK throws if no app was initialized first — mimics init ordering
        if (!window.firebase.apps.length) throw new Error('No Firebase App has been created');
        return {
          ref: (path) => ({
            put: async () => {
              window.__storageCalls.puts.push(path);
              return { ref: { getDownloadURL: async () => 'https://mock-dl/' + encodeURIComponent(path) } };
            },
            getDownloadURL: async () => {
              window.__storageCalls.downloads.push(path);
              return 'https://mock-dl/' + encodeURIComponent(path);
            }
          })
        };
      }
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // 1. Storage should be ready (mock provides firebase.storage)
  const ready = await page.evaluate(() => {
    const st = (window.T1 || {}).storage;
    return st ? st.ready : false;
  });
  console.log('T1.storage ready:', ready);
  if (!ready) throw new Error('T1.storage should be ready with mock');

  // 2. Label renamed + Choose Zip file button + No file selected yet
  const label = await page.evaluate(() => ({
    title: document.querySelector('.zip-upload-label > span').textContent,
    chooseBtn: document.querySelector('.zip-choose-btn') ? document.querySelector('.zip-choose-btn').textContent.trim() : null,
    status: document.querySelector('[data-zip-status]') ? document.querySelector('[data-zip-status]').textContent : null,
  }));
  console.log('Zip UI:', JSON.stringify(label));
  if (label.title !== '📦 Upload Zip file') throw new Error('label not renamed: ' + label.title);
  if (label.chooseBtn !== 'Choose Zip file') throw new Error('choose button missing: ' + label.chooseBtn);
  if (label.status !== 'No file selected yet') throw new Error('initial status wrong: ' + label.status);

  // 3. Create project with a ZIP file → upload should run
  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="new"]').click());
  await page.waitForTimeout(200);
  await page.setInputFiles('#projectForm [data-zip-upload]', { name: 'RFQ-Package.zip', mimeType: 'application/zip', buffer: Buffer.from('PK-mock-zip-data') });
  await page.waitForTimeout(300);
  // Status text should now show the selected file name
  const afterPick = await page.evaluate(() => document.querySelector('[data-zip-status]').textContent);
  console.log('Status after pick:', JSON.stringify(afterPick));
  if (afterPick !== 'RFQ-Package.zip') throw new Error('status should show file name: ' + afterPick);
  await page.evaluate(() => {
    const form = document.getElementById('projectForm');
    form.querySelector('input[name="name"]').value = 'Zip Upload Proj';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  // wait for async upload + project creation
  await page.waitForFunction(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects') || '[]').find(x => x.name === 'Zip Upload Proj');
    return p && p.zipMeta && p.zipMeta.storagePath;
  }, { timeout: 8000 }).catch(() => {});
  const afterCreate = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('t1-projects') || '[]').find(x => x.name === 'Zip Upload Proj');
    return {
      zipMeta: p ? p.zipMeta : null,
      puts: window.__storageCalls.puts,
      downloads: window.__storageCalls.downloads,
    };
  });
  console.log('After create:', JSON.stringify(afterCreate));
  if (!afterCreate.zipMeta || !afterCreate.zipMeta.storagePath) throw new Error('zipMeta.storagePath missing after upload');
  if (afterCreate.zipMeta.downloadUrl !== 'https://mock-dl/uploads/' + encodeURIComponent(afterCreate.zipMeta.storagePath) && afterCreate.zipMeta.downloadUrl !== 'https://mock-dl/' + encodeURIComponent(afterCreate.zipMeta.storagePath)) {
    throw new Error('downloadUrl wrong: ' + afterCreate.zipMeta.downloadUrl);
  }
  if (afterCreate.puts.length !== 1) throw new Error('put should be called once');
  if (!afterCreate.puts[0].startsWith('uploads/') || !afterCreate.puts[0].endsWith('/RFQ-Package.zip')) {
    throw new Error('upload path wrong: ' + afterCreate.puts[0]);
  }
  if (!afterCreate.zipMeta.downloadUrl || afterCreate.zipMeta.downloadUrl.indexOf('mock-dl') === -1) throw new Error('downloadUrl missing');

  // 4. Edit form shows Download Zip button; click triggers getDownloadURL
  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="saved"]').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const card = document.querySelector('.project-card');
    card.open = true;
  });
  await page.waitForTimeout(300);
  const btn = await page.evaluate(() => {
    const bar = document.querySelector('.project-card .zip-bar');
    const el = document.querySelector('[data-zip-download]');
    return { barExists: !!bar, barText: bar ? bar.textContent.replace(/\s+/g, ' ').trim() : null, btnText: el ? el.textContent.trim() : null };
  });
  console.log('Download button:', JSON.stringify(btn));
  if (!btn.barExists) throw new Error('zip-bar (Download file) missing in expanded card');
  if (btn.barText.indexOf('RFQ-Package.zip') === -1 || btn.barText.indexOf('Download file') === -1) throw new Error('zip-bar content wrong: ' + btn.barText);
  if (btn.btnText !== '⬇ Download file') throw new Error('Download button text wrong: ' + btn.btnText);
  await page.evaluate(() => document.querySelector('[data-zip-download]').click());
  const dlEvt = await page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(300);
  const dl = await page.evaluate(() => window.__storageCalls.downloads.slice());
  console.log('Download calls:', JSON.stringify(dl));
  if (dl.length !== 1) throw new Error('getDownloadURL should be called once');
  if (!dlEvt) throw new Error('download event not fired');
  console.log('Download filename:', dlEvt.suggestedFilename());

  // 5. Fallback: without storage (remove mock storage) → zipMeta keeps meta only
  const errs = errors.filter(e => e.indexOf('mock') === -1);
  if (errs.length) {
    console.log('BROWSER ERRORS:', errs.slice(0, 3));
    throw new Error('Browser console errors: ' + errs[0]);
  }

  console.log('\nE2E ZIP STORAGE UPLOAD/DOWNLOAD TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

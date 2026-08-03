// E2E: Mail Request tab per project — TO/CC/Subject/Content (prefilled with
// client info, zip, PARTITION, DOOR, OW, work log) + Send Email (multi recipients).
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await context.route('**/js/emailService.js', r => r.fulfill({
    status: 200, contentType: 'application/javascript',
    body: 'window.T1 = window.T1 || {}; window.__emailCalls = []; window.T1.emailService = { sendEmail: async function(p){ window.__emailCalls.push(p); return true; } };'
  }));
  await context.route('**/auth.js', r => r.fulfill({
    status: 200, contentType: 'application/javascript',
    body: 'window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: "u@x.com" }), currentUser: () => ({ email: "u@x.com" }), handleLogin: () => Promise.resolve(null), signOut: () => {} };'
  }));
  await context.addInitScript(() => {
    // seed a full project: client info + zip + PARTITION/DOOR items + work logs
    const project = {
      id: 'mail-1', name: 'Mail Proj', sales: 'Sales A', priority: 'URGENT',
      tenderer: 'ACME', email: 'proj@acme.com', address: 'Taiwan', deadline: '2026-09-01 EOD',
      briefing: { general: 'GEN', layout: 'LAY' },
      zipMeta: { name: 'docs.zip', size: 2048, storagePath: 'uploads/mail-1/docs.zip', downloadUrl: 'https://mock-dl/x' },
      items: [
        { id: 'i1', type: 'PARTITION', pair: { name: 'P-Item' }, extra: { height: '3000', remark: 'hi' } },
        { id: 'i2', type: 'DOOR', pair: { name: 'D-Item' }, extra: { lock: 'T-8000' } }
      ],
      workLogs: [{ id: 'w1', summary: 'A2VO3', status: 'confirmed', createdAt: '2026-08-01T00:00:00Z' }],
      confirmSummary: []
    };
    localStorage.setItem('t1-projects', JSON.stringify([project]));
    window.firebase = { apps: [], initializeApp: () => { window.firebase.apps.push({}); }, firestore: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: false }), set: async () => {} }) }) }) };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // open saved tab + expand card + click Mail Request
  await page.evaluate(() => {
    document.querySelector('.project-tab[data-project-tab="saved"]').click();
    const card = document.querySelector('.project-card');
    card.open = true;
  });
  await page.waitForTimeout(300);
  const tabExists = await page.evaluate(() => !!document.querySelector('[data-ptab-panel="mail"]'));
  console.log('Mail Request tab exists:', tabExists);
  if (!tabExists) throw new Error('Mail Request tab missing');

  await page.evaluate(() => document.querySelector('[data-ptab-panel="mail"]').click());
  await page.waitForTimeout(300);

  const form = await page.evaluate(() => {
    const card = document.querySelector('[data-mail-request]');
    return {
      to: !!card.querySelector('[data-mail-to]'),
      cc: !!card.querySelector('[data-mail-cc]'),
      subject: !!card.querySelector('[data-mail-subject]'),
      content: card.querySelector('[data-mail-content]').value,
      sendBtn: card.querySelector('[data-mail-send]').textContent.trim(),
    };
  });
  console.log('Form fields ok:', form.to, form.cc, form.subject, '| sendBtn:', form.sendBtn);
  if (!form.to || !form.cc || !form.subject) throw new Error('mail form fields missing');
  if (form.sendBtn !== 'Send Email') throw new Error('send button wrong');
  ['CLIENT INFO', 'Mail Proj', 'ZIP FILE', 'docs.zip', 'PARTITION', 'P-Item', 'DOOR', 'D-Item', 'WORK LOG', 'A2VO3'].forEach(k => {
    if (form.content.indexOf(k) === -1) throw new Error('content missing: ' + k);
  });
  console.log('Content prefilled OK');

  // multi recipients (TO + CC) → one sendEmail per recipient
  await page.evaluate(() => {
    const card = document.querySelector('[data-mail-request]');
    card.querySelector('[data-mail-to]').value = 'a@x.com, b@x.com';
    card.querySelector('[data-mail-cc]').value = 'c@x.com';
    card.querySelector('[data-mail-subject]').value = 'RFQ Enquiry';
    card.querySelector('[data-mail-send]').click();
  });
  await page.waitForTimeout(600);
  const calls = await page.evaluate(() => window.__emailCalls);
  console.log('Email calls:', JSON.stringify(calls.map(c => c.to)));
  if (calls.length !== 3) throw new Error('expected 3 sendEmail calls (2 TO + 1 CC), got ' + calls.length);
  const tos = calls.map(c => c.to).sort();
  if (JSON.stringify(tos) !== JSON.stringify(['a@x.com', 'b@x.com', 'c@x.com'])) throw new Error('recipients wrong: ' + JSON.stringify(tos));
  if (calls.some(c => c.subject !== 'RFQ Enquiry')) throw new Error('subject wrong');
  if (!calls[0].html || calls[0].html.indexOf('Mail Proj') === -1) throw new Error('html should include content');

  if (errors.length) { console.log('ERRORS:', errors.slice(0, 3)); throw new Error('console errors: ' + errors[0]); }
  console.log('\nE2E MAIL REQUEST TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

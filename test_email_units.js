// Unit tests for js/emailTemplate.js and js/emailService.js (browser files run in node).
const assert = require('assert');

// --- emailTemplate.js ---
global.window = global;
require('./js/emailTemplate.js');
const T = global.T1.emailTemplate;

const subj = T.buildEmailSubject('P-001');
assert.strictEqual(subj, 'New RFQ - P-001', 'subject format');

const html = T.buildEmailHtml({
  rfqNumber: 'P-001',
  customer: 'ACME',
  project: 'Tower B',
  quotationDate: '2026-08-04',
  createdBy: 'user@x.com',
  totalItems: 3,
});
assert(html.includes('New RFQ'), 'html has title');
assert(html.includes('P-001'), 'html has RFQ Number');
assert(html.includes('ACME'), 'html has customer');
assert(html.includes('Tower B'), 'html has project');
assert(html.includes('2026-08-04'), 'html has quotation date');
assert(html.includes('user@x.com'), 'html has created by');
assert(html.includes('3'), 'html has total items');
assert(html.includes('View RFQ'), 'html has View RFQ button');
assert(html.includes('your-github-pages-url'), 'html uses placeholder URL');
// escaping
const escHtml = T.buildEmailHtml({ rfqNumber: '<b>&</b>', customer: '', project: '', quotationDate: '', createdBy: '', totalItems: 0 });
assert(!escHtml.includes('<b>'), 'html escapes user data');

// --- emailService.js — success ---
let captured = null;
global.fetch = async (url, opts) => {
  captured = { url, opts };
  return { ok: true, json: async () => ({ ok: true }) };
};
require('./js/emailService.js');
const S = global.T1.emailService;

(async () => {
  const ok = await S.sendEmail({ to: 'a@b.com', subject: 'S', html: '<p>H</p>' });
  assert.strictEqual(ok, true, 'success returns true');
  assert.strictEqual(captured.url, 'https://rfq-email-worker.bubibubibae.workers.dev', 'worker url');
  assert.strictEqual(captured.opts.method, 'POST', 'method POST');
  assert.strictEqual(captured.opts.headers['Content-Type'], 'application/json', 'content-type');
  const body = JSON.parse(captured.opts.body);
  assert.deepStrictEqual(body, { to: 'a@b.com', subject: 'S', html: '<p>H</p>' }, 'body json');

  // HTTP error → false
  global.fetch = async () => ({ ok: false, status: 500, statusText: 'ERR' });
  assert.strictEqual(await S.sendEmail({ to: 'a@b.com', subject: 'S', html: '<p>H</p>' }), false, 'http error false');

  // JSON parse error → false
  global.fetch = async () => ({ ok: true, json: async () => { throw new Error('bad json'); } });
  assert.strictEqual(await S.sendEmail({ to: 'a@b.com', subject: 'S', html: '<p>H</p>' }), false, 'json error false');

  // Network error → false
  global.fetch = async () => { throw new Error('network down'); };
  assert.strictEqual(await S.sendEmail({ to: 'a@b.com', subject: 'S', html: '<p>H</p>' }), false, 'network error false');

  // Missing fields → false (no fetch)
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; return { ok: true, json: async () => ({}) }; };
  assert.strictEqual(await S.sendEmail({ subject: 'S', html: '<p>H</p>' }), false, 'missing to false');
  assert.strictEqual(fetchCalled, false, 'no fetch when fields missing');

  console.log('EMAIL UNIT TESTS PASSED');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });

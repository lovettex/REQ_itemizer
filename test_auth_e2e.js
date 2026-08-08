// E2E: Firebase Auth flow — login success → index.html; failure → error shown;
// unauthenticated guard → back to login.html; logout → login.html.
// auth.js is intercepted with a mock so no real Firebase SDK is required.
const { chromium } = require('playwright');

const MOCK_AUTH = `
window.T1 = window.T1 || {};
var __mockUser = null;
try { __mockUser = JSON.parse(localStorage.getItem('mock-auth-user') || 'null'); } catch(e) { __mockUser = null; }
window.T1.auth = {
  available: true,
  _user: __mockUser,
  loginResult: null,   // null = success, string = error message
  signOutCalled: false,
  init: function() { return Promise.resolve(); },
  onAuthChange: function(cb) { this._cb = cb; cb(this._user); },
  currentUser: function() { return this._user; },
  handleLogin: function(email, password) {
    if (this.loginResult) return Promise.resolve(this.loginResult);
    localStorage.setItem('mock-auth-user', JSON.stringify({ email: email }));
    window.location.href = 'index.html';
    return Promise.resolve(null);
  },
  signOut: function() {
    localStorage.removeItem('mock-auth-user');
    localStorage.setItem('mock-signout-called', '1');
    window.location.href = 'login.html';
    return Promise.resolve();
  }
};
`;

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await context.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: MOCK_AUTH }));
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  // --- 1. Unauthenticated → opening index.html stays on main site (read-access, guard allows) ---
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const afterGuard = page.url();
  console.log('1. Guard (unauthenticated):', afterGuard);
  if (afterGuard.indexOf('login.html') !== -1) throw new Error('unauthenticated should be allowed into main site (read-open rules)');
  const guardTab = await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="saved"]') ? document.querySelector('.project-tab[data-project-tab="saved"]').textContent.trim() : null);
  if (guardTab !== 'LISTED PROJECTS') throw new Error('main tabs should be visible unauthenticated');

  // --- 2. Login failure → Firebase error message shown, no redirect ---
  await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  await page.evaluate(() => { window.T1.auth.loginResult = 'Firebase: Error (auth/invalid-credential).'; });
  await page.fill('input[name="email"]', 'bad@user.com');
  await page.fill('input[name="password"]', 'wrongpass');
  await page.click('#loginBtn');
  await page.waitForTimeout(500);
  const failState = await page.evaluate(() => ({
    error: document.getElementById('loginError').textContent,
    errorVisible: document.getElementById('loginError').classList.contains('show'),
    url: location.href,
  }));
  console.log('2. Login failure:', JSON.stringify(failState));
  if (failState.error.indexOf('Firebase: Error (auth/invalid-credential)') === -1) throw new Error('error message not shown: ' + failState.error);
  if (!failState.errorVisible) throw new Error('error box not visible');
  if (failState.url.indexOf('index.html') !== -1) throw new Error('should NOT redirect on failure');

  // --- 3. Login success → redirect to index.html (mock persists user like real Firebase) ---
  await page.evaluate(() => { window.T1.auth.loginResult = null; });
  await page.fill('input[name="password"]', 'rightpass');
  await page.click('#loginBtn');
  await page.waitForURL('**/index.html', { timeout: 5000 });
  console.log('3. Login success →', page.url());

  // --- 4. Logout → back to login.html (user name shown in topbar while logged in) ---
  const userName = await page.evaluate(() => document.getElementById('topbarUser').textContent);
  console.log('4. Topbar user:', JSON.stringify(userName));
  if (userName.indexOf('bad@user.com') === -1) throw new Error('user name not shown in topbar: ' + userName);
  const logoutBtn = page.locator('#logoutBtn');
  if (await logoutBtn.count() === 0) throw new Error('Logout button missing on index.html');
  await logoutBtn.click();
  await page.waitForURL('**/login.html', { timeout: 5000 });
  const signedOut = await page.evaluate(() => localStorage.getItem('mock-signout-called') === '1');
  console.log('4. Logout →', page.url(), '| signOutCalled:', signedOut);
  if (!signedOut) throw new Error('signOut not called');

  // --- 5. Already logged in → opening login.html redirects to index.html ---
  await page.evaluate(() => localStorage.setItem('mock-auth-user', JSON.stringify({ email: 'a@b.com' })));
  await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/index.html', { timeout: 5000 }).catch(() => {});
  console.log('5. Logged-in login.html →', page.url());
  if (page.url().indexOf('index.html') === -1) throw new Error('logged-in user on login.html should redirect to index.html');

  const errs = errors.filter(e => e.indexOf('Firebase') === -1);
  if (errs.length) { console.log('ERRORS:', errs.slice(0, 3)); throw new Error('console errors: ' + errs[0]); }

  console.log('\nE2E AUTH FLOW TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

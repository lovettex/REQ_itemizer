// Verify login.html (React Bits UI) renders and the Login button logs "Login Clicked".
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const logs = [];
  page.on('console', m => { if (m.type() === 'log' || m.type() === 'error') logs.push(m.text()); });

  // 只攔 Firebase SDK + auth.js（避免真實 Firebase 依賴）；React/Babel/Tailwind 由 unpkg 載入
  await context.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await context.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: `window.T1 = window.T1 || {}; window.__loginCalls = []; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb(null), currentUser: () => null, handleLogin: async function(e,p){ window.__loginCalls.push([e,p]); return null; }, signOut: () => {} };` }));

  await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500); // 等待 React Bits 元件（Aurora/DotField）載入並 mount

  const ui = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const card = q('.login-card');
    return {
      badge: q('.login-logo-badge') ? q('.login-logo-badge').textContent : null,
      title: card && card.querySelector('h1') ? card.querySelector('h1').textContent.trim() : null,
      email: !!q('input[name="email"]'),
      password: !!q('input[name="password"]'),
      remember: !!q('input[name="remember"]'),
      forgot: q('.login-forgot') ? q('.login-forgot').textContent.trim() : null,
      version: q('.login-version b') ? q('.login-version b').textContent.trim() : null,
      loginBtn: q('#loginBtn') ? q('#loginBtn').textContent.trim() : null,
      auroraLayers: document.querySelectorAll('.aurora-layer').length,
      dotField: !!q('.dotfield-canvas'),
      glass: card ? getComputedStyle(card).backdropFilter : null,
    };
  });
  console.log('UI:', JSON.stringify(ui));
  if (ui.badge !== 'T1') throw new Error('logo badge missing');
  if (!ui.title || ui.title.indexOf('Welcome') === -1) throw new Error('welcome title missing');
  if (!ui.email || !ui.password || !ui.remember) throw new Error('form fields missing');
  if (ui.forgot !== 'Forgot Password?') throw new Error('forgot link missing');
  if (ui.version !== 'Version 1.0') throw new Error('version missing');
  if (ui.loginBtn !== 'Login') throw new Error('login button missing');
  if (ui.auroraLayers < 2) throw new Error('Aurora background missing');
  if (!ui.dotField) throw new Error('DotField background missing');
  if (!ui.glass || ui.glass.indexOf('blur') === -1) throw new Error('glassmorphism missing');

  // Login click → console.log("Login Clicked") + handleLogin 被呼叫（填 fields）
  await page.fill('input[name="email"]', 'a@b.com');
  await page.fill('input[name="password"]', 'x');
  await page.click('#loginBtn');
  await page.waitForTimeout(400);
  const calls = await page.evaluate(() => window.__loginCalls);
  console.log('Console:', JSON.stringify(logs));
  console.log('handleLogin calls:', JSON.stringify(calls));
  if (!logs.includes('Login Clicked')) throw new Error('Login Clicked not logged');
  if (calls.length !== 1 || calls[0][0] !== 'a@b.com' || calls[0][1] !== 'x') throw new Error('handleLogin not called with credentials');

  // Forgot Password → no navigation
  const urlBefore = page.url();
  await page.click('.login-forgot');
  await page.waitForTimeout(300);
  if (page.url() !== urlBefore) throw new Error('forgot link navigated: ' + page.url());

  // Dark theme sanity
  const theme = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('Body bg:', theme);

  await page.screenshot({ path: 'login_preview.png', fullPage: false });
  console.log('Screenshot saved: login_preview.png');

  await browser.close();
  console.log('\nLOGIN PAGE CHECK PASSED');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });

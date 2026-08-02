// Verify login.html renders and the Login button logs "Login Clicked".
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const logs = [];
  page.on('console', m => { if (m.type() === 'log' || m.type() === 'error') logs.push(m.text()); });

  await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  const ui = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    return {
      badge: q('.login-logo-badge') ? q('.login-logo-badge').textContent : null,
      title: q('.login-brand h1') ? q('.login-brand h1').textContent.trim() : null,
      email: !!q('input[name="email"]'),
      password: !!q('input[name="password"]'),
      remember: !!q('input[name="remember"]'),
      forgot: q('.login-forgot') ? q('.login-forgot').textContent.trim() : null,
      version: q('.login-version b') ? q('.login-version b').textContent.trim() : null,
      loginBtn: q('#loginBtn') ? q('#loginBtn').textContent.trim() : null,
      columns: getComputedStyle(q('.login-shell')).gridTemplateColumns,
    };
  });
  console.log('UI:', JSON.stringify(ui));
  if (ui.badge !== 'T1') throw new Error('logo badge missing');
  if (!ui.title || ui.title.indexOf('Welcome') === -1) throw new Error('welcome title missing');
  if (!ui.email || !ui.password || !ui.remember) throw new Error('form fields missing');
  if (ui.forgot !== 'Forgot Password?') throw new Error('forgot link missing');
  if (ui.version !== 'Version 1.0') throw new Error('version missing');
  if (ui.loginBtn !== 'Login') throw new Error('login button missing');
  if (ui.columns.split(' ').length < 2) throw new Error('not two-column layout');

  // Login click → console.log("Login Clicked")
  await page.click('#loginBtn');
  await page.waitForTimeout(300);
  console.log('Console:', JSON.stringify(logs));
  if (!logs.includes('Login Clicked')) throw new Error('Login Clicked not logged');

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

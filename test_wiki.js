const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

    await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));
await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Check if RFQ Wiki tab exists
  const wikiTabExists = await page.evaluate(() => {
    const tabs = document.querySelectorAll('.p-inner-tab[data-ptab-panel="wiki"]');
    return tabs.length;
  });

  console.log('RFQ Wiki tabs found:', wikiTabExists);

  // Find first project and open it
  const projects = await page.$$eval('.project-card', cards => cards.length);
  console.log('Projects found:', projects);

  if (projects > 0) {
    // Click first project to expand it
    await page.click('.project-card summary');
    await page.waitForTimeout(500);

    // Check wiki panel
    const wikiPanelExists = await page.evaluate(() => {
      const panels = document.querySelectorAll('[data-ptab-panel$="|wiki"]');
      return panels.length;
    });
    console.log('Wiki panels found:', wikiPanelExists);
  }

  // Screenshot
  await page.screenshot({ path: 'wiki_test.png' });
  console.log('Screenshot saved as wiki_test.png');

  await browser.close();
})();

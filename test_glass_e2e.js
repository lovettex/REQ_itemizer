// Visual check: glassmorphism (panel translucent + backdrop-filter) & depth layers.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const styles = await page.evaluate(() => {
    const gs = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundImage || cs.backgroundColor, backdrop: cs.backdropFilter || cs.webkitBackdropFilter, blur: cs.filter };
    };
    return {
      bodyBg: getComputedStyle(document.body).backgroundImage.slice(0, 80),
      bodyBefore: gs('body::before') || (() => { const b = getComputedStyle(document.body, '::before'); return { bg: b.backgroundImage.slice(0, 60), blur: b.filter }; })(),
      panel: gs('.panel'),
      card: gs('.card'),
      projectCard: gs('.project-card'),
      hasCards: document.querySelectorAll('.results .card').length,
    };
  });
  console.log('Styles:', JSON.stringify(styles, null, 1));
  if (styles.bodyBg.indexOf('gradient') === -1) throw new Error('body gradient missing');
  if (!styles.bodyBefore || styles.bodyBefore.blur.indexOf('46px') === -1) throw new Error('far depth blur layer missing');
  if (!styles.panel) throw new Error('panel missing');
  if (styles.panel.bg.indexOf('gradient') === -1) throw new Error('panel should use the page gradient');

  // Open Master template search → cards visible & translucent
  await page.evaluate(() => {
    const input = document.getElementById('search');
    input.value = 'door';
    input.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(200);
  const cardState = await page.evaluate(() => {
    const card = document.querySelector('#results .card');
    const cs = getComputedStyle(card);
    return { count: document.querySelectorAll('#results .card').length, bg: cs.backgroundColor, backdrop: cs.backdropFilter || cs.webkitBackdropFilter };
  });
  console.log('Card state:', JSON.stringify(cardState));
  if (cardState.count === 0) throw new Error('cards should render');
  if (!cardState.bg.includes('255, 255, 255')) throw new Error('card not translucent');

  // Expand a project card to ensure the projects area still works
  await page.evaluate(() => {
    document.querySelector('.project-tab[data-project-tab="new"]').click();
    const form = document.getElementById('projectForm');
    form.querySelector('input[name="name"]').value = 'Glass Test';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('.project-tab[data-project-tab="saved"]').click());
  await page.waitForTimeout(300);
  const projState = await page.evaluate(() => {
    const card = document.querySelector('.project-card');
    return { count: document.querySelectorAll('.project-card').length, bg: card ? getComputedStyle(card).backgroundColor : null };
  });
  console.log('Project card state:', JSON.stringify(projState));
  if (projState.count === 0) throw new Error('project cards should render');
  if (projState.bg && !projState.bg.includes('255, 255, 255')) throw new Error('project card not translucent');

  await page.screenshot({ path: 'glass_check.png', fullPage: false });
  console.log('Screenshot saved: glass_check.png');

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }
  console.log('\nGLASS VISUAL CHECK PASSED');
  await browser.close();
})().catch(e => { console.error('GLASS CHECK FAILED:', e.message); process.exit(1); });

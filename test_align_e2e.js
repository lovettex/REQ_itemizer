// Alignment check: projects (top), catalog (bottom-left), workspace (side) share
// the same left/right boundaries at multiple viewport widths.
const { chromium } = require('playwright');

const CHECK = async (width, height) => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
await page.context().route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const rects = await page.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { left: Math.round(b.left), right: Math.round(b.right), width: Math.round(b.width) };
    };
    return {
      projects: r('.project-wide'),
      catalog: r('.layout .catalog'),
      workspace: r('.layout .workspace'),
      layout: r('.layout'),
    };
  });
  console.log(`viewport ${width}px:`, JSON.stringify(rects));
  if (!rects.projects || !rects.catalog || !rects.workspace) throw new Error('missing blocks');
  const eps = 2;
  // Left edge: top projects block aligns with bottom-left catalog block
  if (Math.abs(rects.projects.left - rects.catalog.left) > eps) throw new Error('projects/catalog left misaligned');
  // Right edge: top projects block aligns with the side workspace block
  if (Math.abs(rects.projects.right - rects.workspace.right) > eps) throw new Error('projects/workspace right misaligned');
  // Two-column mode: catalog and workspace sit side by side (catalog right ≈ workspace left)
  if (rects.catalog.right < rects.projects.right - 10) {
    if (Math.abs(rects.catalog.right - (rects.workspace.left - 20)) > eps) throw new Error('catalog/workspace gutter misaligned');
  } else {
    // Single column: workspace also full-width, left edges equal
    if (Math.abs(rects.workspace.left - rects.catalog.left) > eps) throw new Error('workspace left misaligned (single col)');
  }
  await browser.close();
  return rects;
};

(async () => {
  await CHECK(1280, 900); // below max-width → 8vw margins
  await CHECK(2000, 900); // above max-width → centered 1560px
  await CHECK(800, 900);  // narrow → single column stack
  console.log('\nALIGNMENT CHECK PASSED (1280 / 2000 / 800)');
})().catch(e => { console.error('ALIGNMENT FAILED:', e.message); process.exit(1); });

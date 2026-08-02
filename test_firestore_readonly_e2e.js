// E2E: 網頁唯讀雲端 — cloud is the authority; local data is never wiped;
// web operations never write to Firestore. Uses a mocked Firebase SDK.
const { chromium } = require('playwright');

async function openPage(browser, opts) {
  const context = await browser.newContext();
  // Block the real Firebase CDN SDK so our injected mock stays in control
  await context.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await context.addInitScript((o) => {
    // seed localStorage (runs before app.js)
    if (o.localPairs) localStorage.setItem('t1-product-pairs', JSON.stringify(o.localPairs));
    if (o.localProjects) localStorage.setItem('t1-projects', JSON.stringify(o.localProjects));
    window.__fsWriteCalls = 0;
    window.__cloud = { pairs: o.cloudPairs, projects: o.cloudProjects };
    window.firebase = {
      apps: [],
      initializeApp: () => {},
      firestore: () => ({
        collection: () => ({
          doc: (id) => ({
            get: async () => {
              const d = window.__cloud[id];
              // deep copy — real Firestore snapshots are independent of the DB object
              return { exists: !!d, data: () => ({ items: JSON.parse(JSON.stringify(d || [])) }) };
            },
            set: async () => { window.__fsWriteCalls++; throw new Error('readonly violated: set called'); }
          })
        })
      })
    };
  }, opts);
  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800); // allow boot + init + loadAll
  return { page, context };
}

const cloudProj = [{ id: 'cloud-1', name: '雲端專案 A', items: [] }];
const localProj = [{ id: 'local-1', name: '本地專案 B', items: [] }];
const cloudPair = [{ id: 'cp1', name: '雲端配對 X' }];
const localPair = [{ id: 'lp1', name: '本地配對 Y' }];

(async () => {
  const browser = await chromium.launch();

  // --- 1. Cloud + local both have data → MERGED (neither side is lost) ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: cloudPair, cloudProjects: cloudProj,
      localPairs: localPair, localProjects: localProj, // different ids from cloud
    });
    const r = await page.evaluate(() => {
      const lsP = JSON.parse(localStorage.getItem('t1-projects') || '[]');
      const lsR = JSON.parse(localStorage.getItem('t1-product-pairs') || '[]');
      return {
        projectNames: Array.from(document.querySelectorAll('.project-card summary')).map(s => s.textContent),
        lsProjectNames: lsP.map(x => x.name),
        lsPairNames: lsR.map(x => x.name),
        writes: window.__fsWriteCalls,
      };
    });
    console.log('1. Merge cloud+local:', JSON.stringify(r));
    if (r.lsProjectNames.length !== 2 || !r.lsProjectNames.includes('雲端專案 A') || !r.lsProjectNames.includes('本地專案 B')) {
      throw new Error('both cloud & local projects must survive: ' + JSON.stringify(r.lsProjectNames));
    }
    if (r.lsPairNames.length !== 2 || !r.lsPairNames.includes('雲端配對 X') || !r.lsPairNames.includes('本地配對 Y')) {
      throw new Error('both cloud & local pairs must survive: ' + JSON.stringify(r.lsPairNames));
    }
    if (!r.projectNames.join('').includes('本地專案 B') || !r.projectNames.join('').includes('雲端專案 A')) {
      throw new Error('UI should show both projects');
    }
    await context.close();
  }

  // --- 1b. Same id in cloud & local → LOCAL wins (most recently operated) ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: null,
      cloudProjects: [{ id: 'same-1', name: '雲端舊名稱', items: [] }],
      localPairs: null,
      localProjects: [{ id: 'same-1', name: '本地新名稱', items: [] }],
    });
    const r = await page.evaluate(() => {
      const lsP = JSON.parse(localStorage.getItem('t1-projects') || '[]');
      return { names: lsP.map(x => x.name), count: lsP.length };
    });
    console.log('1b. Same-id conflict:', JSON.stringify(r));
    if (r.count !== 1 || r.names[0] !== '本地新名稱') throw new Error('local should win on same id: ' + JSON.stringify(r.names));
    await context.close();
  }

  // --- 2. Cloud empty → local data preserved (never wiped) ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: null, cloudProjects: null,
      localPairs: localPair, localProjects: localProj,
    });
    const r = await page.evaluate(() => {
      const lsP = JSON.parse(localStorage.getItem('t1-projects') || '[]');
      const lsR = JSON.parse(localStorage.getItem('t1-product-pairs') || '[]');
      return {
        projectNames: Array.from(document.querySelectorAll('.project-card summary')).map(s => s.textContent),
        lsProjectName: lsP[0] ? lsP[0].name : null,
        lsPairName: lsR[0] ? lsR[0].name : null,
      };
    });
    console.log('2. Cloud-empty keeps local:', JSON.stringify(r));
    if (r.lsProjectName !== '本地專案 B') throw new Error('local project must survive when cloud empty');
    if (r.lsPairName !== '本地配對 Y') throw new Error('local pair must survive when cloud empty');
    if (!r.projectNames.join('').includes('本地專案 B')) throw new Error('UI should still show local project');
    await context.close();
  }

  // --- 3. Web operations never write to Firestore ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: cloudPair, cloudProjects: cloudProj,
      localPairs: null, localProjects: null,
    });
    // create a project via UI
    await page.evaluate(() => {
      document.querySelector('.project-tab[data-project-tab="new"]').click();
      const form = document.getElementById('projectForm');
      form.querySelector('input[name="name"]').value = '唯讀測試專案';
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({
      writes: window.__fsWriteCalls,
      lsProjects: JSON.parse(localStorage.getItem('t1-projects') || '[]').length,
      cloudProjectsStill: (window.__cloud.projects || []).length,
    }));
    console.log('3. Readonly writes:', JSON.stringify(r));
    if (r.writes !== 0) throw new Error('web operation must NOT write to Firestore (writes=' + r.writes + ')');
    if (r.lsProjects === 0) throw new Error('web op should still save to localStorage');
    if (r.cloudProjectsStill !== 1) throw new Error('cloud data must remain untouched');
    await context.close();
  }

  await browser.close();
  console.log('\nE2E FIRESTORE READ-ONLY TEST PASSED');
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

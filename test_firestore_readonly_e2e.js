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
    if (o.localWiki) localStorage.setItem('t1-wiki-entries', JSON.stringify(o.localWiki));
    window.__fsWriteCalls = 0;
    window.__cloud = { pairs: o.cloudPairs, projects: o.cloudProjects, mixmatch: o.cloudMixmatch, wiki: o.cloudWiki };
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
            set: async (data) => {
              window.__fsWriteCalls++;
              window.__cloud[id] = data && data.items; // simulate cloud write
            }
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

  // --- 3. Web operations now WRITE to Firestore (cloud backup) ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: cloudPair, cloudProjects: cloudProj,
      localPairs: null, localProjects: null,
    });
    // create a project via UI
    await page.evaluate(() => {
      document.querySelector('.project-tab[data-project-tab="new"]').click();
      const form = document.getElementById('projectForm');
      form.querySelector('input[name="name"]').value = '雲端寫入測試';
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({
      writes: window.__fsWriteCalls,
      lsProjects: JSON.parse(localStorage.getItem('t1-projects') || '[]').length,
      cloudProjectNames: (window.__cloud.projects || []).map(x => x.name),
    }));
    console.log('3. Cloud write:', JSON.stringify(r));
    if (r.writes === 0) throw new Error('web operation SHOULD write to Firestore');
    if (r.lsProjects === 0) throw new Error('web op should also save to localStorage');
    if (!r.cloudProjectNames.includes('雲端寫入測試')) throw new Error('cloud should contain the new project: ' + JSON.stringify(r.cloudProjectNames));
    await context.close();
  }

  // --- 4. saveMixNotes writes to Firestore (cloud backup) ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: null, cloudProjects: null, localPairs: null, localProjects: null,
    });
    await page.evaluate(() => {
      const fs = (window.T1 || {}).firestore;
      fs.saveMixNotes({ 'CODE-1': { r1: 'a', r2: 'b', r3: 'c' } });
    });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ cloud: window.__cloud.mixmatch }));
    console.log('4. saveMixNotes cloud:', JSON.stringify(r));
    if (!r.cloud || !r.cloud['CODE-1'] || r.cloud['CODE-1'].r1 !== 'a') throw new Error('saveMixNotes should be written to cloud');
    await context.close();
  }

  // --- 5. saveViewerPos writes to Firestore (cross-device positions) ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: null, cloudProjects: null, localPairs: null, localProjects: null,
    });
    await page.evaluate(() => {
      const fs = (window.T1 || {}).firestore;
      fs.saveViewerPos({ 'GF - 1': { scale: 2.5, tx: 120, ty: -30 } });
    });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ cloud: window.__cloud.viewerPos }));
    console.log('5. saveViewerPos cloud:', JSON.stringify(r));
    if (!r.cloud || !r.cloud['GF - 1'] || r.cloud['GF - 1'].scale !== 2.5) throw new Error('saveViewerPos should be written to cloud');
    await context.close();
  }

  // --- 6. saveWiki writes to Firestore (wiki cross-device backup) ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: null, cloudProjects: null, localPairs: null, localProjects: null,
    });
    await page.evaluate(() => {
      const fs = (window.T1 || {}).firestore;
      fs.saveWiki([{ id: 'w1', title: 'Wiki Note', category: 'PO' }]);
    });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ cloud: window.__cloud.wiki }));
    console.log('6. saveWiki cloud:', JSON.stringify(r));
    if (!r.cloud || !Array.isArray(r.cloud) || r.cloud[0].title !== 'Wiki Note') throw new Error('saveWiki should be written to cloud');
    await context.close();
  }

  // --- 7. Wiki merge: cloud + local both survive ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: null, cloudProjects: null, localPairs: null, localProjects: null,
      cloudWiki: [{ id: 'cw1', title: '雲端 Wiki' }],
      localWiki: [{ id: 'lw1', title: '本地 Wiki' }],
    });
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const ls = JSON.parse(localStorage.getItem('t1-wiki-entries') || '[]');
      return { titles: ls.map(x => x.title), count: ls.length };
    });
    console.log('7. Wiki merge:', JSON.stringify(r));
    if (r.count !== 2 || !r.titles.includes('雲端 Wiki') || !r.titles.includes('本地 Wiki')) {
      throw new Error('wiki merge should keep both: ' + JSON.stringify(r));
    }
    await context.close();
  }

  // --- 8. Full project (workLogs + confirmSummary) loads from cloud → all views ---
  {
    const fullProject = [{
      id: 'fp1', name: '完整專案', sales: 'S1', assignedQs: 'Ben', status: 'Processing',
      items: [{ id: 'i1', type: 'PARTITION', pair: { name: 'P' }, extra: { height: '3000' } }],
      workLogs: [
        { id: 'w1', summary: 'A2VO3', status: 'confirmed', createdAt: '2026-08-01T00:00:00Z' },
        { id: 'w2', summary: 'B1', status: 'submited', createdAt: '2026-08-02T00:00:00Z' }
      ],
      confirmSummary: [{ id: 'c1', label: 'PICKLIST (DO)', value: 'DO5', createdAt: '2026-08-01T00:00:00Z' }]
    }];
    const { page, context } = await openPage(browser, {
      cloudPairs: null, cloudProjects: fullProject, localPairs: null, localProjects: null,
    });
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem('t1-projects') || '[]')[0];
      return {
        projectName: p ? p.name : null,
        workLogs: p ? (p.workLogs || []).length : 0,
        confirmSummary: p ? (p.confirmSummary || []).length : 0,
        // Listed Projects 視圖
        listedCard: Array.from(document.querySelectorAll('.project-card summary')).some(s => s.textContent.indexOf('完整專案') !== -1),
        // Dashboard 視圖（處理中狀態）
        dashShowsProject: Array.from(document.querySelectorAll('#dashboardList *')).some(el => el.textContent && el.textContent.indexOf('完整專案') !== -1),
      };
    });
    console.log('8. Full project views:', JSON.stringify(r));
    if (r.projectName !== '完整專案' || r.workLogs !== 2 || r.confirmSummary !== 1) throw new Error('cloud project not fully loaded');
    if (!r.listedCard) throw new Error('Listed Projects should show cloud project');
    if (!r.dashShowsProject) throw new Error('Dashboard should show cloud project');
    await context.close();
  }

  // --- 9. Pair (Saved Library) writes to Firestore ---
  {
    const { page, context } = await openPage(browser, {
      cloudPairs: null, cloudProjects: null, localPairs: null, localProjects: null,
    });
    await page.evaluate(() => {
      const fs = (window.T1 || {}).firestore;
      fs.savePairs([{ id: 'pair1', name: 'Saved Pair' }]);
    });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ cloud: window.__cloud.pairs }));
    console.log('9. savePairs cloud:', JSON.stringify(r));
    if (!r.cloud || !Array.isArray(r.cloud) || r.cloud[0].name !== 'Saved Pair') throw new Error('savePairs should be written to cloud');
    await context.close();
  }

  await browser.close();
  console.log('\nE2E FIRESTORE READ-ONLY TEST PASSED');
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

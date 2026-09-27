// E2E: 上方專案區塊右上角「展開」icon
// - 展開後下方 Master/Profile template 與右側工作區（OW／Current set／Saved Library／Mix & Match）隱藏
// - LISTED PROJECTS 檢索下拉下方列出所有 Project（confirmed／not confirmed 分類）
// - 一次最多 20 筆，其餘到第 2、3… 頁
const { chromium } = require('playwright');

const CONFIRMED = 6;   // 有 confirmed Work Log 的 Project
const OPEN = 19;       // 尚未 confirmed 的 Project
const TOTAL = CONFIRMED + OPEN;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.context().route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));

  // 種入測試資料：confirmed 先（AA 開頭）、未 confirmed 後（BB 開頭），名稱排序穩定
  await page.addInitScript(({ confirmed, open }) => {
    const projects = [];
    for (let i = 1; i <= confirmed; i++) {
      projects.push({
        id: 'conf-' + i, name: 'AA Conf ' + String(i).padStart(2, '0'), sales: 'Glen Tew', assignedQs: 'Ben',
        status: 'Processing', items: [{ id: 'i' + i, pair: { name: 'Item' }, type: 'PARTITION', extra: {} }],
        workLogs: [{ id: 'w' + i, summary: 'A2', status: 'confirmed', createdAt: '2026-09-01T00:00:00.000Z' }]
      });
    }
    for (let i = 1; i <= open; i++) {
      projects.push({
        id: 'open-' + i, name: 'BB Open ' + String(i).padStart(2, '0'), sales: 'Bella', assignedQs: '',
        status: '', items: [], workLogs: [{ id: 'wo' + i, summary: 'A1', status: 'submited', createdAt: '2026-09-02T00:00:00.000Z' }]
      });
    }
    localStorage.setItem('t1-projects', JSON.stringify(projects));
  }, { confirmed: CONFIRMED, open: OPEN });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // 0. 收合狀態：icon 存在於 tab 區塊右上角、下方區塊可見、展開清單不存在
  const collapsed = await page.evaluate(() => {
    const btn = document.getElementById('projectExpandBtn');
    const bar = document.querySelector('.project-tab-bar');
    const browse = document.getElementById('projectBrowse');
    return {
      hasBtn: !!btn,
      insideBar: !!(btn && bar && bar.contains(btn)),
      rightmost: !!(btn && bar && bar.lastElementChild === btn),
      label: btn ? btn.getAttribute('title') : null,
      expandedAttr: btn ? btn.getAttribute('aria-expanded') : null,
      layoutDisplay: getComputedStyle(document.querySelector('.layout')).display,
      browseDisplay: browse ? getComputedStyle(browse).display : null,
      cards: document.querySelectorAll('.project-card').length,
      headBg: getComputedStyle(document.querySelector('.project-card > summary')).backgroundColor
    };
  });
  console.log('Collapsed:', JSON.stringify(collapsed));
  if (!collapsed.hasBtn || !collapsed.insideBar || !collapsed.rightmost) throw new Error('展開 icon 未放在 tab 區塊右上角');
  if (collapsed.expandedAttr !== 'false') throw new Error('aria-expanded 初始應為 false');
  if (collapsed.browseDisplay !== 'none') throw new Error('收合時展開清單應隱藏');
  if (collapsed.headBg !== 'rgb(137, 191, 103)') throw new Error('project 名稱標題列底色應為 #89BF67，實際 ' + collapsed.headBg);
  if (collapsed.cards !== TOTAL) throw new Error(`收合時應有 ${TOTAL} 張 project 卡片，實際 ${collapsed.cards}`);

  // 1. 點 icon → 展開（先捲動頁面，確認展開時回到頂端、topbar 不會被切掉）
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(150);
  await page.click('#projectExpandBtn');
  await page.waitForTimeout(300);
  const expanded = await page.evaluate(() => {
    const browse = document.getElementById('projectBrowse');
    const items = [...document.querySelectorAll('#projectBrowseList .pb-item')];
    const groups = [...document.querySelectorAll('#projectBrowseList .pb-group')].map(g => g.querySelector('span').textContent.trim());
    const counts = [...document.querySelectorAll('#projectBrowseList .pb-group em')].map(e => e.textContent.trim());
    return {
      bodyClass: document.body.classList.contains('project-expanded'),
      expandedAttr: document.getElementById('projectExpandBtn').getAttribute('aria-expanded'),
      layoutDisplay: getComputedStyle(document.querySelector('.layout')).display,
      layoutHidden: !document.querySelector('.layout').checkVisibility(),
      catalogHidden: !document.querySelector('.catalog').checkVisibility(),
      workspaceHidden: !document.querySelector('.workspace').checkVisibility(),
      browseDisplay: getComputedStyle(browse).display,
      panelPos: getComputedStyle(document.getElementById('projectWidePanel')).position,
      lenisPrevent: document.getElementById('projectWidePanel').hasAttribute('data-lenis-prevent'),
      itemCount: items.length,
      groups, counts,
      pagination: [...document.querySelectorAll('#projectBrowsePagination .pg-btn')].map(b => b.textContent.trim()),
      activePage: (document.querySelector('#projectBrowsePagination .pg-active') || {}).textContent,
      countText: document.getElementById('projectBrowseCount').textContent,
      firstName: items[0] ? items[0].querySelector('.pb-name').textContent : null,
      lastName: items[items.length - 1] ? items[items.length - 1].querySelector('.pb-name').textContent : null,
      scrollY: window.scrollY,
      topbarTop: Math.round(document.querySelector('.topbar').getBoundingClientRect().top),
      panelTop: Math.round(document.getElementById('projectWidePanel').getBoundingClientRect().top)
    };
  });
  console.log('Expanded:', JSON.stringify(expanded, null, 1));
  if (!expanded.bodyClass || expanded.expandedAttr !== 'true') throw new Error('展開狀態未生效');
  if (expanded.layoutDisplay !== 'none') throw new Error('展開時下方 .layout 應隱藏');
  if (!expanded.catalogHidden || !expanded.workspaceHidden) throw new Error('展開時 Master/Profile 與右側工作區應隱藏');
  if (expanded.browseDisplay === 'none') throw new Error('展開時應顯示全部 Project 清單');
  if (expanded.panelPos !== 'fixed') throw new Error('展開時專案區塊應佔滿視窗');
  if (!expanded.lenisPrevent) throw new Error('展開時專案區塊應加 data-lenis-prevent 以便內部捲動');
  if (expanded.itemCount !== 20) throw new Error(`第 1 頁應顯示 20 筆，實際 ${expanded.itemCount}`);
  if (expanded.pagination.length !== 2) throw new Error(`應有 2 頁分頁，實際 ${expanded.pagination.length}`);
  if (expanded.groups[0] !== 'CONFIRMED') throw new Error('第 1 頁應先列 CONFIRMED：' + expanded.groups[0]);
  if (expanded.groups.indexOf('NOT CONFIRMED') === -1) throw new Error('第 1 頁應有 NOT CONFIRMED 分類');
  if (expanded.counts[0] !== String(CONFIRMED)) throw new Error(`CONFIRMED 數量應為 ${CONFIRMED}，實際 ${expanded.counts[0]}`);
  if (expanded.scrollY !== 0 || expanded.topbarTop !== 0) throw new Error(`展開時應回到頁面頂端（scrollY=${expanded.scrollY}, topbarTop=${expanded.topbarTop}）`);
  if (expanded.panelTop !== 65) throw new Error(`展開面板應緊貼 topbar 下緣（top=${expanded.panelTop}）`);
  await page.screenshot({ path: 'project_expand_check.png' }); // 供人工檢視（已列入 .gitignore）

  // 2. 第 2 頁 → 剩下 5 筆（全部 NOT CONFIRMED）
  await page.click('#projectBrowsePagination .pg-btn:nth-child(2)');
  await page.waitForTimeout(300);
  const page2 = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#projectBrowseList .pb-item')];
    return {
      itemCount: items.length,
      groups: [...document.querySelectorAll('#projectBrowseList .pb-group')].map(g => g.querySelector('span').textContent.trim()),
      names: items.map(i => i.querySelector('.pb-name').textContent),
      activePage: (document.querySelector('#projectBrowsePagination .pg-active') || {}).textContent,
      selectedCount: document.querySelectorAll('#projectBrowseList .pb-item.selected').length
    };
  });
  console.log('Page2:', JSON.stringify(page2));
  if (page2.itemCount !== TOTAL - 20) throw new Error(`第 2 頁應為 ${TOTAL - 20} 筆，實際 ${page2.itemCount}`);
  if (page2.activePage !== '2') throw new Error('第 2 頁分頁未啟用');
  if (page2.groups.length !== 1 || page2.groups[0] !== 'NOT CONFIRMED') throw new Error('第 2 頁應只有 NOT CONFIRMED 分類');

  // 3. 回第 1 頁 → 點第 1 個 Project → 只顯示該卡片、展開清單標示選取、檢索框帶入名稱
  await page.click('#projectBrowsePagination .pg-btn:nth-child(1)');
  await page.waitForTimeout(300);
  await page.click('#projectBrowseList .pb-item:nth-of-type(1)');
  await page.waitForTimeout(400);
  const picked = await page.evaluate(() => {
    const visible = [...document.querySelectorAll('.project-card')].filter(c => getComputedStyle(c).display !== 'none');
    return {
      visibleCards: visible.length,
      visibleName: visible[0] ? visible[0].querySelector('summary span').textContent : null,
      selectedRows: document.querySelectorAll('#projectBrowseList .pb-item.selected').length,
      searchValue: document.getElementById('projectSearch').value,
      browseStillVisible: getComputedStyle(document.getElementById('projectBrowse')).display !== 'none'
    };
  });
  console.log('Picked:', JSON.stringify(picked));
  if (picked.visibleCards !== 1) throw new Error('點選後應只顯示 1 張 Project 卡片');
  if (picked.selectedRows !== 1) throw new Error('展開清單應標示選取的 Project');
  if (picked.searchValue.indexOf('AA Conf 01') === -1) throw new Error('檢索框應帶入選取的 Project 名稱：' + picked.searchValue);
  if (!picked.browseStillVisible) throw new Error('展開清單應保持顯示以便快速切換');

  // 4. Esc → 收合，回到原本上下兩個區塊
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const afterEsc = await page.evaluate(() => ({
    bodyClass: document.body.classList.contains('project-expanded'),
    layoutDisplay: getComputedStyle(document.querySelector('.layout')).display,
    browseDisplay: getComputedStyle(document.getElementById('projectBrowse')).display,
    lenisPrevent: document.getElementById('projectWidePanel').hasAttribute('data-lenis-prevent')
  }));
  console.log('AfterEsc:', JSON.stringify(afterEsc));
  if (afterEsc.bodyClass || afterEsc.layoutDisplay === 'none' || afterEsc.browseDisplay !== 'none') throw new Error('Esc 應收合展開模式');

  // 5. 窄螢幕：展開後不得出現水平溢位
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('#projectExpandBtn');
  await page.waitForTimeout(400);
  const narrow = await page.evaluate(() => ({
    docScrollW: document.documentElement.scrollWidth,
    docClientW: document.documentElement.clientWidth,
    panelScrollW: document.getElementById('projectWidePanel').scrollWidth,
    itemCount: document.querySelectorAll('#projectBrowseList .pb-item').length
  }));
  console.log('Narrow:', JSON.stringify(narrow));
  if (narrow.panelScrollW > narrow.docClientW + 2) throw new Error('窄螢幕展開模式出現水平溢位');

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }
  console.log('\nPROJECT EXPAND E2E PASSED');
  await browser.close();
})().catch(e => { console.error('PROJECT EXPAND E2E FAILED:', e.message); process.exit(1); });

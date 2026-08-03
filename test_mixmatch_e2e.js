// E2E: Mix & Match — 6 boxes above catalog search; Mix button adds item with fly
// animation; boxes are manageable (remove); persisted in localStorage.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.context().route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // 1. Section exists with 6 empty boxes
  const initial = await page.evaluate(() => ({
    section: !!document.querySelector('.mixmatch-section'),
    title: document.querySelector('.mixmatch-title') ? document.querySelector('.mixmatch-title').textContent.trim() : null,
    boxes: document.querySelectorAll('.mix-box').length,
    empties: document.querySelectorAll('.mix-box.empty').length,
  }));
  console.log('Initial:', JSON.stringify(initial));
  if (!initial.section) throw new Error('mixmatch section missing');
  if (initial.title !== 'Mix & Match') throw new Error('title wrong: ' + initial.title);
  if (initial.boxes !== 6 || initial.empties !== 6) throw new Error('should be 6 empty boxes');

  // 2. Search Master → click Mix on first card → fly animation + added to first box
  await page.evaluate(() => {
    const s = document.getElementById('search'); s.value = 'door'; s.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('[data-mix-add]').click());
  await page.waitForTimeout(100);
  const midFly = await page.evaluate(() => !!document.querySelector('.mix-fly'));
  console.log('Fly animation element present:', midFly);
  if (!midFly) throw new Error('fly animation element missing during transition');
  await page.waitForTimeout(700); // wait for fly to land
  const after1 = await page.evaluate(() => ({
    filled: document.querySelectorAll('.mix-box.filled').length,
    code: document.querySelector('.mix-box.filled .mix-code') ? document.querySelector('.mix-box.filled .mix-code').textContent : null,
  }));
  console.log('After 1 mix:', JSON.stringify(after1));
  if (after1.filled !== 1) throw new Error('one box should be filled');
  if (!after1.code) throw new Error('filled box should show code');

  // 3. Fill all 6, 7th → toast "已滿"
  for (let i = 1; i < 6; i++) {
    await page.evaluate(() => document.querySelector('[data-mix-add]').click());
    await page.waitForTimeout(600);
  }
  const full = await page.evaluate(() => document.querySelectorAll('.mix-box.filled').length);
  console.log('Filled count:', full);
  if (full !== 6) throw new Error('should be 6 filled, got ' + full);
  await page.evaluate(() => document.querySelector('[data-mix-add]').click());
  await page.waitForTimeout(100);
  const toastTxt = await page.evaluate(() => document.getElementById('toast').textContent);
  console.log('Toast when full:', JSON.stringify(toastTxt));
  if (toastTxt.indexOf('已滿') === -1) throw new Error('full toast missing: ' + toastTxt);

  // 4. Remove one → back to 5 filled + 1 empty
  await page.evaluate(() => document.querySelector('.mix-box.filled .mix-remove').click());
  await page.waitForTimeout(200);
  const afterRemove = await page.evaluate(() => ({
    filled: document.querySelectorAll('.mix-box.filled').length,
    empties: document.querySelectorAll('.mix-box.empty').length,
  }));
  console.log('After remove:', JSON.stringify(afterRemove));
  if (afterRemove.filled !== 5 || afterRemove.empties !== 1) throw new Error('remove failed');

  // 5. Persisted after reload
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('t1-mixmatch') || '[]').filter(Boolean).length);
  console.log('Persisted items:', saved);
  if (saved !== 5) throw new Error('localStorage persistence wrong: ' + saved);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const reloaded = await page.evaluate(() => document.querySelectorAll('.mix-box.filled').length);
  console.log('After reload filled:', reloaded);
  if (reloaded !== 5) throw new Error('mixmatch not restored after reload');

  // 6. Profile tab also has Mix button
  await page.evaluate(() => document.querySelector('.catalog-tab[data-catalog-tab="profile"]').click());
  await page.waitForTimeout(200);
  const profMix = await page.evaluate(() => {
    document.getElementById('profileSearch').value = 'T-5001';
    document.getElementById('profileSearch').dispatchEvent(new Event('input'));
    return document.querySelectorAll('[data-mix-add-profile]').length;
  });
  await page.waitForTimeout(200);
  const profMix2 = await page.evaluate(() => document.querySelectorAll('[data-mix-add-profile]').length);
  console.log('Profile Mix buttons:', profMix2);
  if (profMix2 === 0) throw new Error('profile Mix buttons missing');

  // --- 7. Click a filled box → viewer opens (enlarge view) + box selected ---
  await page.evaluate(() => document.querySelector('.catalog-tab[data-catalog-tab="master"]').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.mix-box.filled').click());
  await page.waitForTimeout(300);
  const viewState = await page.evaluate(() => ({
    viewerOpen: !!document.getElementById('viewer').open,
    selectedBoxes: document.querySelectorAll('.mix-box.selected').length,
    noteCount: document.querySelectorAll('.mix-card .mix-note').length,
  }));
  console.log('After box click:', JSON.stringify(viewState));
  if (!viewState.viewerOpen) throw new Error('viewer should open on box click');
  if (viewState.selectedBoxes !== 1) throw new Error('box should be selected');
  if (viewState.noteCount !== 18) throw new Error('should be 6 boxes × 3 notes = 18 inputs, got ' + viewState.noteCount);
  // close viewer
  await page.evaluate(() => document.getElementById('viewer').close());

  // --- 8. Enter 3 notes on the FIRST filled box + Save Profile → stored per item ---
  await page.evaluate(() => {
    const card = document.querySelector('.mix-card .mix-box.filled').closest('.mix-card');
    const inputs = card.querySelectorAll('.mix-note');
    inputs[0].value = '備註A';
    inputs[1].value = '備註B';
    inputs[2].value = '備註C';
    card.querySelector('.mix-save-btn').click();
  });
  await page.waitForTimeout(200);
  const savedNotes = await page.evaluate(() => {
    const notes = JSON.parse(localStorage.getItem('t1-mixmatch-notes') || '{}');
    return Object.keys(notes).map(k => notes[k]);
  });
  console.log('Saved notes:', JSON.stringify(savedNotes));
  if (savedNotes.length !== 1 || savedNotes[0].r1 !== '備註A' || savedNotes[0].r3 !== '備註C') throw new Error('notes not saved: ' + JSON.stringify(savedNotes));

  // --- 9. Remove the box → notes survive; re-add same item → notes auto-loaded in ITS fields ---
  const removedCode = await page.evaluate(() => {
    const code = document.querySelector('.mix-box.filled .mix-code').textContent;
    document.querySelector('.mix-box.filled .mix-remove').click();
    return code;
  });
  await page.waitForTimeout(200);
  const afterRemove2 = await page.evaluate(() => ({
    filled: document.querySelectorAll('.mix-box.filled').length,
    notesStill: Object.keys(JSON.parse(localStorage.getItem('t1-mixmatch-notes') || '{}')).length,
  }));
  console.log('After remove (code=' + removedCode + '):', JSON.stringify(afterRemove2));
  if (afterRemove2.filled !== 4) throw new Error('box should be removed');
  if (afterRemove2.notesStill !== 1) throw new Error('notes should survive box removal');

  // re-add the SAME item from search results (search by its code)
  await page.evaluate((code) => {
    const s = document.getElementById('search'); s.value = code; s.dispatchEvent(new Event('input'));
  }, removedCode);
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('[data-mix-add]').click());
  await page.waitForTimeout(700);
  const reloadedNotes = await page.evaluate(() => {
    const card = document.querySelector('.mix-card .mix-box.filled').closest('.mix-card');
    const inputs = card.querySelectorAll('.mix-note');
    return { n1: inputs[0].value, n2: inputs[1].value, n3: inputs[2].value };
  });
  console.log('Notes after re-add:', JSON.stringify(reloadedNotes));
  if (reloadedNotes.n1 !== '備註A' || reloadedNotes.n3 !== '備註C') throw new Error('notes should auto-load on re-add');

  if (errors.length) { console.log('ERRORS:', errors.slice(0, 3)); throw new Error('console errors: ' + errors[0]); }
  console.log('\nE2E MIX & MATCH TEST PASSED');
  await browser.close();
})().catch(e => { console.error('E2E FAILED:', e.message); process.exit(1); });

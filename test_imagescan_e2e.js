// E2E: New Project tab 的 "Image scan" — 貼上截圖 → OCR.Space API → 自動填入表單欄位
// OCR API 以 route 攔截模擬（本機無外網），驗證送出的請求內容與填表結果。
const { chromium } = require('playwright');

const OCR_TEXT = [
  'FW: RFQ - Tower B Project',
  '',
  'Project: Tower B Curtain Wall',
  'Sales: Glen Tew',
  'Address: Lot 123, Jalan ABC,',
  'Taman XYZ, 50000 Kuala Lumpur',
  'Tenderer 1: XYZ Sdn Bhd',
  'Attn: Mr. Tan',
  'Tel: 03-1234 5678',
  'Email: tan@xyz.com.my',
  'Mobile: 012-345 6789',
  'Fax: 03-1234 5679'
].join('\n');

const EXPECT = {
  name: 'Tower B Curtain Wall',
  sales: 'Glen Tew',
  address: 'Lot 123, Jalan ABC, Taman XYZ, 50000 Kuala Lumpur',
  tenderer: 'XYZ Sdn Bhd',
  attn: 'Mr. Tan',
  tel: '03-1234 5678',
  email: 'tan@xyz.com.my',
  mobile: '012-345 6789',
  fax: '03-1234 5679'
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.context().route(/gstatic\.com\/firebasejs/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.route('**/auth.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: "window.T1 = window.T1 || {}; window.T1.auth = { available: true, init: () => Promise.resolve(), onAuthChange: cb => cb({ email: 'u@x.com' }), currentUser: () => ({ email: 'u@x.com' }), handleLogin: () => Promise.resolve(null), signOut: () => {} };" }));

  // --- 模擬 OCR.Space API ---
  let ocrResponse = { ParsedResults: [{ FileParseExitCode: '1', ParsedText: OCR_TEXT, ErrorMessage: null, ErrorDetails: null }], OCRExitCode: '1', IsErroredOnProcessing: false, ErrorMessage: null, ProcessingTimeInMilliseconds: '120' };
  const calls = [];
  await page.route('**/api.ocr.space/parse/image', async (route) => {
    let body = '';
    try { body = route.request().postData() || ''; } catch (e) { body = ''; }
    calls.push(body);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ocrResponse) });
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // 貼上截圖的工具（合成一張 PNG，走真實的 File → canvas → OCR 流程）
  const pasteShot = () => page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 640; c.height = 220;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 640, 220);
    x.fillStyle = '#000'; x.font = '16px sans-serif';
    x.fillText('Project: Tower B Curtain Wall', 12, 32);
    x.fillText('Tel: 03-1234 5678', 12, 60);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = new File([blob], 'screenshot.png', { type: 'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const ev = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'clipboardData', { value: dt });
    document.dispatchEvent(ev);
  });

  // 0. Image scan 區塊存在於 New Project tab
  await page.click('.project-tab[data-project-tab="new"]');
  await page.waitForTimeout(200);
  const ui0 = await page.evaluate(() => {
    const box = document.getElementById('imageScan');
    return {
      inForm: !!document.querySelector('#projectForm #imageScan'),
      visible: !!box && box.checkVisibility(),
      title: (document.querySelector('.image-scan-title') || {}).textContent,
      hasDrop: !!document.getElementById('imageScanDrop'),
      hasPick: !!document.getElementById('imageScanPick'),
      hasInput: !!document.getElementById('imageScanInput'),
      hint: (document.querySelector('.image-scan-text small') || {}).textContent || '',
      apiKey: (window.T1.imageScan || {}).apiKey
    };
  });
  console.log('UI:', JSON.stringify(ui0));
  if (!ui0.inForm || !ui0.visible) throw new Error('Image scan 應出現在 New Project 表單內');
  if (ui0.title.indexOf('Image scan') === -1) throw new Error('標題應為 Image scan');
  if (!ui0.hasDrop || !ui0.hasPick || !ui0.hasInput) throw new Error('Image scan 缺少貼上區／選擇圖片／file input');
  if (ui0.hint.indexOf('Ctrl+V') === -1) throw new Error('提示文字應說明可貼上截圖');
  if (ui0.apiKey !== 'K87036576688957') throw new Error('OCR.Space API key 未載入：' + ui0.apiKey);

  // 1. 貼上截圖 → 呼叫 OCR → 填入 9 個欄位
  await pasteShot();
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => {
    const val = (name) => {
      const el = document.querySelector(`#projectForm [name="${name}"]`);
      return el ? el.value : null;
    };
    return {
      values: { name: val('name'), sales: val('sales'), address: val('address'), tenderer: val('tenderer'), attn: val('attn'), tel: val('tel'), email: val('email'), mobile: val('mobile'), fax: val('fax') },
      status: document.getElementById('imageScanStatus').textContent,
      statusClass: document.getElementById('imageScanStatus').className,
      previewShown: !document.getElementById('imageScanPreview').hidden,
      previewType: (document.getElementById('imageScanPreview').src || '').slice(0, 20),
      highlighted: document.querySelector('#projectForm [name="tel"]').classList.contains('image-scan-filled')
    };
  });
  console.log('After paste:', JSON.stringify(after, null, 1));
  if (calls.length !== 1) throw new Error('應呼叫 OCR API 一次，實際 ' + calls.length);
  if (!/name="apikey"/.test(calls[0]) || calls[0].indexOf('K87036576688957') === -1) throw new Error('OCR 請求未帶 apikey');
  if (!/name="base64Image"/.test(calls[0]) || calls[0].indexOf('data:image/') === -1) throw new Error('OCR 請求未帶 base64Image');
  if (!/name="OCREngine"/.test(calls[0]) || !/name="scale"/.test(calls[0])) throw new Error('OCR 請求缺少 OCREngine / scale 參數');
  for (const k of Object.keys(EXPECT)) {
    if (after.values[k] !== EXPECT[k]) throw new Error(`欄位 ${k} 應為「${EXPECT[k]}」，實際「${after.values[k]}」`);
  }
  if (after.status.indexOf('已填入 9 個欄位') === -1) throw new Error('狀態應顯示已填入 9 個欄位：' + after.status);
  if (after.status.indexOf('Project') === -1 || after.status.indexOf('Tel') === -1) throw new Error('狀態應列出欄位顯示名稱：' + after.status);
  if (after.statusClass.indexOf('ok') === -1) throw new Error('狀態應為成功樣式：' + after.statusClass);
  if (!after.previewShown || after.previewType.indexOf('data:image/') !== 0) throw new Error('應顯示縮圖預覽');
  if (!after.highlighted) throw new Error('填入的欄位應有高亮標記');

  // 2. 選檔按鈕（點 drop zone 會開啟檔案選擇）
  const pickWired = await page.evaluate(() => {
    let opened = 0;
    const input = document.getElementById('imageScanInput');
    const orig = input.click.bind(input);
    input.click = () => { opened++; };
    document.getElementById('imageScanDrop').click();
    input.click = orig;
    return opened;
  });
  console.log('Pick click wired:', pickWired);
  if (pickWired !== 1) throw new Error('點擊貼上區應開啟檔案選擇');

  // 3. 辨識成功但沒有可對應欄位 → warn（不清空既有值）
  ocrResponse = { ParsedResults: [{ FileParseExitCode: '1', ParsedText: 'Hello, please find attached the RFQ.', ErrorMessage: null }], OCRExitCode: '1', IsErroredOnProcessing: false, ErrorMessage: null };
  await pasteShot();
  await page.waitForTimeout(1000);
  const noField = await page.evaluate(() => ({
    status: document.getElementById('imageScanStatus').textContent,
    statusClass: document.getElementById('imageScanStatus').className,
    nameStill: document.querySelector('#projectForm [name="name"]').value
  }));
  console.log('No label match:', JSON.stringify(noField));
  if (noField.statusClass.indexOf('warn') === -1) throw new Error('找不到欄位時應為 warn 狀態：' + JSON.stringify(noField));
  if (noField.nameStill !== EXPECT.name) throw new Error('找不到欄位時不應清空既有值');

  // 4. OCR API 回報錯誤 → error 狀態
  ocrResponse = { ParsedResults: null, OCRExitCode: '4', IsErroredOnProcessing: true, ErrorMessage: 'E550 Invalid free API key', ErrorDetails: null };
  await pasteShot();
  await page.waitForTimeout(1000);
  const apiErr = await page.evaluate(() => ({
    status: document.getElementById('imageScanStatus').textContent,
    statusClass: document.getElementById('imageScanStatus').className
  }));
  console.log('API error:', JSON.stringify(apiErr));
  if (apiErr.statusClass.indexOf('error') === -1) throw new Error('API 錯誤應為 error 狀態');
  if (apiErr.status.indexOf('E550') === -1) throw new Error('應顯示 API 回傳的錯誤訊息：' + apiErr.status);

  // 5. 非 New Project tab 貼上 → 不應呼叫 OCR
  await page.click('.project-tab[data-project-tab="saved"]');
  await page.waitForTimeout(250);
  const before = calls.length;
  await pasteShot();
  await page.waitForTimeout(800);
  console.log('Calls after paste on other tab:', calls.length, '(was ' + before + ')');
  if (calls.length !== before) throw new Error('其他 tab 貼上不應觸發 OCR');

  // 6. 清除
  await page.click('.project-tab[data-project-tab="new"]');
  await page.waitForTimeout(200);
  ocrResponse = { ParsedResults: [{ FileParseExitCode: '1', ParsedText: 'Project: Clear Test', ErrorMessage: null }], OCRExitCode: '1', IsErroredOnProcessing: false };
  await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 300; c.height = 120;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 300, 120);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'a.png', { type: 'image/png' }));
    const ev = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'clipboardData', { value: dt });
    document.dispatchEvent(ev);
  });
  await page.waitForTimeout(1000);
  await page.click('#imageScanClear');
  await page.waitForTimeout(200);
  const cleared = await page.evaluate(() => ({
    status: document.getElementById('imageScanStatus').textContent,
    previewHidden: document.getElementById('imageScanPreview').hidden
  }));
  console.log('After clear:', JSON.stringify(cleared));
  if (cleared.status !== '' || !cleared.previewHidden) throw new Error('清除後應回到初始狀態');

  await page.screenshot({ path: 'imagescan_check.png' }); // 供人工檢視（已列入 .gitignore）

  if (errors.length) {
    console.log('BROWSER ERRORS:', errors.slice(0, 5));
    throw new Error('Browser console errors: ' + errors[0]);
  }
  console.log('\nIMAGE SCAN E2E PASSED');
  await browser.close();
})().catch(e => { console.error('IMAGE SCAN E2E FAILED:', e.message); process.exit(1); });

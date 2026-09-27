// Unit tests for js/imageScan.js 的 OCR 文字解析（browser file run in node）。
const assert = require('assert');

global.window = global;
require('./js/imageScan.js');
const S = global.T1.imageScan;

assert(S && typeof S.parseFields === 'function', 'imageScan module exposed');
assert.strictEqual(S.apiKey, 'K87036576688957', 'OCR.Space api key');
assert.strictEqual(S.endpoint, 'https://api.ocr.space/parse/image', 'OCR.Space endpoint');

// --- 1. 標準 RFQ email 截圖（含地址換行） ---
const emailText = [
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
const r1 = S.parseFields(emailText);
console.log('1. email:', JSON.stringify(r1));
assert.deepStrictEqual(r1, {
  name: 'Tower B Curtain Wall',
  sales: 'Glen Tew',
  address: 'Lot 123, Jalan ABC, Taman XYZ, 50000 Kuala Lumpur',
  tenderer: 'XYZ Sdn Bhd',
  attn: 'Mr. Tan',
  tel: '03-1234 5678',
  email: 'tan@xyz.com.my',
  mobile: '012-345 6789',
  fax: '03-1234 5679'
}, 'standard RFQ email fields');

// --- 2. 全形冒號 / 空白分隔 / 值在下一行 / 大小寫 ---
const r2 = S.parseFields([
  'PROJECT：Marina Bay Tower',
  'SALES    Kelvin Tjia',
  'ATTN :',
  'Ms. Lim',
  'TEL NO: 07-5566 7788',
  'MOBILE PHONE 019-888 7777',
  'E-mail: lim@abc.com',
  'Fax No.: 07-5566 7789',
  'Address: 88 Jalan Merdeka',
  'Please contact us at 03-9999 0000' // 不應被當成欄位
].join('\n'));
console.log('2. variants:', JSON.stringify(r2));
assert.strictEqual(r2.name, 'Marina Bay Tower', 'fullwidth colon + project');
assert.strictEqual(r2.sales, 'Kelvin Tjia', 'whitespace separator + sales');
assert.strictEqual(r2.attn, 'Ms. Lim', 'value on next line');
assert.strictEqual(r2.tel, '07-5566 7788', 'TEL NO label');
assert.strictEqual(r2.mobile, '019-888 7777', 'MOBILE PHONE label');
assert.strictEqual(r2.email, 'lim@abc.com', 'E-mail label');
assert.strictEqual(r2.fax, '07-5566 7789', 'Fax No. label');
assert.strictEqual(r2.address, '88 Jalan Merdeka', 'address label');

// --- 3. Project Address 不可被當成 Project 名稱 ---
const r3 = S.parseFields('Project Address: 12 Jalan Satu\nProject: The Curve');
console.log('3. project address:', JSON.stringify(r3));
assert.strictEqual(r3.name, 'The Curve', 'Project Address 不應蓋掉 Project 名稱');
assert.strictEqual(r3.address, '12 Jalan Satu', 'Project Address → address');

// --- 4. Project No / Ref 不填入 Project 名稱 ---
const r4 = S.parseFields('Project No: RFQ-2026-001\nProject: Sunway Geo');
console.log('4. project no:', JSON.stringify(r4));
assert.strictEqual(r4.name, 'Sunway Geo', 'Project No 不應填進 name');

// --- 5. 中文標籤 ---
const r5 = S.parseFields(['案名：中央大樓帷幕', '業務：Bella', '地址：台北市信義路 100 號', '聯絡人：王先生', '電話：02-1234-5678', '手機：0912-345-678', '傳真：02-1234-5679'].join('\n'));
console.log('5. chinese:', JSON.stringify(r5));
assert.strictEqual(r5.name, '中央大樓帷幕', '中文案名');
assert.strictEqual(r5.sales, 'Bella', '中文業務');
assert.strictEqual(r5.address, '台北市信義路 100 號', '中文地址');
assert.strictEqual(r5.attn, '王先生', '中文聯絡人');
assert.strictEqual(r5.tel, '02-1234-5678', '中文電話');
assert.strictEqual(r5.mobile, '0912-345-678', '中文手機');
assert.strictEqual(r5.fax, '02-1234-5679', '中文傳真');

// --- 6. 沒有 Email 標籤時，用整段文字中的 email 備援 ---
const r6 = S.parseFields('From: Alice <alice@tender.com>\nProject: Alpha Tower\nTel: 03-1111 2222');
console.log('6. email fallback:', JSON.stringify(r6));
assert.strictEqual(r6.email, 'alice@tender.com', 'email 備援');
assert.strictEqual(r6.name, 'Alpha Tower', 'name 仍正確');

// --- 7. 同一欄位重複 → 取第一次；雜訊行不影響 ---
const r7 = S.parseFields(['Sales: Gerry Lee', 'Sales: Eugene Ng', 'Ironmongery Sign Off (4DWGS): DONE', 'http://example.com/x:y'].join('\n'));
console.log('7. duplicates:', JSON.stringify(r7));
assert.strictEqual(r7.sales, 'Gerry Lee', '重複標籤取第一次');
assert.strictEqual(r7.name, undefined, '雜訊行不應填入');

// --- 8. 空字串 / 無標籤文字 ---
assert.deepStrictEqual(S.parseFields(''), {}, 'empty text');
assert.deepStrictEqual(S.parseFields('Hello, please find attached the RFQ.'), {}, 'no labels');
assert.deepStrictEqual(S.parseFields(null), {}, 'null text');

// --- 9. labelToField 邊界 ---
assert.strictEqual(S.labelToField('Attn.'), 'attn');
assert.strictEqual(S.labelToField('TENDERER 2'), 'tenderer');
assert.strictEqual(S.labelToField('Mobile No'), 'mobile');
assert.strictEqual(S.labelToField('Contact Person'), 'attn');
assert.strictEqual(S.labelToField('Remarks'), null);
assert.strictEqual(S.labelToField(''), null);
assert.strictEqual(S.labelToField('Telephone'), 'tel');

// ===========================================================================
// PARTITION / DOOR / OW 的項目欄位（js/itemImageScan.js）
// 欄位標籤取自 app.js 的 extraFields，這裡用同一份定義（stub 成 window.T1.extraFields）。
// ===========================================================================
global.T1.extraFields = {
  PARTITION: [['legend','LEGEND'],['finishes','FRAME FINISHES'],['height','HEIGHT'],['verticalSection','VERTICAL SECTION'],['horizontalSection','HORIZONTAL SECTION'],['transom','TRANSOM'],['mullion','MULLION'],['glass1','GLASS 1'],['glass2','GLASS 2'],['squarePost','SQUARE POST'],['powerColumn','POWER COLUMN'],['sizePc','SIZE PC'],['remark','REMARK IF ANY']],
  DOOR: [['legend','LEGEND'],['finishes','FRAME FINISHES'],['height','HEIGHT'],['noOfLeaf','NO OF LEAF'],['doorFrame','DOOR FRAME'],['doorPanel','DOOR PANEL'],['transom','TRANSOM'],['mullion','MULLION'],['glass1','GLASS 1'],['glass2','GLASS 2'],['hardware','HARDWARE'],['lock','LOCK'],['doorCloser','DOOR CLOSER'],['hwFinishes','HW FINISHES'],['remark','REMARK IF ANY']],
  OPERABLE_WALL: [['legend','LEGEND (Manual)'],['finishes','FINISHES'],['height','HEIGHT'],['type','TYPE'],['operate','OPERATE'],['country','COUNTRY'],['hwFinishes','HW FINISHES'],['remark','REMARK IF ANY']]
};
require('./js/itemImageScan.js');
const I = global.T1.itemImageScan;
assert(I && typeof I.parseItemFields === 'function', 'itemImageScan module exposed');

// --- 10. PARTITION 規格截圖 ---
const partText = [
  'T1 SINGLE GLAZED PARTITION',
  'LEGEND: P-01 / T-108',
  'FRAME FINISHES: Powder Coat Black (Matt)',
  'HEIGHT: 3000mm',
  'VERTICAL SECTION: GF - 5',
  'HORIZONTAL SECTION: GF - A',
  'GLASS 1: 10mm Clear Tempered',
  'GLASS 2: 6.38mm Laminated',
  'SQUARE POST: SP - 2',
  'POWER COLUMN: PC - 1',
  'SIZE PC: 1200 x 3000',
  'REMARK IF ANY: Provide 2H transom'
].join('\n');
const i10 = I.parseItemFields(partText, 'PARTITION');
console.log('10. PARTITION:', JSON.stringify(i10));
assert.deepStrictEqual(i10, {
  legend: 'P-01 / T-108',
  finishes: 'Powder Coat Black (Matt)',
  height: '3000mm',
  verticalSection: 'GF - 5',
  horizontalSection: 'GF - A',
  glass1: '10mm Clear Tempered',
  glass2: '6.38mm Laminated',
  squarePost: 'SP - 2',
  powerColumn: 'PC - 1',
  sizePc: '1200 x 3000',
  remark: 'Provide 2H transom'
}, 'PARTITION 欄位');

// --- 11. DOOR 截圖（含縮寫標籤與冒號排版） ---
const doorText = [
  'DOOR SCHEDULE',
  'LEGEND  D-03',
  'FRAME FINISHES : Anodized Silver',
  'HEIGHT 2100mm',
  'NO OF LEAF: 1',
  'DOOR FRAME: SWING DF - A',
  'DOOR PANEL: SWING DP - A1',
  'HARDWARE: Dorma',
  'LOCK: Euro Profile',
  'DOOR CLOSER: TS68',
  'HW FINISHES: SSS',
  'REMARK: Self closing'
].join('\n');
const i11 = I.parseItemFields(doorText, 'DOOR');
console.log('11. DOOR:', JSON.stringify(i11));
assert.strictEqual(i11.legend, 'D-03', 'DOOR legend');
assert.strictEqual(i11.finishes, 'Anodized Silver', 'DOOR frame finishes');
assert.strictEqual(i11.height, '2100mm', 'DOOR height');
assert.strictEqual(i11.noOfLeaf, '1', 'DOOR leaf');
assert.strictEqual(i11.doorFrame, 'SWING DF - A', 'DOOR frame');
assert.strictEqual(i11.doorPanel, 'SWING DP - A1', 'DOOR panel');
assert.strictEqual(i11.hardware, 'Dorma', 'DOOR hardware');
assert.strictEqual(i11.lock, 'Euro Profile', 'DOOR lock');
assert.strictEqual(i11.doorCloser, 'TS68', 'DOOR closer');
assert.strictEqual(i11.hwFinishes, 'SSS', 'DOOR hw finishes');
assert.strictEqual(i11.remark, 'Self closing', 'DOOR remark');

// --- 12. OPERABLE WALL 截圖（LEGEND (Manual) 前綴比對） ---
const owText = [
  'E85 SERIES OPERABLE WALL',
  'LEGEND: OW-02',
  'FINISHES: Laminate Maple',
  'HEIGHT: 3600mm',
  'TYPE: E85 (Double Glazed)',
  'OPERATE: Centre Stack',
  'COUNTRY: Malaysia',
  'HW FINISHES: Black',
  'REMARK IF ANY: Include track'
].join('\n');
const i12 = I.parseItemFields(owText, 'OPERABLE_WALL');
console.log('12. OPERABLE_WALL:', JSON.stringify(i12));
assert.strictEqual(i12.legend, 'OW-02', 'OW legend（LEGEND (Manual) 前綴比對）');
assert.strictEqual(i12.finishes, 'Laminate Maple', 'OW finishes');
assert.strictEqual(i12.height, '3600mm', 'OW height');
assert.strictEqual(i12.type, 'E85 (Double Glazed)', 'OW type');
assert.strictEqual(i12.operate, 'Centre Stack', 'OW operate');
assert.strictEqual(i12.country, 'Malaysia', 'OW country');
assert.strictEqual(i12.hwFinishes, 'Black', 'OW hw finishes');
assert.strictEqual(i12.remark, 'Include track', 'OW remark');

// --- 13. 沒有可對應欄位 → 空物件（不應亂填） ---
assert.deepStrictEqual(I.parseItemFields('Hello, please find attached.', 'PARTITION'), {}, 'no item fields');
assert.deepStrictEqual(I.parseItemFields('', 'DOOR'), {}, 'empty text → no fields');

// --- 14. 別名（廠商寫法不同） ---
const i14 = I.parseItemFields(['GLASS: 12mm Clear', 'POST: SP-9', 'VS: GF - 9', 'NOTE: check site'].join('\n'), 'PARTITION');
console.log('14. aliases:', JSON.stringify(i14));
assert.strictEqual(i14.glass1, '12mm Clear', 'GLASS → glass1');
assert.strictEqual(i14.squarePost, 'SP-9', 'POST → squarePost');
assert.strictEqual(i14.verticalSection, 'GF - 9', 'VS → verticalSection');
assert.strictEqual(i14.remark, 'check site', 'NOTE → remark');

// --- 15. 真實 OCR 排版：規格表被讀成「標籤 值」只隔一個空白（最常見的失敗情境） ---
const tableText = [
  'T1 SINGLE GLAZED PARTITION (T-108)',
  'LEGEND P-01',
  'FRAME FINISHES Powder Coat Black (Matt)',
  'HEIGHT 3000mm',
  'VERTICAL SECTION GF - 5',
  'HORIZONTAL SECTION GF - A',
  'TRANSOM TS - 1',
  'MULLION MU - 1',
  'GLASS 1 10mm Clear Tempered',
  'GLASS 2 6.38mm Laminated',
  'SQUARE POST SP - 2',
  'POWER COLUMN PC - 1',
  'SIZE PC 1200 x 3000',
  'REMARK IF ANY Provide 2H transom'
].join('\n');
const i15 = I.parseItemFields(tableText, 'PARTITION');
console.log('15. table (single space):', JSON.stringify(i15));
assert.deepStrictEqual(i15, {
  legend: 'P-01',
  finishes: 'Powder Coat Black (Matt)',
  height: '3000mm',
  verticalSection: 'GF - 5',
  horizontalSection: 'GF - A',
  transom: 'TS - 1',
  mullion: 'MU - 1',
  glass1: '10mm Clear Tempered',
  glass2: '6.38mm Laminated',
  squarePost: 'SP - 2',
  powerColumn: 'PC - 1',
  sizePc: '1200 x 3000',
  remark: 'Provide 2H transom'
}, '單一空白的規格表要全部填入（GLASS 1 不可被切成 GLASS + 1 …）');

// --- 16. 標籤與值各佔一行 ---
const i16 = I.parseItemFields(['LEGEND', 'P-09', 'HEIGHT', '2400mm', 'REMARK IF ANY', 'Check site'].join('\n'), 'PARTITION');
console.log('16. label/value on separate lines:', JSON.stringify(i16));
assert.deepStrictEqual(i16, { legend: 'P-09', height: '2400mm', remark: 'Check site' }, '標籤單獨一行時取下一行當值');

// --- 17. 短橫線分隔 ---
const i17 = I.parseItemFields(['LEGEND - P-03', 'HEIGHT - 2700mm', 'GLASS 1 - 12mm Clear'].join('\n'), 'PARTITION');
console.log('17. dash separator:', JSON.stringify(i17));
assert.deepStrictEqual(i17, { legend: 'P-03', height: '2700mm', glass1: '12mm Clear' }, '標籤 - 值 的分隔要能去除多餘的橫線');

// --- 18. OCR 縮寫（VERT. / HORIZ. / FRAME FINISH） ---
const i18 = I.parseItemFields(['LEGEND: P-05', 'VERT. SECTION: GF - 9', 'HORIZ. SECTION: GF - J', 'FRAME FINISH: Anodized'].join('\n'), 'PARTITION');
console.log('18. OCR abbreviations:', JSON.stringify(i18));
assert.strictEqual(i18.verticalSection, 'GF - 9', 'VERT. SECTION');
assert.strictEqual(i18.horizontalSection, 'GF - J', 'HORIZ. SECTION');
assert.strictEqual(i18.finishes, 'Anodized', 'FRAME FINISH');

// --- 19. 中文標籤 ---
const i19 = I.parseItemFields(['圖例：P-07', '高度：3000mm', '表面處理：粉體塗裝', '玻璃1：10mm 強化玻璃', '備註：確認現場尺寸'].join('\n'), 'PARTITION');
console.log('19. chinese labels:', JSON.stringify(i19));
assert.strictEqual(i19.legend, 'P-07', '中文圖例');
assert.strictEqual(i19.height, '3000mm', '中文高度');
assert.strictEqual(i19.finishes, '粉體塗裝', '中文表面處理');
assert.strictEqual(i19.glass1, '10mm 強化玻璃', '中文玻璃1');
assert.strictEqual(i19.remark, '確認現場尺寸', '中文備註');

// --- 20. 值的行不應被誤認為標籤（沒有對應欄位時不亂填） ---
assert.deepStrictEqual(I.parseItemFields(['GF - 5', 'SP - 2', 'Powder Coat Black'].join('\n'), 'PARTITION'), {}, '純值的行不應被當成標籤');
// 23. New Project 也要能吃「標籤 值」只有一個空白的排版
const f20 = S.parseFields(['Project Marina Bay Tower', 'Sales Kelvin Tjia', 'Tel 07-5566 7788'].join('\n'));
console.log('20. New Project single space:', JSON.stringify(f20));
assert.strictEqual(f20.name, 'Marina Bay Tower', 'Project 單一空白');
assert.strictEqual(f20.sales, 'Kelvin Tjia', 'Sales 單一空白');
assert.strictEqual(f20.tel, '07-5566 7788', 'Tel 單一空白');

console.log('\nIMAGE SCAN UNIT TESTS PASSED');
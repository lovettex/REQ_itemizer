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

console.log('\nIMAGE SCAN UNIT TESTS PASSED');

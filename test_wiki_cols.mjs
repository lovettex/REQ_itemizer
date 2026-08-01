// Unit tests for RFQ Wiki Excel-copy/paste algorithm.
// Pure functions are mirrored from app.js so they can run without a browser.
import assert from 'node:assert/strict';

// --- mirrored from app.js ---
function _wikiColLetter(index) {
  var letters = '';
  index += 1;
  while (index > 0) {
    var rem = (index - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    index = Math.floor((index - 1) / 26);
  }
  return letters;
}
function _wikiColIndex(colStr) {
  var idx = 0;
  for (var i = 0; i < colStr.length; i++) idx = idx * 26 + (colStr.charCodeAt(i) - 64);
  return idx - 1;
}
function _wikiLegacyCol(n) {
  var q = Math.floor(n / 26);
  var r = n % 26;
  return String.fromCharCode(65 + q) + (r ? String.fromCharCode(65 + r) : '');
}
function _parseCellKey(key) {
  var m = key.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { key: key, colLetter: m[1], rowNum: parseInt(m[2], 10) };
}
// --- end mirrored ---

// 1. Column letter generation: A..Z then AA, AB, AC, ...
{
  const expected = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','AA','AB','AC','AD','AE','AF','AG'];
  const got = expected.map((_, i) => _wikiColLetter(i));
  assert.deepEqual(got, expected, 'col letter sequence');
  // round-trip index
  expected.forEach((col, i) => assert.equal(_wikiColIndex(col), i, `index of ${col}`));
}

// 2. Legacy vs correct divergence — the old bug produced A, AB, AC...
{
  assert.equal(_wikiLegacyCol(0), 'A');
  assert.equal(_wikiLegacyCol(1), 'AB'); // legacy wrong — should be B
  assert.equal(_wikiLegacyCol(2), 'AC');
  assert.equal(_wikiLegacyCol(25), 'AZ');
  assert.equal(_wikiLegacyCol(26), 'B');  // legacy single letter at index 26 — must NOT be migrated
  assert.equal(_wikiLegacyCol(27), 'BB');
  // Migration map (same loop as app.js)
  const _colFix = {};
  for (let _cf = 0; _cf < 200; _cf++) {
    const _lg = _wikiLegacyCol(_cf);
    if (_lg.length > 1) _colFix[_lg] = _wikiColLetter(_cf);
  }
  assert.equal(_colFix['AB'], 'B');
  assert.equal(_colFix['AC'], 'C');
  assert.equal(_colFix['AZ'], 'Z');
  assert.equal(_colFix['BB'], 'AB');
  assert.equal(_colFix['B'], undefined, 'single-letter legacy B must NOT be migrated');
  assert.equal(_colFix['AA'], undefined, 'AA never existed in legacy sequence');
}

// 3. Legacy data migration: old manual keys AB1/AC1 → B1/C1; pasted A1 stays
{
  const cells = { A1: 'kept', AB1: 'y', AC1: 'z', AA1: 'w' };
  const _colFix = {};
  for (let _cf = 0; _cf < 200; _cf++) {
    const _lg = _wikiLegacyCol(_cf);
    if (_lg.length > 1) _colFix[_lg] = _wikiColLetter(_cf);
  }
  const migrated = {};
  for (const k of Object.keys(cells)) {
    const m = k.match(/^([A-Z]+)(\d+)$/);
    const fix = (m && _colFix[m[1]]) ? _colFix[m[1]] + m[2] : null;
    if (fix) migrated[fix] = cells[k];
    else migrated[k] = cells[k];
  }
  assert.deepEqual(migrated, { A1: 'kept', B1: 'y', C1: 'z', AA1: 'w' });
}

// 4. Excel TSV paste (3 cols × 4 rows) from A1 → correct cell keys
{
  const tsv = 'H1\tW1\tD1\nH2\tW2\tD2\nH3\tW3\tD3\nH4\tW4\tD4';
  const allRows = tsv.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').map(l => l.split('\t'));
  assert.equal(allRows.length, 4);
  assert.deepEqual(allRows[0], ['H1','W1','D1']);

  const entry = { cells: { BOQ: {} } };
  const startParsed = _parseCellKey('A1');
  const startColIdx = _wikiColIndex(startParsed.colLetter);
  const startRow = startParsed.rowNum;
  let maxCols = 1;
  for (let ri = 0; ri < allRows.length; ri++) {
    const cols = allRows[ri];
    if (cols.length > maxCols) maxCols = cols.length;
    for (let ci = 0; ci < cols.length; ci++) {
      entry.cells.BOQ[_wikiColLetter(startColIdx + ci) + (startRow + ri)] = cols[ci];
    }
  }
  assert.equal(entry.cells.BOQ['A1'], 'H1');
  assert.equal(entry.cells.BOQ['B1'], 'W1');
  assert.equal(entry.cells.BOQ['C1'], 'D1');
  assert.equal(entry.cells.BOQ['C4'], 'D4');
  assert.equal(Object.keys(entry.cells.BOQ).length, 12);
  assert.equal(maxCols, 3);

  // rendered column count must cover C → at least 3, default min 5
  let maxIdx = -1;
  for (const k of Object.keys(entry.cells.BOQ)) maxIdx = Math.max(maxIdx, _wikiColIndex(k.replace(/[0-9]/g,'')));
  assert.equal(Math.max(maxIdx + 1, 5), 5, 'min 5 columns when data fits in 3');
}

// 5. Paste beyond 26 columns (AA...) keeps alignment
{
  const cols27 = Array.from({length: 27}, (_, i) => `v${i + 1}`).join('\t');
  const allRows = [cols27.split('\t')];
  const entry = { cells: { BOQ: {} } };
  const startColIdx = 0, startRow = 1;
  for (let ci = 0; ci < allRows[0].length; ci++) {
    entry.cells.BOQ[_wikiColLetter(startColIdx + ci) + startRow] = allRows[0][ci];
  }
  assert.equal(entry.cells.BOQ['A1'], 'v1');
  assert.equal(entry.cells.BOQ['Z1'], 'v26');
  assert.equal(entry.cells.BOQ['AA1'], 'v27');
}

// 6. Copy direction: selection bounding box → TSV + HTML rows
{
  const cells = { A1: 'a', B1: 'b', A2: 'c', B2: 'd' };
  const colLetters = ['A','B'];
  const sel = [{colLetter:'A',rowNum:1},{colLetter:'B',rowNum:1},{colLetter:'A',rowNum:2},{colLetter:'B',rowNum:2}];
  let minCi = Infinity, maxCi = -1, minRow = Infinity, maxRow = -1;
  for (const s of sel) {
    const ci = colLetters.indexOf(s.colLetter);
    minCi = Math.min(minCi, ci); maxCi = Math.max(maxCi, ci);
    minRow = Math.min(minRow, s.rowNum); maxRow = Math.max(maxRow, s.rowNum);
  }
  const tsvRows = [];
  for (let r = minRow; r <= maxRow; r++) {
    const row = [];
    for (let c = minCi; c <= maxCi; c++) row.push(cells[colLetters[c] + r] || '');
    tsvRows.push(row.join('\t'));
  }
  assert.equal(tsvRows.join('\r\n'), 'a\tb\nc\td'.replace(/\n/g,'\r\n'));
}

console.log('ALL WIKI COLUMN / EXCEL COPY-PASTE TESTS PASSED');

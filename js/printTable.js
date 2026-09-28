/* printTable.js — 把資料以「表格」列印／輸出 PDF（瀏覽器列印 → 另存為 PDF）
 *
 * 用法：
 *   window.T1.printTable.open({
 *     title: 'WORK LOG', subtitle: '專案名稱',
 *     meta: ['Project: …', 'Sales: …'],
 *     columns: ['#','SUMMARY','QTN','NOTE','DATE','STATUS'],
 *     rows: [['1','A2VO3','QTN-1','備註','2026-09-27','confirmed']]
 *   });
 *
 * 作法：把表格寫進 #printArea，加上 body.printing，接著呼叫 window.print()；
 * 列印樣式（styles.css 的 @media print）只顯示 #printArea，其餘畫面全部隱藏。
 * 不需要任何外部函式庫，使用者在列印對話框選「另存為 PDF」即可得到 PDF 表格。
 */
(function () {
  'use strict';

  window.T1 = window.T1 || {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function area() {
    var el = document.getElementById('printArea');
    if (!el) {
      el = document.createElement('div');
      el.id = 'printArea';
      document.body.appendChild(el);
    }
    return el;
  }

  /** 產生列印用 HTML（供測試直接檢查內容） */
  function buildHtml(o) {
    var opts = o || {};
    var cols = opts.columns || [];
    var rows = opts.rows || [];
    var head = '<tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>';
    var body = rows.length
      ? rows.map(function (r) {
          return '<tr>' + cols.map(function (_, i) {
            var v = r[i];
            return '<td>' + (v === null || v === undefined || v === '' ? '—' : esc(v)) + '</td>';
          }).join('') + '</tr>';
        }).join('')
      : '<tr><td class="print-empty" colspan="' + cols.length + '">（尚無資料）</td></tr>';
    var meta = (opts.meta || []).filter(Boolean);
    return '<div class="print-page">' +
      '<div class="print-head">' +
        '<h1>' + esc(opts.title || '') + '</h1>' +
        (opts.subtitle ? '<div class="print-sub">' + esc(opts.subtitle) + '</div>' : '') +
        (meta.length ? '<div class="print-meta">' + meta.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</div>' : '') +
      '</div>' +
      '<table class="print-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' +
      '<div class="print-foot">列印時間：' + esc(new Date().toLocaleString()) + '</div>' +
    '</div>';
  }

  function open(o) {
    if (typeof document === 'undefined') return false;
    var el = area();
    el.innerHTML = buildHtml(o);
    document.body.classList.add('printing');
    var cleanup = function () {
      document.body.classList.remove('printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    // 讓瀏覽器先完成版面，再開列印對話框（使用者可選「另存為 PDF」）
    setTimeout(function () {
      try { window.print(); } catch (e) { cleanup(); }
    }, 60);
    return true;
  }

  window.T1.printTable = { open: open, buildHtml: buildHtml };
})();

/**
 * emailTemplate.js — Build the "New RFQ" email subject and HTML body.
 *
 * Pure builder (no side effects). Used by the RFQ creation flow after a
 * successful Firestore write.
 */

(function (global) {
  'use strict';

  // Placeholder — replace with the real GitHub Pages URL when known
  var VIEW_RFQ_URL = 'https://your-github-pages-url';

  function escHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /**
   * Build the email subject.
   * @param {string} rfqNumber
   * @returns {string} e.g. "New RFQ - P-001"
   */
  function buildEmailSubject(rfqNumber) {
    return 'New RFQ - ' + (rfqNumber || '');
  }

  /**
   * Build the email HTML body.
   * @param {Object} data
   * @param {string} data.rfqNumber     - RFQ Number (project name)
   * @param {string} data.customer      - Customer (Tenderer 1)
   * @param {string} data.project       - Project name
   * @param {string} data.quotationDate - Quotation date
   * @param {string} data.createdBy     - Created By (logged-in user email)
   * @param {number} data.totalItems    - Total items count
   * @returns {string} HTML string
   */
  function buildEmailHtml(data) {
    var d = data || {};
    var rows = [
      ['RFQ Number', d.rfqNumber],
      ['Customer', d.customer],
      ['Project', d.project],
      ['Quotation Date', d.quotationDate],
      ['Created By', d.createdBy],
      ['Total Items', d.totalItems]
    ];

    var tableRows = rows.map(function (row) {
      return '<tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f2;color:#53606d;font-weight:700;white-space:nowrap;">' +
        escHtml(row[0]) +
        '</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f2;color:#17202a;">' +
        escHtml(row[1]) +
        '</td></tr>';
    }).join('');

    return [
      '<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e9ee;border-radius:10px;overflow:hidden;">',
      // Company Logo (placeholder)
      '<div style="padding:18px 24px;background:#182532;text-align:center;">',
      '<img src="" alt="Company Logo" style="max-height:44px;" />',
      '</div>',
      '<div style="padding:24px;">',
      '<h1 style="margin:0 0 16px;font-size:20px;color:#17202a;">New RFQ</h1>',
      '<table style="width:100%;border-collapse:collapse;font-size:13px;">' + tableRows + '</table>',
      '<div style="margin-top:22px;text-align:center;">',
      '<a href="' + escHtml(VIEW_RFQ_URL) + '" style="display:inline-block;background:#0d5932;color:#ffffff;text-decoration:none;padding:11px 26px;border-radius:6px;font-size:13px;font-weight:700;">View RFQ</a>',
      '</div>',
      '<p style="margin:20px 0 0;font-size:11px;color:#7a8896;text-align:center;">This is an automated notification from RFQ Itemizer.</p>',
      '</div>',
      '</div>'
    ].join('');
  }

  // Build a simple HTML wrapper for a plain-text mail content (Mail Request).
  // Newlines are preserved and content is escaped.
  function buildMailRequestHtml(content) {
    return '<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e9ee;border-radius:10px;padding:22px 26px;">' +
      '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;color:#17202a;margin:0;line-height:1.6;">' + escHtml(content) + '</pre>' +
      '</div>';
  }

  global.T1 = global.T1 || {};
  global.T1.emailTemplate = {
    buildEmailSubject: buildEmailSubject,
    buildEmailHtml: buildEmailHtml,
    buildMailRequestHtml: buildMailRequestHtml
  };
})(window);

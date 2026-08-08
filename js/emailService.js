/**
 * emailService.js — Send transactional emails via the existing Cloudflare Worker.
 *
 * Constraint: must call the existing worker endpoint only (never Resend directly,
 * never expose API keys in the frontend).
 *
 * Worker endpoint:
 *   https://rfq-email-worker.bubibubibae.workers.dev
 * POST body:
 *   { "to": "example@gmail.com", "subject": "...", "html": "<h1>Hello</h1>" }
 */

(function (global) {
  'use strict';

  var EMAIL_WORKER_URL = 'https://rfq-email-worker.bubibubibae.workers.dev';
  var TIMEOUT_MS = 10000; // 10s request timeout

  /**
   * Send an email through the Cloudflare Worker.
   *
   * @param {Object} params
   * @param {string} params.to          - recipient email address
   * @param {string} params.subject     - email subject
   * @param {string} params.html        - HTML body
   * @param {Array}  [params.attachments] - [{ filename, content(base64) }] — 附加檔案
   * @returns {Promise<boolean>} true on success, false on any failure
   */
  async function sendEmail(params) {
    var to = params && params.to;
    var subject = params && params.subject;
    var html = params && params.html;
    var attachments = params && params.attachments;

    // Basic guard: missing recipient/subject is a failure (do not throw)
    if (!to || !subject || !html) {
      console.error('[emailService] sendEmail skipped: missing to/subject/html');
      return false;
    }

    var controller = null;
    var timer = null;
    try {
      controller = new AbortController();
      timer = setTimeout(function () {
        controller.abort(); // timeout
      }, TIMEOUT_MS);

      var body = { to: to, subject: subject, html: html };
      if (Array.isArray(attachments) && attachments.length) body.attachments = attachments;

      var response = await fetch(EMAIL_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        console.error('[emailService] sendEmail HTTP error:', response.status, response.statusText);
        return false;
      }

      // Parse JSON body; non-JSON response counts as a failure
      var data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[emailService] sendEmail JSON parse error:', parseError.message);
        return false;
      }

      // Worker returns an object — treat a truthy response as success
      return true;
    } catch (networkError) {
      console.error('[emailService] sendEmail network/request error:', networkError && networkError.message ? networkError.message : networkError);
      return false;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // Expose on window.T1 (namespace kept consistent with the rest of the app)
  global.T1 = global.T1 || {};
  global.T1.emailService = {
    sendEmail: sendEmail,
    workerUrl: EMAIL_WORKER_URL
  };
})(window);

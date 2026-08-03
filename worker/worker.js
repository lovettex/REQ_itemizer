/**
 * Cloudflare Worker — RFQ Email sender via Resend API.
 *
 * Endpoint contract (used by js/emailService.js on the frontend):
 *   POST https://<worker-name>.<account>.workers.dev
 *   Content-Type: application/json
 *   Body: { "to": "example@gmail.com", "subject": "...", "html": "<h1>...</h1>" }
 *
 * Environment variables (set in Cloudflare dashboard / wrangler):
 *   RESEND_API_KEY - Resend API key (never expose in frontend)
 *   FROM_EMAIL     - sender address, e.g. "RFQ Itemizer <rfq@yourdomain.com>"
 */
export default {
  async fetch(request, env) {
    // Only POST is supported
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: cors() });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return json({ ok: false, error: 'Invalid JSON body' }, 400);
    }

    const to = payload && payload.to;
    const subject = payload && payload.subject;
    const html = payload && payload.html;

    if (!to || !subject || !html) {
      return json({ ok: false, error: 'Missing to / subject / html' }, 400);
    }
    if (!env.RESEND_API_KEY) {
      return json({ ok: false, error: 'RESEND_API_KEY not configured' }, 500);
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + env.RESEND_API_KEY
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL || 'RFQ Itemizer <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html
        })
      });

      const text = await res.text();
      if (!res.ok) {
        console.error('[worker] Resend error', res.status, text);
        return json({ ok: false, error: 'Resend rejected: ' + res.status }, 502);
      }
      return json({ ok: true, id: text }, 200);
    } catch (err) {
      console.error('[worker] Resend request failed', err && err.message ? err.message : err);
      return json({ ok: false, error: 'Resend request failed' }, 502);
    }
  }
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cors())
  });
}

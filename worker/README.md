# Cloudflare Worker — RFQ Email sender (Resend)

Deploy this worker to Cloudflare, then the existing frontend
`js/emailService.js` can send emails through it.

## Deploy (wrangler)

```bash
cd worker
npm i -g wrangler          # if not installed
wrangler login
wrangler deploy worker.js --name rfq-email-worker
```

Then set environment variables (secrets):

```bash
wrangler secret put RESEND_API_KEY        # Resend API key (https://resend.com/api-keys)
wrangler secret put FROM_EMAIL            # e.g. "RFQ Itemizer <rfq@yourdomain.com>"
```

Or set them in the Cloudflare Dashboard:
Workers → rfq-email-worker → Settings → Variables and Secrets.

## Verify

```bash
curl -X POST https://rfq-email-worker.<your-account>.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"to":"you@example.com","subject":"Test","html":"<p>hello</p>"}'
```

Expect `{"ok":true,"id":"..."}` and the email should arrive.

## Note

The endpoint contract matches what the frontend already calls:
`POST { to, subject, html }` — no frontend change is required once the
worker is live at the URL configured in `js/emailService.js`.

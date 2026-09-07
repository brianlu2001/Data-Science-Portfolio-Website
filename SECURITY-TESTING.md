# Test the secured website locally

Run `npm run dev`, then open http://127.0.0.1:5173/admin.

Your random **local-only password** is in `.local/LOGIN.md` (or the password field in `.local/credentials.json`). These files are excluded from Git and deployment. The local server binds to loopback.

Historical analytics can be copied explicitly with `node --env-file=.env.local scripts/snapshot-analytics.mjs`, then restarting the local server. The exporter uses a read-only transaction and excludes IP addresses and user agents. The local server imports the ignored snapshot idempotently; local events remain separate. The default analytics filter shows only the last 30 days; choose a longer window to see older visits. Historical events are preserved by the maintenance script.

The local PostgreSQL database and uploaded files are in `.local/`. Your existing public portfolio data was copied there for this session. Editing or deleting a local project does not modify the live database. A fresh checkout without that copy starts with a sample project.

## Manual checks

1. Open Admin while logged out. Confirm that a password is required.
2. Try an incorrect password, then the local password. Confirm successful access with the correct one.
3. Add a temporary project, edit it, reorder it, and delete it.
4. Update the local bio or a project title; refresh and confirm the change persists locally.
5. Upload a small PNG/JPEG/GIF/WebP. It should become a WebP. Try an HTML file renamed to .png; it should be rejected. PDFs/DOCX are accepted up to 4 MB; legacy DOC and SVG uploads are rejected.
6. Log out. Return to Admin and confirm that the password prompt returns.
7. View existing PDF/HTML reports and check the expected content and interactions. HTML reports cannot access the parent page's authenticated context.

Local AI rewriting intentionally returns “not configured”; it cannot spend production OpenAI credits. Local report uploads are saved locally and immediately usable by their returned URL, but the existing report selector lists the static manifest rather than every local upload.

## Automated checks

```text
npm run check:backend
npm run test:security
npm audit
npm run build
```

The regression suite starts its own temporary PostgreSQL database and HTTP server. It tests expired/revoked cookies, anonymous mutations, oversized requests, upload spoofing, invalid inputs, origin checks and concurrent login throttling. It neither connects to production nor calls a paid provider.

Ten bad login attempts within 15 minutes trigger throttling. Use the isolated automated suite to test this without locking yourself out of the manual test session. Restarting the local server preserves its database, sessions and counters.

## Before production

## Verify each production release

Confirm the custom domain points to the intended commit, then use the deployed browser UI:

1. Start logged out on the homepage and click Admin. Confirm `/admin` displays the password form. Check the legacy `/api/auth?action=login` link redirects there too.
2. Sign in, open Analytics and Site Settings, change the analytics window, and refresh. Logout and confirm returning to Admin requires authentication.
3. Open a project through its card, then test Back to Portfolio. Check an external Blob PDF and a local HTML report, including Open in New Tab. An inaccessible cross-origin document DOM does not mean the PDF failed to load.
4. Check errors explicitly: throttled/unavailable login must not say the password is wrong; an analytics error must not appear as zero traffic.
5. Recheck the image/report URLs referenced by the live project data. Keep project edits, deletion, and upload acceptance tests in the isolated environment unless a temporary production test has been deliberately chosen and will be cleaned up.

## Production prerequisites

Follow the outstanding deployment and credential actions in SECURITY-AUDIT.md. The database setup script and production environment requirements are documented there. Do not put local credentials into production.

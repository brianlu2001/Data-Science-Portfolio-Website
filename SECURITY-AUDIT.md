# Security remediation — September 7, 2026

The repository-level findings from the initial audit have been addressed. This does **not** certify production security: issuer-side revocation of historical credentials, repository-history cleanup, production configuration, and deployment verification remain separate actions.

## Implemented

| Initial finding | Change |
| --- | --- |
| Express authentication bypass | Both server entry points now use the same API handlers and administrator authorization. The Replit general-user login and permissive upload routes are retired. |
| Non-expiring HMAC cookies | Random 256-bit opaque sessions, hashed in PostgreSQL, expire after eight hours or 30 minutes idle. Logout deletes the session. Password/signing-secret changes invalidate matching sessions. Legacy tokens are rejected. |
| Anonymous paid AI endpoint | Admin authentication, bounded input, 20 requests/hour and 100/day shared quotas, timeout and no automatic retry. |
| Login brute force | PostgreSQL-backed atomic limits: 10 attempts/source/15 minutes and 50 total/15 minutes. These limits operate across serverless instances. |
| DB connection leaks | Authorization precedes database access; bounded reused pool, transaction rollback and release in finally. Request-driven ALTER TABLE and sequence resets removed. |
| Unsafe uploads | Authenticate first; one file, 4 MB bound; extension/MIME/content signature agreement. Images are decoded and re-encoded as WebP with pixel limits. Only PDF/DOCX documents are accepted. Random names and unconditional temporary-directory cleanup. |
| Public/expensive analytics | Summary requires admin; maximum 366-day range; validated events; shared ingestion limits; new events omit IP/user-agent data. Retention maintenance script supplied. |
| Credentialed wildcard CORS | Removed; state-changing browser requests validate trusted origins. Logout uses POST. Private API responses use no-store. |
| Raw provider errors / malformed input | Shared validation and safe errors, malformed-cookie rejection, no exception rethrow after responding. |
| Committed session credentials | Session/user rows removed from current dump. SQL credential scan in CI and local/environment exclusions added. Old commits are not erased by this change. |
| Vulnerable dependencies | Patched direct/transitive packages; unused Vercel deployment and Replit development tooling removed. Final npm audit: zero findings. |
| Missing checks | Dedicated backend typecheck covers production handlers, security regression suite, GitHub Actions, Dependabot. |
| Active HTML reports | Non-PDF embeds sandboxed; report responses receive sandbox CSP. Baseline content-type, frame, referrer, permissions and CSP headers configured. |

Sessions and counters use the existing `sessions(sid,sess,expire)` table with separate key prefixes. Counters store hashed source identifiers, expire, and receive bounded cleanup. A database failure fails authentication closed. Rate limiting helps with abuse but does not replace platform-level DDoS protection.

The local app now uses embedded PostgreSQL (PGlite) and the same API handlers. Local data, files, and credentials are isolated in ignored `.local/`. OpenAI and Blob credentials are explicitly removed from the local runner; local AI rewriting reports that it is not configured.

## Verified

- `npm run check:backend`: passed.
- `npm run test:security`: 11 tests passed. Covers every admin endpoint anonymously, malformed cookies, origin rejection, normal CRUD, client schema compatibility, related-record deletion, upload spoofing and valid image re-encoding, analytics, logout replay, expiry, credential changes, legacy tokens, and concurrent throttling.
- `npm audit`: zero vulnerabilities across the resolved dependency tree.
- `npm run build`: passed. Existing large frontend bundle warning remains.
- Browser verified: the local portfolio renders; login opens the dashboard; logout removes access; returning to Admin requires the password again. A project submitted through the real admin form was created successfully in the isolated database.
- A read-only check of the configured Neon database confirmed the expected sessions columns (sid, JSONB sess, expire) and projects.status. No production schema or data changes were made.

The repository-wide frontend typecheck had existing unrelated type errors before this work (including Header, ContactSection and legacy storage types). The security-specific backend check is separate and passes; this is not a claim that the original `npm run check` passes.

## Production actions still required

1. **Revoke the historical Replit refresh/access token at the issuer.** The dump's session expired in July 2025, but refresh-token revocation has not been verified. The replacement application no longer accepts that login path. No issuer credentials or authenticated account-management connector were available for revocation.
2. **Coordinate Git history cleanup.** A normal branch push removes credentials from the latest file, not old commits, forks, or copies. Do not force-push rewritten history until collaborators and affected branches are accounted for.
3. **Database hardening completed September 7.** Applied `migrations/security.sql`; created `portfolio_runtime` with data and sequence access only. Verified it cannot create objects in public. Production Vercel DATABASE_URL now uses that role. Removed the one legacy application session and anonymized old analytics without deleting events: 6,285 views and 358 clicks retained at migration time. Issuer-side revocation remains separate.
4. **Production credentials rotated September 7.** Replaced the weak administrator password with a random 32-character password and rotated the session secret. Values are stored in Vercel; the user's new password is in ignored `.local/PRODUCTION-LOGIN.md`. The existing Vercel variables were shared across Production/Preview/Development, and updating them rotated those shared values. Canonical luki90.com origins and Vercel deployment origins are allowed; additional trusted origins use APP_ORIGINS.
5. **Complete production operational checks.** Verify HTTPS/Secure cookies, platform MFA/WAF settings, Blob privileges, backups/restores, dependency alerts and monitoring. The maintenance script now removes visitor identifiers and expired sessions while preserving historical event counts.
6. **Verify actual deployed functions before promoting.** Local tests do not prove Vercel's deployed imports, credentials, headers or data privileges. Upload validation is not antivirus scanning; documents are restricted to administrator uploads and isolated storage, but organizations requiring document malware scanning need a scanner integration.

Pushing this branch is not a claim that these account-level actions are complete or that production has been promoted.

## References

The controls are informed by [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), especially [session management](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x16-V7-Session-Management.md). Vercel source-IP handling follows its [request header documentation](https://vercel.com/docs/headers/request-headers). No full ASVS compliance certification is claimed.

# Release Checklist

## Pre-deploy
```bash
npm run typecheck && npm run check:architecture
```
- [ ] Both PASS

## Allowlist counts (must match)
| Allowlist | Expected |
|-----------|----------|
| Auth (Check X) | 1 |
| Plan branch | 6 |
| feature_flags | 0 |

## E2E smoke
```bash
npm run test:e2e
```
- [ ] Dashboard + Billing smoke PASS

## Deploy
- [ ] Push to main / Vercel build succeeds
- [ ] Production URLs respond

## Post-deploy
- [ ] Login works
- [ ] Dashboard loads
- [ ] Interview page accessible

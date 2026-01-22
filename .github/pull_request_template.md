# Pull Request

## What changed?
<!-- Brief description of changes -->

## Which shell?
- [ ] Info (public pages)
- [ ] Dashboard (org context)
- [ ] Account (user context)
- [ ] Admin (site_admin)
- [ ] N/A (docs/config only)

## Boundaries check
- [ ] No new Auth exceptions (Check X)
- [ ] No new plan/feature_flags exceptions (Check 10-12)
- [ ] Allowlist counts unchanged (Check 14)

> If any exception added, explain why:

## Commands run (Gate v1)
- [ ] `npm run typecheck` PASS
- [ ] `npm run build` PASS
- [ ] `npm run check:api-auth` PASS (error 0)
- [ ] `npm run check:origin-safety` PASS
- [ ] `npm run check:architecture` PASS

## Manual smoke (if applicable)
- [ ] Dashboard → Interview
- [ ] Dashboard → Embed
- [ ] Dashboard → Billing

## Notes
<!-- Any additional context -->

# Solo Ops Runbook

> Actionable checklists for solo maintainability.
> Last updated: 2024-12-29 (Phase 21)

---

## 1. When CI Fails

### Check X (Auth direct calls)
```bash
npm run check:architecture 2>&1 | grep -A5 "Check X"
```
- **If FAIL**: New Auth direct call detected outside allowlist
- **Fix**: Use Core wrapper from `@/lib/core/auth-state` or `@/lib/core/auth-state.client`
- **Ref**: [Auth Wrapper Usage](auth/auth-wrapper-usage.md)

### Check 10 (Plan branch)
- **If FAIL**: `plan === 'xxx'` detected outside allowlist
- **Fix**: Use `featureGate.getEffectiveFeatures` + `getFeatureEnabled`

### Check 11 (feature_flags)
- **If FAIL**: Direct `feature_flags[...]` or `.feature_flags` access
- **Fix**: Use `@/lib/featureGate` exclusively

### Check 12 (FeatureLocked)
- **If FAIL**: Local FeatureLocked component definition
- **Fix**: Import from `@/components/feature/FeatureLocked`

### Check 14 (Allowlist increase)
- **If FAIL**: Allowlist entry count increased
- **Fix**: Either remove the new entry OR update BASELINE in `scripts/check-architecture.sh`
- **Important**: Increasing allowlists is discouraged

---

## 2. When Auth Issues Happen

### Quick Reference
| Situation | Wrapper |
|-----------|---------|
| Server: Get user (optional) | `getUserWithClient(supabase)` |
| Server: Get user (required) | `requireUserWithClient(supabase)` |
| Server: Need metadata | `getUserFullWithClient(supabase)` |
| Client: Get user | `getCurrentUserClient()` |
| Client: Sign out | `signOutClient()` |

### Full Guide
[docs/auth/auth-wrapper-usage.md](auth/auth-wrapper-usage.md)

### Allowlist (middleware only)
[docs/auth/auth-direct-calls-allowlist.md](auth/auth-direct-calls-allowlist.md)

---

## 3. When Plan/Feature/Quota Issues Happen

### Source of Truth
| Concern | Source |
|---------|--------|
| Feature enabled? | `@/lib/featureGate` |
| Plan definition | `@/config/plans.ts` |
| Runtime quota check | `canExecute` RPC in DB |
| UI hints | `PLAN_LIMITS` (display only, NOT enforcement) |

### Golden Rule
> UI shows hints. Server enforces. Never block in UI alone.

---

## 4. Allowlist review_by Warnings

When Check 14 shows expired entries:

### Option A: Extend
1. Edit the allowlist doc (e.g., `docs/auth/auth-direct-calls-allowlist.md`)
2. Update `review_by` to a future date (e.g., `"2026-12-31"`)
3. Commit with reason in message

### Option B: Remove (preferred)
1. Refactor code to use proper pattern (Core wrapper / featureGate)
2. Remove entry from allowlist doc
3. Update BASELINE in `scripts/check-architecture.sh` if needed
4. Commit

---

## 5. Quick Links

| Doc | Purpose |
|-----|---------|
| [boundaries.md](architecture/boundaries.md) | What goes where (Shell/Auth/Feature) |
| [review-gates.md](architecture/review-gates.md) | PR review rules |
| [exceptions-allowlist.md](architecture/exceptions-allowlist.md) | Plan/feature_flags exceptions |
| [auth-direct-calls-allowlist.md](auth/auth-direct-calls-allowlist.md) | Auth exceptions |
| [auth-wrapper-usage.md](auth/auth-wrapper-usage.md) | How to use Core wrappers |

---

## 6. Common Commands

```bash
# Type check
npm run typecheck

# Architecture check
npm run check:architecture

# Both
npm run typecheck && npm run check:architecture

# E2E smoke
npm run test:e2e

# Full build
npm run build
```

---

## 7. Emergency Fixes

### "I need to add an Auth exception"
1. Try Core wrapper first (90% of cases work)
2. If truly impossible: add to allowlist with `reason`, `remove_when`, `review_by`
3. Update BASELINE in `scripts/check-architecture.sh`
4. This should be RARE

### "I need to check plan name directly"
1. Try `getFeatureEnabled(features, 'key')` first
2. If for display only (badge styling), may be allowed
3. Add to `docs/architecture/exceptions-allowlist.md` with justification
4. This should be RARE

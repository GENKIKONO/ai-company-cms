# Deployment Rollback Procedures

## Release Information

**Current Release**: `v1.1.0-recomposed-design`
**Deployment Date**: October 11, 2025
**Production URL**: https://aiohub.jp
**Commit SHA**: `aadb8d1`

## Quick Rollback Commands

### Emergency Rollback (if needed)

```bash
# 1. Checkout previous stable commit
git checkout HEAD~1

# 2. Force push to main (emergency only)
git push origin main --force

# 3. Verify Vercel deployment trigger
# Check https://vercel.com/dashboard for deployment status
```

### Controlled Rollback Process

```bash
# 1. Identify previous stable tag
git tag -l | sort -V | tail -5

# 2. Create rollback branch
git checkout -b rollback/flat-design-revert
git revert 7e7f5b1

# 3. Test rollback locally
npm run build
npm run test

# 4. Deploy rollback
git push origin rollback/flat-design-revert
# Create PR and merge after approval
```

## Vercel-Specific Rollback

### Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select AIO Hub project
3. Navigate to "Deployments" tab
4. Find previous successful deployment
5. Click "..." → "Promote to Production"

### Via Vercel CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## Health Checks After Rollback

### Automated Verification

```bash
# Run health check script
npm run health-check

# Run visual regression tests
npx playwright test tests/visual/ --config=playwright.visual.config.ts

# Verify core functionality
npm run test:e2e
```

### Manual Verification Checklist

- [ ] Homepage loads correctly (https://aiohub.jp)
- [ ] AIO page functions properly (https://aiohub.jp/aio)
- [ ] Hearing service page accessible (https://aiohub.jp/hearing-service)
- [ ] Pricing tables display correctly
- [ ] Mobile responsiveness working
- [ ] Authentication flow operational
- [ ] Database connections stable

## Monitoring After Rollback

### Key Metrics to Watch

1. **Performance Metrics**
   - Page load times < 3 seconds
   - Core Web Vitals in green zone
   - Lighthouse scores maintained

2. **Error Rates**
   - 4xx errors < 1%
   - 5xx errors < 0.1%
   - JavaScript errors minimal

3. **User Experience**
   - Bounce rate stable
   - Conversion funnel intact
   - User feedback monitoring

### Alert Thresholds

```yaml
Critical Alerts:
  - Error rate > 5%
  - Page load time > 10 seconds
  - Site completely inaccessible

Warning Alerts:
  - Error rate > 1%
  - Page load time > 5 seconds
  - Performance score drop > 20 points
```

## Rollback Decision Tree

```
Is the issue critical?
├─ YES: Emergency rollback immediately
└─ NO: Assess severity
   ├─ High: Controlled rollback within 1 hour
   ├─ Medium: Hot fix within 4 hours
   └─ Low: Schedule fix in next release
```

## Communication Protocol

### Internal Team
- **Slack Channel**: #deploy-alerts
- **Escalation**: CTO → Engineering Lead → Team

### External Communications
- **Status Page**: Update within 15 minutes
- **User Notifications**: If user-facing impact
- **Stakeholder Updates**: Within 1 hour

## Post-Rollback Actions

### Immediate (0-2 hours)
1. Verify rollback successful
2. Monitor key metrics
3. Document incident
4. Communicate status

### Short-term (2-24 hours)
1. Root cause analysis
2. Create hot fix plan
3. Update testing procedures
4. Schedule team retrospective

### Long-term (1-7 days)
1. Implement permanent fix
2. Update deployment procedures
3. Enhance monitoring
4. Team retrospective meeting

## Previous Stable Versions

| Tag | Date | Commit | Status | Notes |
|-----|------|--------|--------|-------|
| `v1.1.0-recomposed-design` | 2025-10-11 | `aadb8d1` | Current | Recomposed design system - addresses spacing, layout issues |
| `v1.0.0-flat-design` | 2025-10-11 | `7e7f5b1` | Stable | Original flat design implementation |
| `v0.9.x-pre-flat` | 2025-10-10 | `325487d` | Stable | Pre-flat design state |

## Emergency Contacts

**On-Call Engineer**: Available 24/7
**DevOps Lead**: Available during business hours
**Product Owner**: Available during business hours

## References

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Git Rollback Best Practices](https://git-scm.com/docs/git-revert)
- [Monitoring Dashboard](https://vercel.com/dashboard)

---

**Document Generated**: October 11, 2025
**Generated with Claude Code** - Deployment automation
**Co-Authored-By**: Claude <noreply@anthropic.com>
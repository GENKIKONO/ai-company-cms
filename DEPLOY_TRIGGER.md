# Deploy Trigger

**Purpose**: Force production redeployment to resolve embed API 404 issue  
**Timestamp**: 2025-10-07 13:30 JST  
**Issue**: `/api/public/embed/[slug]/(widget|iframe)` returns 404 in production  
**Root Cause**: Next.js App Router recognizes routes locally but not in production  

## Local Verification Completed ✅

- ✅ Files exist: `src/app/api/public/embed/[slug]/(widget|iframe)/route.ts`
- ✅ Build successful: Routes appear in Next.js build output
- ✅ Manifest confirmed: App paths manifest includes embed routes
- ✅ Code quality: GET signatures, Content-Types, CORS all valid

## Force Redeploy

This file addition will trigger Vercel automatic redeployment.

## Expected Result

After successful deployment:
- `GET /api/public/embed/luxucare-test-org/widget` → 200 + `application/javascript`
- `GET /api/public/embed/luxucare-test-org/iframe` → 200 + `text/html`
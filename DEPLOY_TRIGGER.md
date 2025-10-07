# Deploy Trigger - Phase 2

**Purpose**: FORCE COMPLETE rebuild to resolve embed API 404 issue  
**Timestamp**: 2025-10-07 14:10 JST (Updated)  
**Issue**: `/api/public/embed/[slug]/(widget|iframe)` returns 404 in production  
**Root Cause**: Vercel cache/routing mismatch despite local build success  

## Root Cause Analysis Completed ✅

### フェーズA: ファイル存在確認 ✅
- ✅ All 5 embed files exist with correct paths
- ✅ GET functions exported correctly in both widget/iframe routes

### フェーズB: Next.js構成確認 ✅  
- ✅ next.config.js: No blocking configuration
- ✅ File structure follows App Router conventions
- ✅ No .gitignore/.vercelignore exclusions

### フェーズC: ローカルビルド検証 ✅
- ✅ `npm run build` successful
- ✅ Routes present in app-paths-manifest.json:
  - `/api/public/embed/[slug]/widget/route`
  - `/api/public/embed/[slug]/iframe/route`
- ✅ Build output shows both routes as `ƒ (Dynamic)`

## Conclusion: Vercel Deployment Gap Issue

Local build works perfectly → Production deployment cache/config issue

## Force Complete Rebuild

**Strategy**: Update trigger file to force fresh Vercel deployment with cleared cache.
**Build Command**: `npm run build` (verified working locally)

## Expected Result

After fresh deployment:
- `GET /api/public/embed/luxucare-test-org/widget` → 200 + `application/javascript`
- `GET /api/public/embed/luxucare-test-org/iframe` → 200 + `text/html`

**Verification Method**: HTTP test with actual organization slug
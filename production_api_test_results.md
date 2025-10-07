# 本番稼働確認結果

**実施日時**: 2025-10-07 13:02 JST  
**対象環境**: https://aiohub.jp (Production)

## HTTP実測結果

| Category | URL | Status | Content-Type | Cache-Control | 備考 |
|----------|-----|--------|--------------|---------------|------|
| **Embed系** | | | | | |
| Widget | `/api/public/embed/test-org/widget` | 404 | text/html | private, no-cache | ❌ 未デプロイ |
| iframe | `/api/public/embed/test-org/iframe` | 404 | text/html | private, no-cache | ❌ 未デプロイ |
| **既存公開API** | | | | | |
| Health | `/api/health` | 206 | application/json | no-cache, no-store, must-revalidate | ✅ OK |
| RSS Feed | `/feed.xml` | 200 | application/rss+xml | public, max-age=60 | ✅ OK |
| Services | `/api/public/services` | 200 | application/json | public, max-age=300 | ✅ OK |
| FAQs | `/api/public/faqs` | 200 | application/json | public, max-age=300 | ✅ OK |
| Case Studies | `/api/public/case-studies` | 200 | application/json | public, max-age=300 | ✅ OK |
| **Sitemap系** | | | | | |
| Main Sitemap | `/sitemap.xml` | 200 | application/xml | public, max-age=0, must-revalidate | ✅ OK |
| Images | `/sitemap-images.xml` | 200 | application/xml | public, max-age=300 | ✅ OK |
| News | `/sitemap-news.xml` | 200 | application/xml | public, max-age=300 | ✅ OK |
| **OpenAPI** | | | | | |
| Spec | `/api/public/openapi.json` | 200 | application/json | (不明) | ✅ OK (openapi:3.1.0確認) |

## CORS実測

| Test Type | Origin | Expected | Result |
|-----------|---------|----------|---------|
| Evil Origin | `https://evil.example` | Block/Deny | |
| Allowed Origin | `https://aiohub.jp` | Allow | |

## 詳細ログ

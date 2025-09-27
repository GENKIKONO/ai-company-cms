# ai-company-cms

## 本番とソースの乖離可視化

### ビルド情報バッジ
画面右上にビルド情報バッジが常時表示されます。これにより本番とソースコードの乖離を確認できます。
- バッジ内容: `commit:{コミットSHA} / deploy:{デプロイメントID}`
- ローカル環境では `commit:local / deploy:dev` と表示

### 診断API

#### /api/diag/ui
本番とソースの乖離状況を診断するAPIです。

**使用方法:**
```bash
# ローカル環境
npm run diag:ui

# 本番環境  
APP_URL=https://yourdomain.com npm run diag:ui

# 直接cURL
curl https://yourdomain.com/api/diag/ui
```

**レスポンス例:**
```json
{
  "commit": "abc123...",
  "deployId": "dpl_xyz...",
  "routes": {
    "root": "src/app/page.tsx",
    "dashboard": "src/app/dashboard/page.tsx"
  },
  "flags": {
    "hasAuthHeader": true,
    "hasSearchCard": false
  }
}
```

#### /api/diag
基本的なビルド情報とコミットSHAを返す軽量診断API。
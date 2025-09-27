# Single-Org Mode テスト自動化

## 概要

SINGLE_ORG_MODE_TESTING.md の手動テスト手順16ケースを完全自動化した統合テストスイートです。

## 実行方法

### 1. 単体実行（推奨）
```bash
npm run test:single-org
```

### 2. 全テストと一緒に実行
```bash
npm run test:e2e
```

### 3. ウォッチモード（開発中）
```bash
npm run test:watch -- src/tests/single-org-mode.test.ts
```

### 4. カバレッジ取得
```bash
npm run test:coverage
```

## 自動化されたテストケース

### API エンドポイントテスト
- ✅ Test Case 1: GET /api/my/organization (初回・企業なし)
- ✅ Test Case 2: POST /api/my/organization (新規作成)
- ✅ Test Case 3: GET /api/my/organization (企業作成後)
- ✅ Test Case 4: POST /api/my/organization (重複作成試行)
- ✅ Test Case 5: PUT /api/my/organization (更新)
- ✅ Test Case 6: POST /api/my/organization (重複slug)
- ✅ Test Case 7: DELETE /api/my/organization (削除)
- ✅ Test Case 8: 認証なしでのアクセス

### データベース制約テスト
- ✅ Test Case 9: 直接DB挿入での制約確認
- ✅ 制約の存在確認

### RLSポリシーテスト
- ✅ Test Case 10: 他ユーザーの企業へのアクセス制限
- ✅ Test Case 11: 他ユーザーの企業の更新試行
- ✅ RLSポリシーの存在確認

### エラーハンドリングテスト
- ✅ Test Case 12: 必須フィールド不足
- ✅ Test Case 13: 不正なデータ型

### パフォーマンステスト
- ✅ Test Case 15: 大量データでの制約確認

### セキュリティテスト
- ✅ Test Case 16: SQLインジェクション耐性

### 追加テスト
- ✅ データベース接続エラーハンドリング
- ✅ データ正規化テスト（空文字→null変換）

## テスト環境設定

### 必要な環境変数
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 注意事項
1. **本番環境では実行しない**: テストは開発環境でのみ実行
2. **テストデータの自動クリーンアップ**: テスト完了後に自動で削除
3. **動的ユーザー作成**: 毎回新しいテストユーザーを作成
4. **ポート競合回避**: テスト用にポート3001を使用

## テスト構造

```typescript
// メインテストスイート
describe('Single-Org Mode API Tests', () => {
  // 各テストケースがdescribeブロックで分離
})

// データベースレベルのテスト
describe('Database Constraint Tests', () => {
  // 制約の直接検証
})

// セキュリティレベルのテスト
describe('RLS Policy Tests', () => {
  // Row Level Securityの検証
})
```

## 実行時間

- 単体実行: 約30-60秒
- 初回実行（依存関係ビルド含む）: 約2-3分

## デバッグ

### 詳細ログを有効にする
```bash
DEBUG_TESTS=true npm run test:single-org
```

### 特定テストのみ実行
```bash
npm test -- --testNamePattern="Test Case 1"
```

### Jest ウォッチモード
```bash
npm run test:watch
```

## トラブルシューティング

### よくある問題

1. **認証エラー**
   - Supabase環境変数が正しく設定されているか確認
   - ローカルSupabaseが起動しているか確認

2. **ポート競合**
   - ポート3001が使用可能か確認
   - `lsof -i :3001`で確認

3. **タイムアウトエラー**
   - ネットワーク接続を確認
   - Supabaseサービスの可用性を確認

4. **テストデータ残存**
   - 手動クリーンアップ: `npm run test:cleanup`（実装予定）

## CI/CD統合

GitHubActionsでの実行例:

```yaml
- name: Run Single-Org Mode Tests
  run: npm run test:single-org
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## 今後の拡張

- [ ] フロントエンド統合テスト（Playwright）
- [ ] 負荷テスト（大量ユーザー・企業での動作確認）
- [ ] モックSupabaseでのユニットテスト分離
- [ ] テストレポートの自動生成
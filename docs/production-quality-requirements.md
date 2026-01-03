# 本番運用品質 改善要件定義

**作成日**: 2026-01-03
**目的**: AIOHubを本番運用品質に引き上げるための改善タスク棚卸し

---

## 現状サマリー

| 項目 | 現状 | 目標 |
|------|------|------|
| TypeCheck | ✅ Pass | 維持 |
| Build | ✅ Pass (287警告) | 警告0 |
| Uncommitted Files | 71ファイル | 0ファイル |
| console使用箇所 | 372箇所/107ファイル | logger統一 |
| TypeScript strict | false | true |

---

## Phase 1: Uncommittedファイル整理

**優先度**: 🔴 高
**見積り工数**: 小

### 1.1 コミット対象の分類

| カテゴリ | ファイル数 | 対応 |
|----------|-----------|------|
| CI/CD Workflows | 4 | コミット |
| E2Eテスト | 4 | コミット |
| ドキュメント | 10 | コミット |
| マイグレーション | 4 | コミット |
| テストスクリプト | 30+ | gitignore or 削除 |
| テスト結果JSON | 8 | gitignore |
| セキュリティ監査JSON | 3 | gitignore |
| デバッグ用 | 1 | gitignore |

### 1.2 具体的アクション

```bash
# コミット対象
.github/workflows/enhanced-ci.yml
.github/workflows/mandatory-pr-checks.yml
.github/workflows/mandatory-pr-main-only.yml
.github/workflows/pre-commit-check.yml
tests/e2e/*.spec.ts
docs/*.md (有用なもののみ)
migrations/*.sql (本番適用済みのもののみ)

# gitignoreに追加
test-results*.json
*_audit*.json
*_report.json
phase*_*.json
debug/
scripts/*.js (開発時限定のもの)
```

### 1.3 成果物

- [ ] `.gitignore` 更新
- [ ] 必要ファイルのコミット
- [ ] 不要ファイルの削除

---

## Phase 2: console文のlogger統一

**優先度**: 🔴 高
**見積り工数**: 中

### 2.1 現状分析

| ファイルタイプ | 箇所数 | 対応方針 |
|---------------|--------|----------|
| APIルート | 150+ | `logger.info/error` へ移行 |
| libユーティリティ | 100+ | `logger.debug/warn` へ移行 |
| Adminコンポーネント | 30+ | 削除 or コメントアウト |
| テストファイル | 20+ | 除外 (eslint-disable) |

### 2.2 移行ルール

```typescript
// ❌ Before
console.log('Debug info', data);
console.error('Error occurred', error);

// ✅ After
import { logger } from '@/lib/utils/logger';
logger.debug('Debug info', { data });
logger.error('Error occurred', { data: error });
```

### 2.3 段階的アプローチ

1. **即時対応**: `eslint-disable-next-line no-console` 追加（一時措置）
2. **順次移行**: ファイル単位でlogger移行
3. **最終確認**: ESLint no-console をerrorに変更

### 2.4 成果物

- [ ] `src/lib/` 配下の全console文をlogger化
- [ ] `src/app/api/` 配下の全console文をlogger化
- [ ] `src/components/admin/` 配下のconsole文を削除
- [ ] ESLint設定更新

---

## Phase 3: TypeScript strict mode 有効化

**優先度**: 🟡 中
**見積り工数**: 大

### 3.1 strict mode で有効になるチェック

| オプション | 影響 | 対応難易度 |
|-----------|------|-----------|
| `strictNullChecks` | null/undefined チェック必須 | 大 |
| `strictFunctionTypes` | 関数型の厳密化 | 小 |
| `strictBindCallApply` | bind/call/apply型チェック | 小 |
| `strictPropertyInitialization` | クラスプロパティ初期化必須 | 中 |
| `noImplicitAny` | 暗黙のany禁止 | 中 |
| `noImplicitThis` | 暗黙のthis禁止 | 小 |
| `alwaysStrict` | 常にuse strict | なし |

### 3.2 段階的アプローチ

```json
// Step 1: 個別オプション有効化
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,           // Phase 3a
    "strictNullChecks": true,         // Phase 3b
    "strictFunctionTypes": true,      // Phase 3c
    "strictPropertyInitialization": true // Phase 3d
  }
}

// Step 2: 全有効化
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 3.3 成果物

- [ ] Phase 3a: `noImplicitAny` 有効化 + 型エラー修正
- [ ] Phase 3b: `strictNullChecks` 有効化 + null安全対応
- [ ] Phase 3c: 残りのオプション有効化
- [ ] Phase 3d: `strict: true` 完全移行

---

## Phase 4: ビルド警告ゼロ化

**優先度**: 🟡 中
**見積り工数**: 中

### 4.1 警告カテゴリ

| 警告タイプ | 件数 | 対応 |
|-----------|------|------|
| no-console | 287 | Phase 2で対応 |
| unused-vars | TBD | 削除 or アンダースコア |
| any型使用 | TBD | 型定義追加 |
| その他 | TBD | 個別対応 |

### 4.2 成果物

- [ ] ビルド警告0件達成
- [ ] CIで警告検出時にfail設定

---

## Phase 5: CIパイプライン強化

**優先度**: 🟢 低（運用開始後）
**見積り工数**: 小

### 5.1 追加チェック

```yaml
# .github/workflows/quality-gate.yml
- name: Type Check
  run: npm run typecheck

- name: Build (no warnings)
  run: npm run build 2>&1 | grep -c "Warning" | xargs test 0 -eq

- name: Lint
  run: npm run lint -- --max-warnings 0

- name: Unit Tests
  run: npm run test

- name: E2E Tests
  run: npm run test:e2e
```

### 5.2 成果物

- [ ] PRマージ条件にquality gate追加
- [ ] mainブランチ保護ルール設定

---

## 実行順序

```
Phase 1 (Uncommitted整理)
    ↓ [1-2時間]
Phase 2 (console→logger)
    ↓ [4-8時間]
Phase 4 (警告ゼロ化) ← Phase 2完了後に自動的に大幅削減
    ↓ [2-4時間]
Phase 3 (strict mode) ← 最も工数大、段階的に実施
    ↓ [8-16時間]
Phase 5 (CI強化)
    ↓ [1-2時間]
完了
```

---

## 優先度別サマリー

### 即時実行（Phase 1）
- Uncommittedファイル整理
- .gitignore更新

### 短期実行（Phase 2, 4）
- console→logger統一
- ビルド警告対応

### 中期実行（Phase 3）
- TypeScript strict mode段階的有効化

### 運用後（Phase 5）
- CI/CD強化

---

## 完了条件

- [ ] `git status` がクリーン
- [ ] `npm run build` が警告0で完了
- [ ] `npm run typecheck` がstrict modeでPass
- [ ] `npm run lint` がerror/warning 0で完了
- [ ] CI全チェックがgreen

---

*この要件定義は本番運用品質達成のための指針です。各Phaseは独立して実行可能です。*

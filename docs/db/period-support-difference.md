# Quota Period 要件差分ドキュメント

**作成日**: 2025-12-28
**状態**: 差分として固定（技術負債化防止）

---

## 要件と実装の差分

### 要件定義 §8.4

```
period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'rolling' | 'total'
```

### 現在の実装

```typescript
// src/lib/featureGate.ts
period: 'daily' | 'weekly' | 'monthly' | 'total'
```

| period | 要件 | DB対応 | アプリ対応 | 状態 |
|--------|:----:|:------:|:----------:|------|
| daily | ✅ | ✅ | ✅ | 利用可能 |
| weekly | ✅ | ✅ | ✅ | 利用可能 |
| monthly | ✅ | ✅ | ✅ | 利用可能 |
| total | ✅ | ✅ | ✅ | 利用可能 |
| yearly | ✅ | ❌ | ❌ | **未対応** |
| rolling | ✅ | ❌ | ❌ | **未対応** |

---

## 採用方針: B案（型は現状維持）

### 理由

1. **DB側未対応**: DB側の `check_and_consume_quota` が yearly/rolling をサポートしていない
2. **実行時エラー回避**: 型で制限することでコンパイル時に検出可能
3. **影響範囲最小化**: 既存コードの変更が不要
4. **将来対応容易**: DB対応後に型を追加するだけで有効化可能

### 不採用: A案（型に含めて実行時エラー）

- 実行時エラーはユーザー体験を損なう
- 型安全性が低下する
- コンパイル時に検出できない

---

## 将来対応手順（DB対応後）

DB側で yearly/rolling がサポートされた場合：

### Step 1: featureGate.ts の型を更新

```typescript
// Before
period: 'daily' | 'weekly' | 'monthly' | 'total'

// After
period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'rolling' | 'total'
```

### Step 2: 型チェック実行

```bash
npm run typecheck
```

### Step 3: このドキュメントを更新

差分ステータスを「解消」に変更。

---

## 関連ファイル

- `src/lib/featureGate.ts` - canExecute 関数の period 型定義
- `docs/db/rpc-status-confirmed.md` - DB側対応状況

---

## 負債化防止チェックリスト

- [x] 差分が明示的にドキュメント化されている
- [x] 将来対応手順が記載されている
- [x] 型レベルで制限されている（実行時エラーなし）
- [x] DB対応後の解消手順が明確

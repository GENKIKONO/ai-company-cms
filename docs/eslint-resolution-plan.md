# 📋 ESLint警告解消計画

## 🎯 目標
- **42件のESLint警告**を段階的に解消
- **破壊的変更のリスクを最小化**
- **PRベースでの安全な修正**

---

## 📊 現状分析

### 警告内訳
- `react-hooks/exhaustive-deps`: 39件（93%）
- `@next/next/no-img-element`: 2件（5%）
- `import/no-anonymous-default-export`: 1件（2%）

---

## 🚀 解消ステップ

### **Step 1: 低リスク修正（即座実行可能）**

#### 1-1. Anonymous Default Export 修正
**対象**: `src/lib/ai/group-context.ts:473`
**リスク**: 🟢 VERY LOW
**修正方法**: export前に変数代入

```typescript
// Before
export default {
  // object content
}

// After  
const groupContext = {
  // object content
}
export default groupContext;
```

#### 1-2. Image要素の最適化（条件付き）
**対象**: 2ファイル（`src/components/embed/WidgetPreview.tsx`, `src/components/team/TeamManagement.tsx`）
**リスク**: 🟡 LOW-MEDIUM  
**修正方法**: `<img>` → `<Image />` (Next.js)

⚠️ **注意**: 外部URLや動的src の場合は慎重に検討

---

### **Step 2: useEffect依存配列修正（慎重な対応）**

#### 2-1. パターン分析

**最頻出パターン**:
```typescript
// 現在のパターン（警告発生）
useEffect(() => {
  loadData();
}, []);

// 警告: 'loadData' が依存配列にない
```

#### 2-2. 修正戦略

**戦略A: useCallback でラップ**
```typescript
const loadData = useCallback(async () => {
  // データロード処理
}, [/* 実際の依存関係 */]);

useEffect(() => {
  loadData();
}, [loadData]);
```

**戦略B: ESLint無効化（コメント付き）**
```typescript
useEffect(() => {
  loadData();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**戦略C: useEffect内で関数定義**
```typescript
useEffect(() => {
  const loadData = async () => {
    // データロード処理
  };
  loadData();
}, [/* 必要な依存関係のみ */]);
```

---

## 📋 PR分割案

### **PR #1: 低リスク修正**
- Anonymous default export 修正
- Image要素最適化（安全なもののみ）
- **影響**: ほぼなし
- **テスト**: ビルドチェックのみ

### **PR #2-4: useEffect修正（エリア別）**

#### **PR #2: 管理画面系**
**対象ファイル**:
- `src/app/admin/org-groups/**`
- `src/app/admin/enforcement/**`
- `src/app/management-console/**`
- **件数**: ~12件
- **リスク**: 中程度（管理者のみ影響）

#### **PR #3: ダッシュボード系**
**対象ファイル**:
- `src/app/dashboard/**`
- `src/components/dashboard/**`
- **件数**: ~15件  
- **リスク**: 高（エンドユーザー影響）

#### **PR #4: その他・汎用系**
**対象ファイル**:
- `src/components/**`
- `src/hooks/**`
- その他共通部分
- **件数**: ~12件
- **リスク**: 高（全体影響）

---

## 🔍 修正前チェックリスト

### 各ファイル修正時の確認事項

1. **依存関係の特定**
   - 関数内で使用される外部変数・状態
   - props、state、context の使用
   - 他のhooksの戻り値

2. **無限ループリスクの評価**
   - 依存配列に追加した値が毎回変化するか
   - オブジェクトや配列の参照が安定しているか

3. **パフォーマンス影響の評価**
   - 過度な再実行が発生しないか
   - 重い処理がuseEffectに含まれているか

4. **テストケース確認**
   - 該当機能のE2Eテストが存在するか
   - ユニットテストでhookの動作を検証できるか

---

## ⚠️ 高リスクファイル（慎重対応）

### 以下のファイルは特に注意深く修正:

1. **`src/app/dashboard/analytics/**`** - データ分析系
2. **`src/app/dashboard/billing/**`** - 課金系
3. **`src/components/auth/**`** - 認証系
4. **`src/hooks/**`** - 共通hooks

→ これらは**専用PRで1ファイルずつ修正**推奨

---

## 🧪 修正後テスト戦略

### PR毎のテスト要件

| PR | 必須テスト | 推奨テスト |
|----|-----------|-----------|
| #1 低リスク | Build test | E2E smoke |
| #2 管理画面 | Admin E2E | Full regression |
| #3 ダッシュボード | Dashboard E2E | User journey |
| #4 汎用系 | Full E2E suite | Performance test |

---

## 📅 実行スケジュール案

1. **Week 1**: PR #1 (低リスク修正)
2. **Week 2**: PR #2 (管理画面系) + テスト
3. **Week 3**: PR #3 (ダッシュボード系) + テスト  
4. **Week 4**: PR #4 (汎用系) + 全体回帰テスト

**目標**: 4週間で全42件解消

---

## 🚨 緊急時の対応

### もし修正で問題が発生した場合:

1. **即座にrevert** - 問題のあるPRを取り消し
2. **原因分析** - なぜ問題が発生したかを特定
3. **修正方針変更** - ESLint無効化やより保守的な修正に変更
4. **テスト強化** - 問題を検出できるテストを追加

---

## ✅ 完了基準

- [ ] 全42件のESLint警告解消
- [ ] ビルド成功継続
- [ ] E2Eテスト全通過
- [ ] パフォーマンス劣化なし
- [ ] 機能的な破綻なし
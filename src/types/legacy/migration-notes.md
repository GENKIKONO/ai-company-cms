# 型移行計画メモ

## 移行フェーズの概要

### Phase 1 (完了): 新しいディレクトリ構成の作成
- `src/types/domain/` - UI・ビジネスロジック専用型
- `src/types/utils/` - 型ユーティリティ・派生型
- `src/types/legacy/` - 移行作業用の一時ディレクトリ

### Phase 2 (予定): 既存型の分類・移行
- `database.ts` の型を新構成に分割

## 既存ファイルの分析結果

### `database.ts.original` の型分類

#### ✅ Supabase自動生成で代替可能な型
- `AppUser` → Supabaseの `users` テーブル型で代替可能
- `Partner` → Supabaseの `partners` テーブル型で代替可能  
- `Organization` → Supabaseの `organizations` テーブル型で代替可能
- `Service` → Supabaseの `services` テーブル型で代替可能
- `FAQ` → Supabaseの `faqs` テーブル型で代替可能
- `CaseStudy` → Supabaseの `case_studies` テーブル型で代替可能
- `Post` → Supabaseの `posts` テーブル型で代替可能

#### 🔄 domain/ に移行すべき型
- `UserRole`, `UserSegment`, `OrganizationStatus`, `PartnershipType`, `DayOfWeek`
  → enum型は UI層で使用するため `src/types/domain/` に移行
- `OrganizationFormData`, `ServiceFormData`, `FAQFormData`, `CaseStudyFormData`
  → フォーム専用型は `src/types/domain/` に移行
- `*WithDetails` 型 (例: `QuestionWithDetails`)
  → UI用の拡張型は `src/types/domain/` に移行

#### ❌ 削除候補の型
- 重複する型定義
- 使用されていない型
- Deprecated な型

### 他ファイルの移行計画

#### `ai-interviewer.ts`
- 現在の位置: `src/types/ai-interviewer.ts`
- 移行先: **既に `src/types/domain/ai-interviewer.ts` に新版を作成済み**
- 移行方法: 既存版との差分を確認後、import先を更新

#### `dashboard.ts`
- 現在の位置: `src/types/dashboard.ts`
- 移行先: **既に `src/types/domain/dashboard.ts` に新版を作成済み**
- 移行方法: 既存版との差分を確認後、import先を更新

#### `database.types.ts`
- 現在の位置: `src/types/database.types.ts`
- 内容: `export * from '@/types/database'` の再エクスポート
- 移行方法: `src/types/utils/database.ts` に統合後、削除

#### `api.ts`, `api.types.ts`
- 現在の位置: `src/types/api.ts`, `src/types/api.types.ts`
- 移行先: `src/types/domain/api-responses.ts` に統合
- 移行方法: 内容を確認し、新しいapi-responses.tsと統合

## 移行スケジュール

### Phase 2: 型の統合・移行 (次のステップ)
1. 各既存ファイルの詳細分析
2. enum型の domain/ への移行
3. フォーム型の domain/ への移行
4. UI拡張型の domain/ への移行

### Phase 3: Import の更新
1. 全ファイルでの import パスの更新
   - `from '@/types/database'` → `from '@/types/supabase'` または `from '@/types/utils/database'`
   - `from '@/types/ai-interviewer'` → `from '@/types/domain/ai-interviewer'`
2. TypeScript コンパイルエラーの修正

### Phase 4: 最終整理
1. `legacy/` ディレクトリの削除
2. 未使用ファイルの削除
3. CI での型チェック有効化

## 注意点

- 既存のコードを壊さないよう段階的に移行
- 各フェーズでビルドが通ることを確認
- import元が多い型は特に慎重に移行
- Supabase型との重複を避ける

## 移行済み状況

### ✅ 完了
- 新ディレクトリ構成の作成
- domain ファイルの骨格作成
- utils ファイルの骨格作成

### 🔄 進行中
- package.json scripts の追加
- contract_violations ユーティリティの実装

### ⏸ 未着手
- 既存ファイルの詳細分析
- import パスの全置換
- 重複型の統合
- legacy ファイルの削除
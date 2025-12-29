# Archive - 旧要件定義書

> **警告**: このディレクトリ内の文書は **参照禁止** です。

## 目的

このディレクトリには、AIOHub プロジェクトの旧アーキテクチャに基づく要件定義書が保管されています。
これらは **履歴保存目的のみ** であり、現行の実装やアーキテクチャ判断の参照には使用しないでください。

## 現行正本

**すべてのアーキテクチャ判断は以下を参照してください:**

- [`docs/core-architecture.md`](../core-architecture.md) - コアアーキテクチャ要件定義（v1.0 DB正対応）
- [`docs/requirements_system.md`](../requirements_system.md) - システム/技術要件
- [`CLAUDE.md`](../../CLAUDE.md) - AI開発ガイドライン

## アーカイブ済み文書一覧

| ファイル | 旧概念 | アーカイブ理由 |
|---------|--------|---------------|
| `requirements_overview.md` | セルフサーブ＋代理店併存モデル | 4領域アーキテクチャに置換 |
| `requirements_business.md` | 1ユーザー=1組織、partner ロール | Subject統一に置換 |
| `requirements_changelog.md` | 旧→新の変更履歴 | 履歴として保存、参照不要 |
| `migrations_plan.md` | 旧スキーマ移行計画 | 完了済み、現行DBと乖離 |
| `acceptance_criteria.md` | セルフサーブ/partner テストケース | 4領域ベースに更新必要 |
| `requirements_revision_proposal.txt` | 改訂提案書 | 提案完了、採用済み |

## 旧アーキテクチャの概要（参考）

以下の概念は **廃止** されています：

- **セルフサーブモード（1ユーザー=1組織）**: Subject統一（org/user）に置換
- **代理店モード（partner ロール）**: org_role（organization_members.role）に置換
- **user_organizations**: organization_members に統一
- **orgId?: string | null**: Subject型 `{ type: 'org' | 'user', id: string }` に統一
- **created_by = auth.uid() 一律RLS**: 領域別RLS（Dashboard/Account/Admin）に置換

## 注意事項

- Git履歴から復元可能なため、このディレクトリ内のファイルは削除しても問題ありません
- 将来のPartner/OEM拡張を検討する際の参考として残しています
- AI（Claude/Cursor等）がこれらの文書を参照した場合、正本への誘導が必要です

---

アーカイブ日: 2024-12-25

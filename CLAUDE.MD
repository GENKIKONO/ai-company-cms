# CLAUDE.MD

## プロジェクト概要
- [要件定義（ビジネス視点）](docs/requirements_business.md)
- [要件定義（システム/技術視点）](docs/requirements_system.md)
- [実装ガイドライン](docs/implementation.md)
- [タスク分解（スプリント計画）](docs/sprints.md)
- **[MVPセットアップガイド（Cursor + Claude Code）](docs/mvp_setup_guide.md)** ⭐

---

## Claudeへの指示
このプロジェクトでは以下の方針で開発を進めます：

1. **最初に** `docs/mvp_setup_guide.md` を参照して基盤を構築する
2. Claudeは `docs/requirements_system.md` を最優先で参照して設計・実装する  
3. `docs/implementation.md` のコード規約・環境設定を守る  
4. `docs/sprints.md` を元にチケット単位で開発を進める

## 開発着手時の手順
1. `docs/mvp_setup_guide.md` の手順をコピペで実行
2. 基盤が動作確認できたらCursor/Claude Codeで機能追加
3. RLSポリシー・JSON-LD・Preflightを重点的にテスト
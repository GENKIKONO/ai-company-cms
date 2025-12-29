# Claude Code Panic Capture Guide

## 何が起きているか

Claude Code 2.0.75 で以下のRust panicが発生:

```
thread '<unnamed>' panicked at ...:
byte index 2 is not a char boundary; it is inside '）' (bytes 0..3) of `）`
```

- `）`（全角閉じ括弧）は UTF-8 で 3バイト（0xEF 0xBC 0x89）
- Rustコードがバイト位置2で文字列をスライスしようとして境界エラー

## なぜ今は確定できないか

| 必要な証拠 | 現状 |
|------------|------|
| RUST_BACKTRACE出力 | 元panic時に未設定のため取得できず |
| 落ちたバイナリ名 | backtraceがないため特定不可 |
| 実行されたコマンド/引数 | Claude Code内部ログなし |
| 再現手順 | 全テストで再現不可 |

**現時点の結論: 確定不可（推定止まり）**

推定Culprit: Claude Code本体（ripgrep単体は正常動作）

## 次回panic発生時の確定手順

### Step 1: バックトレース付きでClaude Codeを起動

```bash
# プロジェクトルートで実行
./scripts/run-claude-with-backtrace.sh
```

これにより:
- `RUST_BACKTRACE=full` が設定される
- 全出力が `.logs/claude/claude-YYYYMMDD-HHMMSS.log` に保存される

### Step 2: panic発生時にログを確認

```bash
# 最新のログを確認
ls -lt .logs/claude/ | head -5
cat .logs/claude/claude-*.log | grep -A 50 "panicked at"
```

### Step 3: 確定に必要な情報を抽出

1. **backtrace先頭フレーム** - 落ちた関数名/ファイル名
2. **落ちたバイナリ名** - `claude` / `rg` / その他
3. **直前操作** - 何を検索/実行したか

### Step 4: 報告テンプレート

```markdown
## Panic Report

**日時**: YYYY-MM-DD HH:MM:SS
**Claude Code version**: 2.0.75

**Backtrace先頭30行**:
[ここに貼る]

**落ちたバイナリ**: [claude / rg / 不明]
**直前操作**: [検索パターン/対象ファイル等]
**再現性**: [再現可 / 再現不可]
```

## 再現テストの実行方法

```bash
# rgの各モードでテスト
./scripts/repro/run-rg-matrix.sh
```

## 暫定回避策

`scripts/check-architecture.sh` に `--color never` を追加済み。

**注意**: これは回避策であり、根本原因の修正ではない。
カラー出力処理でのバイト境界計算が問題である可能性を排除するためのもの。

## 関連ファイル

| ファイル | 用途 |
|----------|------|
| `scripts/run-claude-with-backtrace.sh` | バックトレース付き起動 |
| `scripts/repro/utf8-paren.txt` | 再現用テストデータ |
| `scripts/repro/run-rg-matrix.sh` | rgバリエーションテスト |
| `.logs/claude/` | ログ保存先 |

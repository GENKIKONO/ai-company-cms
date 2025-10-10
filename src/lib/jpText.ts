/**
 * 日本語組版ユーティリティライブラリ
 * 改行位置・句読点処理・文字幅調整を自動化
 */

/**
 * 末尾1語落ち防止（widow text prevention）
 * 最後の単語が1行に孤立するのを防ぐ
 */
export function preventWidow(text: string): string {
  // 最後の空白を改行しにくい空白に置換
  return text.replace(/(\S)\s+(\S+)$/, '$1\u00A0$2');
}

/**
 * 行頭に句読点や記号が来ないように保護
 * 句読点の前に改行制御文字を挿入
 */
export function protectPunctuation(text: string): string {
  // 句読点・記号の前に改行抑制文字を挿入
  return text.replace(/([。、，．！？\)\]\】」』\}])/g, '\u2060$1');
}

/**
 * 日本語特有の改行制御
 * 助詞・接続詞が行頭に来るのを防ぐ
 */
export function protectParticles(text: string): string {
  // よく使われる助詞・接続詞を保護
  const particles = ['が', 'を', 'に', 'へ', 'と', 'で', 'から', 'より', 'まで', 'など', 'なら', 'ので', 'ため', 'こと', 'もの'];
  let result = text;
  
  particles.forEach(particle => {
    // 助詞の前に改行抑制文字を挿入
    const regex = new RegExp(`(\\S)\\s+(${particle})`, 'g');
    result = result.replace(regex, `$1\u2060$2`);
  });
  
  return result;
}

/**
 * 数値と単位の分離を防ぐ
 * 「100 円」「50 %」などが分かれないように保護
 */
export function protectNumbers(text: string): string {
  // 数値と単位の間に改行しにくい空白を挿入
  return text
    .replace(/(\d+)\s*(円|万円|億円|千円|%|％|件|社|名|人|個|時間|分|秒|年|月|日|回|倍|GB|MB|KB)/g, '$1\u00A0$2')
    .replace(/(\d+)\s*(件以上|社以上|名以上|人以上|個以上)/g, '$1\u00A0$2');
}

/**
 * ボタンテキストの改行防止
 * 「無料で始める」「お問い合わせ」などを1行に保持
 */
export function protectButtonText(text: string): string {
  const buttonPhrases = [
    '無料で始める',
    'お問い合わせ',
    'ログイン',
    'サインアップ',
    '詳しく見る',
    '今すぐ試す',
    '資料請求',
    'ダウンロード'
  ];
  
  let result = text;
  buttonPhrases.forEach(phrase => {
    // フレーズ内の文字間に改行抑制文字を挿入
    const protectedPhrase = phrase.split('').join('\u2060');
    result = result.replace(new RegExp(phrase, 'g'), protectedPhrase);
  });
  
  return result;
}

/**
 * メイン関数: 全ての日本語組版処理を適用
 */
export function formatJP(text: string): string {
  return protectButtonText(
    protectNumbers(
      protectParticles(
        protectPunctuation(
          preventWidow(text)
        )
      )
    )
  );
}

/**
 * 見出し専用の軽量版（過度な処理を避ける）
 */
export function formatJPHeading(text: string): string {
  return protectPunctuation(preventWidow(text));
}

/**
 * 本文専用（フル機能版）
 */
export function formatJPBody(text: string): string {
  return formatJP(text);
}

/**
 * ボタン専用（改行防止重視）
 */
export function formatJPButton(text: string): string {
  return protectButtonText(protectNumbers(text));
}
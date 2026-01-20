/**
 * ファイルアップロード検証ユーティリティ
 *
 * セキュリティ:
 * - MIMEタイプ検証（ブラウザから送信されるContent-Type）
 * - マジックバイト検証（ファイル先頭のバイトシーケンス）
 * - 二重検証によりMIMEスプーフィング攻撃を防止
 */

// 画像ファイルのマジックバイト定義
const IMAGE_MAGIC_BYTES: Record<string, { signature: number[]; offset?: number }[]> = {
  'image/png': [
    { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] } // PNG signature
  ],
  'image/jpeg': [
    { signature: [0xFF, 0xD8, 0xFF] } // JPEG signature (FFD8FF)
  ],
  'image/webp': [
    { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
    { signature: [0x57, 0x45, 0x42, 0x50], offset: 8 }  // WEBP
  ],
  'image/gif': [
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }  // GIF89a
  ],
  'image/svg+xml': [
    // SVGはテキスト形式なので先頭の文字列をチェック
    // '<svg' または '<?xml'
  ],
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
}

/**
 * ファイルのマジックバイトを検証
 *
 * @param buffer ファイルのArrayBuffer
 * @param expectedMimeType 期待するMIMEタイプ
 * @returns 検証結果
 */
export function validateMagicBytes(
  buffer: ArrayBuffer,
  expectedMimeType: string
): FileValidationResult {
  const bytes = new Uint8Array(buffer);

  // SVGは特別処理（テキストベース）
  if (expectedMimeType === 'image/svg+xml') {
    const text = new TextDecoder().decode(bytes.slice(0, 100));
    if (text.includes('<svg') || text.includes('<?xml')) {
      return { valid: true, detectedType: 'image/svg+xml' };
    }
    return { valid: false, error: 'ファイル内容がSVG形式ではありません' };
  }

  const magicDefs = IMAGE_MAGIC_BYTES[expectedMimeType];
  if (!magicDefs) {
    return { valid: false, error: `未対応のMIMEタイプ: ${expectedMimeType}` };
  }

  // WebPは2箇所チェックが必要
  if (expectedMimeType === 'image/webp') {
    const riffMatch = matchSignature(bytes, [0x52, 0x49, 0x46, 0x46], 0);
    const webpMatch = matchSignature(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    if (riffMatch && webpMatch) {
      return { valid: true, detectedType: 'image/webp' };
    }
    return { valid: false, error: 'ファイル内容がWebP形式ではありません' };
  }

  // 他の形式は通常のシグネチャチェック
  for (const def of magicDefs) {
    if (matchSignature(bytes, def.signature, def.offset || 0)) {
      return { valid: true, detectedType: expectedMimeType };
    }
  }

  return {
    valid: false,
    error: `ファイル内容が${expectedMimeType}形式と一致しません`
  };
}

/**
 * バイトシーケンスが一致するかチェック
 */
function matchSignature(
  bytes: Uint8Array,
  signature: number[],
  offset: number
): boolean {
  if (bytes.length < offset + signature.length) {
    return false;
  }
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

/**
 * 画像ファイルの包括的検証
 *
 * MIMEタイプとマジックバイトの両方をチェック
 */
export async function validateImageFile(
  file: File,
  allowedTypes: string[],
  maxSizeBytes: number
): Promise<FileValidationResult> {
  // 1. MIMEタイプチェック
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `許可されていないファイル形式です。対応形式: ${allowedTypes.join(', ')}`
    };
  }

  // 2. ファイルサイズチェック
  if (file.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `ファイルサイズが大きすぎます。最大${maxMB}MBまで許可されています`
    };
  }

  // 3. マジックバイト検証（内容の実際の形式をチェック）
  try {
    const buffer = await file.arrayBuffer();
    const magicResult = validateMagicBytes(buffer, file.type);

    if (!magicResult.valid) {
      return {
        valid: false,
        error: magicResult.error || 'ファイル内容の検証に失敗しました'
      };
    }

    return { valid: true, detectedType: magicResult.detectedType };
  } catch (error) {
    return {
      valid: false,
      error: 'ファイルの読み取りに失敗しました'
    };
  }
}

/**
 * ファイル拡張子の取得
 */
export function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  };
  return extensions[mimeType] || '.bin';
}

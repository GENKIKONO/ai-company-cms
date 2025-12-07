/**
 * P4-5: Differential Update Helpers
 * 差分判定ロジックの統一実装
 */

export type DiffStrategy = 'content_hash' | 'updated_at' | 'version';

/**
 * content_hash による差分判定
 * @param currentHash 現在のハッシュ値
 * @param newHash 新しいハッシュ値
 * @returns 処理が必要かどうか
 */
export function shouldProcessByHash(currentHash: string | null, newHash: string | null): boolean {
  if (!newHash) return false;
  return currentHash !== newHash;
}

/**
 * updated_at による差分判定
 * @param updatedAt レコードの更新日時
 * @param since 基準日時
 * @returns 処理が必要かどうか
 */
export function shouldProcessByUpdatedAt(updatedAt: string, since: string): boolean {
  if (!updatedAt) return false;
  return new Date(updatedAt).getTime() > new Date(since).getTime();
}

/**
 * version による差分判定
 * @param currentVersion 現在のバージョン
 * @param incomingVersion 新しいバージョン
 * @returns 処理が必要かどうか
 */
export function shouldProcessByVersion(currentVersion: number | null, incomingVersion: number | null): boolean {
  if (incomingVersion == null) return false;
  return currentVersion == null || incomingVersion > currentVersion;
}

/**
 * 統一差分判定インターフェース
 * @param strategy 差分判定方式
 * @param currentValue 現在の値
 * @param newValue 新しい値
 * @returns 処理が必要かどうか
 */
export function shouldProcess(
  strategy: DiffStrategy,
  currentValue: string | number | null,
  newValue: string | number | null
): boolean {
  switch (strategy) {
    case 'content_hash':
      return shouldProcessByHash(
        currentValue as string | null, 
        newValue as string | null
      );
    case 'updated_at':
      return shouldProcessByUpdatedAt(
        newValue as string, 
        currentValue as string
      );
    case 'version':
      return shouldProcessByVersion(
        currentValue as number | null,
        newValue as number | null
      );
    default:
      return true; // 不明な場合は処理する
  }
}
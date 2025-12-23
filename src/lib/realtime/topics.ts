/**
 * Realtime Topic Naming Utilities
 * 命名規約: org:{orgId}:{entity}
 */

/**
 * 組織スコープのRealtimeトピック名を生成
 * @param orgId - 組織ID (UUID)
 * @param entity - エンティティ名 (e.g., 'cms', 'posts', 'sessions')
 * @returns フォーマット済みトピック名
 */
export function orgTopic(orgId: string, entity: string): string {
  if (!orgId || !entity) {
    throw new Error('orgId and entity are required for topic generation');
  }
  return `org:${orgId}:${entity}`;
}

/**
 * トピック名が組織スコープかどうかを検証
 */
export function isOrgTopic(topic: string): boolean {
  return /^org:[0-9a-f-]{36}:[a-z_]+$/.test(topic);
}

/**
 * トピック名から組織IDを抽出
 */
export function extractOrgIdFromTopic(topic: string): string | null {
  const match = topic.match(/^org:([0-9a-f-]{36}):/);
  return match ? match[1] : null;
}

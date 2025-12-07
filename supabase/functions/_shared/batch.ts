/**
 * P4-5: Batch Processing Utilities
 * バッチ処理・リトライロジックの統一実装
 */

export type RetryPolicy = {
  maxRetries: number;
  baseDelayMs: number;
};

/**
 * 指数バックオフによるリトライ実行
 * @param fn 実行する関数
 * @param policy リトライポリシー
 * @returns 関数の実行結果
 */
export async function withRetry<T>(fn: () => Promise<T>, policy: RetryPolicy): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (attempt > policy.maxRetries) {
        throw e;
      }
      
      // 指数バックオフ
      const delay = policy.baseDelayMs * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * 配列をバッチに分割して順次処理
 * @param items 処理対象の配列
 * @param batchSize バッチサイズ
 * @param worker バッチ処理関数
 * @returns 処理結果の配列
 */
export async function inBatches<T, R>(
  items: T[],
  batchSize: number,
  worker: (chunk: T[], index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const result = await worker(chunk, Math.floor(i / batchSize));
    results.push(result);
  }
  
  return results;
}

/**
 * 並列バッチ処理（同時実行制限付き）
 * @param items 処理対象の配列
 * @param batchSize バッチサイズ
 * @param concurrency 同時実行数
 * @param worker バッチ処理関数
 * @returns 処理結果の配列
 */
export async function inParallelBatches<T, R>(
  items: T[],
  batchSize: number,
  concurrency: number,
  worker: (chunk: T[], index: number) => Promise<R>
): Promise<R[]> {
  const chunks: T[][] = [];
  
  // バッチに分割
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize));
  }
  
  const results: R[] = [];
  
  // 同時実行制限付きで処理
  for (let i = 0; i < chunks.length; i += concurrency) {
    const concurrentChunks = chunks.slice(i, i + concurrency);
    const promises = concurrentChunks.map((chunk, idx) => 
      worker(chunk, i + idx)
    );
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * 部分失敗に対応したバッチ処理
 * @param items 処理対象の配列
 * @param batchSize バッチサイズ
 * @param worker 個別処理関数（1件ずつ）
 * @returns 成功・失敗・スキップの統計
 */
export async function processWithPartialFailure<T>(
  items: T[],
  batchSize: number,
  worker: (item: T, index: number) => Promise<{ success: boolean; skipped?: boolean; error?: string }>
): Promise<{
  total: number;
  processed: number;
  skipped: number;
  failed: number;
  errors: string[];
}> {
  const stats = {
    total: items.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  await inBatches(items, batchSize, async (chunk, _batchIndex) => {
    for (let i = 0; i < chunk.length; i++) {
      const item = chunk[i];
      try {
        const result = await worker(item, i);
        if (result.success) {
          if (result.skipped) {
            stats.skipped++;
          } else {
            stats.processed++;
          }
        } else {
          stats.failed++;
          if (result.error) {
            stats.errors.push(result.error);
          }
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  });
  
  return stats;
}
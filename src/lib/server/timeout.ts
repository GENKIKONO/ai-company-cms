/**
 * タイムアウト・リトライユーティリティ
 * 商用レベルのエラー耐性を提供
 */

/**
 * Promiseにタイムアウトを適用
 * @param promise - 対象のPromise（PromiseLikeも対応）
 * @param ms - タイムアウト時間（ミリ秒）
 * @param message - タイムアウト時のエラーメッセージ
 */
export async function withTimeout<T>(
  promise: Promise<T> | PromiseLike<T>,
  ms = 5000,
  message = 'Request timeout'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  return Promise.race([Promise.resolve(promise), timeout]);
}

/**
 * リトライ付きでPromiseを実行
 * @param fn - 実行する関数
 * @param retries - リトライ回数
 * @param delay - リトライ間隔（ミリ秒）
 * @param backoff - バックオフ係数
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 500,
  backoff = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        const waitTime = delay * Math.pow(backoff, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

/**
 * タイムアウト + リトライを組み合わせて実行
 */
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    retries?: number;
    delay?: number;
  } = {}
): Promise<T> {
  const { timeout = 5000, retries = 2, delay = 500 } = options;

  return withRetry(
    () => withTimeout(fn(), timeout),
    retries,
    delay
  );
}

/**
 * 簡易サーキットブレーカー
 * 連続エラー時に一定期間リクエストを遮断
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private isOpen = false;

  constructor(
    private threshold = 5,
    private resetTimeMs = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // サーキットがオープンの場合、リセット時間経過を確認
    if (this.isOpen) {
      if (Date.now() - this.lastFailure >= this.resetTimeMs) {
        this.isOpen = false;
        this.failures = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();

      if (this.failures >= this.threshold) {
        this.isOpen = true;
      }

      throw error;
    }
  }

  get status() {
    return {
      isOpen: this.isOpen,
      failures: this.failures,
      lastFailure: this.lastFailure,
    };
  }
}

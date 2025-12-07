/**
 * P4-5: Database Access Utilities
 * 軽量データベースアクセスヘルパー（@supabase/supabase-js を使わない軽量パス）
 */

export const SB_URL = Deno.env.get('SUPABASE_URL')!;
export const SB_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * レコード更新の共通ヘルパー
 * @param table テーブル名
 * @param filter フィルタ（例: 'id=eq.123'）
 * @param body 更新内容
 * @returns 更新結果
 */
export async function patch(table: string, filter: string, body: unknown): Promise<any> {
  const url = new URL(`${SB_URL}/rest/v1/${table}`);
  
  // filterの解析（'id=eq.123' → 'id' と 'eq.123'）
  const [col, opEqValue] = filter.split('=');
  url.searchParams.set(col, opEqValue);
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SB_SERVICE_KEY,
      'Authorization': `Bearer ${SB_SERVICE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    throw new Error(`patch ${table} failed: ${res.status}`);
  }
  
  return res.json();
}

/**
 * レコード取得の共通ヘルパー
 * @param table テーブル名
 * @param filter フィルタ条件
 * @param select 取得カラム（デフォルト: '*'）
 * @returns 取得結果
 */
export async function select(table: string, filter?: Record<string, string>, select = '*'): Promise<any[]> {
  const url = new URL(`${SB_URL}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SB_SERVICE_KEY,
      'Authorization': `Bearer ${SB_SERVICE_KEY}`,
    },
  });
  
  if (!res.ok) {
    throw new Error(`select ${table} failed: ${res.status}`);
  }
  
  return res.json();
}

/**
 * レコード挿入の共通ヘルパー
 * @param table テーブル名
 * @param body 挿入データ
 * @returns 挿入結果
 */
export async function insert(table: string, body: unknown): Promise<any> {
  const url = new URL(`${SB_URL}/rest/v1/${table}`);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SB_SERVICE_KEY,
      'Authorization': `Bearer ${SB_SERVICE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    throw new Error(`insert ${table} failed: ${res.status}`);
  }
  
  return res.json();
}

/**
 * バルク操作のヘルパー
 * @param table テーブル名
 * @param operation 操作種別
 * @param data データ配列
 * @returns 操作結果
 */
export async function bulkOperation(
  table: string, 
  operation: 'insert' | 'upsert' | 'update',
  data: unknown[]
): Promise<any[]> {
  const url = new URL(`${SB_URL}/rest/v1/${table}`);
  
  let method = 'POST';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SB_SERVICE_KEY,
    'Authorization': `Bearer ${SB_SERVICE_KEY}`,
    'Prefer': 'return=representation',
  };
  
  if (operation === 'upsert') {
    headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
  } else if (operation === 'update') {
    method = 'PATCH';
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    throw new Error(`bulkOperation ${operation} on ${table} failed: ${res.status}`);
  }
  
  return res.json();
}

/**
 * トランザクション風の複数テーブル更新
 * @param operations 操作配列
 * @returns 全ての操作結果
 */
export async function transaction(operations: Array<{
  table: string;
  operation: 'insert' | 'update' | 'patch';
  data: unknown;
  filter?: string; // update/patch用
}>): Promise<any[]> {
  const results: any[] = [];
  
  // 順次実行（Supabase REST APIには真のトランザクション機能がないため）
  for (const op of operations) {
    try {
      let result;
      if (op.operation === 'insert') {
        result = await insert(op.table, op.data);
      } else if (op.operation === 'patch' && op.filter) {
        result = await patch(op.table, op.filter, op.data);
      } else {
        throw new Error(`Unsupported operation: ${op.operation}`);
      }
      results.push(result);
    } catch (error) {
      // 部分的ロールバックはできないため、エラーを含む結果を返す
      results.push({ error: error instanceof Error ? error.message : 'Unknown error' });
      break; // エラー発生時は後続処理を停止
    }
  }
  
  return results;
}
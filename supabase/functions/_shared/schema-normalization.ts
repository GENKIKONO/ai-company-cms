/**
 * Schema Object Normalization Utilities
 * EPIC 3-7: Supabase Review対応 - ハッシュ正規化による差分検知精度向上
 * 
 * 機能:
 * - RLSポリシー定義の正規化
 * - 関数定義の正規化
 * - ビュー定義の正規化
 * - インデックス定義の正規化
 * - 一貫したハッシュ生成による偽陽性削減
 */

import { createHash } from 'node:crypto';

// ============================================
// 型定義
// ============================================

export interface NormalizationOptions {
  removeComments: boolean;
  normalizeWhitespace: boolean;
  sortParameters: boolean;
  lowercaseKeywords: boolean;
  removeSchemaPrefix: boolean;
}

export const DEFAULT_NORMALIZATION_OPTIONS: NormalizationOptions = {
  removeComments: true,
  normalizeWhitespace: true,
  sortParameters: true,
  lowercaseKeywords: true,
  removeSchemaPrefix: true
};

// ============================================
// RLS ポリシー正規化
// ============================================

/**
 * RLSポリシー定義の正規化
 * - 式の標準化（不要な括弧、空白除去）
 * - 関数呼び出しの正規化
 * - 論理演算子の統一
 */
export function normalizeRlsPolicy(
  command: string,
  roles: string[],
  usingExpression: string | null,
  withCheckExpression: string | null,
  options: NormalizationOptions = DEFAULT_NORMALIZATION_OPTIONS
): string {
  
  const normalizedCommand = command.toLowerCase().trim();
  const normalizedRoles = [...roles].sort().map(role => role.toLowerCase());
  
  const normalizedUsing = usingExpression 
    ? normalizeExpression(usingExpression, options)
    : null;
    
  const normalizedWithCheck = withCheckExpression 
    ? normalizeExpression(withCheckExpression, options)
    : null;

  // 正規化された定義を構築
  const parts = [
    `COMMAND:${normalizedCommand}`,
    `ROLES:[${normalizedRoles.join(',')}]`,
    normalizedUsing ? `USING:${normalizedUsing}` : '',
    normalizedWithCheck ? `WITH_CHECK:${normalizedWithCheck}` : ''
  ].filter(Boolean);

  return parts.join('|');
}

/**
 * SQL式の正規化
 */
function normalizeExpression(expression: string, options: NormalizationOptions): string {
  let normalized = expression;

  // コメント除去
  if (options.removeComments) {
    normalized = normalized.replace(/--.*$/gm, ''); // 行コメント
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, ''); // ブロックコメント
  }

  // 空白正規化
  if (options.normalizeWhitespace) {
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }

  // キーワード小文字化
  if (options.lowercaseKeywords) {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
      'TRUE', 'FALSE', 'NULL', 'IS', 'LIKE', 'ILIKE', 'BETWEEN',
      'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'AS'
    ];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      normalized = normalized.replace(regex, keyword.toLowerCase());
    });
  }

  // スキーマプレフィックス除去
  if (options.removeSchemaPrefix) {
    normalized = normalized.replace(/\bpublic\./g, '');
    normalized = normalized.replace(/\bauth\./g, '');
  }

  // 不要な括弧の統一
  normalized = normalized.replace(/\s*\(\s*/g, '(');
  normalized = normalized.replace(/\s*\)\s*/g, ')');

  // 演算子の統一
  normalized = normalized.replace(/\s*=\s*/g, '=');
  normalized = normalized.replace(/\s*!=\s*/g, '!=');
  normalized = normalized.replace(/\s*<>\s*/g, '!='); // <> を != に統一

  return normalized;
}

// ============================================
// 関数定義正規化
// ============================================

/**
 * 関数定義の正規化
 * - 引数型の標準化
 * - 戻り値型の標準化  
 * - 言語識別子の統一
 * - SECURITY DEFINER等のオプションの正規化
 */
export function normalizeFunctionDefinition(
  functionName: string,
  argumentTypes: string[],
  returnType: string,
  language: string,
  isSecurityDefiner: boolean,
  options: NormalizationOptions = DEFAULT_NORMALIZATION_OPTIONS
): string {
  
  const normalizedName = functionName.toLowerCase();
  const normalizedLanguage = language.toLowerCase();
  
  // 引数型の正規化
  const normalizedArgs = argumentTypes.map(arg => normalizeDataType(arg));
  if (options.sortParameters) {
    normalizedArgs.sort();
  }
  
  // 戻り値型の正規化
  const normalizedReturnType = normalizeDataType(returnType);
  
  // セキュリティ設定の正規化
  const securityFlag = isSecurityDefiner ? 'SECURITY_DEFINER' : 'SECURITY_INVOKER';
  
  const parts = [
    `NAME:${normalizedName}`,
    `ARGS:[${normalizedArgs.join(',')}]`,
    `RETURNS:${normalizedReturnType}`,
    `LANGUAGE:${normalizedLanguage}`,
    `SECURITY:${securityFlag}`
  ];

  return parts.join('|');
}

/**
 * データ型の正規化
 */
function normalizeDataType(dataType: string): string {
  let normalized = dataType.toLowerCase().trim();
  
  // 型エイリアスの統一
  const typeMapping: Record<string, string> = {
    'int': 'integer',
    'int4': 'integer',
    'int8': 'bigint',
    'varchar': 'character varying',
    'char': 'character',
    'bool': 'boolean',
    'timestamptz': 'timestamp with time zone',
    'text': 'text'
  };
  
  // 長さ指定の正規化（例: varchar(255) → character varying(255)）
  const lengthMatch = normalized.match(/^(\w+)\((\d+)\)$/);
  if (lengthMatch) {
    const baseType = typeMapping[lengthMatch[1]] || lengthMatch[1];
    return `${baseType}(${lengthMatch[2]})`;
  }
  
  return typeMapping[normalized] || normalized;
}

// ============================================
// インデックス定義正規化
// ============================================

/**
 * インデックス定義の正規化
 * - キー順序の統一
 * - オプションの標準化
 * - 不要な空白除去
 */
export function normalizeIndexDefinition(
  indexDefinition: string,
  options: NormalizationOptions = DEFAULT_NORMALIZATION_OPTIONS
): string {
  
  let normalized = indexDefinition;

  if (options.removeComments) {
    normalized = normalized.replace(/--.*$/gm, '');
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  if (options.normalizeWhitespace) {
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }

  if (options.lowercaseKeywords) {
    const keywords = [
      'CREATE', 'UNIQUE', 'INDEX', 'ON', 'USING', 'WHERE', 'INCLUDE',
      'BTREE', 'HASH', 'GIN', 'GIST', 'SPGIST', 'BRIN'
    ];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      normalized = normalized.replace(regex, keyword.toLowerCase());
    });
  }

  // インデックス名の除去（定義内容のみを対象とする）
  normalized = normalized.replace(/create\s+(?:unique\s+)?index\s+\w+\s+on/gi, 
    'create index on');

  return normalized;
}

// ============================================
// 制約定義正規化
// ============================================

/**
 * 制約定義の正規化
 * - CHECK制約式の正規化
 * - 外部キー参照の正規化
 * - 制約タイプの統一
 */
export function normalizeConstraintDefinition(
  constraintType: string,
  constraintDefinition: string | null,
  options: NormalizationOptions = DEFAULT_NORMALIZATION_OPTIONS
): string {
  
  const normalizedType = constraintType.toLowerCase();
  
  if (!constraintDefinition) {
    return `TYPE:${normalizedType}`;
  }
  
  let normalizedDefinition = constraintDefinition;
  
  if (constraintType.toLowerCase() === 'check') {
    normalizedDefinition = normalizeExpression(constraintDefinition, options);
  } else if (constraintType.toLowerCase() === 'foreign key') {
    // 外部キー参照の正規化
    normalizedDefinition = normalizeExpression(constraintDefinition, options);
  }
  
  return `TYPE:${normalizedType}|DEF:${normalizedDefinition}`;
}

// ============================================
// 統一ハッシュ生成
// ============================================

/**
 * 正規化されたオブジェクト定義から一貫したハッシュを生成
 */
export function generateNormalizedHash(normalizedDefinition: string): string {
  return createHash('sha256')
    .update(normalizedDefinition)
    .digest('hex')
    .substring(0, 16);
}

/**
 * スキーマオブジェクトの正規化とハッシュ生成（一括処理）
 */
export function normalizeSchemaObject(
  objectType: 'rls_policy' | 'function' | 'index' | 'constraint',
  objectData: any,
  options: NormalizationOptions = DEFAULT_NORMALIZATION_OPTIONS
): { normalized_definition: string; normalized_hash: string } {
  
  let normalizedDefinition: string;
  
  switch (objectType) {
    case 'rls_policy':
      normalizedDefinition = normalizeRlsPolicy(
        objectData.command,
        objectData.roles,
        objectData.using_expression,
        objectData.with_check_expression,
        options
      );
      break;
      
    case 'function':
      normalizedDefinition = normalizeFunctionDefinition(
        objectData.function_name,
        objectData.argument_types,
        objectData.return_type,
        objectData.language,
        objectData.is_security_definer,
        options
      );
      break;
      
    case 'index':
      normalizedDefinition = normalizeIndexDefinition(
        objectData.index_definition,
        options
      );
      break;
      
    case 'constraint':
      normalizedDefinition = normalizeConstraintDefinition(
        objectData.constraint_type,
        objectData.constraint_definition,
        options
      );
      break;
      
    default:
      throw new Error(`Unsupported object type: ${objectType}`);
  }
  
  const normalizedHash = generateNormalizedHash(normalizedDefinition);
  
  return {
    normalized_definition: normalizedDefinition,
    normalized_hash: normalizedHash
  };
}

// ============================================
// 差分比較用ユーティリティ
// ============================================

/**
 * 正規化されたオブジェクト間の意味的差分検出
 */
export function detectSemanticDifference(
  oldObject: any,
  newObject: any,
  objectType: 'rls_policy' | 'function' | 'index' | 'constraint',
  options: NormalizationOptions = DEFAULT_NORMALIZATION_OPTIONS
): {
  has_semantic_change: boolean;
  old_normalized_hash: string;
  new_normalized_hash: string;
  change_summary?: string;
} {
  
  const oldNormalized = normalizeSchemaObject(objectType, oldObject, options);
  const newNormalized = normalizeSchemaObject(objectType, newObject, options);
  
  const hasSemanticChange = oldNormalized.normalized_hash !== newNormalized.normalized_hash;
  
  let changeSummary: string | undefined;
  if (hasSemanticChange) {
    changeSummary = generateChangeSummary(
      oldNormalized.normalized_definition,
      newNormalized.normalized_definition,
      objectType
    );
  }
  
  return {
    has_semantic_change: hasSemanticChange,
    old_normalized_hash: oldNormalized.normalized_hash,
    new_normalized_hash: newNormalized.normalized_hash,
    change_summary: changeSummary
  };
}

/**
 * 変更内容の要約生成
 */
function generateChangeSummary(
  oldDefinition: string,
  newDefinition: string,
  objectType: string
): string {
  
  const oldParts = oldDefinition.split('|');
  const newParts = newDefinition.split('|');
  
  const changes: string[] = [];
  
  // パーツ別の比較
  const maxLength = Math.max(oldParts.length, newParts.length);
  for (let i = 0; i < maxLength; i++) {
    const oldPart = oldParts[i] || '';
    const newPart = newParts[i] || '';
    
    if (oldPart !== newPart) {
      changes.push(`Part ${i}: "${oldPart}" → "${newPart}"`);
    }
  }
  
  return changes.length > 0 
    ? `${objectType} changed: ${changes.join('; ')}`
    : `${objectType} modified`;
}

// ============================================
// デバッグ・検証用ユーティリティ  
// ============================================

/**
 * 正規化プロセスのデバッグ情報生成
 */
export function debugNormalization(
  objectData: any,
  objectType: 'rls_policy' | 'function' | 'index' | 'constraint',
  options: NormalizationOptions = DEFAULT_NORMALIZATION_OPTIONS
): {
  original: any;
  normalized_definition: string;
  normalized_hash: string;
  normalization_steps: string[];
} {
  
  const steps: string[] = [];
  steps.push(`Starting normalization for ${objectType}`);
  steps.push(`Options: ${JSON.stringify(options)}`);
  
  const result = normalizeSchemaObject(objectType, objectData, options);
  
  steps.push(`Normalized definition: ${result.normalized_definition}`);
  steps.push(`Generated hash: ${result.normalized_hash}`);
  
  return {
    original: objectData,
    normalized_definition: result.normalized_definition,
    normalized_hash: result.normalized_hash,
    normalization_steps: steps
  };
}
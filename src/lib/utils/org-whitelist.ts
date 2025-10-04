// src/lib/utils/org-whitelist.ts
export const ORG_COLUMNS: ReadonlyArray<string> = [
  'name','slug','description','legal_form','representative_name',
  'capital','employees',
  'address_country','address_region','address_locality',
  'address_postal_code','address_street',
  'telephone','email','email_public',
  'url','logo_url','industries','same_as','status','partner_id',
  // 正式な日付フィールドは established_at のみ採用（founded は排除）
  'established_at',
  // 任意のメタ系（存在すれば）
  'meta_title','meta_description','meta_keywords'
];

// 空文字と undefined は落とす。null は通す（DBでNULLとして扱う）
export function buildOrgInsert(input: Record<string, unknown>) {
  const allowedEntries = ORG_COLUMNS
    .map(k => [k, (input as any)[k]] as const)
    .filter(([, v]) => v !== '' && v !== undefined);

  return Object.fromEntries(allowedEntries);
}
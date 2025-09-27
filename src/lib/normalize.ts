export function normalizeOrganizationPayload(input: Record<string, any>) {
  const data = { ...input };

  // 空文字は null に
  const nullables = [
    'description','keywords','postal_code','street_address',
    'address_locality','address_region','address_country',
    'telephone','email','url'
  ];
  nullables.forEach((k) => { if (data[k] === '') data[k] = null; });

  // DATE 型（任意）: '' → null
  ['founded','established_at'].forEach((k) => {
    if (data[k] === '') data[k] = null;
  });

  // 数値型（任意）: '' → null / 数値文字列 → number
  ['employees','capital'].forEach((k) => {
    if (data[k] === '') data[k] = null;
    else if (typeof data[k] === 'string' && data[k]?.trim().length) {
      const n = Number(data[k]);
      if (!Number.isNaN(n)) data[k] = n;
    }
  });

  // slug の簡易バリデーション（undefined.match を防止）
  if (typeof data.slug !== 'string') data.slug = '';
  data.slug = data.slug.trim();
  if (data.slug && !/^[a-z0-9-]{3,}$/.test(data.slug)) {
    throw new Error('slug format invalid');
  }

  return data;
}
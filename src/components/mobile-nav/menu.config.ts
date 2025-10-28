// src/components/mobile-nav/menu.config.ts
export type MenuItem = { label: string; href: string };

const common: MenuItem[] = [
  { label: 'トップ', href: '/' },
  { label: '料金プラン', href: '/pricing' },
  { label: '企業ディレクトリ', href: '/organizations' },
  { label: 'ヒアリング代行', href: '/hearing-service' },
];

export const resolveMenu = (_pathname: string): MenuItem[] => {
  // 将来: if (pathname.startsWith('/admin')) { return adminMenu }
  return common;
};
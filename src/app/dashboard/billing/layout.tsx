// 強制的に動的SSRにして、認証状態を毎回評価
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// 親レイアウト（dashboard/layout.tsx）の骨格を継承
// 独自のラッパーは追加しない（サイドナビを維持するため）
export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
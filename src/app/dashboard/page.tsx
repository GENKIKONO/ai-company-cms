import DashboardMain from './components/DashboardMain';

// 強制的に動的SSRにして、認証状態を毎回評価
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function DashboardPage() {
  return <DashboardMain />;
}
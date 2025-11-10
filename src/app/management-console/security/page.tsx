import { Metadata } from 'next';
import SecurityDashboard from '@/components/admin/SecurityDashboard';

// 管理系ページ: cookiesを使用するためリクエスト時実行が必要
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Security Dashboard - Management Console',
  description: 'Real-time security monitoring and threat detection dashboard',
};

export default function SecurityPage() {
  return (
    <div className="container mx-auto py-6">
      <SecurityDashboard />
    </div>
  );
}
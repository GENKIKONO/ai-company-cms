/**
 * Dashboard Loading State
 * サイドナビの骨格を維持したまま、メインコンテンツ部分のみローディング表示
 */

export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* ページタイトルスケルトン */}
        <div className="h-8 bg-[var(--dashboard-card-border)] rounded w-1/4 mb-6"></div>

        {/* コンテンツスケルトン */}
        <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)] p-6">
          <div className="space-y-4">
            <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-1/2"></div>
            <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-2/3"></div>
          </div>
        </div>

        {/* カードグリッドスケルトン */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)] p-6">
              <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-[var(--dashboard-card-border)] rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

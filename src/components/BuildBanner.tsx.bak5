import { env } from '@/lib/env';

interface BuildBannerProps {
  commit?: string;
  deployUrl?: string;
  environment?: string;
}

export default function BuildBanner({ 
  commit, 
  deployUrl, 
  environment = 'development' 
}: BuildBannerProps) {
  // SHOW_BUILD_BANNER が false の場合は表示しない
  if (!env.SHOW_BUILD_BANNER) {
    return null;
  }

  // 開発環境でない場合も表示しない
  if (process.env.NODE_ENV === 'production' && !env.SHOW_BUILD_BANNER) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <span className="font-medium text-yellow-800">
            🚧 開発環境
          </span>
          {commit && (
            <span className="text-yellow-700">
              Commit: <code className="bg-yellow-100 px-1 rounded">{commit.substring(0, 8)}</code>
            </span>
          )}
          {environment && (
            <span className="text-yellow-700">
              Env: <code className="bg-yellow-100 px-1 rounded">{environment}</code>
            </span>
          )}
        </div>
        {deployUrl && (
          <a 
            href={deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-600 hover:text-yellow-800 underline"
          >
            デプロイURL
          </a>
        )}
      </div>
    </div>
  );
}
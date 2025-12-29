'use client';

import { useState } from 'react';
import { 
  BookOpenIcon, 
  CodeBracketIcon, 
  KeyIcon,
  ServerIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function ApiDocumentation() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections = [
    { id: 'overview', title: '概要', icon: BookOpenIcon },
    { id: 'authentication', title: '認証', icon: KeyIcon },
    { id: 'organizations', title: '組織API', icon: ServerIcon },
    { id: 'search', title: '検索API', icon: DocumentTextIcon },
    { id: 'collaboration', title: 'リアルタイムAPI', icon: CodeBracketIcon },
    { id: 'sdk', title: 'SDK', icon: CodeBracketIcon },
  ];

  const apiEndpoints = {
    organizations: [
      {
        method: 'GET',
        path: '/api/organizations',
        description: '組織一覧を取得',
        parameters: {
          page: '?page=1',
          limit: '?limit=24',
          industry: '?industry=IT,finance',
          region: '?region=tokyo',
        },
        response: `{
  "data": [
    {
      "id": "uuid",
      "name": "株式会社Example",
      "description": "企業の説明文",
      "url": "https://example.com",
      "industries": ["IT", "finance"],
      "region": "tokyo",
      "employee_count": 100,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 24,
    "has_more": true
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/organizations/{id}',
        description: '特定の組織を取得',
        parameters: {},
        response: `{
  "data": {
    "id": "uuid",
    "name": "株式会社Example",
    "description": "企業の説明文",
    "url": "https://example.com",
    "email": "contact@example.com",
    "phone": "03-1234-5678",
    "address": "東京都渋谷区...",
    "industries": ["IT", "finance"],
    "technologies": ["React", "Node.js"],
    "services": ["Webアプリ開発", "システム設計"],
    "employee_count": 100,
    "founded_year": 2010,
    "is_verified": true,
    "status": "published",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T12:00:00Z"
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/organizations',
        description: '新しい組織を作成',
        parameters: {},
        requestBody: `{
  "name": "株式会社NewCompany",
  "description": "新しい企業の説明",
  "url": "https://newcompany.com",
  "email": "info@newcompany.com",
  "industries": ["IT"],
  "status": "published"
}`,
        response: `{
  "data": {
    "id": "new-uuid",
    "name": "株式会社NewCompany",
    "description": "新しい企業の説明",
    "url": "https://newcompany.com",
    "email": "info@newcompany.com",
    "industries": ["IT"],
    "status": "published",
    "created_by": "null-uuid",
    "created_at": "2024-01-16T10:00:00Z"
  }
}`,
      },
      {
        method: 'PUT',
        path: '/api/organizations/{id}',
        description: '組織情報を更新',
        parameters: {},
        requestBody: `{
  "name": "株式会社UpdatedName",
  "description": "更新された企業の説明",
  "employee_count": 150
}`,
        response: `{
  "data": {
    "id": "uuid",
    "name": "株式会社UpdatedName",
    "description": "更新された企業の説明",
    "employee_count": 150,
    "updated_at": "2024-01-16T11:00:00Z"
  }
}`,
      },
      {
        method: 'DELETE',
        path: '/api/organizations/{id}',
        description: '組織を削除',
        parameters: {},
        response: `{
  "message": "Organization deleted successfully"
}`,
      },
    ],
    search: [
      {
        method: 'GET',
        path: '/api/search',
        description: 'ファセット検索を実行',
        parameters: {
          q: '?q=keyword',
          industries: '?industries=IT,finance',
          regions: '?regions=tokyo,osaka',
          sizes: '?sizes=medium,large',
          technologies: '?technologies=React,Node.js',
          hasUrl: '?hasUrl=true',
          page: '?page=1',
          limit: '?limit=24',
        },
        response: `{
  "data": {
    "organizations": [...],
    "facets": [
      {
        "key": "industries",
        "label": "業界",
        "type": "checkbox",
        "options": [
          {
            "value": "IT",
            "label": "IT",
            "count": 45,
            "selected": true
          }
        ]
      }
    ],
    "total_count": 120,
    "has_more": true,
    "search_time": 150
  }
}`,
      },
    ],
  };

  const sdkExamples = {
    javascript: `// インストール
npm install @aiohub/sdk

// 初期化
import { AIO HubSDK } from '@aiohub/sdk';
import { logger } from '@/lib/utils/logger';

const client = new AIO HubSDK({
  apiKey: 'your-api-key',
  baseURL: 'https://api.aiohub.jp'
});

// 組織一覧を取得
const organizations = await client.organizations.list({
  page: 1,
  limit: 24,
  industries: ['IT', 'finance']
});

// 特定の組織を取得
const organization = await client.organizations.get('org-id');

// 検索実行
const searchResults = await client.search.faceted({
  query: 'キーワード',
  industries: ['IT'],
  regions: ['tokyo']
});

// リアルタイム共同編集
const collaboration = client.collaboration.join('org-id');
collaboration.on('nullJoined', (null) => {
  logger.debug('新しいユーザーが参加', null);
});

collaboration.on('fieldEdit', (edit) => {
  logger.debug('フィールドが編集されました', edit);
});`,
    
    python: `# インストール
pip install aiohub-sdk

# 初期化
from aiohub import AIO HubSDK

client = AIO HubSDK(
    api_key="your-api-key",
    base_url="https://api.aiohub.jp"
)

# 組織一覧を取得
organizations = client.organizations.list(
    page=1,
    limit=24,
    industries=["IT", "finance"]
)

# 特定の組織を取得
organization = client.organizations.get("org-id")

# 検索実行
search_results = client.search.faceted(
    query="キーワード",
    industries=["IT"],
    regions=["tokyo"]
)`,

    curl: `# 組織一覧を取得
curl -X GET "https://api.aiohub.jp/api/organizations?page=1&limit=24" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json"

# 組織を作成
curl -X POST "https://api.aiohub.jp/api/organizations" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "株式会社Example",
    "description": "企業の説明",
    "industries": ["IT"]
  }'

# ファセット検索
curl -X GET "https://api.aiohub.jp/api/search?q=キーワード&industries=IT" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json"`,
  };

  const renderCodeBlock = (code: string, language: string, id: string) => (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg">
        <span className="text-sm font-mono">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
        >
          {copiedCode === id ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <ClipboardDocumentIcon className="w-4 h-4" />
          )}
          <span className="text-xs">{copiedCode === id ? 'コピー済み' : 'コピー'}</span>
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );

  const renderEndpoint = (endpoint: any, index: number) => (
    <div key={index} className="border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className={`
              px-2 py-1 rounded text-xs font-mono font-bold
              ${endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : ''}
              ${endpoint.method === 'POST' ? 'bg-[var(--aio-info-muted)] text-[var(--aio-info)]' : ''}
              ${endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' : ''}
            `}>
              {endpoint.method}
            </span>
            <code className="text-lg font-mono">{endpoint.path}</code>
          </div>
          <p className="text-gray-600">{endpoint.description}</p>
        </div>
      </div>

      {Object.keys(endpoint.parameters).length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">パラメータ</h4>
          <div className="bg-gray-50 rounded p-3">
            {Object.entries(endpoint.parameters).map(([key, value]) => (
              <div key={key} className="mb-1">
                <code className="text-sm">{key}: {value as string}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {endpoint.requestBody && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">リクエストボディ</h4>
          {renderCodeBlock(endpoint.requestBody, 'json', `request-${index}`)}
        </div>
      )}

      <div>
        <h4 className="font-medium text-gray-900 mb-2">レスポンス</h4>
        {renderCodeBlock(endpoint.response, 'json', `response-${index}`)}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="prose max-w-none">
            <h1>AIO Hub API ドキュメント</h1>
            <p className="text-lg text-gray-600">
              AIO Hub APIは、企業組織情報の管理、検索、リアルタイム共同編集機能を提供するRESTful APIです。
            </p>

            <h2>主な機能</h2>
            <ul>
              <li><strong>組織管理</strong> - 企業組織の作成、読み取り、更新、削除</li>
              <li><strong>高度な検索</strong> - ファセット検索による柔軟な組織検索</li>
              <li><strong>リアルタイム共同編集</strong> - 複数ユーザーによる同時編集</li>
              <li><strong>認証・認可</strong> - JWT ベースの認証システム</li>
              <li><strong>分析機能</strong> - 利用統計とインサイト</li>
            </ul>

            <h2>ベースURL</h2>
            <div className="bg-gray-100 p-3 rounded">
              <code>https://api.aiohub.jp</code>
            </div>

            <h2>レート制限</h2>
            <p>APIには以下のレート制限が適用されます：</p>
            <ul>
              <li>認証済みユーザー: 1000リクエスト/時間</li>
              <li>未認証ユーザー: 100リクエスト/時間</li>
              <li>検索API: 500リクエスト/時間</li>
            </ul>

            <h2>エラーハンドリング</h2>
            <p>APIは標準的なHTTPステータスコードを使用します：</p>
            <ul>
              <li><code>200</code> - 成功</li>
              <li><code>201</code> - 作成成功</li>
              <li><code>400</code> - 不正なリクエスト</li>
              <li><code>401</code> - 認証エラー</li>
              <li><code>403</code> - 権限不足</li>
              <li><code>404</code> - リソースが見つからない</li>
              <li><code>429</code> - レート制限超過</li>
              <li><code>500</code> - サーバーエラー</li>
            </ul>
          </div>
        );

      case 'authentication':
        return (
          <div className="prose max-w-none">
            <h1>認証</h1>
            <p>AIO Hub APIは Bearer Token による認証を使用します。</p>

            <h2>APIキーの取得</h2>
            <p>APIキーは管理画面から取得できます：</p>
            <ol>
              <li>AIO Hubにログイン</li>
              <li>設定 → API キー管理にアクセス</li>
              <li>「新しいAPIキー」をクリック</li>
              <li>必要な権限を選択して作成</li>
            </ol>

            <h2>認証ヘッダー</h2>
            <p>すべてのAPIリクエストには Authorization ヘッダーが必要です：</p>
            {renderCodeBlock('Authorization: Bearer your-api-key-here', 'http', 'auth-header')}

            <h2>権限レベル</h2>
            <ul>
              <li><strong>読み取り専用</strong> - 組織情報の取得、検索のみ</li>
              <li><strong>読み書き</strong> - 組織の作成、更新が可能</li>
              <li><strong>管理者</strong> - すべての操作が可能</li>
            </ul>

            <h2>認証エラー</h2>
            <p>認証に失敗した場合のレスポンス例：</p>
            {renderCodeBlock(`{
  "error": "Unauthorized",
  "message": "Invalid or missing API key",
  "code": 401
}`, 'json', 'auth-error')}
          </div>
        );

      case 'organizations':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">組織API</h1>
            <p className="text-lg text-gray-600 mb-8">
              企業組織の管理に関するAPIエンドポイントです。
            </p>
            {apiEndpoints.organizations.map(renderEndpoint)}
          </div>
        );

      case 'search':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">検索API</h1>
            <p className="text-lg text-gray-600 mb-8">
              ファセット検索機能により、柔軟な組織検索が可能です。
            </p>
            {apiEndpoints.search.map(renderEndpoint)}
          </div>
        );

      case 'collaboration':
        return (
          <div className="prose max-w-none">
            <h1>リアルタイムAPI</h1>
            <p>WebSocketベースのリアルタイム共同編集機能です。</p>

            <h2>接続</h2>
            <p>WebSocketエンドポイント：</p>
            {renderCodeBlock('wss://api.aiohub.jp/ws/collaboration/{organization_id}', 'url', 'ws-endpoint')}

            <h2>認証</h2>
            <p>WebSocket接続時に認証トークンをクエリパラメータで送信：</p>
            {renderCodeBlock('wss://api.aiohub.jp/ws/collaboration/{organization_id}?token=your-api-key', 'url', 'ws-auth')}

            <h2>イベント</h2>
            <h3>nullJoined</h3>
            <p>新しいユーザーがセッションに参加した時：</p>
            {renderCodeBlock(`{
  "event": "nullJoined",
  "data": {
    "nullId": "null-uuid",
    "name": "ユーザー名",
    "email": "null@example.com",
    "color": "#3B82F6"
  }
}`, 'json', 'null-joined')}

            <h3>fieldEdit</h3>
            <p>フィールドが編集された時：</p>
            {renderCodeBlock(`{
  "event": "fieldEdit",
  "data": {
    "nullId": "null-uuid",
    "nullName": "ユーザー名",
    "fieldPath": "name",
    "value": "新しい組織名",
    "timestamp": 1642345678901
  }
}`, 'json', 'field-edit')}

            <h3>conflictDetected</h3>
            <p>編集競合が検出された時：</p>
            {renderCodeBlock(`{
  "event": "conflictDetected",
  "data": {
    "conflicts": [
      {
        "fieldPath": "name",
        "edits": [...]
      }
    ]
  }
}`, 'json', 'conflict')}
          </div>
        );

      case 'sdk':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">SDK</h1>
            <p className="text-lg text-gray-600 mb-8">
              公式SDKを使用してAIO Hub APIを簡単に統合できます。
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">JavaScript/TypeScript</h3>
                <p className="text-sm text-gray-600 mb-3">Node.js とブラウザ環境で使用可能</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">npm install @aiohub/sdk</code>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Python</h3>
                <p className="text-sm text-gray-600 mb-3">Python 3.7+ 対応</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">pip install aiohub-sdk</code>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">cURL</h3>
                <p className="text-sm text-gray-600 mb-3">REST API 直接呼び出し</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">curl examples</code>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">JavaScript/TypeScript</h2>
                {renderCodeBlock(sdkExamples.javascript, 'javascript', 'js-sdk')}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Python</h2>
                {renderCodeBlock(sdkExamples.python, 'python', 'python-sdk')}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">cURL</h2>
                {renderCodeBlock(sdkExamples.curl, 'bash', 'curl-sdk')}
              </div>
            </div>
          </div>
        );

      default:
        return <div>セクションが見つかりません</div>;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 fixed h-full overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API ドキュメント</h2>
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors
                    ${activeSection === section.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">リンク</h3>
          <div className="space-y-2">
            <a
              href="https://github.com/aiohub/sdk"
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="/support"
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              <span>サポート</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64">
        <div className="max-w-4xl mx-auto p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
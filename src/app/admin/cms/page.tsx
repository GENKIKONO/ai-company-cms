'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCmsData } from '@/hooks/useCmsData';
import { supabaseBrowser } from '@/lib/supabase/client';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  SaveIcon, 
  SettingsIcon,
  ImageIcon,
  ComponentIcon,
  WifiIcon,
  WifiOffIcon,
  RefreshCwIcon
} from 'lucide-react';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  data_type: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface CMSSection {
  id: string;
  page_key: string;
  section_key: string;
  section_type: string;
  title?: string;
  content: Record<string, any>;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CMSAsset {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  alt_text?: string;
  description?: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CMSAdminPage() {
  const [activeTab, setActiveTab] = useState('settings');
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // 編集フォーム状態
  const [editingSetting, setEditingSetting] = useState<Partial<SiteSetting> | null>(null);
  const [editingSection, setEditingSection] = useState<Partial<CMSSection> | null>(null);

  // Realtime CMS データフック
  const cmsData = useCmsData(organizationId || '');

  // 組織ID取得
  useEffect(() => {
    const getOrganizationId = async () => {
      const supabase = supabaseBrowser;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .single();
        
        if (userOrg && 'organization_id' in userOrg) {
          setOrganizationId((userOrg as { organization_id: string }).organization_id);
        }
      }
    };
    
    getOrganizationId();
  }, []);

  // CMS操作ハンドラー
  const saveSetting = async () => {
    if (!editingSetting || !organizationId) return;

    const result = editingSetting.id 
      ? await cmsData.updateSiteSetting(editingSetting as any)
      : await cmsData.createSiteSetting({
          key: editingSetting.key!,
          value: editingSetting.value!,
          data_type: editingSetting.data_type!,
          description: editingSetting.description,
          is_public: editingSetting.is_public!
        });

    if (result.success) {
      setEditingSetting(null);
    }
  };

  const saveSection = async () => {
    if (!editingSection || !organizationId) return;

    const result = editingSection.id
      ? await cmsData.updateCmsSection(editingSection as any)
      : await cmsData.createCmsSection({
          page_key: editingSection.page_key!,
          section_key: editingSection.section_key!,
          section_type: editingSection.section_type!,
          title: editingSection.title,
          content: editingSection.content!,
          display_order: editingSection.display_order!,
          is_active: editingSection.is_active!
        });

    if (result.success) {
      setEditingSection(null);
    }
  };

  const deleteSetting = async (key: string) => {
    if (!confirm('この設定を削除しますか？') || !organizationId) return;
    await cmsData.deleteSiteSetting(key);
  };

  const deleteSection = async (pageKey: string, sectionKey: string) => {
    if (!confirm('このセクションを削除しますか？') || !organizationId) return;
    await cmsData.deleteCmsSection(pageKey, sectionKey);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              CMS 管理
            </h1>
            <p className="text-gray-600">
              サイトのコンテンツをコード不要で編集・管理できます
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Realtime接続状態 */}
            <div className="flex items-center gap-2">
              {cmsData.isConnected ? (
                <>
                  <WifiIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">リアルタイム接続中</span>
                </>
              ) : (
                <>
                  <WifiOffIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">オフライン</span>
                </>
              )}
            </div>
            
            {/* 手動リフレッシュボタン */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cmsData.refresh}
              disabled={cmsData.isLoading}
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${cmsData.isLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
            
            {/* 最終更新時間 */}
            {cmsData.lastUpdate && (
              <div className="text-xs text-gray-500">
                最終更新: {new Date(cmsData.lastUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {cmsData.error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{cmsData.error}</p>
          </CardContent>
        </Card>
      )}

      {/* 組織未選択状態 */}
      {!organizationId && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-600">組織情報を読み込み中...</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            サイト設定
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <ComponentIcon className="w-4 h-4" />
            セクション
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            アセット
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>サイト設定</CardTitle>
                  <Button onClick={() => setEditingSetting({})}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    新規作成
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingSetting && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-4">
                      {editingSetting.id ? '設定を編集' : '新しい設定を作成'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">キー</label>
                        <Input
                          value={editingSetting.key || ''}
                          onChange={(e) => setEditingSetting({
                            ...editingSetting,
                            key: e.target.value
                          })}
                          placeholder="site_title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">データタイプ</label>
                        <select
                          value={editingSetting.data_type || 'text'}
                          onChange={(e) => setEditingSetting({
                            ...editingSetting,
                            data_type: e.target.value
                          })}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="text">テキスト</option>
                          <option value="json">JSON</option>
                          <option value="boolean">真偽値</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">値</label>
                      <Textarea
                        value={editingSetting.value || ''}
                        onChange={(e) => setEditingSetting({
                          ...editingSetting,
                          value: e.target.value
                        })}
                        placeholder="設定値を入力"
                        rows={3}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">説明</label>
                      <Input
                        value={editingSetting.description || ''}
                        onChange={(e) => setEditingSetting({
                          ...editingSetting,
                          description: e.target.value
                        })}
                        placeholder="設定の説明"
                      />
                    </div>
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={editingSetting.is_public || false}
                        onChange={(e) => setEditingSetting({
                          ...editingSetting,
                          is_public: e.target.checked
                        })}
                        className="mr-2"
                      />
                      <label htmlFor="is_public" className="text-sm">
                        公開設定（フロントエンドからアクセス可能）
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveSetting} disabled={cmsData.isLoading}>
                        <SaveIcon className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingSetting(null)}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {cmsData.settings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{setting.key}</span>
                          <Badge variant={setting.is_public ? "default" : "secondary"}>
                            {setting.is_public ? '公開' : 'プライベート'}
                          </Badge>
                          <Badge variant="outline">
                            {setting.data_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {setting.value}
                        </p>
                        {setting.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSetting(setting)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSetting(setting.key)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {cmsData.settings.length === 0 && !cmsData.isLoading && (
                  <p className="text-center text-gray-500 py-8">
                    設定が見つかりません。新しい設定を作成してください。
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>ページセクション</CardTitle>
                <Button onClick={() => setEditingSection({})}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  新規作成
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingSection && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-medium mb-4">
                    {editingSection.id ? 'セクションを編集' : '新しいセクションを作成'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">ページキー</label>
                      <Input
                        value={editingSection.page_key || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          page_key: e.target.value
                        })}
                        placeholder="homepage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">セクションキー</label>
                      <Input
                        value={editingSection.section_key || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          section_key: e.target.value
                        })}
                        placeholder="hero"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">セクションタイプ</label>
                      <select
                        value={editingSection.section_type || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          section_type: e.target.value
                        })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">選択してください</option>
                        <option value="hero">ヒーロー</option>
                        <option value="feature_list">機能一覧</option>
                        <option value="text_block">テキストブロック</option>
                        <option value="pricing_table">料金表</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">タイトル</label>
                    <Input
                      value={editingSection.title || ''}
                      onChange={(e) => setEditingSection({
                        ...editingSection,
                        title: e.target.value
                      })}
                      placeholder="セクションタイトル"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">コンテンツ（JSON）</label>
                    <Textarea
                      value={editingSection.content ? JSON.stringify(editingSection.content, null, 2) : '{}'}
                      onChange={(e) => {
                        try {
                          const content = JSON.parse(e.target.value);
                          setEditingSection({
                            ...editingSection,
                            content
                          });
                        } catch {
                          // 無効なJSONの場合は何もしない
                        }
                      }}
                      placeholder='{"title": "タイトル", "subtitle": "サブタイトル"}'
                      rows={6}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">表示順序</label>
                      <Input
                        type="number"
                        value={editingSection.display_order || 0}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          display_order: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active_section"
                        checked={editingSection.is_active !== false}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          is_active: e.target.checked
                        })}
                        className="mr-2"
                      />
                      <label htmlFor="is_active_section" className="text-sm">
                        アクティブ
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveSection} disabled={cmsData.isLoading}>
                      <SaveIcon className="w-4 h-4 mr-2" />
                      保存
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingSection(null)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {cmsData.sections.map((section) => (
                  <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {section.page_key}/{section.section_key}
                        </span>
                        <Badge variant="outline">{section.section_type}</Badge>
                        {section.is_active ? (
                          <Badge variant="default">アクティブ</Badge>
                        ) : (
                          <Badge variant="secondary">非アクティブ</Badge>
                        )}
                        <Badge variant="outline">順序: {section.display_order}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {section.title || '（タイトルなし）'}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSection(section)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSection(section.page_key, section.section_key)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {cmsData.sections.length === 0 && !cmsData.isLoading && (
                <p className="text-center text-gray-500 py-8">
                  セクションが見つかりません。新しいセクションを作成してください。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>アセット管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">
                  アセット管理機能は今後実装予定です
                </p>
                <p className="text-sm text-gray-400">
                  画像アップロード、ファイル管理機能を追加予定
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
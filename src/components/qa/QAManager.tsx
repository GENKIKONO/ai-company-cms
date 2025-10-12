'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import QACategoryManager from './QACategoryManager';
import QAEntryManager from './QAEntryManager';
import { useQAData } from '@/hooks/useQAData';
import { Folder, FileText, Search, TrendingUp } from 'lucide-react';

export default function QAManager() {
  const [activeTab, setActiveTab] = useState('entries');
  const { categories, loading, refreshCategories } = useQAData();

  const handleCategoryChange = () => {
    refreshCategories();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Q&A管理システム</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            読み込み中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Q&A管理システム
          </CardTitle>
          <CardDescription>
            組織の知識ベースを構築・管理し、AIと検索エンジン最適化を通じて情報発見を向上させます。
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Q&Aエントリ
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            カテゴリ管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <QAEntryManager 
            categories={categories} 
            onRefreshCategories={refreshCategories}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <QACategoryManager onCategoryChange={handleCategoryChange} />
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">総Q&Aエントリ</p>
                <p className="text-xs text-muted-foreground">管理中のQ&A数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">アクティブカテゴリ</p>
                <p className="text-xs text-muted-foreground">
                  {categories.filter(c => c.is_active).length}個のカテゴリ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">検索最適化</p>
                <p className="text-xs text-muted-foreground">JSON-LD対応</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
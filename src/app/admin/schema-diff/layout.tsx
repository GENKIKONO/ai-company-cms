/**
 * Schema Diff Admin Layout
 * EPIC 3-7: Super Admin Console レイアウト
 */

import { Metadata } from 'next';
import { Database, GitBranch } from 'lucide-react';

export const metadata: Metadata = {
  title: 'スキーマ変更履歴 | Super Admin Console',
  description: 'データベーススキーマの差分検知履歴と詳細分析',
};

export default function SchemaDiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">スキーマ変更管理</h1>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              <span>EPIC 3-7</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
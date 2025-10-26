'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardContent
} from '@/components/ui/HIGCard';
import { HIGButton } from '@/components/ui/HIGButton';
import { 
  MessageSquare, 
  Send, 
  Building, 
  User,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default function AskQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companySlug = searchParams.get('company');
  
  // State管理
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [questionText, setQuestionText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 初期化
  useEffect(() => {
    loadOrganizations();
    checkAuthStatus();
  }, []);

  // 企業選択の設定
  useEffect(() => {
    if (companySlug && organizations.length > 0) {
      const company = organizations.find(org => org.slug === companySlug);
      if (company) {
        setSelectedCompanyId(company.id);
      }
    }
  }, [companySlug, organizations]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/organizations?limit=100');
      
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      setError('企業一覧の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('質問を投稿するには、ログインが必要です。');
      return;
    }

    if (!selectedCompanyId) {
      setError('質問先の企業を選択してください。');
      return;
    }

    if (questionText.trim().length < 10) {
      setError('質問は10文字以上で入力してください。');
      return;
    }

    if (questionText.length > 1000) {
      setError('質問は1000文字以内で入力してください。');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: selectedCompanyId,
          question_text: questionText.trim()
        })
      });

      if (response.ok) {
        setSuccess(true);
        setQuestionText('');
        setSelectedCompanyId('');
        
        // 3秒後にマイページにリダイレクト
        setTimeout(() => {
          router.push('/dashboard/my-questions');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '質問の投稿に失敗しました');
      }
    } catch (error) {
      console.error('Question submission failed:', error);
      setError('質問の投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCompany = organizations.find(org => org.id === selectedCompanyId);

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--color-background-primary)] p-6">
        <div className="max-w-2xl mx-auto">
          <HIGCard variant="elevated" className="text-center">
            <HIGCardContent className="py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="hig-text-h2 text-[var(--color-text-primary)] mb-2">
                質問を投稿しました
              </h1>
              <p className="hig-text-body text-[var(--color-text-secondary)] mb-6">
                {selectedCompany?.name}に質問が送信されました。<br />
                回答があり次第、メールでお知らせいたします。
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/my-questions">
                  <HIGButton variant="primary">
                    投稿した質問を確認
                  </HIGButton>
                </Link>
                <HIGButton 
                  variant="secondary"
                  onClick={() => setSuccess(false)}
                >
                  別の質問を投稿
                </HIGButton>
              </div>
            </HIGCardContent>
          </HIGCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-primary)] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* ヘッダー */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <HIGButton variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              戻る
            </HIGButton>
          </Link>
          <div className="flex-1">
            <h1 className="hig-text-h1 text-[var(--color-text-primary)] flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-[var(--color-primary)]" />
              企業に質問する
            </h1>
            <p className="hig-text-body text-[var(--color-text-secondary)] mt-2">
              興味のある企業に直接質問を送ることができます
            </p>
          </div>
        </div>

        {/* 認証状態チェック */}
        {!user && (
          <HIGCard variant="filled" className="border-l-4 border-l-orange-500">
            <HIGCardContent>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="hig-text-body text-orange-800 font-medium">
                    ログインが必要です
                  </p>
                  <p className="hig-text-caption text-orange-700 mt-1">
                    質問を投稿するには、アカウントにログインしてください。
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/auth/login">
                  <HIGButton variant="primary" size="sm">
                    ログイン
                  </HIGButton>
                </Link>
              </div>
            </HIGCardContent>
          </HIGCard>
        )}

        {/* 質問フォーム */}
        <HIGCard>
          <HIGCardHeader>
            <HIGCardTitle level={2}>
              <Send className="h-5 w-5 inline mr-2" />
              質問内容
            </HIGCardTitle>
          </HIGCardHeader>
          <HIGCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 企業選択 */}
              <div>
                <label className="hig-text-caption text-[var(--color-text-secondary)] block mb-2">
                  <Building className="h-4 w-4 inline mr-1" />
                  質問先企業 *
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  disabled={loading || !user}
                  className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg 
                           bg-[var(--color-background)] text-[var(--color-text-primary)]
                           focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">企業を選択してください</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {companySlug && selectedCompany && (
                  <p className="hig-text-caption text-[var(--color-text-secondary)] mt-1">
                    {selectedCompany.name}が選択されています
                  </p>
                )}
              </div>

              {/* 質問テキスト */}
              <div>
                <label className="hig-text-caption text-[var(--color-text-secondary)] block mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  質問内容 *
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  disabled={!user}
                  placeholder="具体的で明確な質問を記入してください。サービス内容、料金、導入方法など、何でもお気軽にお聞きください。"
                  rows={6}
                  className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg 
                           bg-[var(--color-background)] text-[var(--color-text-primary)]
                           focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
                  required
                  minLength={10}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="hig-text-caption text-[var(--color-text-secondary)]">
                    10文字以上、1000文字以内で入力してください
                  </p>
                  <p className="hig-text-caption text-[var(--color-text-secondary)]">
                    {questionText.length}/1000
                  </p>
                </div>
              </div>

              {/* エラー表示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="hig-text-caption text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                </div>
              )}

              {/* 送信ボタン */}
              <div className="flex gap-3">
                <HIGButton
                  type="submit"
                  variant="primary"
                  leftIcon={<Send className="h-4 w-4" />}
                  loading={submitting}
                  disabled={!user || loading || submitting}
                >
                  質問を送信
                </HIGButton>
                
                {user && (
                  <Link href="/dashboard/my-questions">
                    <HIGButton variant="secondary">
                      投稿済み質問を確認
                    </HIGButton>
                  </Link>
                )}
              </div>

              {/* 注意事項 */}
              <div className="p-4 bg-[var(--color-background-secondary)] rounded-lg">
                <h4 className="hig-text-caption font-semibold text-[var(--color-text-primary)] mb-2">
                  ご注意
                </h4>
                <ul className="hig-text-caption text-[var(--color-text-secondary)] space-y-1">
                  <li>• 質問は企業担当者が直接確認します</li>
                  <li>• 回答には数日程度お時間をいただく場合があります</li>
                  <li>• 不適切な内容の質問は削除される場合があります</li>
                  <li>• 質問と回答は非公開で、他のユーザーには表示されません</li>
                </ul>
              </div>
            </form>
          </HIGCardContent>
        </HIGCard>
      </div>
    </div>
  );
}
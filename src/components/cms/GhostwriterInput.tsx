'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Globe, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSessionClient } from '@/lib/core/auth-state.client';

interface GhostwriterInputProps {
  organizationId: string;
  organizationSlug?: string;
}

export function GhostwriterInput({ organizationId, organizationSlug }: GhostwriterInputProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!organizationId) {
      toast({
        title: "組織権限が必要です",
        description: "AI企業情報自動生成を使用するには、組織のオーナー権限が必要です",
        variant: "destructive",
      });
      return;
    }

    if (!url.trim()) {
      toast({
        title: "URLが必要です",
        description: "企業サイトのURLを入力してください",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(url)) {
      toast({
        title: "無効なURL",
        description: "正しいURLフォーマットを入力してください（https://example.com）",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress('AIがサイトを解析中...');

    try {
      // Progress simulation for better UX
      const progressSteps = [
        'サイト構造を分析中...',
        '企業情報を抽出中...',
        'コンテンツを生成中...',
        '最終調整中...'
      ];
      
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length - 1) {
          stepIndex++;
          setProgress(progressSteps[stepIndex]);
        }
      }, 2000);

      // Get Supabase session for auth token
      const session = await getSessionClient();
      if (!session) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ghostwriter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            url: url.trim(),
            organization_id: organizationId
          }),
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "AI生成完了!",
        description: "企業情報が自動生成されました。データを確認してください。",
      });

      // Show success UI
      setShowSuccess(true);
      
      // Refresh the page to show updated data
      router.refresh();
      
      // Clear the URL input
      setUrl('');
      
      // Hide success UI after 10 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 10000);
      
    } catch (error) {
      toast({
        title: "生成に失敗しました",
        description: error instanceof Error ? error.message : "予期せぬエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/20 shadow-2xl shadow-blue-500/10">
      {/* Glassmorphism background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/50"></div>
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-yellow-400/20 rounded-full blur-xl"></div>
      
      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              AI Ghostwriter
            </h2>
            <p className="text-gray-600 text-sm">
              企業サイトから自動で情報を抽出・生成
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-company.com"
              disabled={isLoading}
              className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--aio-info)]/50 focus:border-[var(--aio-info)]/50 transition-all duration-200 text-gray-900 placeholder-gray-500 shadow-inner"
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !url.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AIで企業情報を自動生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                AIで企業情報を自動生成
              </>
            )}
          </button>
        </div>

        {/* Progress Indicator */}
        {isLoading && progress && (
          <div className="mt-6 p-4 bg-white/40 backdrop-blur rounded-xl border border-white/20">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-gray-700 font-medium">{progress}</p>
            </div>
            
            {/* Animated progress bar */}
            <div className="mt-3 w-full h-1 bg-gray-200/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" 
                   style={{ width: '70%' }}></div>
            </div>
          </div>
        )}

        {/* Feature highlights */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>企業情報自動抽出</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>SEO最適化</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>コンテンツ生成</span>
          </div>
        </div>

        {/* Success UI with public page preview */}
        {showSuccess && organizationSlug && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">生成完了！</h3>
                <p className="text-sm text-green-700">企業ページが自動で作成されました</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`/o/${organizationSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Globe className="w-5 h-5" />
                公開ページを今すぐ確認する
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              
              <button
                onClick={() => setShowSuccess(false)}
                className="inline-flex items-center justify-center px-4 py-3 border border-green-300 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors duration-200"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* Usage note */}
        <div className="mt-6 p-3 bg-amber-50/50 border border-amber-200/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              <strong>ご注意:</strong> この機能は企業の公開ウェブサイトから情報を抽出します。
              プライベートな情報や機密情報が含まれていないことを確認してください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
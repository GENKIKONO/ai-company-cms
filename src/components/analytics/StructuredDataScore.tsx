'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { calculateStructuredDataScore } from '@/lib/trial-manager';
import type { Organization } from '@/types/database';

interface StructuredDataScoreProps {
  organization: Organization;
  className?: string;
}

export function StructuredDataScore({ organization, className = '' }: StructuredDataScoreProps) {
  const [score, setScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const calculatedScore = calculateStructuredDataScore(organization);
    setScore(calculatedScore);

    // アニメーション効果
    const timer = setTimeout(() => {
      setAnimatedScore(calculatedScore);
    }, 100);

    return () => clearTimeout(timer);
  }, [organization]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-[var(--bg-primary)]';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <TrendingUp className="w-5 h-5 text-[var(--bg-primary)]" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'AI検索で高い評価を得られる構造化レベルです';
    if (score >= 60) return '基本的な構造化が完了しています';
    if (score >= 40) return '構造化を改善する余地があります';
    return '構造化データの追加が必要です';
  };

  const getRecommendations = (score: number) => {
    const recommendations = [];
    
    if (!organization.description) {
      recommendations.push('企業説明を追加');
    }
    if (!organization.logo_url) {
      recommendations.push('企業ロゴを設定');
    }
    if ((organization.services?.length || 0) < 3) {
      recommendations.push('サービス情報を追加（3件以上推奨）');
    }
    if ((organization.faqs?.length || 0) < 5) {
      recommendations.push('FAQ項目を追加（5件以上推奨）');
    }
    if ((organization.case_studies?.length || 0) === 0) {
      recommendations.push('導入事例を追加');
    }

    return recommendations.slice(0, 3); // 最大3つまで表示
  };

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        {getScoreIcon(score)}
        <h3 className="text-lg font-semibold text-neutral-900">構造化データスコア</h3>
      </div>

      {/* スコア表示 */}
      <div className="mb-6">
        <div className="flex items-end gap-2 mb-2">
          <div className={`text-3xl font-bold tabular-nums ${getScoreColor(score)}`}>
            {animatedScore}
          </div>
          <div className="text-lg text-neutral-600 mb-1">/100</div>
        </div>

        {/* プログレスバー */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full progress-bar ${
              score >= 80 ? 'bg-green-500' : 
              score >= 60 ? 'bg-blue-500' : 
              score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${animatedScore}%` }}
          />
        </div>

        <p className="text-sm text-neutral-600">
          {getScoreMessage(score)}
        </p>
      </div>

      {/* 改善提案 */}
      {score < 80 && (
        <div className={`p-4 rounded-lg ${getScoreBgColor(score)}`}>
          <h4 className="font-medium text-neutral-900 mb-2">改善提案</h4>
          <ul className="space-y-1">
            {getRecommendations(score).map((rec, index) => (
              <li key={index} className="text-sm text-neutral-700 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 高スコア時の表示 */}
      {score >= 80 && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">構造化データが最適化されています</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            AI検索エンジンが企業情報を正確に理解できる状態です。
          </p>
        </div>
      )}
    </div>
  );
}

export default StructuredDataScore;
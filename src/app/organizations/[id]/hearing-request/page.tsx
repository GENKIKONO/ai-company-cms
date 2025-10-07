'use client';

import { useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Phone, Mail, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface HearingRequestFormData {
  purpose: string;
  preferred_date: string;
  contact_phone: string;
  contact_email: string;
  business_overview: boolean;
  service_details: boolean;
  case_studies: boolean;
  competitive_advantage: boolean;
  target_market: boolean;
}

export default function HearingRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orgId, setOrgId] = useState<string>('');
  const [formData, setFormData] = useState<HearingRequestFormData>({
    purpose: '',
    preferred_date: '',
    contact_phone: '',
    contact_email: '',
    business_overview: false,
    service_details: false,
    case_studies: false,
    competitive_advantage: false,
    target_market: false,
  });

  // パラメータから組織IDを取得
  React.useEffect(() => {
    params.then(p => setOrgId(p.id));
  }, [params]);

  const hearingCategories = [
    { key: 'business_overview', label: '事業概要ヒアリング', description: '会社の基本的な事業内容や沿革' },
    { key: 'service_details', label: 'サービス詳細ヒアリング', description: '提供サービスの詳細な内容や特徴' },
    { key: 'case_studies', label: '事例・実績ヒアリング', description: '具体的な導入事例や成功実績' },
    { key: 'competitive_advantage', label: '競合優位性ヒアリング', description: '他社との差別化ポイントや強み' },
    { key: 'target_market', label: 'ターゲット市場ヒアリング', description: '対象顧客層や市場の特徴' },
  ];

  const handleCategoryChange = (key: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 最低1つのヒアリング項目が選択されているかチェック
    const hasSelectedCategory = hearingCategories.some(cat => formData[cat.key as keyof HearingRequestFormData]);
    if (!hasSelectedCategory) {
      alert('ヒアリング項目を1つ以上選択してください。');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/hearing-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: orgId,
          ...formData,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        const error = await response.json();
        alert(`エラー: ${error.message || 'ヒアリング依頼の送信に失敗しました。'}`);
      }
    } catch (error) {
      console.error('Hearing request submission error:', error);
      alert('ヒアリング依頼の送信中にエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ヒアリング依頼を受け付けました</h2>
          <p className="text-gray-600 mb-6">
            ご依頼いただきありがとうございます。<br />
            担当者より3営業日以内にご連絡いたします。
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={18} />
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={18} />
            ダッシュボードに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ヒアリング支援依頼</h1>
          <p className="text-gray-600">
            専門スタッフによる企業ヒアリングをご依頼いただけます。お客様のニーズに合わせて詳細な情報収集を行います。
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-8">
            {/* 依頼目的 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="inline w-4 h-4 mr-1" />
                依頼目的・背景 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ヒアリングの目的や背景をご記入ください（例：新規事業パートナー検討、市場調査、競合分析など）"
                required
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.purpose.length}/1000文字</p>
            </div>

            {/* 希望実施日 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                希望実施日
              </label>
              <input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">ご希望がある場合にご指定ください</p>
            </div>

            {/* 連絡先情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  連絡先電話番号
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="03-1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  連絡先メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            {/* ヒアリング項目 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <Users className="inline w-4 h-4 mr-1" />
                ヒアリング項目 <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-4">実施をご希望されるヒアリング項目を選択してください（複数選択可）</p>
              
              <div className="space-y-3">
                {hearingCategories.map((category) => (
                  <label key={category.key} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[category.key as keyof HearingRequestFormData] as boolean}
                      onChange={(e) => handleCategoryChange(category.key, e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{category.label}</div>
                      <div className="text-sm text-gray-600">{category.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '送信中...' : 'ヒアリング依頼を送信'}
              </button>
            </div>
          </form>
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">ご利用について</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• ヒアリング実施には3-5営業日のお時間をいただきます</li>
            <li>• 専門スタッフがお客様に代わって詳細な情報収集を行います</li>
            <li>• ヒアリング結果はレポート形式でご提供いたします</li>
            <li>• ご依頼内容によっては追加料金が発生する場合があります</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
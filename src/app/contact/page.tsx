'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BackLink } from '@/components/ui/back-link';
import { HIGButton } from '@/design-system';

// Map form subject to API category
const SUBJECT_TO_CATEGORY: Record<string, string> = {
  general: 'general',
  technical: 'support',
  billing: 'sales',
  feature: 'other',
  bug: 'support',
  partnership: 'partnership',
  other: 'other',
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company || undefined,
          category: SUBJECT_TO_CATEGORY[formData.subject] || 'general',
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'お問い合わせの送信に失敗しました');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="relative z-10 max-w-2xl mx-auto px-6 section-spacing">
          <div className="mb-8">
            <BackLink fallbackUrl="/" />
          </div>
          
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 p-12 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                <span className="text-emerald-600">
                  お問い合わせを受け付けました
                </span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                ご連絡いただきありがとうございます。<br />
                3営業日以内にご返信いたします。
              </p>
            </div>
            
            <Link href="/help">
              <HIGButton 
                variant="primary"
                size="lg"
                className="bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] border-none shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl px-8 py-4 text-lg font-semibold"
              >
                ヘルプセンターへ戻る
              </HIGButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="relative z-10 max-w-3xl mx-auto px-6 section-spacing">
        <div className="mb-8">
          <BackLink fallbackUrl="/" />
        </div>
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-full px-6 py-3 mb-8 text-sm font-semibold text-gray-700 shadow-lg">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
            お問い合わせ
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="text-[var(--aio-primary)]">
              ご質問・ご相談
            </span>
            <br />
            お気軽にどうぞ
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            どんな些細なことでも構いません。<br />
            お客様の成功をサポートするため、専門チームがお答えします。
          </p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="group">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]/30 focus:border-[var(--aio-primary)] transition-all duration-300 bg-gray-50/50 hover:bg-white group-hover:shadow-md"
                />
              </div>
              
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]/30 focus:border-[var(--aio-primary)] transition-all duration-300 bg-gray-50/50 hover:bg-white group-hover:shadow-md"
                />
              </div>
            </div>
            
            <div className="group">
              <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-3">
                会社名・組織名
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]/30 focus:border-[var(--aio-primary)] transition-all duration-300 bg-gray-50/50 hover:bg-white group-hover:shadow-md"
              />
            </div>
            
            <div className="group">
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-3">
                お問い合わせ種別 <span className="text-red-500">*</span>
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]/30 focus:border-[var(--aio-primary)] transition-all duration-300 bg-gray-50/50 hover:bg-white group-hover:shadow-md"
              >
                <option value="">選択してください</option>
                <option value="general">一般的なお問い合わせ</option>
                <option value="technical">技術的なサポート</option>
                <option value="billing">料金・契約について</option>
                <option value="feature">機能要望</option>
                <option value="bug">不具合の報告</option>
                <option value="other">その他</option>
              </select>
            </div>
            
            <div className="group">
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-3">
                お問い合わせ内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]/30 focus:border-[var(--aio-primary)] transition-all duration-300 bg-gray-50/50 hover:bg-white group-hover:shadow-md resize-none"
                placeholder="お問い合わせ内容を詳しくお書きください"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200/60 p-6 rounded-2xl">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">個人情報の取り扱いについて：</span><br />
                お客様からいただいた個人情報は、お問い合わせへの回答およびサービス向上のためにのみ使用いたします。
                詳細は <Link href="/privacy" className="text-[var(--aio-primary)] hover:text-blue-500 underline font-medium transition-colors duration-200">プライバシーポリシー</Link> をご確認ください。
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <div className="pt-4">
              <HIGButton
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                size="lg"
                className="w-full bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] border-none shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl py-5 text-lg font-semibold"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    送信中...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    送信する
                  </div>
                )}
              </HIGButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
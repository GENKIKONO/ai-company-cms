'use client';

import Link from 'next/link';
import { Organization } from '@/types/organization';

interface FirstTimeUserOnboardingProps {
  organization: Organization;
  userName?: string;
}

export function FirstTimeUserOnboarding({ organization, userName }: FirstTimeUserOnboardingProps) {
  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl opacity-60"></div>
      
      {/* Content */}
      <div className="relative glass-card backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 text-center">
        {/* Welcome Icon */}
        <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        {/* Welcome Message */}
        <div className="space-y-4 mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            ようこそ、{userName || 'あなた'}さん！
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {organization.name}の企業情報管理を始めましょう。
            <br />
            AIが数分で包括的な企業コンテンツを自動生成します。
          </p>
        </div>
        
        {/* Main CTA */}
        <div className="space-y-6">
          <Link
            href="/dashboard/settings"
            className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AIで企業情報を一括生成する
          </Link>
          
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            サービス紹介、導入事例、FAQ、企業概要などを自動で作成し、
            <br />
            プロフェッショナルな公開ページを数分で準備できます。
          </p>
        </div>
        
        {/* Feature Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center p-6 rounded-2xl bg-white/50 border border-gray-200/50">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AIコンテンツ生成</h3>
            <p className="text-sm text-gray-600">企業情報から自動でコンテンツを生成</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white/50 border border-gray-200/50">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">即座に公開</h3>
            <p className="text-sm text-gray-600">生成後すぐにプロ品質のページが利用可能</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white/50 border border-gray-200/50">
            <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">編集・カスタマイズ</h3>
            <p className="text-sm text-gray-600">生成後も自由に編集・調整可能</p>
          </div>
        </div>
      </div>
    </div>
  );
}
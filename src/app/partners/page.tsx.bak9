'use client';

import React, { useState } from 'react';
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { HandshakeIcon } from '@/lib/icons/placeholder';
import Link from 'next/link';

const PARTNER_BENEFITS = [
  {
    icon: CurrencyDollarIcon,
    title: '高額コミッション',
    description: '成約に応じて最大20%のコミッション。ティア制度で更なる報酬アップも可能。'
  },
  {
    icon: ChartBarIcon,
    title: 'リアルタイム分析',
    description: 'パフォーマンス追跡、収益分析、顧客動向を詳細にモニタリング。'
  },
  {
    icon: UserGroupIcon,
    title: '専属サポート',
    description: '専任アカウントマネージャーによる営業支援とマーケティングサポート。'
  },
  {
    icon: HandshakeIcon,
    title: '長期パートナーシップ',
    description: '安定した継続収益と成長を共にするビジネスパートナーシップ。'
  }
];

const PARTNER_TIERS = [
  {
    name: 'ブロンズ',
    commission: '5-10%',
    requirements: '月間売上 ¥100K+',
    benefits: ['基本サポート', 'マーケティング素材', '月次レポート']
  },
  {
    name: 'シルバー',
    commission: '10-15%',
    requirements: '月間売上 ¥500K+',
    benefits: ['優先サポート', 'カスタム素材', '週次レポート', '特別イベント招待']
  },
  {
    name: 'ゴールド',
    commission: '15-18%',
    requirements: '月間売上 ¥1M+',
    benefits: ['専任AM', 'ホワイトラベル', 'リアルタイム分析', '四半期ボーナス']
  },
  {
    name: 'プラチナ',
    commission: '18-20%',
    requirements: '月間売上 ¥3M+',
    benefits: ['エグゼクティブサポート', 'カスタム統合', '戦略相談', '年次ボーナス']
  }
];

export default function PartnersPage() {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <HandshakeIcon className="mx-auto h-16 w-16 text-blue-600 mb-8" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AIO Hub
              <span className="block text-blue-600">パートナープログラム</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AIマーケティングの未来を共に築き、持続可能な収益を獲得しませんか？
              高品質なリード、手厚いサポート、魅力的な報酬体系でお待ちしています。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsApplicationOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors flex items-center justify-center"
              >
                パートナー申請
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
              <Link
                href="/partners/dashboard"
                className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-medium transition-colors flex items-center justify-center"
              >
                ダッシュボード
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              なぜAIO Hubパートナーなのか？
            </h2>
            <p className="text-lg text-gray-600">
              業界最高レベルの条件と充実したサポートでパートナー様の成功をお約束します
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PARTNER_BENEFITS.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier System */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              パートナーティア制度
            </h2>
            <p className="text-lg text-gray-600">
              実績に応じてより高い報酬と特別な特典を獲得できます
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PARTNER_TIERS.map((tier, index) => (
              <div key={index} className={`bg-white rounded-lg shadow-md p-6 ${
                index === 2 ? 'ring-2 ring-blue-500 transform scale-105' : ''
              }`}>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {tier.commission}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {tier.requirements}
                  </div>
                  
                  <ul className="text-left space-y-2">
                    {tier.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                {index === 2 && (
                  <div className="mt-4 text-center">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      おすすめ
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            今すぐパートナーとして参加しませんか？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            申請から承認まで最短3営業日。まずはお気軽にお申し込みください。
          </p>
          <button
            onClick={() => setIsApplicationOpen(true)}
            className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-lg text-lg font-medium transition-colors"
          >
            無料で申請する
          </button>
        </div>
      </div>

      {/* Application Modal Placeholder */}
      {isApplicationOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">パートナー申請</h3>
            <p className="text-gray-600 mb-6">
              詳細な申請フォームは実装予定です。
              現在は問い合わせフォームからお申し込みください。
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsApplicationOpen(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded transition-colors"
              >
                閉じる
              </button>
              <Link
                href="/contact"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-center"
              >
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { ArrowRight, Database, Search, Zap } from 'lucide-react';
import Link from 'next/link';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  description: string;
  features: ReadonlyArray<{ readonly icon: string; readonly text: string }>;
  stats: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  primaryCta: { href: string; text: string };
  secondaryCta?: { href: string; text: string };
}

const iconComponents = {
  Database,
  Search,
  Zap,
};

export default function HeroSection({
  title,
  subtitle,
  description,
  features,
  stats,
  primaryCta,
  secondaryCta
}: HeroSectionProps) {
  return (
    <section className="relative pt-24 md:pt-32 pb-16 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* バッジ */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>{subtitle}</span>
          </div>
          
          {/* メインタイトル */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-wide">
            {title.split('\n').map((line, index) => (
              <span key={index} className="block">
                {index === 1 ? (
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {line}
                  </span>
                ) : (
                  line
                )}
              </span>
            ))}
          </h1>
          
          {/* サブタイトル */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            {description}
          </p>
          
          {/* 特徴ポイント */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 text-gray-700">
            {features.map((feature, index) => {
              const IconComponent = iconComponents[feature.icon as keyof typeof iconComponents];
              const colors = ['text-blue-500', 'text-purple-500', 'text-indigo-500'];
              
              return (
                <div key={index} className="flex items-center gap-2">
                  <IconComponent className={`w-5 h-5 ${colors[index]}`} />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>
          
          {/* CTAボタン */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href={primaryCta.href}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span>{primaryCta.text}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-300"
              >
                {secondaryCta.text}
              </Link>
            )}
          </div>
          
          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              const colors = ['text-blue-600', 'text-purple-600', 'text-indigo-600'];
              
              return (
                <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                  <div className={`text-3xl font-bold ${colors[index]} mb-2`}>{stat.value}</div>
                  <div className="text-gray-700 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
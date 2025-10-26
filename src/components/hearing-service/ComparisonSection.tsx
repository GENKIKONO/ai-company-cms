'use client';

import { X, Check } from 'lucide-react';

export default function ComparisonSection() {
  return (
    <section className="apple-section">
      <div className="apple-container">
        <div className="apple-section-header">
          <h2 className="apple-title1">構造化前後の違い</h2>
          <p className="apple-body-large apple-text-secondary">
            ヒアリングによってあなたの企業情報がどのように変わるかをご覧ください
          </p>
        </div>

        <div className="apple-comparison-grid">
          {/* Before Card */}
          <div className="apple-comparison-card apple-comparison-before">
            <div className="apple-comparison-header">
              <div className="apple-comparison-badge apple-comparison-badge-before">
                <X className="apple-comparison-badge-icon" />
                <span>構造化前</span>
              </div>
            </div>
            
            <div className="apple-comparison-content">
              <div className="apple-comparison-example">
                <div className="apple-comparison-text">
                  "弊社は総合的なITソリューションを提供しています..."
                </div>
              </div>
              <div className="apple-comparison-example">
                <div className="apple-comparison-text">
                  "様々な業界のお客様にご利用いただいております..."
                </div>
              </div>
              <div className="apple-comparison-example">
                <div className="apple-comparison-text">
                  "高品質なサービスで満足度向上を実現..."
                </div>
              </div>
            </div>
            
            <div className="apple-comparison-footer">
              <X className="apple-comparison-status-icon apple-comparison-error" />
              <span className="apple-comparison-status-text">抽象的で検索されにくい</span>
            </div>
          </div>

          {/* After Card */}
          <div className="apple-comparison-card apple-comparison-after">
            <div className="apple-comparison-header">
              <div className="apple-comparison-badge apple-comparison-badge-after">
                <Check className="apple-comparison-badge-icon" />
                <span>構造化後</span>
              </div>
            </div>
            
            <div className="apple-comparison-content">
              <div className="apple-comparison-structured">
                <div className="apple-comparison-structured-item apple-comparison-primary">
                  <div><strong>対象業界:</strong> 製造業・小売業・サービス業</div>
                  <div><strong>主力サービス:</strong> ECサイト構築・在庫管理システム</div>
                </div>
                <div className="apple-comparison-structured-item apple-comparison-secondary">
                  <div><strong>導入実績:</strong> 中小企業への豊富な導入経験</div>
                  <div><strong>特徴:</strong> 短期間での効果実現を重視</div>
                </div>
                <div className="apple-comparison-structured-item apple-comparison-tertiary">
                  <div><strong>差別化:</strong> ノーコード対応・24時間サポート</div>
                  <div><strong>価格:</strong> 月額5万円〜・初期費用無料</div>
                </div>
              </div>
            </div>
            
            <div className="apple-comparison-footer">
              <Check className="apple-comparison-status-icon apple-comparison-success" />
              <span className="apple-comparison-status-text">具体的でAIが理解しやすい</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
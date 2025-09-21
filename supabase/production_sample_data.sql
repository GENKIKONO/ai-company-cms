-- =====================================================
-- LuxuCare AI企業CMS 本番環境サンプルデータ
-- 注意: production_setup.sql 実行後に実行してください
-- =====================================================

-- 1. パートナー企業データ
INSERT INTO public.partners (id, name, website, logo_url, description) VALUES
('11111111-1111-1111-1111-111111111111', 'テクノロジーパートナーズ株式会社', 'https://techpartners.jp', NULL, 'AI技術のリーディングカンパニー'),
('22222222-2222-2222-2222-222222222222', 'ビジネスソリューションズ株式会社', 'https://biz-solutions.jp', NULL, '企業向け業務効率化ソリューション'),
('33333333-3333-3333-3333-333333333333', '統合システムズ株式会社', 'https://integration-sys.jp', NULL, 'システム統合・連携のエキスパート')
ON CONFLICT (id) DO NOTHING;

-- 2. サンプル組織データ
INSERT INTO public.organizations (
    id, name, slug, description, website, industry, founded_year, 
    employee_count, headquarters, status, contact_email, contact_phone,
    address_prefecture, address_city, address_line1, address_postal_code
) VALUES 
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'イノベーション株式会社',
    'innovation-corp',
    'AI技術を活用した革新的なソリューションを提供する企業です。機械学習、深層学習、自然言語処理などの最新技術を駆使し、企業のDXを支援しています。',
    'https://innovation-corp.jp',
    ARRAY['AI・機械学習', 'SaaS', 'コンサルティング'],
    2018,
    '51-200名',
    '東京都',
    'published',
    'info@innovation-corp.jp',
    '03-1234-5678',
    '東京都',
    '渋谷区',
    '神宮前1-1-1',
    '150-0001'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'フューチャーテック株式会社',
    'future-tech',
    '次世代技術の研究開発を行う先進的な企業です。ブロックチェーン、IoT、AR/VRなどの技術を組み合わせた新しいサービスを創造しています。',
    'https://future-tech.jp',
    ARRAY['ブロックチェーン', 'IoT', 'AR/VR'],
    2020,
    '11-50名',
    '東京都',
    'published',
    'contact@future-tech.jp',
    '03-2345-6789',
    '東京都',
    '港区',
    '六本木2-2-2',
    '106-0032'
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'データサイエンス研究所',
    'data-science-lab',
    'ビッグデータ解析とデータサイエンスの専門集団です。企業の持つデータから価値ある洞察を抽出し、意思決定を支援しています。',
    'https://data-science-lab.jp',
    ARRAY['データ分析', 'ビッグデータ', 'コンサルティング'],
    2016,
    '21-50名',
    '東京都',
    'published',
    'hello@data-science-lab.jp',
    '03-3456-7890',
    '東京都',
    '千代田区',
    '丸の内3-3-3',
    '100-0005'
)
ON CONFLICT (id) DO NOTHING;

-- 3. 各組織のサービス
INSERT INTO public.services (organization_id, name, description, category, price_range, features) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AI予測分析プラットフォーム', '機械学習アルゴリズムを活用した高精度な予測分析システム', 'AI・機械学習', '月額50万円〜', ARRAY['リアルタイム予測', '可視化ダッシュボード', 'API連携']),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'チャットボット構築サービス', '自然言語処理技術を使った高性能チャットボットの開発・運用', 'AI・機械学習', '初期費用100万円〜', ARRAY['多言語対応', '学習機能', '既存システム連携']),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ブロックチェーン決済システム', '安全で透明性の高いブロックチェーン技術を活用した決済プラットフォーム', 'ブロックチェーン', '月額30万円〜', ARRAY['暗号化通信', 'スマートコントラクト', 'マルチ通貨対応']),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'VR研修システム', '没入感のあるVR環境での企業研修プログラム', 'AR/VR', '年額200万円〜', ARRAY['カスタマイズ研修', '進捗管理', 'マルチプラットフォーム']),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ビッグデータ解析コンサルティング', '企業データの統合・分析・活用戦略立案', 'データ分析', '月額80万円〜', ARRAY['データ統合', '予測モデリング', '戦略立案']),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'リアルタイム分析ダッシュボード', 'リアルタイムでのデータ監視・分析・アラート機能', 'データ分析', '月額40万円〜', ARRAY['リアルタイム監視', 'カスタマイズ可能', 'アラート機能'])
ON CONFLICT DO NOTHING;

-- 4. 導入事例
INSERT INTO public.case_studies (organization_id, title, description, challenge, solution, results, client_name, industry, completion_date) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
 '製造業での予測保全システム導入', 
 '大手製造業での機械故障予測システムの導入事例',
 '設備の突発的な故障により生産ラインが停止し、大きな損失が発生していた',
 'IoTセンサーと機械学習を組み合わせた予測保全システムを構築',
 '故障予測精度95%を達成、ダウンタイムを70%削減、年間3億円のコスト削減を実現',
 '○○製造株式会社',
 '製造業',
 '2024-08-15'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '小売業界での顧客体験向上プロジェクト',
 'VR技術を活用した新しい顧客体験の創造',
 '実店舗での商品体験に限界があり、顧客満足度の向上が課題だった',
 'VR技術を活用したバーチャル商品体験システムを導入',
 '顧客満足度が40%向上、売上が25%増加、新規顧客獲得率が60%アップ',
 '△△リテール株式会社',
 '小売業',
 '2024-07-20'),
('cccccccc-cccc-cccc-cccc-cccccccccccc',
 '金融機関でのリスク分析高度化',
 'ビッグデータを活用したリスク評価モデルの構築',
 '従来の定性的なリスク評価では精度に限界があり、より高度な分析が必要だった',
 '機械学習とビッグデータ解析を組み合わせたリスク評価システムを開発',
 'リスク予測精度が30%向上、不良債権率を15%削減、審査時間を50%短縮',
 '□□銀行',
 '金融業',
 '2024-06-30')
ON CONFLICT DO NOTHING;

-- 5. よくある質問
INSERT INTO public.faqs (organization_id, question, answer, display_order) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'サービス導入までの期間はどの程度ですか？', 'プロジェクトの規模にもよりますが、通常3〜6ヶ月程度で導入が可能です。詳細な要件定義を行い、段階的に導入を進めることで、リスクを最小限に抑えています。', 1),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '既存システムとの連携は可能ですか？', 'はい、API連携やデータベース接続など、様々な方法で既存システムとの連携が可能です。事前に詳細な技術調査を行い、最適な連携方法をご提案いたします。', 2),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'セキュリティ対策はどのようになっていますか？', '最新の暗号化技術とブロックチェーン技術を組み合わせ、業界最高水準のセキュリティを実現しています。定期的なセキュリティ監査も実施しており、安心してご利用いただけます。', 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'サポート体制について教えてください', '24時間365日のテクニカルサポートを提供しています。また、専任のカスタマーサクセス担当者が、導入から運用まで一貫してサポートいたします。', 2),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'データの機密性は保たれますか？', '厳格なデータ管理プロセスとアクセス制御により、お客様のデータの機密性を確保しています。ISO27001認証も取得しており、国際的なセキュリティ基準に準拠しています。', 1),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'カスタマイズは可能ですか？', 'お客様の業務要件に合わせたカスタマイズが可能です。標準機能に加えて、特定のニーズに対応したカスタム機能の開発も承っております。', 2)
ON CONFLICT DO NOTHING;

-- 6. パートナーシップ
INSERT INTO public.partnerships (organization_id, partner_id, type, description, start_date) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'technology', 'AI技術の共同研究開発', '2024-01-01'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'business', 'ビジネス領域での戦略パートナーシップ', '2024-02-01'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'integration', 'システム統合ソリューションの提供', '2024-03-01')
ON CONFLICT DO NOTHING;

-- 7. ニュース
INSERT INTO public.news (organization_id, title, content, excerpt, published_date) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
 '新製品「AI予測分析プラットフォーム v2.0」をリリース',
 '当社は本日、AI予測分析プラットフォームの最新版「v2.0」をリリースいたしました。新バージョンでは、予測精度の向上、処理速度の高速化、UI/UXの改善を実現しています。',
 '予測精度向上と処理速度高速化を実現した新バージョンをリリース',
 '2024-09-01'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 'Series A資金調達完了のお知らせ',
 '当社は、複数の投資家から総額5億円のSeries A資金調達を完了いたしました。調達した資金は、製品開発の加速と優秀な人材の採用に活用してまいります。',
 'Series A資金調達により5億円を調達、事業拡大を加速',
 '2024-08-15'),
('cccccccc-cccc-cccc-cccc-cccccccccccc',
 'データサイエンティスト向け新サービス開始',
 'データサイエンティストの業務効率化を支援する新サービス「DataScience Accelerator」の提供を開始いたします。機械学習モデルの開発から運用まで一貫してサポートします。',
 'データサイエンティストの業務効率化を支援する新サービス開始',
 '2024-08-30')
ON CONFLICT DO NOTHING;

-- =====================================================
-- サンプルデータ投入完了！
-- =====================================================
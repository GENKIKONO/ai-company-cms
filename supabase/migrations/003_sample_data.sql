-- Sample Data for LuxuCare AI企業CMSシステム
-- 開発・テスト用のサンプルデータ

-- Insert sample partners
INSERT INTO public.partners (id, name, description, website_url, logo_url, partnership_type, is_active) VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-123456789001',
    'AI Tech Solutions Inc.',
    '先進的なAI技術ソリューションを提供するパートナー企業',
    'https://aitechsolutions.com',
    'https://via.placeholder.com/200x200/007ACC/FFFFFF?text=AI+Tech',
    'technology',
    true
),
(
    'a1b2c3d4-e5f6-7890-abcd-123456789002', 
    'Global Distribution Partners',
    'グローバル展開をサポートする流通パートナー',
    'https://gdpartners.com',
    'https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=GDP',
    'distribution',
    true
);

-- Insert sample organizations
INSERT INTO public.organizations (
    id, name, slug, description, legal_form, representative_name, founded, capital, employees,
    address_country, address_region, address_locality, address_postal_code, address_street,
    telephone, email, email_public, url, logo_url, industries, status, partner_id
) VALUES
(
    'b2c3d4e5-f6g7-8901-bcde-234567890001',
    'イノベーション株式会社',
    'innovation-corp',
    'AIとIoTを活用した次世代ビジネスソリューションを提供する革新的な企業です。スマートシティ、自動運転、ヘルスケアの分野で数多くの実績を持ち、日本のDX推進をリードしています。',
    '株式会社',
    '田中 太郎',
    '2018-04-01',
    100000000,
    150,
    'Japan',
    '東京都',
    '渋谷区',
    '150-0002',
    '道玄坂1-2-3 イノベーションビル10F',
    '03-1234-5678',
    'info@innovation-corp.jp',
    true,
    'https://innovation-corp.jp',
    'https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=Innovation',
    ARRAY['AI・機械学習', 'IoT', 'スマートシティ', 'ヘルスケア'],
    'published',
    'a1b2c3d4-e5f6-7890-abcd-123456789001'
),
(
    'b2c3d4e5-f6g7-8901-bcde-234567890002',
    'テックソリューションズ合同会社',
    'tech-solutions-llc',
    '中小企業向けのクラウドベースITソリューションを専門とする企業。低コストで高品質なシステム開発とコンサルティングサービスを提供し、地域企業のデジタル変革を支援しています。',
    '合同会社',
    '佐藤 花子',
    '2020-01-15',
    30000000,
    45,
    'Japan',
    '大阪府',
    '大阪市中央区',
    '541-0041',
    '船場中央1-4-5 テックビル3F',
    '06-2345-6789',
    'contact@tech-solutions.co.jp',
    true,
    'https://tech-solutions.co.jp',
    'https://via.placeholder.com/300x300/50C878/FFFFFF?text=TechSol',
    ARRAY['クラウド', 'システム開発', 'コンサルティング', 'DX支援'],
    'published',
    'a1b2c3d4-e5f6-7890-abcd-123456789002'
),
(
    'b2c3d4e5-f6g7-8901-bcde-234567890003',
    'フューチャーロボティクス株式会社',
    'future-robotics',
    '産業用ロボットと自動化システムの開発・製造を行う先端技術企業。製造業の生産性向上と働き方改革に貢献する革新的なロボティクスソリューションを提供しています。',
    '株式会社',
    '鈴木 一郎',
    '2015-09-01',
    500000000,
    280,
    'Japan',
    '愛知県',
    '名古屋市中区',
    '460-0008',
    '栄3-15-33 ロボティクスタワー15F',
    '052-3456-7890',
    'info@future-robotics.jp',
    true,
    'https://future-robotics.jp',
    'https://via.placeholder.com/300x300/FF6B35/FFFFFF?text=FutureBot',
    ARRAY['ロボティクス', '自動化', '製造業', 'AI'],
    'published',
    null
);

-- Insert sample services
INSERT INTO public.services (
    id, organization_id, name, description, features, categories, price_range, url, 
    supported_platforms, api_available, free_trial
) VALUES
(
    'c3d4e5f6-g7h8-9012-cdef-345678901001',
    'b2c3d4e5-f6g7-8901-bcde-234567890001',
    'AI予測分析プラットフォーム',
    'ビッグデータとAIを活用して、ビジネスの将来予測と最適化を支援するクラウドプラットフォーム',
    ARRAY['リアルタイム予測', '自動レポート生成', 'カスタムダッシュボード', 'API連携'],
    ARRAY['AI・機械学習', 'データ分析', 'ビジネスインテリジェンス'],
    '月額50万円〜',
    'https://innovation-corp.jp/ai-platform',
    ARRAY['Web', 'iOS', 'Android', 'API'],
    true,
    true
),
(
    'c3d4e5f6-g7h8-9012-cdef-345678901002',
    'b2c3d4e5-f6g7-8901-bcde-234567890001',
    'スマートシティ管理システム',
    '都市インフラの効率的な管理と市民サービスの向上を実現するIoT統合プラットフォーム',
    ARRAY['IoTセンサー管理', '交通最適化', 'エネルギー管理', '緊急時対応'],
    ARRAY['IoT', 'スマートシティ', 'インフラ管理'],
    '導入費用2000万円〜',
    'https://innovation-corp.jp/smart-city',
    ARRAY['Web', 'Mobile App'],
    true,
    false
),
(
    'c3d4e5f6-g7h8-9012-cdef-345678901003',
    'b2c3d4e5-f6g7-8901-bcde-234567890002',
    'クラウド会計システム',
    '中小企業向けの使いやすいクラウド型会計・経理管理システム',
    ARRAY['自動仕訳', '決算書作成', '税務申告サポート', 'モバイル対応'],
    ARRAY['会計', 'クラウド', '中小企業向け'],
    '月額5,000円〜',
    'https://tech-solutions.co.jp/accounting',
    ARRAY['Web', 'iOS', 'Android'],
    true,
    true
);

-- Insert sample case studies
INSERT INTO public.case_studies (
    id, organization_id, service_id, title, problem, solution, outcome, metrics,
    client_name, client_industry, client_size, published_date
) VALUES
(
    'd4e5f6g7-h8i9-0123-defg-456789012001',
    'b2c3d4e5-f6g7-8901-bcde-234567890001',
    'c3d4e5f6-g7h8-9012-cdef-345678901001',
    '大手小売チェーンの売上予測精度向上事例',
    '季節変動や外部要因を考慮した正確な売上予測が困難で、在庫過多や機会損失が発生していた',
    'AI予測分析プラットフォームを導入し、過去の売上データ、気象データ、イベント情報などを統合して機械学習モデルを構築',
    '売上予測精度が大幅に向上し、適切な在庫管理により収益性が改善された',
    '{"prediction_accuracy": "85%→95%", "inventory_reduction": "20%", "revenue_increase": "12%"}',
    '株式会社メガリテール',
    '小売業',
    '大企業',
    '2024-02-15'
),
(
    'd4e5f6g7-h8i9-0123-defg-456789012002',
    'b2c3d4e5-f6g7-8901-bcde-234567890002',
    'c3d4e5f6-g7h8-9012-cdef-345678901003',
    '地域工務店のデジタル化成功事例',
    '手作業による会計処理に時間がかかり、リアルタイムな経営状況の把握が困難だった',
    'クラウド会計システムを導入し、現場での工事進捗と連動した自動的な売上・原価管理を実現',
    '経理業務の効率化と経営の見える化により、事業拡大の基盤が整備された',
    '{"processing_time_reduction": "70%", "real_time_visibility": "100%", "error_reduction": "90%"}',
    '山田工務店',
    '建設業',
    '中小企業',
    '2024-01-20'
);

-- Insert sample FAQs
INSERT INTO public.faqs (
    id, organization_id, service_id, question, answer, category, order_index
) VALUES
(
    'e5f6g7h8-i9j0-1234-efgh-567890123001',
    'b2c3d4e5-f6g7-8901-bcde-234567890001',
    'c3d4e5f6-g7h8-9012-cdef-345678901001',
    'AI予測分析プラットフォームの導入期間はどの程度ですか？',
    '通常、要件定義から本格運用開始まで2-3ヶ月程度を要します。お客様のデータ状況や要求仕様により期間は変動します。',
    'サービス導入',
    1
),
(
    'e5f6g7h8-i9j0-1234-efgh-567890123002',
    'b2c3d4e5-f6g7-8901-bcde-234567890001',
    'c3d4e5f6-g7h8-9012-cdef-345678901001',
    'データのセキュリティは大丈夫ですか？',
    'ISO27001認証を取得しており、エンドツーエンドの暗号化とアクセス制御により、お客様のデータを最高レベルで保護しています。',
    'セキュリティ',
    2
),
(
    'e5f6g7h8-i9j0-1234-efgh-567890123003',
    'b2c3d4e5-f6g7-8901-bcde-234567890002',
    'c3d4e5f6-g7h8-9012-cdef-345678901003',
    '他の会計ソフトからのデータ移行は可能ですか？',
    'はい、弥生会計、freee、マネーフォワードなど主要な会計ソフトからのデータ移行をサポートしています。移行作業も弊社が代行いたします。',
    'データ移行',
    1
);

-- Insert sample news
INSERT INTO public.news (
    id, organization_id, title, content, summary, category, published_date, is_featured
) VALUES
(
    'f6g7h8i9-j0k1-2345-fghi-678901234001',
    'b2c3d4e5-f6g7-8901-bcde-234567890001',
    '新型AI予測エンジンをリリース',
    '当社は本日、従来比3倍の精度を実現する新型AI予測エンジン「PredictiveAI 3.0」をリリースいたしました...',
    '従来比3倍の精度を実現する新型AI予測エンジンをリリース',
    'プレスリリース',
    '2024-03-01',
    true
),
(
    'f6g7h8i9-j0k1-2345-fghi-678901234002',
    'b2c3d4e5-f6g7-8901-bcde-234567890002',
    'シリーズA資金調達を完了',
    '当社は本日、ベンチャーキャピタル数社を引受先とするシリーズA資金調達を完了したことをお知らせいたします...',
    'ベンチャーキャピタルからのシリーズA資金調達を完了',
    'プレスリリース',
    '2024-02-20',
    true
);

-- Insert sample partnerships
INSERT INTO public.partnerships (
    id, organization_a_id, organization_b_id, partnership_type, description, started_at, is_active
) VALUES
(
    'g7h8i9j0-k1l2-3456-ghij-789012345001',
    'b2c3d4e5-f6g7-8901-bcde-234567890001',
    'b2c3d4e5-f6g7-8901-bcde-234567890003',
    'technology',
    'AIとロボティクスの融合による次世代自動化ソリューションの共同開発',
    '2024-01-01',
    true
);
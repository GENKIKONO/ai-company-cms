#!/usr/bin/env node

/**
 * 認証・権限テスト用スクリプト
 * ブラウザでの手動テスト項目をガイド
 */

const testUsers = [
  {
    role: 'admin',
    email: 'admin@luxucare.com',
    password: 'AdminPass123!',
    permissions: [
      '全データの閲覧・編集・削除',
      'ユーザー管理機能',
      '管理画面アクセス',
      '組織のステータス変更'
    ]
  },
  {
    role: 'editor', 
    email: 'editor@luxucare.com',
    password: 'EditorPass123!',
    permissions: [
      '企業・サービス・事例データの閲覧・編集',
      '新規データ作成',
      '削除権限なし',
      '管理画面限定アクセス'
    ]
  },
  {
    role: 'viewer',
    email: 'viewer@luxucare.com', 
    password: 'ViewerPass123!',
    permissions: [
      '公開データの閲覧のみ',
      '編集・作成権限なし',
      'お気に入り機能'
    ]
  }
];

const testScenarios = [
  {
    name: '基本認証フロー',
    steps: [
      '1. https://aiohub.jp/auth/login にアクセス',
      '2. 各テストユーザーでログイン試行',
      '3. ログイン成功後のリダイレクト確認',
      '4. ユーザープロフィール表示確認',
      '5. ログアウト機能確認'
    ]
  },
  {
    name: '権限別アクセス制御',
    steps: [
      '1. Admin: /dashboard で全機能アクセス可能',
      '2. Editor: /dashboard で編集機能のみ',  
      '3. Viewer: /dashboard アクセス拒否',
      '4. 各ロールでの組織作成・編集・削除権限確認',
      '5. RLSによるデータ表示制限確認'
    ]
  },
  {
    name: 'データ操作権限',
    steps: [
      '1. Admin: 組織の新規作成・編集・削除・ステータス変更',
      '2. Editor: 組織の新規作成・編集（削除不可）', 
      '3. Viewer: 組織の閲覧のみ',
      '4. サービス・事例データでの同様確認',
      '5. 他ユーザーのデータへのアクセス制限確認'
    ]
  },
  {
    name: 'セッション・セキュリティ',
    steps: [
      '1. セッション有効期限の確認',
      '2. 不正なトークンでのアクセス拒否',
      '3. CSRF保護の確認',
      '4. HTTPSリダイレクト確認',
      '5. セキュリティヘッダーの確認'
    ]
  }
];

function printTestGuide() {
  console.log('🔐 LuxuCare AI企業CMS 認証・権限テストガイド');
  console.log('=' .repeat(60));
  
  console.log('\n👥 テストユーザー情報:');
  testUsers.forEach(user => {
    console.log(`\n📧 ${user.role.toUpperCase()}:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   権限:`);
    user.permissions.forEach(permission => {
      console.log(`     - ${permission}`);
    });
  });

  console.log('\n🧪 テストシナリオ:');
  testScenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}:`);
    scenario.steps.forEach(step => {
      console.log(`   ${step}`);
    });
  });

  console.log('\n✅ 成功基準:');
  console.log('   - 各ロールが適切な権限のみでアクセス可能');
  console.log('   - 不正アクセスが適切にブロックされる');
  console.log('   - セッション管理が正常に動作');
  console.log('   - セキュリティヘッダーが設定済み');

  console.log('\n⚠️  確認事項:');
  console.log('   - RLSポリシーによるデータフィルタリング');
  console.log('   - 認証エラー時の適切なメッセージ表示');
  console.log('   - ログアウト後のセッション無効化');
  console.log('   - 権限外操作の阻止');
}

// 自動テスト用ユーティリティ
function getTestUserCredentials(role) {
  const user = testUsers.find(u => u.role === role);
  if (!user) {
    throw new Error(`Unknown role: ${role}`);
  }
  return {
    email: user.email,
    password: user.password
  };
}

function getExpectedPermissions(role) {
  const user = testUsers.find(u => u.role === role);
  return user ? user.permissions : [];
}

// スクリプト実行
if (require.main === module) {
  printTestGuide();
}

module.exports = {
  testUsers,
  testScenarios,
  getTestUserCredentials,
  getExpectedPermissions,
  printTestGuide
};
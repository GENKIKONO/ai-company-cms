/**
 * 国際化（i18n）ユーティリティ (L1)
 * 多言語対応とローカライゼーション機能
 */

export type SupportedLocale = 'ja' | 'en' | 'zh' | 'ko';

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  dateFormat: string;
  numberFormat: {
    locale: string;
    currency: string;
    currencyDisplay: 'symbol' | 'code' | 'name';
  };
}

export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleConfig> = {
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: {
      locale: 'ja-JP',
      currency: 'JPY',
      currencyDisplay: 'symbol'
    }
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
    dateFormat: 'MMMM DD, YYYY',
    numberFormat: {
      locale: 'en-US',
      currency: 'USD',
      currencyDisplay: 'symbol'
    }
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    dir: 'ltr',
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: {
      locale: 'zh-CN',
      currency: 'CNY',
      currencyDisplay: 'symbol'
    }
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    dir: 'ltr',
    dateFormat: 'YYYY년 MM월 DD일',
    numberFormat: {
      locale: 'ko-KR',
      currency: 'KRW',
      currencyDisplay: 'symbol'
    }
  }
};

export const DEFAULT_LOCALE: SupportedLocale = 'ja';

/**
 * 翻訳辞書の型定義
 */
export interface TranslationDictionary {
  // 共通UI要素
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    filter: string;
    sort: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    close: string;
    open: string;
    more: string;
    less: string;
    all: string;
    none: string;
    yes: string;
    no: string;
  };

  // ナビゲーション
  navigation: {
    home: string;
    organizations: string;
    services: string;
    caseStudies: string;
    blog: string;
    about: string;
    contact: string;
    login: string;
    signup: string;
    dashboard: string;
    profile: string;
    settings: string;
    logout: string;
  };

  // 組織関連
  organization: {
    name: string;
    description: string;
    website: string;
    location: string;
    industry: string;
    size: string;
    founded: string;
    employees: string;
    services: string;
    caseStudies: string;
    contact: string;
    socialMedia: string;
    businessHours: string;
    timezone: string;
  };

  // サービス関連
  service: {
    name: string;
    description: string;
    category: string;
    price: string;
    duration: string;
    features: string;
    benefits: string;
    testimonials: string;
    faq: string;
    getStarted: string;
    learnMore: string;
    requestDemo: string;
  };

  // 検索
  search: {
    placeholder: string;
    search: string;
    advancedFilters: string;
    clearFilters: string;
    resultsCount: string;
    noResults: string;
    noResultsDescription: string;
    searching: string;
    smartSearch: string;
    sortBy: string;
    min: string;
    max: string;
    enhanced: {
      title: string;
      subtitle: string;
    };
    filters: {
      industries: string;
      regions: string;
      categories: string;
      companySize: string;
      foundedYear: string;
      other: string;
      hasAwards: string;
      hasCertifications: string;
    };
    companySize: {
      startup: string;
      small: string;
      medium: string;
      large: string;
      enterprise: string;
    };
    types: {
      all: string;
      organizations: string;
      services: string;
      caseStudies: string;
    };
    sort: {
      relevance: string;
      name: string;
      founded: string;
      updated: string;
      desc: string;
      asc: string;
    };
  };

  // ページネーション
  pagination: {
    previous: string;
    next: string;
    page: string;
  };

  // フォーム
  form: {
    required: string;
    optional: string;
    placeholder: {
      search: string;
      email: string;
      password: string;
      name: string;
      company: string;
      message: string;
    };
    validation: {
      required: string;
      email: string;
      minLength: string;
      maxLength: string;
      pattern: string;
    };
  };

  // メッセージ
  messages: {
    welcome: string;
    success: {
      created: string;
      updated: string;
      deleted: string;
      sent: string;
    };
    error: {
      generic: string;
      notFound: string;
      unauthorized: string;
      forbidden: string;
      validation: string;
      network: string;
    };
  };

  // SEO・メタデータ
  seo: {
    title: {
      home: string;
      organizations: string;
      search: string;
      about: string;
      contact: string;
    };
    description: {
      home: string;
      organizations: string;
      search: string;
      about: string;
      contact: string;
    };
  };
}

/**
 * 翻訳辞書
 */
export const translations: Record<SupportedLocale, TranslationDictionary> = {
  ja: {
    common: {
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      cancel: 'キャンセル',
      save: '保存',
      delete: '削除',
      edit: '編集',
      create: '作成',
      search: '検索',
      filter: '絞り込み',
      sort: '並び替え',
      back: '戻る',
      next: '次へ',
      previous: '前へ',
      submit: '送信',
      close: '閉じる',
      open: '開く',
      more: 'もっと見る',
      less: '閉じる',
      all: 'すべて',
      none: 'なし',
      yes: 'はい',
      no: 'いいえ'
    },
    navigation: {
      home: 'ホーム',
      organizations: '企業一覧',
      services: 'サービス',
      caseStudies: '事例',
      blog: 'ブログ',
      about: 'AIO Hubについて',
      contact: 'お問い合わせ',
      login: 'ログイン',
      signup: '新規登録',
      dashboard: 'ダッシュボード',
      profile: 'プロフィール',
      settings: '設定',
      logout: 'ログアウト'
    },
    organization: {
      name: '企業名',
      description: '企業説明',
      website: 'ウェブサイト',
      location: '所在地',
      industry: '業界',
      size: '企業規模',
      founded: '設立年',
      employees: '従業員数',
      services: 'サービス',
      caseStudies: '導入事例',
      contact: 'お問い合わせ',
      socialMedia: 'SNS',
      businessHours: '営業時間',
      timezone: 'タイムゾーン'
    },
    service: {
      name: 'サービス名',
      description: 'サービス説明',
      category: 'カテゴリ',
      price: '料金',
      duration: '期間',
      features: '機能',
      benefits: 'メリット',
      testimonials: 'お客様の声',
      faq: 'よくある質問',
      getStarted: '始める',
      learnMore: '詳しく見る',
      requestDemo: 'デモを依頼'
    },
    search: {
      placeholder: 'AI・DX企業、サービス、事例を検索...',
      search: '検索',
      advancedFilters: '高度なフィルター',
      clearFilters: 'フィルターをクリア',
      resultsCount: '{count}件の結果',
      noResults: '検索結果が見つかりませんでした',
      noResultsDescription: '検索条件を変更してお試しください',
      searching: '検索中',
      smartSearch: 'スマート検索',
      sortBy: '並び替え',
      min: '最小',
      max: '最大',
      enhanced: {
        title: '高度検索',
        subtitle: '詳細なフィルタリングで理想の企業・サービス・事例を見つけましょう'
      },
      types: {
        all: 'すべて',
        organizations: '企業',
        services: 'サービス',
        caseStudies: '事例'
      },
      filters: {
        industries: '業界',
        regions: '地域',
        categories: 'カテゴリ',
        companySize: '企業規模',
        foundedYear: '設立年',
        other: 'その他',
        hasAwards: '受賞歴あり',
        hasCertifications: '認証取得'
      },
      companySize: {
        startup: 'スタートアップ（〜10名）',
        small: '小企業（11〜50名）',
        medium: '中企業（51〜200名）',
        large: '大企業（201〜1000名）',
        enterprise: '大手企業（1001名〜）'
      },
      sort: {
        relevance: '関連度',
        name: '名前',
        founded: '設立年',
        updated: '更新日',
        desc: '降順',
        asc: '昇順'
      }
    },
    pagination: {
      previous: '前へ',
      next: '次へ',
      page: 'ページ'
    },
    form: {
      required: '必須',
      optional: '任意',
      placeholder: {
        search: 'キーワードを入力...',
        email: 'メールアドレス',
        password: 'パスワード',
        name: 'お名前',
        company: '会社名',
        message: 'メッセージ'
      },
      validation: {
        required: 'この項目は必須です',
        email: '正しいメールアドレスを入力してください',
        minLength: '文字以上で入力してください',
        maxLength: '文字以内で入力してください',
        pattern: '正しい形式で入力してください'
      }
    },
    messages: {
      welcome: 'AIO Hubへようこそ',
      success: {
        created: '作成しました',
        updated: '更新しました',
        deleted: '削除しました',
        sent: '送信しました'
      },
      error: {
        generic: 'エラーが発生しました',
        notFound: 'ページが見つかりません',
        unauthorized: 'ログインが必要です',
        forbidden: 'アクセス権限がありません',
        validation: '入力内容に誤りがあります',
        network: 'ネットワークエラーが発生しました'
      }
    },
    seo: {
      title: {
        home: 'AIO Hub - AI・DX企業ディレクトリ',
        organizations: '企業一覧 - AIO Hub',
        search: '企業検索 - AIO Hub',
        about: 'AIO Hubについて',
        contact: 'お問い合わせ - AIO Hub'
      },
      description: {
        home: 'AI・DX領域の企業情報を集約したディレクトリサービス。企業詳細、サービス、事例を検索・比較できます。',
        organizations: 'AI・DX企業の一覧ページ。業界、規模、サービス内容で企業を検索・比較できます。',
        search: 'AI・DX企業の検索ページ。キーワード、カテゴリ、地域で企業を絞り込めます。',
        about: 'AIO Hubは、AI・DX領域の企業情報を集約したディレクトリサービスです。',
        contact: 'AIO Hubへのお問い合わせ。サービスに関するご質問やご相談をお受けします。'
      }
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      close: 'Close',
      open: 'Open',
      more: 'Show more',
      less: 'Show less',
      all: 'All',
      none: 'None',
      yes: 'Yes',
      no: 'No'
    },
    navigation: {
      home: 'Home',
      organizations: 'Organizations',
      services: 'Services',
      caseStudies: 'Case Studies',
      blog: 'Blog',
      about: 'About AIO Hub',
      contact: 'Contact',
      login: 'Login',
      signup: 'Sign Up',
      dashboard: 'Dashboard',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout'
    },
    organization: {
      name: 'Company Name',
      description: 'Description',
      website: 'Website',
      location: 'Location',
      industry: 'Industry',
      size: 'Company Size',
      founded: 'Founded',
      employees: 'Employees',
      services: 'Services',
      caseStudies: 'Case Studies',
      contact: 'Contact',
      socialMedia: 'Social Media',
      businessHours: 'Business Hours',
      timezone: 'Timezone'
    },
    service: {
      name: 'Service Name',
      description: 'Description',
      category: 'Category',
      price: 'Price',
      duration: 'Duration',
      features: 'Features',
      benefits: 'Benefits',
      testimonials: 'Testimonials',
      faq: 'FAQ',
      getStarted: 'Get Started',
      learnMore: 'Learn More',
      requestDemo: 'Request Demo'
    },
    search: {
      placeholder: 'Search AI & DX companies, services, case studies...',
      search: 'Search',
      advancedFilters: 'Advanced Filters',
      clearFilters: 'Clear Filters',
      resultsCount: '{count} results',
      noResults: 'No results found',
      noResultsDescription: 'Try changing your search criteria',
      searching: 'Searching',
      smartSearch: 'Smart Search',
      sortBy: 'Sort by',
      min: 'Min',
      max: 'Max',
      enhanced: {
        title: 'Advanced Search',
        subtitle: 'Find the perfect companies, services, and case studies with detailed filtering'
      },
      types: {
        all: 'All',
        organizations: 'Organizations',
        services: 'Services',
        caseStudies: 'Case Studies'
      },
      filters: {
        industries: 'Industries',
        regions: 'Regions',
        categories: 'Categories',
        companySize: 'Company Size',
        foundedYear: 'Founded Year',
        other: 'Other',
        hasAwards: 'Has Awards',
        hasCertifications: 'Has Certifications'
      },
      companySize: {
        startup: 'Startup (1-10)',
        small: 'Small (11-50)',
        medium: 'Medium (51-200)',
        large: 'Large (201-1000)',
        enterprise: 'Enterprise (1001+)'
      },
      sort: {
        relevance: 'Relevance',
        name: 'Name',
        founded: 'Founded',
        updated: 'Updated',
        desc: 'Descending',
        asc: 'Ascending'
      }
    },
    pagination: {
      previous: 'Previous',
      next: 'Next',
      page: 'Page'
    },
    form: {
      required: 'Required',
      optional: 'Optional',
      placeholder: {
        search: 'Enter keywords...',
        email: 'Email address',
        password: 'Password',
        name: 'Name',
        company: 'Company',
        message: 'Message'
      },
      validation: {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        minLength: 'Must be at least',
        maxLength: 'Must be no more than',
        pattern: 'Please enter in the correct format'
      }
    },
    messages: {
      welcome: 'Welcome to AIO Hub',
      success: {
        created: 'Created successfully',
        updated: 'Updated successfully',
        deleted: 'Deleted successfully',
        sent: 'Sent successfully'
      },
      error: {
        generic: 'An error occurred',
        notFound: 'Page not found',
        unauthorized: 'Login required',
        forbidden: 'Access denied',
        validation: 'Please check your input',
        network: 'Network error occurred'
      }
    },
    seo: {
      title: {
        home: 'AIO Hub - AI & DX Company Directory',
        organizations: 'Companies - AIO Hub',
        search: 'Search Companies - AIO Hub',
        about: 'About AIO Hub',
        contact: 'Contact - AIO Hub'
      },
      description: {
        home: 'A comprehensive directory of AI and DX companies. Search and compare company details, services, and case studies.',
        organizations: 'Browse AI and DX companies. Search and compare by industry, size, and services.',
        search: 'Search AI and DX companies by keywords, categories, and regions.',
        about: 'AIO Hub is a comprehensive directory service for AI and DX companies.',
        contact: 'Contact AIO Hub for inquiries about our services and platform.'
      }
    }
  },
  zh: {
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      create: '创建',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      back: '返回',
      next: '下一页',
      previous: '上一页',
      submit: '提交',
      close: '关闭',
      open: '打开',
      more: '查看更多',
      less: '收起',
      all: '全部',
      none: '无',
      yes: '是',
      no: '否'
    },
    navigation: {
      home: '首页',
      organizations: '企业目录',
      services: '服务',
      caseStudies: '案例研究',
      blog: '博客',
      about: '关于AIO Hub',
      contact: '联系我们',
      login: '登录',
      signup: '注册',
      dashboard: '控制台',
      profile: '个人资料',
      settings: '设置',
      logout: '退出登录'
    },
    organization: {
      name: '公司名称',
      description: '公司描述',
      website: '网站',
      location: '地址',
      industry: '行业',
      size: '公司规模',
      founded: '成立时间',
      employees: '员工数',
      services: '服务',
      caseStudies: '案例研究',
      contact: '联系方式',
      socialMedia: '社交媒体',
      businessHours: '营业时间',
      timezone: '时区'
    },
    service: {
      name: '服务名称',
      description: '服务描述',
      category: '类别',
      price: '价格',
      duration: '期限',
      features: '功能',
      benefits: '优势',
      testimonials: '客户评价',
      faq: '常见问题',
      getStarted: '开始使用',
      learnMore: '了解更多',
      requestDemo: '申请演示'
    },
    search: {
      placeholder: '搜索AI和数字化转型企业、服务、案例...',
      search: '搜索',
      advancedFilters: '高级筛选',
      clearFilters: '清除筛选',
      resultsCount: '{count}个结果',
      noResults: '未找到搜索结果',
      noResultsDescription: '请尝试修改搜索条件',
      searching: '搜索中',
      smartSearch: '智能搜索',
      sortBy: '排序方式',
      min: '最小值',
      max: '最大值',
      enhanced: {
        title: '高级搜索',
        subtitle: '通过详细筛选找到理想的企业、服务和案例研究'
      },
      types: {
        all: '全部',
        organizations: '企业',
        services: '服务',
        caseStudies: '案例研究'
      },
      filters: {
        industries: '行业',
        regions: '地区',
        categories: '类别',
        companySize: '公司规模',
        foundedYear: '成立年份',
        other: '其他',
        hasAwards: '有获奖记录',
        hasCertifications: '有认证资质'
      },
      companySize: {
        startup: '初创企业（1-10人）',
        small: '小型企业（11-50人）',
        medium: '中型企业（51-200人）',
        large: '大型企业（201-1000人）',
        enterprise: '企业集团（1001人以上）'
      },
      sort: {
        relevance: '相关性',
        name: '名称',
        founded: '成立时间',
        updated: '更新时间',
        desc: '降序',
        asc: '升序'
      }
    },
    pagination: {
      previous: '上一页',
      next: '下一页',
      page: '页'
    },
    form: {
      required: '必填',
      optional: '选填',
      placeholder: {
        search: '输入关键词...',
        email: '邮箱地址',
        password: '密码',
        name: '姓名',
        company: '公司名称',
        message: '留言'
      },
      validation: {
        required: '此项为必填项',
        email: '请输入有效的邮箱地址',
        minLength: '至少需要',
        maxLength: '最多不超过',
        pattern: '请按正确格式输入'
      }
    },
    messages: {
      welcome: '欢迎来到AIO Hub',
      success: {
        created: '创建成功',
        updated: '更新成功',
        deleted: '删除成功',
        sent: '发送成功'
      },
      error: {
        generic: '发生错误',
        notFound: '页面未找到',
        unauthorized: '需要登录',
        forbidden: '访问被拒绝',
        validation: '请检查输入内容',
        network: '网络错误'
      }
    },
    seo: {
      title: {
        home: 'AIO Hub - AI和数字化转型企业目录',
        organizations: '企业列表 - AIO Hub',
        search: '企业搜索 - AIO Hub',
        about: '关于AIO Hub',
        contact: '联系我们 - AIO Hub'
      },
      description: {
        home: 'AI和数字化转型领域的综合企业目录。搜索和比较企业详情、服务和案例研究。',
        organizations: '浏览AI和数字化转型企业。按行业、规模和服务进行搜索和比较。',
        search: '按关键词、类别和地区搜索AI和数字化转型企业。',
        about: 'AIO Hub是AI和数字化转型企业的综合目录服务。',
        contact: '联系AIO Hub咨询我们的服务和平台。'
      }
    }
  },
  ko: {
    common: {
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      cancel: '취소',
      save: '저장',
      delete: '삭제',
      edit: '편집',
      create: '생성',
      search: '검색',
      filter: '필터',
      sort: '정렬',
      back: '뒤로',
      next: '다음',
      previous: '이전',
      submit: '제출',
      close: '닫기',
      open: '열기',
      more: '더 보기',
      less: '접기',
      all: '전체',
      none: '없음',
      yes: '예',
      no: '아니오'
    },
    navigation: {
      home: '홈',
      organizations: '기업 목록',
      services: '서비스',
      caseStudies: '사례 연구',
      blog: '블로그',
      about: 'AIO Hub 소개',
      contact: '문의하기',
      login: '로그인',
      signup: '회원가입',
      dashboard: '대시보드',
      profile: '프로필',
      settings: '설정',
      logout: '로그아웃'
    },
    organization: {
      name: '회사명',
      description: '회사 설명',
      website: '웹사이트',
      location: '위치',
      industry: '산업',
      size: '회사 규모',
      founded: '설립연도',
      employees: '직원 수',
      services: '서비스',
      caseStudies: '사례 연구',
      contact: '연락처',
      socialMedia: '소셜 미디어',
      businessHours: '영업시간',
      timezone: '시간대'
    },
    service: {
      name: '서비스명',
      description: '서비스 설명',
      category: '카테고리',
      price: '가격',
      duration: '기간',
      features: '기능',
      benefits: '혜택',
      testimonials: '고객 후기',
      faq: '자주 묻는 질문',
      getStarted: '시작하기',
      learnMore: '자세히 보기',
      requestDemo: '데모 요청'
    },
    search: {
      placeholder: 'AI 및 DX 기업, 서비스, 사례 연구 검색...',
      search: '검색',
      advancedFilters: '고급 필터',
      clearFilters: '필터 지우기',
      resultsCount: '{count}개 결과',
      noResults: '검색 결과가 없습니다',
      noResultsDescription: '검색 조건을 변경해 보세요',
      searching: '검색 중',
      smartSearch: '스마트 검색',
      sortBy: '정렬 기준',
      min: '최소',
      max: '최대',
      enhanced: {
        title: '고급 검색',
        subtitle: '상세 필터링으로 완벽한 기업, 서비스, 사례 연구를 찾아보세요'
      },
      types: {
        all: '전체',
        organizations: '기업',
        services: '서비스',
        caseStudies: '사례 연구'
      },
      filters: {
        industries: '산업',
        regions: '지역',
        categories: '카테고리',
        companySize: '회사 규모',
        foundedYear: '설립연도',
        other: '기타',
        hasAwards: '수상 경력 보유',
        hasCertifications: '인증 보유'
      },
      companySize: {
        startup: '스타트업 (1-10명)',
        small: '소기업 (11-50명)',
        medium: '중기업 (51-200명)',
        large: '대기업 (201-1000명)',
        enterprise: '대기업 (1001명 이상)'
      },
      sort: {
        relevance: '관련성',
        name: '이름',
        founded: '설립연도',
        updated: '업데이트',
        desc: '내림차순',
        asc: '오름차순'
      }
    },
    pagination: {
      previous: '이전',
      next: '다음',
      page: '페이지'
    },
    form: {
      required: '필수',
      optional: '선택',
      placeholder: {
        search: '키워드 입력...',
        email: '이메일 주소',
        password: '비밀번호',
        name: '이름',
        company: '회사명',
        message: '메시지'
      },
      validation: {
        required: '이 필드는 필수입니다',
        email: '유효한 이메일 주소를 입력하세요',
        minLength: '최소',
        maxLength: '최대',
        pattern: '올바른 형식으로 입력하세요'
      }
    },
    messages: {
      welcome: 'AIO Hub에 오신 것을 환영합니다',
      success: {
        created: '생성되었습니다',
        updated: '업데이트되었습니다',
        deleted: '삭제되었습니다',
        sent: '전송되었습니다'
      },
      error: {
        generic: '오류가 발생했습니다',
        notFound: '페이지를 찾을 수 없습니다',
        unauthorized: '로그인이 필요합니다',
        forbidden: '접근이 거부되었습니다',
        validation: '입력 내용을 확인해주세요',
        network: '네트워크 오류가 발생했습니다'
      }
    },
    seo: {
      title: {
        home: 'AIO Hub - AI 및 DX 기업 디렉토리',
        organizations: '기업 목록 - AIO Hub',
        search: '기업 검색 - AIO Hub',
        about: 'AIO Hub 소개',
        contact: '문의하기 - AIO Hub'
      },
      description: {
        home: 'AI 및 디지털 전환 분야의 포괄적인 기업 디렉토리. 기업 정보, 서비스, 사례 연구를 검색하고 비교하세요.',
        organizations: 'AI 및 DX 기업을 탐색하세요. 산업, 규모, 서비스별로 검색하고 비교할 수 있습니다.',
        search: '키워드, 카테고리, 지역별로 AI 및 DX 기업을 검색하세요.',
        about: 'AIO Hub는 AI 및 DX 기업의 종합 디렉토리 서비스입니다.',
        contact: '서비스 및 플랫폼에 대한 문의는 AIO Hub로 연락하세요.'
      }
    }
  }
};

/**
 * i18n管理クラス
 */
export class I18nManager {
  private currentLocale: SupportedLocale = DEFAULT_LOCALE;
  private fallbackLocale: SupportedLocale = DEFAULT_LOCALE;

  constructor(initialLocale?: SupportedLocale) {
    if (initialLocale && this.isValidLocale(initialLocale)) {
      this.currentLocale = initialLocale;
    } else {
      this.currentLocale = this.detectLocale();
    }
  }

  /**
   * 現在のロケール取得
   */
  getCurrentLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * ロケール設定
   */
  setLocale(locale: SupportedLocale): void {
    if (this.isValidLocale(locale)) {
      this.currentLocale = locale;
      this.saveToStorage(locale);
      this.updateDocumentLanguage(locale);
    }
  }

  /**
   * 翻訳取得
   */
  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLocale];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    // フォールバック
    if (value === undefined) {
      let fallbackValue: any = translations[this.fallbackLocale];
      for (const k of keys) {
        fallbackValue = fallbackValue?.[k];
        if (fallbackValue === undefined) break;
      }
      value = fallbackValue || key;
    }

    // パラメータ置換
    if (typeof value === 'string' && params) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), String(val));
      });
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * 複数形対応翻訳
   */
  tn(key: string, count: number, params?: Record<string, string | number>): string {
    const singularKey = `${key}.singular`;
    const pluralKey = `${key}.plural`;
    
    const targetKey = count === 1 ? singularKey : pluralKey;
    return this.t(targetKey, { ...params, count });
  }

  /**
   * 日付フォーマット
   */
  formatDate(date: Date): string {
    const config = SUPPORTED_LOCALES[this.currentLocale];
    return new Intl.DateTimeFormat(config.numberFormat.locale).format(date);
  }

  /**
   * 数値フォーマット
   */
  formatNumber(number: number): string {
    const config = SUPPORTED_LOCALES[this.currentLocale];
    return new Intl.NumberFormat(config.numberFormat.locale).format(number);
  }

  /**
   * 通貨フォーマット
   */
  formatCurrency(amount: number): string {
    const config = SUPPORTED_LOCALES[this.currentLocale];
    return new Intl.NumberFormat(config.numberFormat.locale, {
      style: 'currency',
      currency: config.numberFormat.currency,
      currencyDisplay: config.numberFormat.currencyDisplay
    }).format(amount);
  }

  /**
   * 利用可能なロケール一覧
   */
  getAvailableLocales(): LocaleConfig[] {
    return Object.values(SUPPORTED_LOCALES);
  }

  /**
   * ロケール検出
   */
  private detectLocale(): SupportedLocale {
    // 1. ストレージから取得
    const stored = this.loadFromStorage();
    if (stored && this.isValidLocale(stored)) {
      return stored;
    }

    // 2. ブラウザ言語設定から取得
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language.split('-')[0] as SupportedLocale;
      if (this.isValidLocale(browserLang)) {
        return browserLang;
      }
    }

    // 3. デフォルト
    return DEFAULT_LOCALE;
  }

  private isValidLocale(locale: string): locale is SupportedLocale {
    return Object.keys(SUPPORTED_LOCALES).includes(locale);
  }

  private saveToStorage(locale: SupportedLocale): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aiohub_locale', locale);
      } catch (error) {
        console.warn('Failed to save locale to storage:', error);
      }
    }
  }

  private loadFromStorage(): SupportedLocale | null {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('aiohub_locale');
        return stored as SupportedLocale;
      } catch (error) {
        console.warn('Failed to load locale from storage:', error);
      }
    }
    return null;
  }

  private updateDocumentLanguage(locale: SupportedLocale): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = SUPPORTED_LOCALES[locale].dir;
    }
  }
}

// グローバルインスタンス
export const i18n = new I18nManager();

/**
 * React Hook for i18n
 */
export function useTranslation() {
  return {
    t: i18n.t.bind(i18n),
    tn: i18n.tn.bind(i18n),
    locale: i18n.getCurrentLocale(),
    setLocale: i18n.setLocale.bind(i18n),
    availableLocales: i18n.getAvailableLocales(),
    formatDate: i18n.formatDate.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n)
  };
}
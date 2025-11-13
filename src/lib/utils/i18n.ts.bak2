import { logger } from '@/lib/utils/logger';

/**
 * 国際化（i18n）ユーティリティ (L1)
 * 多言語対応とローカライゼーション機能
 */

export type SupportedLocale = 'ja';

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

  // ページ固有の翻訳
  pages: {
    home: {
      title: string;
      description: string;
      hero: {
        title: string;
        subtitle: string;
        viewDirectory: string;
      };
      features: {
        title: string;
        subtitle: string;
        organizationManagement: {
          title: string;
          description: string;
        };
        serviceManagement: {
          title: string;
          description: string;
        };
        caseManagement: {
          title: string;
          description: string;
        };
      };
      stats: {
        title: string;
        organizations: string;
        services: string;
        cases: string;
        categories: string;
      };
      message: {
        title: string;
        content: string;
      };
      cta: {
        title: string;
        subtitle: string;
        button: string;
      };
      footer: {
        tagline: string;
        features: string;
        links: string;
        support: string;
        directory: string;
        search: string;
        helpCenter: string;
        contact: string;
        terms: string;
        privacy: string;
        copyright: string;
      };
    };
  };

  // UI共通要素
  ui: {
    header: {
      title: string;
      dashboard: string;
    };
    common: {
      getStarted: string;
      tryFree: string;
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
    },
    pages: {
      home: {
        title: 'AIO Hub - AI・DX企業ディレクトリ',
        description: 'AI技術を活用した企業情報の統合管理プラットフォーム',
        hero: {
          title: 'AIO Hub AI企業CMS',
          subtitle: 'AI技術を活用した企業情報の統合管理プラットフォーム',
          viewDirectory: '企業ディレクトリを見る'
        },
        features: {
          title: '充実した機能',
          subtitle: 'AI・DX領域の企業情報を効率的に管理・活用できます',
          organizationManagement: {
            title: '企業管理',
            description: 'AI・DX企業の詳細情報を包括的に管理。プロフィール、サービス、導入事例まで一元管理できます。'
          },
          serviceManagement: {
            title: 'サービス管理',
            description: '企業が提供するAI・DXサービスの詳細情報を管理。特徴、価格、技術仕様まで網羅的に記録できます。'
          },
          caseManagement: {
            title: '導入事例管理',
            description: '成功事例や実績を効果的に管理・発信。顧客の声や成果を分かりやすく伝えることができます。'
          }
        },
        stats: {
          title: '実績・統計',
          organizations: '企業',
          services: 'サービス',
          cases: '導入事例',
          categories: 'カテゴリー'
        },
        message: {
          title: '代表メッセージ',
          content: '私たちは、AI技術を通じて企業の情報発信を支援し、より良いビジネス成果の実現をお手伝いします。'
        },
        cta: {
          title: '今すぐ始めましょう',
          subtitle: 'AI・DXビジネスの成長を加速させる\n最適なソリューションをご提供します',
          button: '無料で始める'
        },
        footer: {
          tagline: 'AI・DX企業情報の統合管理プラットフォーム',
          features: '機能',
          links: 'リンク',
          support: 'サポート',
          directory: '企業ディレクトリ',
          search: '検索',
          helpCenter: 'ヘルプセンター',
          contact: 'お問い合わせ',
          terms: '利用規約',
          privacy: 'プライバシーポリシー',
          copyright: '© 2025 AIO Hub. All rights reserved.'
        }
      }
    },
    ui: {
      header: {
        title: 'AIO Hub AI企業CMS',
        dashboard: 'ダッシュボード'
      },
      common: {
        getStarted: '始める',
        tryFree: '無料で始める'
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
        logger.warn('Failed to save locale to storage', error);
      }
    }
  }

  private loadFromStorage(): SupportedLocale | null {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('aiohub_locale');
        return stored as SupportedLocale;
      } catch (error) {
        logger.warn('Failed to load locale from storage', error);
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
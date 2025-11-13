'use client';

import { useState, useRef, useEffect } from 'react';
import { useI18n, type Locale } from '@/components/layout/I18nProvider';
import { Globe2, ChevronDown } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' }
];

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'button';
  showFlag?: boolean;
  showNativeName?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
  className = ''
}: LanguageSelectorProps) {
  // 日本語専用運用のため、言語選択UIは非表示
  return null;
}

export function MobileLanguageSelector({ className = '' }: { className?: string }) {
  // 日本語専用運用のため、言語選択UIは非表示
  return null;
}

export type { Language };
export { SUPPORTED_LANGUAGES };
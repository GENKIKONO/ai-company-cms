/**
 * Content Domain Types
 * 
 * コンテンツ管理関連のUI専用型とフォーム型
 */

import type { ServiceMedia } from '../utils/database'

// Service Form Data
export interface ServiceFormData {
  name: string;
  price?: number;
  duration_months?: number;
  category?: string;
  description?: string;
  features?: string[];
  media?: ServiceMedia[];
  image_url?: string;
  video_url?: string;
  cta_text?: string;
  cta_url?: string;
  status?: 'draft' | 'published';
  is_published?: boolean;
}

// Post Form Data
export interface PostFormData {
  title: string;
  slug?: string;
  content?: string;
  content_markdown?: string;
  status: 'draft' | 'published';
  is_published?: boolean;
}

// Case Study Form Data
export interface CaseStudyFormData {
  title: string;
  problem?: string;
  solution?: string;
  result?: string;
  tags?: string[];
}

// FAQ Form Data
export interface FAQFormData {
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
  status?: 'draft' | 'published';
  is_published?: boolean;
}
/**
 * AIインタビュアー - サービス向け質問ページ
 * ユーザーがサービスに関する質問に回答し、AI用の素材を作成する
 */

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/server';
import { getInterviewQuestionsByAxis } from '@/lib/ai/interviewer-server';
import { CONTENT_TYPES, SUPPORTED_LANGUAGES } from '@/types/ai-interviewer';
import { redirect } from 'next/navigation';
import { ServiceInterviewerClient } from './components/ServiceInterviewerClient';

export default async function ServiceInterviewerPage() {
  // 認証チェック
  const user = await getServerUser();
  if (!user) {
    redirect('/auth/login');
  }

  // サービス向けの質問リストを取得
  const questionGroups = await getInterviewQuestionsByAxis(
    CONTENT_TYPES.SERVICE,
    SUPPORTED_LANGUAGES.JA
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AIインタビュアー - サービス紹介
        </h1>
        <p className="text-gray-600">
          以下の質問にお答えください。ご入力いただいた内容をもとに、AIがサービス紹介文やFAQの下書きを作成します。
        </p>
      </div>

      <Suspense fallback={<div>質問を読み込み中...</div>}>
        <ServiceInterviewerClient 
          questionGroups={questionGroups}
          user={user}
        />
      </Suspense>
    </div>
  );
}
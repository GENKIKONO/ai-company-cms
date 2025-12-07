'use client';

// 管理系ページ: cookiesを使用するためリクエスト時実行が必要
export const dynamic = 'force-dynamic';

import { useState, useEffect , useCallback} from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useSuccessToast, useErrorToast } from '@/components/ui/toast';

const BUCKET = 'public-settings';
const KEY = 'hero_image_url';

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('settings').select('value').eq('key', KEY).maybeSingle();
    setUrl(data?.value ?? '');
  }, [supabase]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {
      errorToast('PNG/JPG/WebP のみ対応しています');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      errorToast('2MB以内の画像をご利用ください');
      return;
    }
    setLoading(true);
    try {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `hero/hero.${ext}`;
      // overwrite same path to keep stable URL
      await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error } = await supabase.from('settings').upsert({ key: KEY, value: publicUrl }, { onConflict: 'key' });
      if (error) throw error;
      setUrl(publicUrl);
      successToast('ヒーロー画像を更新しました');
    } catch (e: any) {
      errorToast(e.message ?? 'アップロードに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">サイト設定</h1>
      <section className="space-y-4">
        <h2 className="text-lg font-medium">ヒーロー画像（/aio）</h2>
        {url ? (
          <div className="relative w-full aspect-video rounded-lg border bg-white overflow-hidden">
            <Image src={url} alt="Hero" fill className="object-cover" sizes="(max-width: 768px) 100vw, 800px" />
          </div>
        ) : (
          <p className="text-sm text-gray-500">未設定（現在はローカルのデフォルトSVGを表示）</p>
        )}
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer bg-white hover:bg-gray-50">
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} disabled={loading} />
          画像を選択（最大2MB）
        </label>
      </section>
    </main>
  );
}
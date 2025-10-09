import { redirect } from 'next/navigation';

// /service ページから /aio にリダイレクト
export default function ServicePage() {
  redirect('/aio');
}
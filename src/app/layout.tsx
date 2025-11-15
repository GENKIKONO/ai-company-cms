import type { Metadata } from "next";
import "./globals.css";
import { UnifiedMobileNav } from "@/components/navigation/UnifiedMobileNav";
import Footer from "@/components/layout/Footer";
import DynamicHeader from "@/components/header/DynamicHeader";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "AIO Hub",
  description: "AIに正しく理解されるためのCMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ToastProvider>
          <DynamicHeader />
          <main className="min-h-dvh pb-0">{children}</main>
          <Footer />
          <UnifiedMobileNav />
        </ToastProvider>
      </body>
    </html>
  );
}
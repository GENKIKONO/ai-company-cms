export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { UIProvider } from "@/lib/core/ui-provider";
import { ErrorBoundary } from "@/lib/core/error-boundary";

export const metadata: Metadata = {
  title: "AIOHub",
  description: "AI-optimized CMS for enterprise visibility",
  robots: "index, follow",
};

/**
 * Root Layout - Providers Only
 *
 * This layout provides global context (UIProvider, ToastProvider, ErrorBoundary)
 * but does NOT render any UI chrome (header/footer/nav).
 *
 * Layout boundaries:
 * - (public)/ routes: Public header + footer via (public)/layout.tsx
 * - dashboard/     : Dashboard sidebar via dashboard/layout.tsx
 * - admin/         : Admin shell via admin/layout.tsx
 * - account/       : User shell via account/layout.tsx
 *
 * See: docs/architecture/boundaries.md
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <UIProvider>
          <ToastProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ToastProvider>
        </UIProvider>
      </body>
    </html>
  );
}

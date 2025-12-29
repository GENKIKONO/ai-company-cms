/**
 * Public Layout - renders public header/footer for Info pages
 *
 * This layout wraps all public-facing pages that need:
 * - DynamicHeader (public header)
 * - Footer (public footer)
 * - UnifiedMobileNav (mobile navigation)
 *
 * Route group: (public) does NOT affect URL structure.
 * /pricing renders from (public)/pricing/page.tsx
 */
import DynamicHeader from "@/components/header/DynamicHeader";
import Footer from "@/components/layout/Footer";
import { UnifiedMobileNav } from "@/components/navigation/UnifiedMobileNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DynamicHeader />
      <main className="min-h-dvh pb-0">{children}</main>
      <Footer />
      <UnifiedMobileNav />
    </>
  );
}

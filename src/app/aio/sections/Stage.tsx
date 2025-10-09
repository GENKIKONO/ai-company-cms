import Hero from '../../../components/marketing/Hero';
import { aioCopy } from '../copy';

export default function Stage() {
  return (
    <Hero
      title={aioCopy.stage.title}
      lead="AIに「読まれて引用される」ための情報最適化。構造化・整備・更新をAIO Hubで一元化し、ゼロクリック時代でも見つかり続ける企業情報を。"
      primaryCta={{ href: "/organizations", label: "無料で始める" }}
      secondaryCta={{ href: "/service", label: "サービス概要を見る" }}
      imageSrc="/illustrations/aio-architecture.svg"
      imageAlt="AIOの情報最適化アーキテクチャ"
    />
  );
}
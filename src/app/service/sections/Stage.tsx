import Hero from '../../../components/marketing/Hero';
import { serviceCopy } from '../copy';

export default function Stage() {
  return (
    <Hero
      title={serviceCopy.stage.title}
      lead="ユーザーはChatGPTやGeminiなどのAIに「調べてもらう」のが当たり前に。AIO HubはAIが引用できる構造の情報を整え、貴社を選択肢から外さないための基盤を提供します。"
      primaryCta={{ href: "/organizations", label: "無料で始める" }}
      secondaryCta={{ href: "/pricing", label: "料金を見る" }}
      imageSrc="/illustrations/zero-click-hero.svg"
      imageAlt="検索からAI回答へのシフト図"
    />
  );
}
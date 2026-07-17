import type { HeroContent } from "@/cms/defaults";
import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import StatsBar from "@/components/sections/StatsBar";
import AboutIntro from "@/components/sections/AboutIntro";
import Services from "@/components/sections/Services";
import BrandHeights from "@/components/sections/BrandHeights";
import Experience from "@/components/sections/Experience";
import Portfolio from "@/components/sections/Portfolio";
import Team from "@/components/sections/Team";
import Interactive from "@/components/sections/Interactive";
import Testimonials from "@/components/sections/Testimonials";
import Footer from "@/components/sections/Footer";
import AgencyMarquee from "@/components/ui/AgencyMarquee";
import WidgetSection from "@/components/sections/WidgetSection";
import {
  sectionLayoutDefaults,
  type SectionLayout,
} from "@/cms/section-defaults";
import BuilderBridge from "@/components/BuilderBridge";
import GlobalPopup from "@/components/GlobalPopup";
import type { GlobalDesign } from "@/cms/design-resources";

export type SiteSection = {
  id: string;
  type: string;
  visible: boolean;
  content: unknown;
};
const componentMap: Record<string, (content: unknown) => React.ReactNode> = {
  header: (content) => <Nav content={content} />,
  hero: (content) => <Hero content={content as Partial<HeroContent>} />,
  "agency-marquee": (content) => <AgencyMarquee content={content} />,
  stats: (content) => <StatsBar content={content} />,
  about: (content) => <AboutIntro content={content} />,
  services: (content) => <Services content={content} />,
  "brand-heights": (content) => <BrandHeights content={content} />,
  experience: (content) => <Experience content={content} />,
  portfolio: (content) => <Portfolio content={content} />,
  team: (content) => <Team content={content} />,
  interactive: (content) => <Interactive content={content} />,
  testimonials: (content) => <Testimonials content={content} />,
  footer: (content) => <Footer content={content} />,
  widgets: (content) => <WidgetSection content={content} />,
};

export default function SiteHome({
  hero,
  sections,
  builder = false,
  popup,
}: {
  hero?: Partial<HeroContent>;
  sections?: SiteSection[];
  builder?: boolean;
  popup?: GlobalDesign | null;
}) {
  if (
    !sections?.length ||
    sections.filter((s) => s.type === "agency-marquee").length < 5
  )
    return <LegacyHome hero={hero} />;
  return (
    <main className="relative overflow-x-hidden">
      {builder && <BuilderBridge />}
      {!builder && <GlobalPopup design={popup} />}
      {sections
        .filter((section) => section.visible)
        .map((section) => {
          const layout = {
            ...sectionLayoutDefaults,
            ...((section.content as { _layout?: Partial<SectionLayout> })
              ?._layout || {}),
          };
          return (
            <div
              key={section.id}
              data-cms-section={section.id}
              data-desktop-visible={layout.desktopVisible}
              data-tablet-visible={layout.tabletVisible}
              data-mobile-visible={layout.mobileVisible}
              className={`cms-section cms-animation-${layout.animation}`}
              style={{
                backgroundColor: layout.backgroundColor,
                paddingTop: layout.paddingTop,
                paddingBottom: layout.paddingBottom,
                marginTop: layout.marginTop,
                marginBottom: layout.marginBottom,
                maxWidth: layout.maxWidth || undefined,
                marginInline: layout.maxWidth ? "auto" : undefined,
                textAlign: layout.alignment,
                animationDuration: `${layout.animationDuration}s`,
              }}
            >
              {componentMap[section.type]?.(section.content)}
            </div>
          );
        })}
    </main>
  );
}

function LegacyHome({ hero }: { hero?: Partial<HeroContent> }) {
  return (
    <main className="relative overflow-x-hidden">
      <Nav />
      <Hero content={hero} />
      <AgencyMarquee />
      <StatsBar />
      <AboutIntro />
      <AgencyMarquee />
      <Services />
      <BrandHeights />
      <Experience />
      <AgencyMarquee />
      <Portfolio />
      <Team />
      <Interactive />
      <AgencyMarquee />
      <Testimonials />
      <AgencyMarquee />
      <Footer />
    </main>
  );
}

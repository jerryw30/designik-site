import { Fragment } from "react";
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
import WidgetSection, {
  type WidgetForm,
} from "@/components/sections/WidgetSection";
import {
  sectionLayoutDefaults,
  type SectionLayout,
} from "@/cms/section-defaults";
import BuilderBridge from "@/components/BuilderBridge";
import GlobalPopup from "@/components/GlobalPopup";
import type { GlobalDesign } from "@/cms/design-resources";
import ElementStyleRuntime from "@/components/ElementStyleRuntime";

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
};

export default function SiteHome({
  hero,
  sections,
  builder = false,
  popup,
  forms = [],
}: {
  hero?: Partial<HeroContent>;
  sections?: SiteSection[];
  builder?: boolean;
  popup?: GlobalDesign | null;
  forms?: WidgetForm[];
}) {
  if (!sections) return <LegacyHome hero={hero} />;
  const visible = sections.filter((section) => section.visible);
  const footerIdx = visible.findIndex((s) => s.type === "footer");
  // The design ends at the footer — drop any marquee ordered after it.
  const ordered =
    footerIdx === -1
      ? visible
      : visible.filter(
          (s, i) => !(s.type === "agency-marquee" && i > footerIdx),
        );
  return (
    <main className="relative overflow-x-clip">
      {builder && <BuilderBridge />}
      {!builder && <GlobalPopup design={popup} />}
      {ordered
        .map((section, sectionIndex, visibleSections) => {
          const prevType = visibleSections[sectionIndex - 1]?.type;
          const followsAbout = prevType === "about" || prevType === "interactive";
          const layout = {
            ...sectionLayoutDefaults,
            ...((section.content as { _layout?: Partial<SectionLayout> })
              ?._layout || {}),
          };
          return (
            <Fragment key={section.id}>
              {section.type === "footer" && <LegalLinksBar />}
              <div
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
              <ElementStyleRuntime
                sectionId={section.id}
                styles={
                  (
                    section.content as {
                      _elementStyles?: Record<string, never>;
                    }
                  )?._elementStyles
                }
              />
              {section.type === "widgets" ? (
                <WidgetSection content={section.content} forms={forms} />
              ) : section.type === "agency-marquee" && followsAbout ? (
                <AgencyMarquee content={section.content} figmaGray />
              ) : (
                componentMap[section.type]?.(section.content)
              )}
              </div>
            </Fragment>
          );
        })}
    </main>
  );
}

function LegacyHome({ hero }: { hero?: Partial<HeroContent> }) {
  return (
    <main className="relative overflow-x-clip">
      <Nav />
      <Hero content={hero} />
      <AgencyMarquee />
      <StatsBar />
      <AboutIntro />
      <AgencyMarquee figmaGray />
      <Services />
      <BrandHeights />
      <Experience />
      <AgencyMarquee />
      <Portfolio />
      <Team />
      <Interactive />
      <AgencyMarquee figmaGray />
      <Testimonials />
      <AgencyMarquee />
      <LegalLinksBar />
      <Footer />
    </main>
  );
}

function LegalLinksBar() {
  return (
    <section
      aria-label="Legal policies"
      className="bg-[#580a25] px-5 py-5 text-white"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-5 gap-y-2 md:gap-x-7">
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
          Legal
        </span>
        <a
          href="/terms-and-conditions"
          className="font-display text-[14px] font-medium uppercase tracking-[0.02em] text-white transition-colors hover:text-[#f4c7d9]"
        >
          Terms and Conditions
        </a>
        <span aria-hidden className="hidden h-4 w-px bg-white/25 sm:block" />
        <a
          href="/privacy-policy"
          className="font-display text-[14px] font-medium uppercase tracking-[0.02em] text-white transition-colors hover:text-[#f4c7d9]"
        >
          Privacy Policy
        </a>
      </div>
    </section>
  );
}

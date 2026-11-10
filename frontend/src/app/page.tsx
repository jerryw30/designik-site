
import type { ReactNode } from "react";
import type { HeroContent } from "@/cms/defaults";

import {
  sectionLayoutDefaults,
  type SectionLayout,
} from "@/cms/section-defaults";

import homepage from "@/data/homepage.json";

import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import AgencyMarquee from "@/components/ui/AgencyMarquee";
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

import ElementStyleRuntime from "@/components/ElementStyleRuntime";
import GetStartedModal from "@/components/ui/GetStartedModal";

// Replace backend-served media URLs with static asset URLs.
function staticMedia(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replaceAll("/api/static/figma/", "/figma/")
      .replaceAll("/api/static/video/", "/video/");
  }

  if (Array.isArray(value)) {
    return value.map(staticMedia);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        staticMedia(item),
      ])
    );
  }

  return value;
}

const renderers: Record<
  string,
  (content: unknown) => ReactNode
> = {
  header: (content) => <Nav content={content} />,

  hero: (content) => (
    <Hero content={content as Partial<HeroContent>} />
  ),

  "agency-marquee": (content) => (
    <AgencyMarquee content={content} />
  ),

  stats: (content) => <StatsBar content={content} />,

  about: (content) => <AboutIntro content={content} />,

  services: (content) => <Services content={content} />,

  "brand-heights": (content) => (
    <BrandHeights content={content} />
  ),

  experience: (content) => <Experience content={content} />,

  portfolio: (content) => <Portfolio content={content} />,

  team: (content) => <Team content={content} />,

  interactive: (content) => (
    <Interactive content={content} />
  ),

  testimonials: (content) => (
    <Testimonials content={content} />
  ),

  footer: (content) => <Footer content={content} />,
};

export default function Home() {
  const sections = homepage.sections;

  return (
    <main className="relative overflow-x-clip">

      {/* Global Start a Project popup */}
      <GetStartedModal />

      {/* Published CMS homepage sections */}
      {sections.map((section, index) => {
        const content = staticMedia(
          section.content ?? {}
        ) as Record<string, unknown>;

        const layout: SectionLayout = {
          ...sectionLayoutDefaults,
          ...((content._layout as Partial<SectionLayout>) || {}),
        };

        const previousType = sections[index - 1]?.type;

        const followsAbout =
          previousType === "about" ||
          previousType === "interactive";

        const renderer = renderers[section.type];

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
              marginInline: layout.maxWidth
                ? "auto"
                : undefined,
              textAlign: layout.alignment,
              animationDuration: `${layout.animationDuration}s`,
            }}
          >
            <ElementStyleRuntime
              sectionId={section.id}
              styles={
                content._elementStyles as
                  | Parameters<
                      typeof ElementStyleRuntime
                    >[0]["styles"]
                  | undefined
              }
            />

            {section.type === "agency-marquee" &&
            followsAbout ? (
              <AgencyMarquee
                content={content}
                figmaGray
              />
            ) : (
              renderer?.(content)
            )}
          </div>
        );
      })}
    </main>
  );
}

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

export type SiteSection = { id: string; type: string; visible: boolean; content: unknown };
const componentMap: Record<string, (content: unknown) => React.ReactNode> = {
  header: () => <Nav />, hero: (content) => <Hero content={content as Partial<HeroContent>} />, "agency-marquee": () => <AgencyMarquee />, stats: () => <StatsBar />, about: () => <AboutIntro />,
  services: () => <Services />, "brand-heights": () => <BrandHeights />, experience: () => <Experience />, portfolio: () => <Portfolio />, team: () => <Team />, interactive: () => <Interactive />, testimonials: () => <Testimonials />, footer: () => <Footer />,
};

export default function SiteHome({ hero, sections }: { hero?: Partial<HeroContent>; sections?: SiteSection[] }) {
  if (!sections?.length || sections.filter((s) => s.type === "agency-marquee").length < 5) return <LegacyHome hero={hero} />;
  return <main className="relative overflow-x-hidden">{sections.filter((section) => section.visible).map((section) => <div key={section.id} data-cms-section={section.id} className="contents">{componentMap[section.type]?.(section.content)}</div>)}</main>;
}

function LegacyHome({ hero }: { hero?: Partial<HeroContent> }) { return <main className="relative overflow-x-hidden"><Nav /><Hero content={hero} /><AgencyMarquee /><StatsBar /><AboutIntro /><AgencyMarquee /><Services /><BrandHeights /><Experience /><AgencyMarquee /><Portfolio /><Team /><Interactive /><AgencyMarquee /><Testimonials /><AgencyMarquee /><Footer /></main>; }

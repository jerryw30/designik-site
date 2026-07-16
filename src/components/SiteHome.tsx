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

export default function SiteHome({ hero }: { hero?: Partial<HeroContent> }) {
  return <main className="relative overflow-x-hidden"><Nav /><Hero content={hero} /><AgencyMarquee /><StatsBar /><AboutIntro /><AgencyMarquee /><Services /><BrandHeights /><Experience /><AgencyMarquee /><Portfolio /><Team /><Interactive /><AgencyMarquee /><Testimonials /><AgencyMarquee /><Footer /></main>;
}

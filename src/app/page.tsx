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
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { heroContent } from "@/cms/defaults";

export const revalidate = 60;

export default async function Home() {
  const [heroSection] = await db.select({ content: sections.publishedContent }).from(sections).where(eq(sections.type, "hero")).limit(1);
  return (
    <main className="relative overflow-x-hidden">
      <Nav />
      <Hero content={heroContent(heroSection?.content)} />
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

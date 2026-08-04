export type HeroContent = {
  heading: string; description: string;
  primaryLabel: string; primaryLink: string; primaryIcon: "arrow" | "none";
  secondaryLabel: string; secondaryLink: string; secondaryIcon: "play" | "none";
  video: string; backgroundImage: string;
  backgroundColor: string; overlayColor: string; overlayOpacity: number;
  alignment: "left" | "center" | "right"; contentMaxWidth: number;
  contentTopDesktop: number; contentTopTablet: number; contentTopMobile: number;
  headingFont: string; headingColor: string; headingWeight: number; headingLetterSpacing: number;
  headingSizeDesktop: number; headingSizeTablet: number; headingSizeMobile: number;
  descriptionFont: string; descriptionColor: string; descriptionWeight: number;
  descriptionSizeDesktop: number; descriptionSizeTablet: number; descriptionSizeMobile: number;
  textGap: number; buttonGap: number; buttonsTop: number;
  primaryBackground: string; primaryColor: string; primaryBorderColor: string; primaryBorderWidth: number;
  secondaryBackground: string; secondaryColor: string; secondaryBorderColor: string; secondaryBorderWidth: number;
  buttonRadius: number; buttonFontSize: number; buttonPaddingX: number; buttonPaddingY: number;
  primaryHoverBackground: string; primaryHoverColor: string; secondaryHoverBackground: string; secondaryHoverColor: string; hoverScale: number;
  entranceAnimation: "fade-up" | "fade" | "zoom" | "none"; animationDuration: number; animationDelay: number;
  sceneScale: number; videoFit: "cover" | "contain" | "fill"; showScrollCue: boolean;
};

export const heroDefaults: HeroContent = {
  heading: "Design that moves", description: "We turn sharp ideas into digital experiences people remember.",
  primaryLabel: "Start Something", primaryLink: "#contact", primaryIcon: "arrow",
  secondaryLabel: "Book an Appointment", secondaryLink: "https://calendly.com/luke-designingenious/", secondaryIcon: "play",
  video: "/api/static/video/portfolio.mp4", backgroundImage: "/api/static/figma/hero-scene.png",
  backgroundColor: "#4d071d", overlayColor: "#25020e", overlayOpacity: 45,
  alignment: "center", contentMaxWidth: 1200, contentTopDesktop: 18, contentTopTablet: 18, contentTopMobile: 17,
  headingFont: "var(--font-display)", headingColor: "#ffffff", headingWeight: 400, headingLetterSpacing: -0.02,
  headingSizeDesktop: 72, headingSizeTablet: 58, headingSizeMobile: 44,
  descriptionFont: "var(--font-sans)", descriptionColor: "#ffffffe6", descriptionWeight: 300,
  descriptionSizeDesktop: 20, descriptionSizeTablet: 17, descriptionSizeMobile: 15,
  textGap: 20, buttonGap: 12, buttonsTop: 32,
  primaryBackground: "#ffffff", primaryColor: "#b0164d", primaryBorderColor: "#ffffff", primaryBorderWidth: 0,
  secondaryBackground: "#ffffff00", secondaryColor: "#ffffff", secondaryBorderColor: "#ffffffcc", secondaryBorderWidth: 1,
  buttonRadius: 999, buttonFontSize: 13, buttonPaddingX: 24, buttonPaddingY: 10,
  primaryHoverBackground: "#ffffff", primaryHoverColor: "#b0164d", secondaryHoverBackground: "#ffffff1a", secondaryHoverColor: "#ffffff", hoverScale: 1.04,
  entranceAnimation: "fade-up", animationDuration: 0.9, animationDelay: 0.25,
  sceneScale: 1.12, videoFit: "cover", showScrollCue: true,
};

export function heroContent(value: unknown): HeroContent {
  return { ...heroDefaults, ...(typeof value === "object" && value ? value : {}) };
}

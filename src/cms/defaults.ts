export type HeroContent = {
  heading: string;
  description: string;
  primaryLabel: string;
  primaryLink: string;
  secondaryLabel: string;
  secondaryLink: string;
  video: string;
};

export const heroDefaults: HeroContent = {
  heading: "Design with ease",
  description: "Designik drives brand engagement with innovative digital solutions.",
  primaryLabel: "Get Started",
  primaryLink: "#contact",
  secondaryLabel: "Watch Video",
  secondaryLink: "#portfolio",
  video: "/video/portfolio.mp4",
};

export function heroContent(value: unknown): HeroContent {
  return { ...heroDefaults, ...(typeof value === "object" && value ? value : {}) };
}

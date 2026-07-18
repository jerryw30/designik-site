// Central registry of Figma-exported assets (public/figma/*)
const A = (f: string) => `/figma/${f}`;

export const assets = {
  // Backgrounds / scenes
  heroScene: A("hero-scene.png"),
  aboutMountains: A("image218.png"),
  cloud: A("image217.png"),
  cloudSky: A("image220.png"),
  interactiveScene: A("image252.png"),
  desert: A("a9-b0-fcd7-d1364-e8-e8600-cc7-ec606-d5011.png"),
  statue: A("df1770-b34-c504758-a6-ff6499604366-a11.png"),
  experienceHills: A("rectangle39502.png"),
  gridTexture: A("6847051-fca9-d03-f2175253-ef-grid15.png"),

  // Logo / icons
  logo: A("vector1.svg"),
  arrow: A("background.svg"),

  // Service cards
  seo: A("image235.png"),
  productDesign: A("image229.png"),
  digitalMarketing: A("image233.png"),
  brandIdentity: A("image231.png"),
  hangingTag: A("individual/image-photoroom-1-2--277-73.png"),
  mobileAppHand: A("image236.png"),
  mobileAppScreen: A("image23611.png"),
  iconWebDev: A("web-development1.png"),
  iconDeveloper: A("developer1.png"),
  iconCustom: A("custom1.png"),
  iconSend: A("send1.png"),

  // Portfolio banners
  portfolioOrange: A("rectangle39359.png"),
  portfolioPhone: A("image213.png"),
  portfolioDark: A("rectangle39515.png"),
  portfolioPurple: A("rectangle39360.png"),
  portfolioPhone2: A("image214.png"),
  cubes: A("image-photoroom2411.png"),

  // Team (greyscale portraits, duotoned over coloured cards)
  teamA: A("rectangle39532.png"),
  teamB: A("rectangle39535.png"),

  // Testimonials
  trafficLight: A("image241.png"),
  testimonialPhone: A("image23611.png"),
  appScreens: A("image-photoroom2411.png"),
} as const;

export type AssetKey = keyof typeof assets;

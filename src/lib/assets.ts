// Central registry of Figma-exported assets (public/figma/*)
const A = (f: string) => `/figma/${f}`;

export const assets = {
  // Backgrounds / scenes
  heroScene: A("hero-scene.png"),
  aboutMountains: A("image218.png"),
  cloud: A("image217.png"),
  cloudSky: A("image220.png"),
  interactiveScene: A("image252.png"),
  brandMist: A("brand-mist.png"),
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

  // Portfolio (exact per-node Figma exports)
  pfCard1Bg: A("individual/rectangle-39359--221-1364.png"),
  pfCard2Bg: A("individual/rectangle-39515--221-1382.png"),
  pfCard3Bg: A("individual/rectangle-39359--221-1398.png"),
  pfPhoneHand: A("individual/image-213--221-1366.png"),
  pfLaptop: A("individual/image-photoroom-24-1-1--221-1395.png"),
  pfPhones: A("individual/image-214--221-1411.png"),
  pfCloud: A("individual/image-217--221-1377.png"),
  pfTag: A("individual/image-photoroom-1-1--277-70.png"),
  pfSky: A("individual/image-220--221-1290.png"),
  pfGrid: A("individual/6847051fca9d03f2175253ef-grid-1-6--221-1291.png"),

  // Team (greyscale portraits, duotoned over coloured cards)
  teamA: A("rectangle39532.png"),
  teamB: A("rectangle39535.png"),

  // Team (exact per-node Figma exports)
  teamPhoto1: A("individual/image-243--275-49.png"),
  teamPhoto2: A("individual/image-248--275-50.png"),
  teamPhoto3: A("individual/image-245--275-51.png"),
  teamPhoto4: A("individual/image-251--278-87.png"),
  teamWatermark: A("individual/team-watermark--283-18.svg"),
  teamSky: A("individual/image-220--221-1153.png"),
  teamGrid: A("individual/6847051fca9d03f2175253ef-grid-1-6--221-1154.png"),

  // Experience (exact per-node Figma exports)
  expCard: A("individual/rectangle-39502--221-1293.png"),
  expStatue: A("individual/df1770b3-4c50-4758-a6ff-6499604366a1-1--221-1357.png"),
  expCloudL: A("individual/image-218--221-1314.png"),
  expCloudR: A("individual/image-217--221-1313.png"),
  expCornerL: A("individual/exp-corner-l--221-1295.svg"),
  expCornerR: A("individual/exp-corner-r--221-1294.svg"),
  expArrow205: A("individual/image-205--221-1345.png"),
  expArrow207: A("individual/image-207--221-1301.png"),
  expArrow208: A("individual/image-208--221-1302.png"),
  expArrow209: A("individual/image-209--221-1299.png"),
  expArrow210: A("individual/image-210--221-1300.png"),
  expSwirl: A("individual/exp-swirl--221-1346.svg"),
  expIconStrategy: A("individual/icon-socialstrategy-crop.png"),
  expIconCreator: A("individual/icon-creator--221-1323.svg"),
  expIconInfluencer: A("individual/icon-influencer--221-1334.svg"),
  expIconPublishing: A("individual/icon-socialpub-crop.png"),
  expIconInsight: A("individual/icon-insight-crop.png"),

  // Footer (exact per-node Figma exports)
  footerBadge: A("individual/footer-badge--229-15.svg"),
  footerTag: A("individual/image-photoroom-1-5--277-82.png"),
  footerSend: A("individual/send-1--221-1671.png"),
  footerField: A("individual/a9b0fcd7-d136-4e8e-8600-cc7ec606d501-1--221-1647.png"),

  // Testimonials (exact per-node Figma exports)
  testiPhoneRaw: A("individual/testi-phone-raw--245-180.png"),
  testiTrafficRaw: A("individual/testi-traffic-raw--249-229.png"),
  testiWatermark: A("individual/testi-watermark--249-245.svg"),
  testiTexture: A("individual/rectangle-39537--245-131.png"),
  testiTag: A("individual/image-photoroom-1-4--277-79.png"),

  // Interactive (exact per-node Figma exports)
  interactiveScene2: A("individual/image-252--279-94.png"),
  interactiveScreen: A("individual/tv-screen--279-96.png"),
  interactiveGrid: A("individual/6847051fca9d03f2175253ef-grid-1-7--221-1152.png"),
  interactiveCloudL: A("individual/image-250--277-64.png"),
  interactiveCloudR: A("individual/image-249--277-63.png"),

  // Testimonials
  trafficLight: A("image241.png"),
  testimonialPhone: A("image23611.png"),
  appScreens: A("image-photoroom2411.png"),
} as const;

export type AssetKey = keyof typeof assets;

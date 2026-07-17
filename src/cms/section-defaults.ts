export const sectionDefaults = {
  "agency-marquee": { text: "Designik Agency", duration: 26, backgroundColor: "#ff5a1f", textColor: "#000000", fontSizeDesktop: 42, fontSizeMobile: 26 },
  stats: { reviewLabel: "Reviewed On", reviewSite: "Clutch", reviews: "31 Reviews", items: [
    { value: 20, suffix: "", label: "Proven Track Record", unit: "Years" }, { value: 98, suffix: "%", label: "Customer Satisfaction", unit: "" },
    { value: 1500, suffix: "", label: "We Have Completed", unit: "Projects" }, { value: 3, suffix: "", label: "Average Answer Time", unit: "Mins" },
  ] },
  about: { eyebrow: "About Us", headingAccent: "Designik", heading: "Creative Agency", description: "Designik exists to revolutionize the way brands connect and engage with their audiences in the digital era by leveraging innovative strategies and cutting-edge technology.", buttonLabel: "About Us", buttonLink: "#services", backgroundImage: "/figma/image218.png" },
  interactive: { heading: "Our Interactive Design", buttonLabel: "Get Started", buttonLink: "#contact", backgroundImage: "/figma/image252.png", heightVh: 80, parallax: true },
} as const;

export type EditableSectionType = keyof typeof sectionDefaults;
export function sectionContent<T extends EditableSectionType>(type:T,value:unknown): (typeof sectionDefaults)[T] { return { ...sectionDefaults[type], ...(typeof value === "object" && value ? value : {}) } as (typeof sectionDefaults)[T]; }

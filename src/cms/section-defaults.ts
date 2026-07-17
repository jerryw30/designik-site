export const sectionDefaults = {
  "agency-marquee": { text: "Designik Agency", duration: 26, backgroundColor: "#ff5a1f", textColor: "#000000", fontSizeDesktop: 42, fontSizeMobile: 26 },
  stats: { reviewLabel: "Reviewed On", reviewSite: "Clutch", reviews: "31 Reviews", items: [
    { value: 20, suffix: "", label: "Proven Track Record", unit: "Years" }, { value: 98, suffix: "%", label: "Customer Satisfaction", unit: "" },
    { value: 1500, suffix: "", label: "We Have Completed", unit: "Projects" }, { value: 3, suffix: "", label: "Average Answer Time", unit: "Mins" },
  ] },
  about: { eyebrow: "About Us", headingAccent: "Designik", heading: "Creative Agency", description: "Designik exists to revolutionize the way brands connect and engage with their audiences in the digital era by leveraging innovative strategies and cutting-edge technology.", buttonLabel: "About Us", buttonLink: "#services", backgroundImage: "/figma/image218.png" },
  interactive: { heading: "Our Interactive Design", buttonLabel: "Get Started", buttonLink: "#contact", backgroundImage: "/figma/image252.png", heightVh: 80, parallax: true },
  team: { headingAccent:"Meet", heading:"Our Team", description:"Designik exists to revolutionize the way brands connect and engage with their audiences in the digital era by leveraging innovative strategies and cutting-edge technology.", buttonLabel:"View All", buttonLink:"#contact", members:[
    {name:"Michel Brown",role:"Social Media Manager",photo:"/figma/rectangle39532.png",background:"#7a1437"},{name:"Michel Brown",role:"Social Media Manager",photo:"/figma/rectangle39535.png",background:"#b89cf0"},{name:"Michel Brown",role:"Social Media Manager",photo:"/figma/rectangle39532.png",background:"#ff5a1f"},{name:"Michel Brown",role:"Social Media Manager",photo:"/figma/rectangle39535.png",background:"#ed3b25"}
  ] },
  testimonials: { headingAccent:"Meet", heading:"Our Team", description:"Designik exists to revolutionize the way brands connect and engage with their audiences in the digital era by leveraging innovative strategies and cutting-edge technology.", quote:"Designik exists to revolutionize the way brands connect and engage with their audiences in the digital era by leveraging innovative strategies and cutting-edge technology.", author:"Milla Ass", role:"Marketer", rating:"4.9 out of 5.0", images:["/figma/image23611.png","/figma/image241.png"] },
  footer: { brand:"Designik", heading:"We Drive Your\nBrand to New Height", logo:"/figma/vector1.svg", columns:[["Home","About Us","Services","Project","Contact"],["News","Careers","Blogs","Book Consultation","Faqs"],["Contact","Privacy Policy","Cookie Policy"]], newsletterHeading:"Subscribe to our newsletter", newsletterNote:"By subscribing you agree to our privacy policy and its terms.", copyright:"@ 2026, All rights reserved.", backgroundImage:"/figma/a9-b0-fcd7-d1364-e8-e8600-cc7-ec606-d5011.png" },
} as const;

export type EditableSectionType = keyof typeof sectionDefaults;
export function sectionContent<T extends EditableSectionType>(type:T,value:unknown): (typeof sectionDefaults)[T] { return { ...sectionDefaults[type], ...(typeof value === "object" && value ? value : {}) } as (typeof sectionDefaults)[T]; }

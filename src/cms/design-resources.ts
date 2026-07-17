import { sectionContent } from "./section-defaults";

export type DesignModule =
  "headers" | "footers" | "popups" | "templates" | "saved-sections";

export type DesignStyle = {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  width: number;
  minHeight: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginBottom: number;
  gap: number;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  shadow: string;
  alignment: "left" | "center" | "right";
  hoverColor: string;
  animation: "none" | "fade" | "slide-up" | "zoom";
  desktopVisible: boolean;
  tabletVisible: boolean;
  mobileVisible: boolean;
};

export type GlobalDesign = {
  content: Record<string, unknown>;
  style: DesignStyle;
  conditions: { location: string; priority: number };
};

export type DesignStore = {
  draft: GlobalDesign;
  published: GlobalDesign | null;
};

const styleDefaults: DesignStyle = {
  backgroundColor: "transparent",
  textColor: "#ffffff",
  accentColor: "#ff006b",
  fontFamily: "var(--font-body)",
  width: 100,
  minHeight: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  marginTop: 0,
  marginBottom: 0,
  gap: 16,
  borderWidth: 0,
  borderColor: "transparent",
  borderRadius: 0,
  shadow: "none",
  alignment: "left",
  hoverColor: "#ff006b",
  animation: "none",
  desktopVisible: true,
  tabletVisible: true,
  mobileVisible: true,
};

const popupContent = {
  heading: "Stay in the loop",
  body: "Subscribe for Designik news, creative insights, and new work.",
  image: "",
  buttonLabel: "Get started",
  buttonLink: "#contact",
  closeLabel: "Close",
  trigger: "delay",
  delaySeconds: 5,
  scrollPercent: 50,
  frequency: "session",
};

export function designDefault(module: DesignModule): GlobalDesign {
  const content =
    module === "headers"
      ? sectionContent("header", {})
      : module === "footers"
        ? sectionContent("footer", {})
        : module === "popups"
          ? popupContent
          : module === "templates"
            ? {
                templateType: "page",
                description: "Reusable page layout",
                sections: [
                  {
                    type: "widgets",
                    name: "Content section",
                    content: sectionContent("widgets", {}),
                  },
                ],
              }
            : {
                type: "widgets",
                name: "Saved section",
                content: sectionContent("widgets", {}),
              };
  return {
    content: structuredClone(content) as Record<string, unknown>,
    style: { ...styleDefaults },
    conditions: { location: "entire-site", priority: 10 },
  };
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export function designValue(module: DesignModule, value: unknown): DesignStore {
  const raw = object(value);
  const fallback = designDefault(module);
  const merge = (input: unknown): GlobalDesign => {
    const source = object(input);
    return {
      content: { ...fallback.content, ...object(source.content) },
      style: { ...fallback.style, ...object(source.style) } as DesignStyle,
      conditions: {
        ...fallback.conditions,
        ...object(source.conditions),
      } as GlobalDesign["conditions"],
    };
  };
  return {
    draft: merge(raw.draft || raw),
    published: raw.published ? merge(raw.published) : null,
  };
}

export const designLabels: Record<
  DesignModule,
  { title: string; singular: string; description: string }
> = {
  headers: {
    title: "Header Builder",
    singular: "header",
    description: "Reusable global headers with navigation and display rules.",
  },
  footers: {
    title: "Footer Builder",
    singular: "footer",
    description: "Reusable global footers with columns and newsletter content.",
  },
  popups: {
    title: "Popup Builder",
    singular: "popup",
    description: "Targeted website popups with timing and frequency rules.",
  },
  templates: {
    title: "Templates",
    singular: "template",
    description: "Reusable page and section structures for the visual builder.",
  },
  "saved-sections": {
    title: "Saved Sections",
    singular: "saved section",
    description:
      "Sections saved from the visual builder for reuse on any page.",
  },
};

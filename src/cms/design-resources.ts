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
  let raw = object(value);
  // Saved sections created from the page builder are stored as a flat
  // snapshot ({type, name, content, draftContent, ...}) rather than the
  // draft/published wrapper. Lift them into the wrapper shape so the design
  // editor and preview read the real section content instead of defaults.
  if (
    module === "saved-sections" &&
    !raw.draft &&
    !raw.published &&
    (raw.draftContent || raw.publishedContent)
  ) {
    raw = {
      draft: {
        content: {
          type: raw.type || "widgets",
          name: raw.name || "Saved section",
          content: object(raw.draftContent || raw.content),
        },
      },
      published: null,
    };
  }
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

export type DesignLocation = "homepage" | "blog" | "pages" | "posts";

/**
 * Resolve which published design applies to the page being rendered:
 * honors the display-location condition ("entire-site" or the matching
 * location) and picks the highest priority when several qualify.
 */
export function publishedDesign(
  rows: ReadonlyArray<{ module: string; data: unknown }>,
  module: DesignModule,
  location: DesignLocation,
): GlobalDesign | null {
  return (
    rows
      .filter((row) => row.module === module)
      .map((row) => designValue(module, row.data).published)
      .filter(
        (design): design is GlobalDesign =>
          !!design &&
          ["entire-site", location].includes(design.conditions.location),
      )
      .sort(
        (a, b) => (b.conditions.priority || 0) - (a.conditions.priority || 0),
      )[0] || null
  );
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

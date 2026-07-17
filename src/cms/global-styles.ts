export type CustomFont = {
  id: string;
  name: string;
  url: string;
  weight: number;
  style: "normal" | "italic";
};
export type GlobalStyles = {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  typography: {
    bodyFamily: string;
    headingFamily: string;
    marqueeFamily: string;
    bodySize: number;
    bodyLineHeight: number;
    headingWeight: number;
  };
  buttons: {
    radius: number;
    paddingX: number;
    paddingY: number;
    fontWeight: number;
  };
  layout: { containerWidth: number; sectionGap: number };
  customFonts: CustomFont[];
};
export const globalStyleDefaults: GlobalStyles = {
  colors: {
    primary: "#a10140",
    secondary: "#530823",
    accent: "#db2f73",
    text: "#1a1416",
    background: "#ffffff",
  },
  typography: {
    bodyFamily: "var(--font-inter), Inter, system-ui, sans-serif",
    headingFamily: "var(--font-oswald), Oswald, system-ui, sans-serif",
    marqueeFamily: "var(--font-akshar), Akshar, system-ui, sans-serif",
    bodySize: 16,
    bodyLineHeight: 1.5,
    headingWeight: 500,
  },
  buttons: { radius: 999, paddingX: 24, paddingY: 12, fontWeight: 600 },
  layout: { containerWidth: 1280, sectionGap: 0 },
  customFonts: [],
};
export function globalStyles(value: unknown): GlobalStyles {
  const input =
    value && typeof value === "object" ? (value as Partial<GlobalStyles>) : {};
  return {
    ...globalStyleDefaults,
    ...input,
    colors: { ...globalStyleDefaults.colors, ...input.colors },
    typography: { ...globalStyleDefaults.typography, ...input.typography },
    buttons: { ...globalStyleDefaults.buttons, ...input.buttons },
    layout: { ...globalStyleDefaults.layout, ...input.layout },
    customFonts: Array.isArray(input.customFonts) ? input.customFonts : [],
  };
}
export function globalStyleVariables(
  styles: GlobalStyles,
): Record<string, string> {
  return {
    "--color-wine-500": styles.colors.primary,
    "--color-wine-900": styles.colors.secondary,
    "--color-pink-brand": styles.colors.accent,
    "--color-ink": styles.colors.text,
    "--background": styles.colors.background,
    "--foreground": styles.colors.text,
    "--font-sans": styles.typography.bodyFamily,
    "--font-display": styles.typography.headingFamily,
    "--font-marquee": styles.typography.marqueeFamily,
    "--global-body-size": `${styles.typography.bodySize}px`,
    "--global-body-line-height": String(styles.typography.bodyLineHeight),
    "--global-heading-weight": String(styles.typography.headingWeight),
    "--global-button-radius": `${styles.buttons.radius}px`,
    "--global-button-padding-x": `${styles.buttons.paddingX}px`,
    "--global-button-padding-y": `${styles.buttons.paddingY}px`,
    "--global-button-weight": String(styles.buttons.fontWeight),
    "--global-container-width": `${styles.layout.containerWidth}px`,
    "--global-section-gap": `${styles.layout.sectionGap}px`,
  };
}
export function customFontCss(styles: GlobalStyles) {
  return styles.customFonts
    .filter((font) => font.name.trim() && /^(https:\/\/|\/)/.test(font.url))
    .map((font) => {
      const name = font.name.replace(/[^a-zA-Z0-9 _-]/g, "");
      const url = font.url.replace(/["'()\\]/g, "");
      return `@font-face{font-family:"${name}";src:url("${url}");font-style:${font.style};font-weight:${font.weight};font-display:swap;}`;
    })
    .join("\n");
}

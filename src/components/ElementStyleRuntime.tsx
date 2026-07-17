type ElementStyle = {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: number;
  width?: string;
  height?: string;
  margin?: string;
  padding?: string;
  textAlign?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  boxShadow?: string;
  hoverColor?: string;
  hoverBackgroundColor?: string;
  desktopVisible?: boolean;
  tabletVisible?: boolean;
  mobileVisible?: boolean;
  desktopFontSize?: number;
  tabletFontSize?: number;
  mobileFontSize?: number;
  desktopWidth?: string;
  tabletWidth?: string;
  mobileWidth?: string;
  animation?: "none" | "fade" | "slide-up" | "zoom";
};

function declarations(style: ElementStyle) {
  const safe = (value: unknown) => String(value).replace(/[<>{}]/g, "");
  return [
    style.color && `color:${safe(style.color)}!important`,
    style.backgroundColor &&
      `background-color:${safe(style.backgroundColor)}!important`,
    style.fontSize !== undefined && `font-size:${style.fontSize}px!important`,
    style.fontWeight !== undefined &&
      `font-weight:${style.fontWeight}!important`,
    style.width && `width:${safe(style.width)}!important`,
    style.height && `height:${safe(style.height)}!important`,
    style.margin && `margin:${safe(style.margin)}!important`,
    style.padding && `padding:${safe(style.padding)}!important`,
    style.textAlign && `text-align:${safe(style.textAlign)}!important`,
    style.borderWidth !== undefined &&
      `border-width:${style.borderWidth}px!important;border-style:solid!important`,
    style.borderColor && `border-color:${safe(style.borderColor)}!important`,
    style.borderRadius !== undefined &&
      `border-radius:${style.borderRadius}px!important`,
    style.boxShadow && `box-shadow:${safe(style.boxShadow)}!important`,
    style.animation === "fade" &&
      "animation:cmsElementFade .6s ease both!important",
    style.animation === "slide-up" &&
      "animation:cmsElementSlide .6s ease both!important",
    style.animation === "zoom" &&
      "animation:cmsElementZoom .6s ease both!important",
  ]
    .filter(Boolean)
    .join(";");
}

export default function ElementStyleRuntime({
  sectionId,
  styles,
}: {
  sectionId: string;
  styles: Record<string, ElementStyle> | undefined;
}) {
  if (!styles || !Object.keys(styles).length) return null;
  const scope = `[data-cms-section="${sectionId}"]`;
  const css =
    "@keyframes cmsElementFade{from{opacity:0}to{opacity:1}}@keyframes cmsElementSlide{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}@keyframes cmsElementZoom{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}" +
    Object.entries(styles)
      .map(([selector, style]) => {
        if (!/^[a-z0-9(): >-]+$/i.test(selector)) return "";
        const target = `${scope} ${selector}`;
        const hoverColor = String(style.hoverColor || "").replace(
          /[<>{}]/g,
          "",
        );
        const hoverBackground = String(
          style.hoverBackgroundColor || "",
        ).replace(/[<>{}]/g, "");
        return [
          `${target}{${declarations(style)};transition:all .2s ease}`,
          hoverColor || hoverBackground
            ? `${target}:hover{${hoverColor ? `color:${hoverColor}!important;` : ""}${hoverBackground ? `background-color:${hoverBackground}!important;` : ""}}`
            : "",
          style.mobileVisible === false
            ? `@media(max-width:639px){${target}{display:none!important}}`
            : style.mobileFontSize !== undefined || style.mobileWidth
              ? `@media(max-width:639px){${target}{${style.mobileFontSize !== undefined ? `font-size:${style.mobileFontSize}px!important;` : ""}${style.mobileWidth ? `width:${String(style.mobileWidth).replace(/[<>{}]/g, "")}!important;` : ""}}}`
              : "",
          style.tabletVisible === false
            ? `@media(min-width:640px) and (max-width:1023px){${target}{display:none!important}}`
            : style.tabletFontSize !== undefined || style.tabletWidth
              ? `@media(min-width:640px) and (max-width:1023px){${target}{${style.tabletFontSize !== undefined ? `font-size:${style.tabletFontSize}px!important;` : ""}${style.tabletWidth ? `width:${String(style.tabletWidth).replace(/[<>{}]/g, "")}!important;` : ""}}}`
              : "",
          style.desktopVisible === false
            ? `@media(min-width:1024px){${target}{display:none!important}}`
            : style.desktopFontSize !== undefined || style.desktopWidth
              ? `@media(min-width:1024px){${target}{${style.desktopFontSize !== undefined ? `font-size:${style.desktopFontSize}px!important;` : ""}${style.desktopWidth ? `width:${String(style.desktopWidth).replace(/[<>{}]/g, "")}!important;` : ""}}}`
              : "",
        ].join("");
      })
      .join("");
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

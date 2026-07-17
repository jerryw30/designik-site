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
  const css = Object.entries(styles)
    .map(([selector, style]) => {
      if (!/^[a-z0-9(): >-]+$/i.test(selector)) return "";
      const target = `${scope} ${selector}`;
      const hoverColor = String(style.hoverColor || "").replace(/[<>{}]/g, "");
      const hoverBackground = String(style.hoverBackgroundColor || "").replace(
        /[<>{}]/g,
        "",
      );
      return [
        `${target}{${declarations(style)};transition:all .2s ease}`,
        hoverColor || hoverBackground
          ? `${target}:hover{${hoverColor ? `color:${hoverColor}!important;` : ""}${hoverBackground ? `background-color:${hoverBackground}!important;` : ""}}`
          : "",
        style.mobileVisible === false
          ? `@media(max-width:639px){${target}{display:none!important}}`
          : "",
        style.tabletVisible === false
          ? `@media(min-width:640px) and (max-width:1023px){${target}{display:none!important}}`
          : "",
        style.desktopVisible === false
          ? `@media(min-width:1024px){${target}{display:none!important}}`
          : "",
      ].join("");
    })
    .join("");
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

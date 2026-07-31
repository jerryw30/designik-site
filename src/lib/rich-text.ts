import sanitizeHtml from "sanitize-html";

/**
 * Post bodies are authored as HTML by the classic-style editor, then rendered
 * into the public blog with dangerouslySetInnerHTML.
 *
 * CONTENT_EDITOR and MARKETING_MANAGER can edit posts without being admins
 * (see ROLE_PERMISSIONS), so this is a genuine privilege boundary: unsanitised
 * markup would let a non-admin author run script on a public page and lift an
 * admin session cookie. Everything is allowlisted — tags, attributes, and the
 * individual CSS properties the toolbar can set.
 */

// Only the inline styles the toolbar produces. Anything else (position,
// background-image, behaviour-bearing values) is dropped.
const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\((\s*[\d.]+\s*,?){3,4}\)$/i];

export const POST_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4",
    "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "span", "div",
    "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    "*": ["style"],
  },
  allowedStyles: {
    "*": {
      color: COLOR,
      "background-color": COLOR,
      // Browsers emit keyword sizes (x-large) for execCommand("fontSize"), and
      // explicit units when a size is picked from the toolbar. Allow both.
      "font-size": [
        /^\d{1,3}(\.\d+)?(px|pt|em|rem|%)$/,
        /^(xx-small|x-small|small|medium|large|x-large|xx-large)$/,
      ],
      "font-weight": [/^(normal|bold|[1-9]00)$/],
      "font-style": [/^(normal|italic)$/],
      "text-align": [/^(left|right|center|justify)$/],
      "text-decoration": [/^(none|underline|line-through)$/],
    },
  },
  // http/https/mailto/tel only — blocks javascript: and data: URLs.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  // Force external links to be safe: noopener stops the opened page reaching
  // back through window.opener.
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href || "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(external
            ? { target: attribs.target || "_blank", rel: "noopener noreferrer" }
            : {}),
        },
      };
    },
  },
  disallowedTagsMode: "discard",
};

/** Clean untrusted post HTML for storage and for rendering. */
export function sanitizePostHtml(html: string) {
  return sanitizeHtml(html, POST_HTML_OPTIONS);
}

/**
 * Posts written before the rich editor are plain text with newlines. Treat a
 * body with no block-level markup as plain text so old posts keep their line
 * breaks instead of collapsing into one paragraph.
 */
export function isHtmlContent(content: string) {
  return /<(p|div|h[2-4]|ul|ol|li|blockquote|br|strong|em|u|s|a|span|img|pre|table)\b/i.test(
    content,
  );
}

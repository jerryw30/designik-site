import React from "react";

// URLs without trailing punctuation (so "…link." doesn't break the href).
const URL_RE = /(https?:\/\/[^\s<]*[^\s<.,:;"')\]!?])/g;

/**
 * Renders message text with URLs as safe, clickable links that wrap inside
 * the bubble instead of overflowing it.
 */
export function Linkified({ text, linkClass }: { text: string; linkClass?: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`break-all font-medium underline underline-offset-2 ${linkClass || ""}`}
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

"use client";
import { useEffect } from "react";
export default function BuilderBridge() {
  useEffect(() => {
    let outlined: HTMLElement | null = null;
    const target = (event: Event) => {
      const node = event.target as HTMLElement | null;
      return (
        node?.closest<HTMLElement>("[data-cms-element],[data-cms-section]") ||
        null
      );
    };
    const over = (event: MouseEvent) => {
      const node = target(event);
      if (!node || node === outlined) return;
      if (outlined) {
        outlined.style.outline = "";
        outlined.style.outlineOffset = "";
      }
      outlined = node;
      node.style.outline = "2px solid #ff2f88";
      node.style.outlineOffset = "-2px";
    };
    const out = (event: MouseEvent) => {
      if (target(event) !== outlined || !outlined) return;
      outlined.style.outline = "";
      outlined.style.outlineOffset = "";
      outlined = null;
    };
    const click = (event: MouseEvent) => {
      const node = target(event);
      if (!node) return;
      const section = node.closest<HTMLElement>("[data-cms-section]");
      if (!section) return;
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage(
        {
          source: "designik-builder",
          sectionId: section.dataset.cmsSection,
          elementId: node.dataset.cmsElement || null,
        },
        window.location.origin,
      );
    };
    document.addEventListener("mouseover", over, true);
    document.addEventListener("mouseout", out, true);
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("mouseover", over, true);
      document.removeEventListener("mouseout", out, true);
      document.removeEventListener("click", click, true);
    };
  }, []);
  return null;
}

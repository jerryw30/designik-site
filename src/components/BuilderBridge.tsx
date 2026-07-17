"use client";
import { useEffect } from "react";
export default function BuilderBridge() {
  useEffect(() => {
    let outlined: HTMLElement | null = null;
    const target = (event: Event) => {
      const node = event.target as HTMLElement | null;
      if (!node) return null;
      const section = node.closest<HTMLElement>("[data-cms-section]");
      if (!section) return null;
      const leaf =
        node.childElementCount === 0 &&
        (node.textContent?.trim() ||
          node instanceof HTMLImageElement ||
          node instanceof HTMLVideoElement)
          ? node
          : null;
      const widget = node.closest<HTMLElement>("[data-cms-element]");
      const candidate =
        widget ||
        leaf ||
        node.closest<HTMLElement>("h1,h2,h3,h4,h5,h6,p,a,button,img,video");
      return candidate && section.contains(candidate) ? candidate : section;
    };
    const selector = (node: HTMLElement, section: HTMLElement) => {
      const parts: string[] = [];
      let current: HTMLElement | null = node;
      while (current && current !== section) {
        const tag = current.tagName.toLowerCase();
        const siblings = current.parentElement
          ? [...current.parentElement.children].filter(
              (item) => item.tagName === current?.tagName,
            )
          : [];
        const position = siblings.indexOf(current) + 1;
        parts.unshift(`${tag}:nth-of-type(${Math.max(1, position)})`);
        current = current.parentElement;
      }
      return parts.join(" > ");
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
      const elementSource =
        node instanceof HTMLImageElement || node instanceof HTMLVideoElement
          ? node.getAttribute("src")
          : node instanceof HTMLAnchorElement
            ? node.getAttribute("href")
            : null;
      window.parent.postMessage(
        {
          source: "designik-builder",
          sectionId: section.dataset.cmsSection,
          elementId: node.dataset.cmsElement || null,
          elementText: node.textContent?.trim() || "",
          elementSource: elementSource || "",
          elementTag: node.tagName.toLowerCase(),
          elementSelector: selector(node, section),
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

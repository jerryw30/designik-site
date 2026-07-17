"use client";
import { useEffect } from "react";
export default function BuilderBridge() {
  useEffect(() => {
    const nodes = [
      ...document.querySelectorAll<HTMLElement>("[data-cms-section]"),
    ];
    const cleanups = nodes.map((node) => {
      const enter = () => {
        node.style.outline = "2px solid #ff2f88";
        node.style.outlineOffset = "-2px";
      };
      const leave = () => {
        node.style.outline = "";
        node.style.outlineOffset = "";
      };
      const click = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage(
          { source: "designik-builder", sectionId: node.dataset.cmsSection },
          window.location.origin,
        );
      };
      node.addEventListener("mouseenter", enter);
      node.addEventListener("mouseleave", leave);
      node.addEventListener("click", click, true);
      return () => {
        node.removeEventListener("mouseenter", enter);
        node.removeEventListener("mouseleave", leave);
        node.removeEventListener("click", click, true);
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);
  return null;
}

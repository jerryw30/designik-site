"use client";

import { useRef } from "react";

/**
 * WordPress-style "select all" header checkbox: toggles every checkbox named
 * `ids` inside the closest form.
 */
export function SelectAllBox() {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all"
      className="h-4 w-4 accent-[#2271b1]"
      onChange={() => {
        const form = ref.current?.closest("form");
        if (!form) return;
        form.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((box) => {
          box.checked = ref.current!.checked;
        });
      }}
    />
  );
}

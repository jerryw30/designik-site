"use client";

import { useRef } from "react";

/**
 * Submit button that asks for confirmation before running its (server)
 * form action. Use for destructive actions like permanent deletes.
 */
export function ConfirmButton({
  message,
  formAction,
  className,
  children,
}: {
  message: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      formAction={formAction}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

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
      className="h-4 w-4 accent-[#a10140]"
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

"use client";

import { useState } from "react";

/** Password field with a show/hide eye toggle. */
export function PasswordInput({
  name = "password",
  id,
  placeholder,
  minLength,
  required,
  autoComplete,
  className = "",
  tone = "light",
}: {
  name?: string;
  id?: string;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        id={id}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
        autoComplete={autoComplete}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition ${
          tone === "dark" ? "text-white/45 hover:text-white" : "text-neutral-400 hover:text-neutral-700"
        }`}
      >
        {show ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
            <path d="M17.94 17.94A10.5 10.5 0 0 1 12 20c-7 0-10-8-10-8a18.4 18.4 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.8 9.8 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <path d="M2 2l20 20" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
            <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          </svg>
        )}
      </button>
    </div>
  );
}

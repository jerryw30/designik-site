"use client";
import { useState } from "react";
import type { FormDefinition } from "@/app/admin/forms/actions";
export default function PublicForm({
  formId,
  definition,
}: {
  formId: string;
  definition: FormDefinition;
}) {
  const [status, setStatus] = useState<
      "idle" | "sending" | "success" | "error"
    >("idle"),
    [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus("sending");
    const data = Object.fromEntries(new FormData(formElement));
    try {
      const response = await fetch(`/api/forms/${formId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        setStatus("success");
        setMessage(result.message);
        formElement.reset();
      } else {
        setStatus("error");
        setMessage(result.error || "Submission failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error — please try again.");
    }
  }
  if (status === "success")
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-800">
        {message}
      </div>
    );
  return (
    <form onSubmit={submit} className="grid gap-4">
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      {definition.fields.map((field) => (
        <label key={field.id} className="block text-sm font-medium">
          {field.type !== "checkbox" && field.label}
          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              required={field.required}
              placeholder={field.placeholder}
              className="mt-1 block min-h-32 w-full rounded-xl border p-3"
            />
          ) : field.type === "select" ? (
            <select
              name={field.name}
              required={field.required}
              className="mt-1 block w-full rounded-xl border p-3"
            >
              <option value="">Select…</option>
              {field.options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <span className="flex items-center gap-2">
              <input
                name={field.name}
                type="checkbox"
                required={field.required}
              />
              {field.label}
            </span>
          ) : (
            <input
              name={field.name}
              type={field.type === "phone" ? "tel" : field.type}
              required={field.required}
              placeholder={field.placeholder}
              className="mt-1 block w-full rounded-xl border p-3"
            />
          )}
        </label>
      ))}
      <button disabled={status === "sending"} className="admin-button py-3">
        {status === "sending" ? "Sending…" : definition.submitLabel}
      </button>
      {status === "error" && <p className="text-sm text-red-600">{message}</p>}
    </form>
  );
}

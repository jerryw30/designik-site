"use client";
import { useState, useTransition } from "react";
import { saveForm, type FormDefinition, type FormField } from "./actions";
const fieldTypes = [
  "text",
  "email",
  "phone",
  "textarea",
  "select",
  "checkbox",
] as const;
export default function FormEditor({
  id,
  initialTitle,
  initialDefinition,
}: {
  id: string;
  initialTitle: string;
  initialDefinition: FormDefinition;
}) {
  const [title, setTitle] = useState(initialTitle),
    [definition, setDefinition] = useState(initialDefinition),
    [dragged, setDragged] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    [pending, start] = useTransition();
  const fields = definition.fields;
  const update = (id: string, patch: Partial<FormField>) =>
    setDefinition((old) => ({
      ...old,
      fields: old.fields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    }));
  const add = () =>
    setDefinition((old) => ({
      ...old,
      fields: [
        ...old.fields,
        {
          id: crypto.randomUUID(),
          type: "text",
          label: "New field",
          name: `field-${old.fields.length + 1}`,
          placeholder: "",
          required: false,
          options: [],
        },
      ],
    }));
  const remove = (id: string) =>
    setDefinition((old) => ({
      ...old,
      fields: old.fields.filter((field) => field.id !== id),
    }));
  const duplicate = (field: FormField) =>
    setDefinition((old) => ({
      ...old,
      fields: [
        ...old.fields,
        {
          ...field,
          id: crypto.randomUUID(),
          label: `${field.label} Copy`,
          name: `${field.name}-copy`,
        },
      ],
    }));
  const drop = (target: string) => {
    if (!dragged || dragged === target) return;
    const next = [...fields],
      from = next.findIndex((field) => field.id === dragged),
      to = next.findIndex((field) => field.id === target);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDefinition({ ...definition, fields: next });
    setDragged(null);
  };
  const persist = () =>
    start(async () => {
      await saveForm(id, title, definition);
      setMessage("Form saved");
    });
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
      <section className="rounded-2xl border bg-white p-6">
        <label className="text-sm font-medium">
          Form name
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-xl border p-3 text-xl"
          />
        </label>
        <div className="mt-6 space-y-3">
          {fields.map((field) => (
            <div
              key={field.id}
              draggable
              onDragStart={() => setDragged(field.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(field.id)}
              className="rounded-xl border p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="cursor-grab text-neutral-400">⠿</span>
                <b className="mr-auto">{field.label}</b>
                <button
                  type="button"
                  onClick={() => duplicate(field)}
                  className="text-xs"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => remove(field.id)}
                  className="text-xs text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={field.type}
                  onChange={(e) =>
                    update(field.id, {
                      type: e.target.value as FormField["type"],
                    })
                  }
                  className="rounded-lg border p-2"
                >
                  {fieldTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <input
                  value={field.label}
                  onChange={(e) => update(field.id, { label: e.target.value })}
                  aria-label="Field label"
                  className="rounded-lg border p-2"
                />
                <input
                  value={field.name}
                  onChange={(e) => update(field.id, { name: e.target.value })}
                  aria-label="Field name"
                  className="rounded-lg border p-2"
                />
                <input
                  value={field.placeholder}
                  onChange={(e) =>
                    update(field.id, { placeholder: e.target.value })
                  }
                  aria-label="Placeholder"
                  className="rounded-lg border p-2"
                />
                {field.type === "select" && (
                  <input
                    value={field.options.join(", ")}
                    onChange={(e) =>
                      update(field.id, {
                        options: e.target.value
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Options, comma separated"
                    className="rounded-lg border p-2"
                  />
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      update(field.id, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          className="mt-4 w-full rounded-xl border border-dashed p-3"
        >
          + Add field
        </button>
      </section>
      <aside>
        <div className="sticky top-24 space-y-4 rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Form settings</h2>
          <label className="block text-sm">
            Submit label
            <input
              value={definition.submitLabel}
              onChange={(e) =>
                setDefinition({ ...definition, submitLabel: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border p-2"
            />
          </label>
          <label className="block text-sm">
            Success message
            <textarea
              value={definition.successMessage}
              onChange={(e) =>
                setDefinition({ ...definition, successMessage: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border p-2"
            />
          </label>
          <label className="block text-sm">
            Notification email
            <input
              type="email"
              value={definition.notificationEmail}
              onChange={(e) =>
                setDefinition({
                  ...definition,
                  notificationEmail: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-lg border p-2"
            />
          </label>
          <button
            disabled={pending}
            onClick={persist}
            className="admin-button w-full"
          >
            {pending ? "Saving…" : "Save form"}
          </button>
          <p className="text-center text-xs text-emerald-600">{message}</p>
        </div>
      </aside>
    </div>
  );
}

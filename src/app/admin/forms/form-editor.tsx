"use client";
import { useState, useTransition } from "react";
import { T } from "../theme";
import { saveForm, type FormDefinition, type FormField } from "./actions";

const fieldTypes = [
  "text",
  "email",
  "phone",
  "textarea",
  "select",
  "checkbox",
] as const;

const miniLabel =
  "mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400";

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
      <section className={T.cardPad}>
        <label className="block">
          <span className={T.label}>Form name</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${T.input} text-[18px] font-semibold`}
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
              className="rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-[#a10140]/35"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="cursor-grab text-neutral-300">⠿</span>
                <b className="mr-auto text-[13.5px] font-semibold text-[#1b1c20]">
                  {field.label}
                </b>
                <button
                  type="button"
                  onClick={() => duplicate(field)}
                  className={`text-[12px] ${T.mutedLink}`}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => remove(field.id)}
                  className={`text-[12px] ${T.dangerLink}`}
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <span className={miniLabel}>Type</span>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      update(field.id, {
                        type: e.target.value as FormField["type"],
                      })
                    }
                    className={`${T.select} w-full`}
                  >
                    {fieldTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className={miniLabel}>Label</span>
                  <input
                    value={field.label}
                    onChange={(e) => update(field.id, { label: e.target.value })}
                    aria-label="Field label"
                    className={T.input}
                  />
                </div>
                <div>
                  <span className={miniLabel}>Name</span>
                  <input
                    value={field.name}
                    onChange={(e) => update(field.id, { name: e.target.value })}
                    aria-label="Field name"
                    className={T.input}
                  />
                </div>
                <div>
                  <span className={miniLabel}>Placeholder</span>
                  <input
                    value={field.placeholder}
                    onChange={(e) =>
                      update(field.id, { placeholder: e.target.value })
                    }
                    aria-label="Placeholder"
                    className={T.input}
                  />
                </div>
                {field.type === "select" && (
                  <div>
                    <span className={miniLabel}>Options</span>
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
                      className={T.input}
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 self-end pb-2 text-[13px] font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      update(field.id, { required: e.target.checked })
                    }
                    className={T.checkbox}
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
          className="mt-4 w-full rounded-lg border border-dashed border-neutral-300 bg-white p-3 text-[13px] font-medium text-neutral-500 transition hover:border-[#a10140]/50 hover:text-[#a10140]"
        >
          + Add field
        </button>
      </section>
      <aside>
        <div className={`sticky top-24 space-y-4 ${T.cardPad}`}>
          <h2 className="text-[15px] font-semibold text-[#1b1c20]">
            Form settings
          </h2>
          <label className="block">
            <span className={T.label}>Submit label</span>
            <input
              value={definition.submitLabel}
              onChange={(e) =>
                setDefinition({ ...definition, submitLabel: e.target.value })
              }
              className={T.input}
            />
          </label>
          <label className="block">
            <span className={T.label}>Success message</span>
            <textarea
              value={definition.successMessage}
              onChange={(e) =>
                setDefinition({ ...definition, successMessage: e.target.value })
              }
              className={`${T.input} min-h-[84px]`}
            />
          </label>
          <label className="block">
            <span className={T.label}>Notification email</span>
            <input
              type="email"
              value={definition.notificationEmail}
              onChange={(e) =>
                setDefinition({
                  ...definition,
                  notificationEmail: e.target.value,
                })
              }
              className={T.input}
            />
          </label>
          <button
            disabled={pending}
            onClick={persist}
            className={`${T.btnPrimary} w-full disabled:opacity-60`}
          >
            {pending ? "Saving…" : "Save form"}
          </button>
          <p className="text-center text-[12px] font-medium text-emerald-600">
            {message}
          </p>
        </div>
      </aside>
    </div>
  );
}

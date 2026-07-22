"use client";
import { useState, useTransition } from "react";
import { T } from "../theme";
import { saveMenu, type MenuItem } from "./actions";

const fieldLabel =
  "mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400";

export default function MenuEditor({
  id,
  initialTitle,
  initialItems,
}: {
  id: string;
  initialTitle: string;
  initialItems: MenuItem[];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState(initialItems);
  const [dragged, setDragged] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const update = (id: string, patch: Partial<MenuItem>) =>
    setItems((list) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const add = () =>
    setItems((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        label: "New item",
        url: "#",
        parentId: null,
        target: "_self",
      },
    ]);
  const duplicate = (item: MenuItem) =>
    setItems((list) => [
      ...list,
      { ...item, id: crypto.randomUUID(), label: `${item.label} Copy` },
    ]);
  const remove = (id: string) =>
    setItems((list) =>
      list
        .filter((item) => item.id !== id)
        .map((item) =>
          item.parentId === id ? { ...item, parentId: null } : item,
        ),
    );
  const move = (target: string) => {
    if (!dragged || dragged === target) return;
    const next = [...items],
      from = next.findIndex((item) => item.id === dragged),
      to = next.findIndex((item) => item.id === target);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragged(null);
  };
  const persist = () =>
    start(async () => {
      try {
        setError(false);
        await saveMenu(id, title, items);
        setMessage("Menu saved");
      } catch {
        setError(true);
        setMessage("Could not save the menu — please retry.");
      }
    });
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className={T.cardPad}>
        <label className="block">
          <span className={T.label}>Menu name</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={`${T.input} text-[17px] font-semibold`}
          />
        </label>
        <div className="mt-6 space-y-2.5">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragged(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => move(item.id)}
              className={`rounded-lg border border-black/[0.07] bg-white p-4 shadow-[0_1px_2px_rgba(16,17,22,0.04)] transition hover:border-[#a10140]/25 ${item.parentId ? "ml-10 border-l-4 border-l-[#a10140]/60" : ""}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="cursor-grab text-neutral-300 transition hover:text-[#a10140]">
                  ⠿
                </span>
                <b className="mr-auto text-[13px] font-semibold text-[#1b1c20]">
                  Item {index + 1}
                </b>
                <button
                  type="button"
                  onClick={() => duplicate(item)}
                  className="text-[12px] font-medium text-neutral-500 transition hover:text-[#a10140]"
                >
                  Duplicate
                </button>
                <span className={T.dot}>·</span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-[12px] font-medium text-red-600 hover:text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <span className={fieldLabel}>Label</span>
                  <input
                    aria-label="Label"
                    value={item.label}
                    onChange={(event) =>
                      update(item.id, { label: event.target.value })
                    }
                    className={T.input}
                  />
                </div>
                <div>
                  <span className={fieldLabel}>URL</span>
                  <input
                    aria-label="URL"
                    value={item.url}
                    onChange={(event) =>
                      update(item.id, { url: event.target.value })
                    }
                    className={T.input}
                  />
                </div>
                <div>
                  <span className={fieldLabel}>Parent item</span>
                  <select
                    aria-label="Parent item"
                    value={item.parentId || ""}
                    onChange={(event) =>
                      update(item.id, { parentId: event.target.value || null })
                    }
                    className={`${T.select} block w-full`}
                  >
                    <option value="">Top level</option>
                    {items
                      .filter(
                        (parent) => parent.id !== item.id && !parent.parentId,
                      )
                      .map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          Child of {parent.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <span className={fieldLabel}>Link target</span>
                  <select
                    aria-label="Link target"
                    value={item.target}
                    onChange={(event) =>
                      update(item.id, {
                        target: event.target.value as "_self" | "_blank",
                      })
                    }
                    className={`${T.select} block w-full`}
                  >
                    <option value="_self">Same window</option>
                    <option value="_blank">New window</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          className="mt-4 w-full rounded-lg border border-dashed border-neutral-300 bg-white p-3 text-[13px] font-medium text-neutral-500 transition hover:border-[#a10140]/50 hover:text-[#a10140]"
        >
          + Add menu item
        </button>
      </section>
      <aside>
        <div className={`${T.card} sticky top-24 p-5`}>
          <h2 className="text-[14px] font-semibold text-[#1b1c20]">
            Menu structure
          </h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-500">
            Drag items to reorder. Choose a parent to create a dropdown.
          </p>
          <button
            disabled={pending}
            onClick={persist}
            className={`${T.btnPrimary} mt-5 w-full disabled:opacity-50`}
          >
            {pending ? "Saving…" : "Save menu"}
          </button>
          <p
            className={`mt-3 text-center text-[12px] font-medium ${error ? "text-red-600" : "text-emerald-600"}`}
          >
            {message}
          </p>
        </div>
      </aside>
    </div>
  );
}

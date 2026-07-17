"use client";
import { useState, useTransition } from "react";
import { saveMenu, type MenuItem } from "./actions";
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
      await saveMenu(id, title, items);
      setMessage("Menu draft saved");
    });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-2xl border bg-white p-6">
        <label className="text-sm font-medium">
          Menu name
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 block w-full rounded-xl border p-3 text-xl"
          />
        </label>
        <div className="mt-6 space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragged(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => move(item.id)}
              className={`rounded-xl border bg-white p-4 shadow-sm ${item.parentId ? "ml-10 border-l-4 border-l-pink-400" : ""}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="cursor-grab text-neutral-400">⠿</span>
                <b className="mr-auto text-sm">Item {index + 1}</b>
                <button
                  type="button"
                  onClick={() => duplicate(item)}
                  className="text-xs"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-xs text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  aria-label="Label"
                  value={item.label}
                  onChange={(event) =>
                    update(item.id, { label: event.target.value })
                  }
                  className="rounded-lg border p-2"
                />
                <input
                  aria-label="URL"
                  value={item.url}
                  onChange={(event) =>
                    update(item.id, { url: event.target.value })
                  }
                  className="rounded-lg border p-2"
                />
                <select
                  aria-label="Parent item"
                  value={item.parentId || ""}
                  onChange={(event) =>
                    update(item.id, { parentId: event.target.value || null })
                  }
                  className="rounded-lg border p-2"
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
                <select
                  aria-label="Link target"
                  value={item.target}
                  onChange={(event) =>
                    update(item.id, {
                      target: event.target.value as "_self" | "_blank",
                    })
                  }
                  className="rounded-lg border p-2"
                >
                  <option value="_self">Same window</option>
                  <option value="_blank">New window</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          className="mt-4 w-full rounded-xl border border-dashed p-3 text-sm"
        >
          + Add menu item
        </button>
      </section>
      <aside>
        <div className="sticky top-24 rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Menu structure</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Drag items to reorder. Choose a parent to create a dropdown.
          </p>
          <button
            disabled={pending}
            onClick={persist}
            className="admin-button mt-5 w-full"
          >
            {pending ? "Saving…" : "Save menu"}
          </button>
          <p className="mt-3 text-center text-xs text-emerald-600">{message}</p>
        </div>
      </aside>
    </div>
  );
}

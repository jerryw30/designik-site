/**
 * Elementor-style row / column / widget layout model for "widgets" sections.
 *
 * A section holds ROWS, each row holds COLUMNS (with a width %), each column
 * holds a stack of WIDGETS. Old sections that stored a flat `widgets[]` array
 * are migrated to a single full-width row so nothing breaks.
 */

export type LayoutWidget = {
  id: string;
  type: string;
  content: string;
  settings: Record<string, string | number | boolean>;
};

export type LayoutColumn = {
  id: string;
  width: number; // percentage of the row (columns sum ~100)
  widgets: LayoutWidget[];
};

export type LayoutRow = {
  id: string;
  columns: LayoutColumn[];
  settings: {
    gap: number;
    paddingY: number;
    paddingX: number;
    background: string;
    maxWidth: number; // 0 = inherit section max width
    verticalAlign: "top" | "center" | "bottom" | "stretch";
    reverseOnMobile: boolean;
  };
};

export type SectionLayout = {
  backgroundColor: string;
  paddingTop: number;
  paddingBottom: number;
  maxWidth: number;
  rows: LayoutRow[];
};

/** Column-count / split presets offered when adding a row. */
export const COLUMN_PRESETS: { label: string; widths: number[] }[] = [
  { label: "1", widths: [100] },
  { label: "1 / 1", widths: [50, 50] },
  { label: "1 / 1 / 1", widths: [33.33, 33.33, 33.34] },
  { label: "1 / 1 / 1 / 1", widths: [25, 25, 25, 25] },
  { label: "2 / 1", widths: [66.66, 33.34] },
  { label: "1 / 2", widths: [33.34, 66.66] },
  { label: "1 / 2 / 1", widths: [25, 50, 25] },
];

export const rowDefaults: LayoutRow["settings"] = {
  gap: 24,
  paddingY: 0,
  paddingX: 0,
  background: "transparent",
  maxWidth: 0,
  verticalAlign: "top",
  reverseOnMobile: false,
};

let seed = 0;
function uid(prefix: string) {
  // deterministic-ish id (avoids crypto in RSC); collisions harmless in a form
  seed += 1;
  return `${prefix}-${seed.toString(36)}-${Math.floor(performance?.now?.() ?? 0)}`;
}

export function makeColumn(width: number, widgets: LayoutWidget[] = []): LayoutColumn {
  return { id: uid("col"), width, widgets };
}

export function makeRow(widths: number[] = [100], widgets: LayoutWidget[] = []): LayoutRow {
  const cols = widths.map((w, i) => makeColumn(w, i === 0 ? widgets : []));
  return { id: uid("row"), columns: cols, settings: { ...rowDefaults } };
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function asWidget(v: unknown): LayoutWidget | null {
  const o = asObject(v);
  if (!o.type) return null;
  return {
    id: String(o.id || uid("w")),
    type: String(o.type),
    content: typeof o.content === "string" ? o.content : String(o.content ?? ""),
    settings: asObject(o.settings) as LayoutWidget["settings"],
  };
}

function asColumn(v: unknown): LayoutColumn {
  const o = asObject(v);
  const widgets = Array.isArray(o.widgets)
    ? (o.widgets.map(asWidget).filter(Boolean) as LayoutWidget[])
    : [];
  return { id: String(o.id || uid("col")), width: Number(o.width) || 100, widgets };
}

function asRow(v: unknown): LayoutRow {
  const o = asObject(v);
  const columns = Array.isArray(o.columns) && o.columns.length
    ? o.columns.map(asColumn)
    : [makeColumn(100)];
  const s = asObject(o.settings);
  return {
    id: String(o.id || uid("row")),
    columns,
    settings: {
      gap: Number(s.gap ?? rowDefaults.gap),
      paddingY: Number(s.paddingY ?? rowDefaults.paddingY),
      paddingX: Number(s.paddingX ?? rowDefaults.paddingX),
      background: String(s.background ?? rowDefaults.background),
      maxWidth: Number(s.maxWidth ?? rowDefaults.maxWidth),
      verticalAlign: (["top", "center", "bottom", "stretch"].includes(String(s.verticalAlign))
        ? s.verticalAlign
        : rowDefaults.verticalAlign) as LayoutRow["settings"]["verticalAlign"],
      reverseOnMobile: s.reverseOnMobile === true,
    },
  };
}

/**
 * Normalize any stored widgets-section content into the row/column model.
 * Accepts both the new `{ rows }` shape and the legacy flat `{ widgets }` shape.
 */
export function normalizeLayout(content: unknown): SectionLayout {
  const o = asObject(content);
  const backgroundColor = String(o.backgroundColor ?? "#ffffff");
  const paddingTop = Number(o.paddingTop ?? 64);
  const paddingBottom = Number(o.paddingBottom ?? 64);
  const maxWidth = Number(o.maxWidth ?? 1200);

  let rows: LayoutRow[];
  if (Array.isArray(o.rows) && o.rows.length) {
    rows = o.rows.map(asRow);
  } else if (Array.isArray(o.widgets) && o.widgets.length) {
    // legacy flat list -> one full-width row/column
    const widgets = (o.widgets.map(asWidget).filter(Boolean) as LayoutWidget[]);
    rows = [makeRow([100], widgets)];
  } else {
    rows = [];
  }
  return { backgroundColor, paddingTop, paddingBottom, maxWidth, rows };
}

/** Flatten for callers that still want every widget (e.g. legacy consumers). */
export function allWidgets(layout: SectionLayout): LayoutWidget[] {
  return layout.rows.flatMap((r) => r.columns.flatMap((c) => c.widgets));
}

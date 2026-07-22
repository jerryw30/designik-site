/**
 * Designik admin design system — shared class strings so every screen looks
 * and behaves consistently. WordPress-caliber structure, Designik identity:
 * wine (#a10140) accent, soft cards, modern rounded controls.
 */

export const T = {
  /* links */
  link: "font-medium text-[#a10140] hover:text-[#7c0134] hover:underline",
  dangerLink: "font-medium text-red-600 hover:text-red-700 hover:underline",
  mutedLink: "text-neutral-500 hover:text-[#a10140] hover:underline",

  /* buttons */
  btnPrimary:
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#a10140] to-[#c81a5e] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(161,1,64,0.25)] transition hover:opacity-95 active:scale-[0.98]",
  btn:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 transition hover:border-[#a10140]/40 hover:text-[#a10140]",
  btnDanger:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-[13px] font-medium text-red-600 transition hover:bg-red-50",
  btnSmall:
    "inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[12.5px] font-medium text-neutral-600 transition hover:border-[#a10140]/40 hover:text-[#a10140]",

  /* surfaces */
  card: "rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(16,17,22,0.05)]",
  cardPad: "rounded-xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(16,17,22,0.05)]",
  cardHeader: "flex items-center justify-between border-b border-black/[0.05] px-5 py-4",

  /* forms */
  input:
    "block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-[#1b1c20] outline-none transition placeholder:text-neutral-400 focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15",
  select:
    "rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-[13px] text-[#1b1c20] outline-none focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15",
  label: "mb-1.5 block text-[13px] font-medium text-neutral-700",
  help: "mt-1 text-[12px] text-neutral-400",
  checkbox: "h-4 w-4 rounded accent-[#a10140]",

  /* screen header */
  screenTitle: "text-[22px] font-semibold text-[#1b1c20]",

  /* list table */
  table: "w-full border-collapse text-[13px]",
  tableWrap: "mt-3 overflow-x-auto rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(16,17,22,0.05)]",
  th: "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400",
  theadRow: "border-b border-black/[0.06]",
  row: "group border-b border-black/[0.04] align-top transition-colors last:border-0 hover:bg-[#a10140]/[0.025]",
  td: "px-4 py-3",
  rowTitle: "text-[14px] font-semibold text-[#a10140] hover:text-[#7c0134] hover:underline",
  rowActions:
    "mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100",
  dot: "text-neutral-300",

  /* pills */
  pillPublished: "inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-700",
  pillDraft: "inline-flex rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700",
  pillTrash: "inline-flex rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-red-600",
  pillNeutral: "inline-flex rounded-full bg-neutral-500/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-neutral-600",
  pillNew: "inline-flex rounded-full bg-[#ff2e73]/10 px-2.5 py-0.5 text-[11.5px] font-bold text-[#d61860]",

  /* status filter row (subsubsub) */
  filterActive: "font-semibold text-[#1b1c20]",
  filterLink: "font-medium text-[#a10140] hover:underline",
} as const;

export function statusPill(status: string) {
  const s = status.toUpperCase();
  if (s === "PUBLISHED") return T.pillPublished;
  if (s === "DRAFT") return T.pillDraft;
  if (s === "TRASH" || s === "ARCHIVED") return T.pillTrash;
  if (s === "NEW") return T.pillNew;
  return T.pillNeutral;
}

export function wpDate(d: Date) {
  const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  return `${date} at ${time}`;
}

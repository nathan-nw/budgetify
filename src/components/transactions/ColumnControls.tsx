"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpDown, Check, Filter, Search } from "lucide-react";
import type {
  ColumnState,
  FilterState,
  GroupBy,
  SortDir,
  SortField,
} from "@/lib/analytics";
import type { Category } from "@/lib/types";

const GROUPS: { key: GroupBy; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const DATE_PRESETS = [
  "This month",
  "Last month",
  "Last 3 months",
  "Year to date",
  "All time",
] as const;
type DatePreset = (typeof DATE_PRESETS)[number];

function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(preset: DatePreset): { from: string | null; to: string | null } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "This month":
      return { from: isoOf(new Date(y, m, 1)), to: isoOf(now) };
    case "Last month":
      return {
        from: isoOf(new Date(y, m - 1, 1)),
        to: isoOf(new Date(y, m, 0)),
      };
    case "Last 3 months":
      return { from: isoOf(new Date(y, m - 2, 1)), to: isoOf(now) };
    case "Year to date":
      return { from: isoOf(new Date(y, 0, 1)), to: isoOf(now) };
    case "All time":
      return { from: null, to: null };
  }
}

/** Icon button + popover panel that closes on outside-click or Escape. */
function Popover({
  icon,
  label,
  active,
  children,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          active || open
            ? "border-text/30 bg-page text-text"
            : "border-border text-muted hover:text-text"
        }`}
      >
        {icon}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

export function ColumnControls({
  state,
  onStateChange,
  categories,
}: {
  state: ColumnState;
  onStateChange: (s: ColumnState) => void;
  categories: Category[];
}) {
  const { groupBy, sortField, sortDir, filter } = state;

  function setGroupBy(g: GroupBy) {
    onStateChange({ ...state, groupBy: g });
  }
  function setSort(field: SortField, dir: SortDir) {
    onStateChange({ ...state, sortField: field, sortDir: dir });
  }
  function setFilter(patch: Partial<FilterState>) {
    onStateChange({ ...state, filter: { ...filter, ...patch } });
  }
  function toggleCategory(id: string) {
    const has = filter.categoryIds.includes(id);
    setFilter({
      categoryIds: has
        ? filter.categoryIds.filter((c) => c !== id)
        : [...filter.categoryIds, id],
    });
  }

  const filterActive =
    filter.categoryIds.length > 0 ||
    !filter.includeArchived ||
    !!filter.from ||
    !!filter.to;
  const searchActive = filter.query.trim().length > 0;
  const hasArchived = categories.some((c) => c.is_archived);

  return (
    <div className="flex items-center gap-2">
      {/* Grouping pills */}
      <div className="inline-flex rounded-full border border-border p-0.5">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGroupBy(g.key)}
            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
              groupBy === g.key
                ? "bg-text text-page"
                : "text-muted hover:text-text"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Filter */}
        <Popover
          icon={<Filter size={15} />}
          label="Filter"
          active={filterActive}
        >
          <p className="mb-2 text-xs font-medium text-muted">Categories</p>
          <div className="mb-3 max-h-40 space-y-0.5 overflow-y-auto">
            {categories.length === 0 && (
              <p className="text-xs text-muted">No categories.</p>
            )}
            {categories.map((c) => {
              const checked = filter.categoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-sm hover:bg-page"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? "border-text bg-text text-page"
                        : "border-border"
                    }`}
                  >
                    {checked && <Check size={11} />}
                  </span>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="truncate">
                    {c.name}
                    {c.is_archived ? " (archived)" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {hasArchived && (
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filter.includeArchived}
                onChange={(e) =>
                  setFilter({ includeArchived: e.target.checked })
                }
              />
              Include archived
            </label>
          )}

          <p className="mb-2 text-xs font-medium text-muted">Date range</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {DATE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilter(presetRange(p))}
                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted hover:text-text"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              value={filter.from ?? ""}
              onChange={(e) => setFilter({ from: e.target.value || null })}
              className="w-full rounded-lg border border-border bg-page px-2 py-1 outline-none"
            />
            <span className="text-muted">–</span>
            <input
              type="date"
              value={filter.to ?? ""}
              onChange={(e) => setFilter({ to: e.target.value || null })}
              className="w-full rounded-lg border border-border bg-page px-2 py-1 outline-none"
            />
          </div>

          {filterActive && (
            <button
              type="button"
              onClick={() =>
                setFilter({
                  categoryIds: [],
                  includeArchived: true,
                  from: null,
                  to: null,
                })
              }
              className="mt-3 w-full rounded-lg border border-border py-1.5 text-xs text-muted hover:text-text"
            >
              Clear filters
            </button>
          )}
        </Popover>

        {/* Sort */}
        <Popover icon={<ArrowUpDown size={15} />} label="Sort" active={false}>
          <p className="mb-2 text-xs font-medium text-muted">Sort by</p>
          <div className="space-y-1">
            {(
              [
                ["date", "desc", "Newest first"],
                ["date", "asc", "Oldest first"],
                ["amount", "desc", "Largest amount"],
                ["amount", "asc", "Smallest amount"],
              ] as [SortField, SortDir, string][]
            ).map(([field, dir, label]) => {
              const selected = sortField === field && sortDir === dir;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSort(field, dir)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-page ${
                    selected ? "text-text" : "text-muted"
                  }`}
                >
                  {label}
                  {selected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </Popover>

        {/* Search */}
        <Popover
          icon={<Search size={15} />}
          label="Search"
          active={searchActive}
        >
          <p className="mb-2 text-xs font-medium text-muted">Search</p>
          <input
            type="text"
            value={filter.query}
            onChange={(e) => setFilter({ query: e.target.value })}
            placeholder="Note or category…"
            className="w-full rounded-lg border border-border bg-page px-2.5 py-1.5 text-sm outline-none focus:border-text/30"
          />
        </Popover>
      </div>
    </div>
  );
}

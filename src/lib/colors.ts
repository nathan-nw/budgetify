import type { TxType } from "./types";

// Fixed palette offered in the category color picker and used for seeding.
// Each category stores its own hex, so its color is identical everywhere it
// appears (chart slice, legend, transaction dot).
export const PALETTE = [
  "#378ADD", // blue
  "#1F9D63", // green
  "#DB6A4B", // coral
  "#D7A53B", // amber
  "#8A6FD4", // violet
  "#3FAFA0", // teal
  "#D96BA0", // pink
  "#6B8E23", // olive
  "#C7613A", // rust
  "#5B7DB1", // slate blue
  "#A26FB0", // mauve
  "#7A9E4C", // moss
];

// Fallback color matching the DB default, used if a category somehow lacks one.
export const DEFAULT_COLOR = "#378ADD";

// Starter categories seeded on a user's first dashboard load. Colors are drawn
// from the palette so a fresh account already looks intentional.
export const STARTER_CATEGORIES: {
  name: string;
  type: TxType;
  color: string;
}[] = [
  { name: "Salary", type: "income", color: "#1F9D63" },
  { name: "Freelance", type: "income", color: "#3FAFA0" },
  { name: "Other income", type: "income", color: "#6B8E23" },
  { name: "Rent", type: "expense", color: "#378ADD" },
  { name: "Groceries", type: "expense", color: "#DB6A4B" },
  { name: "Dining", type: "expense", color: "#D7A53B" },
  { name: "Transport", type: "expense", color: "#8A6FD4" },
  { name: "Utilities", type: "expense", color: "#5B7DB1" },
  { name: "Entertainment", type: "expense", color: "#D96BA0" },
  { name: "Other", type: "expense", color: "#A26FB0" },
];

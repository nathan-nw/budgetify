"use client";

import { Check } from "lucide-react";
import { PALETTE } from "@/lib/colors";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((color) => {
        const selected = color.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Select color ${color}`}
            className="flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              boxShadow: selected ? `0 0 0 2px ${color}` : undefined,
            }}
          >
            {selected && <Check size={14} className="text-white" />}
          </button>
        );
      })}
    </div>
  );
}

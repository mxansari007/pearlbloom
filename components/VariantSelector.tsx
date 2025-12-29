"use client";

import { Variant } from "../types/products";

type Props = {
  variants: Variant[];
  selected: Variant;
  onChange: (variant: Variant) => void;
};

export default function VariantSelector({
  variants,
  selected,
  onChange,
}: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {variants.map((variant) => {
        const label =
          variant.attributes.map((a) => a.value).join(" / ") ||
          "Variant";

        const disabled =
          variant.stock.track && variant.stock.quantity <= 0;

        return (
          <button
            key={variant.id}
            onClick={() => onChange(variant)}
            disabled={disabled}
            className={`px-4 py-2 rounded-md border text-sm transition
              ${
                selected.id === variant.id
                  ? "border-[rgb(var(--gold-rgb))] bg-[rgba(var(--gold-rgb),0.1)] text-[rgb(var(--gold-rgb))]"
                  : "border-[var(--input-border)] bg-[var(--input-bg)] hover:bg-[var(--glass)]"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

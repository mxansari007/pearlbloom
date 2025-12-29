"use client";

import type { Product, Variant } from "../types/products";

export default function ProductVariantBlock({
  product,
  selectedVariant,
  onChange,
}: {
  product: Product;
  selectedVariant?: Variant;
  onChange: (v: Variant) => void;
}) {
  return (
    <div className="variant-selector">
      {product.variants.map((v) => {
        const label = v.attributes.map((a) => a.value).join(" / ");
        const disabled = v.stock.track && v.stock.quantity <= 0;
        const isSelected = selectedVariant?.id === v.id;

        return (
          <button
            key={v.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(v)}
            className={`variant-selector__option ${
              isSelected ? "variant-selector__option--selected" : ""
            } ${disabled ? "variant-selector__option--disabled" : ""}`}
          >
            <span className="variant-selector__radio">
              {isSelected && (
                <span className="variant-selector__radio-dot" />
              )}
            </span>
            <span className="variant-selector__label">{label}</span>
            {disabled && (
              <span className="variant-selector__badge-oos">Sold out</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

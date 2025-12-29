"use client";

import { useState } from "react";
import Image from "next/image";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { X, Star, Loader2 } from "lucide-react";
import { dbClient } from "@/libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";
import type { OrderItem } from "@/types/orders";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: OrderItem;
  orderId?: string;
}

export default function WriteReviewModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  orderId,
}: WriteReviewModalProps) {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please write a review.");
      return;
    }
    if (!user) {
      setError("You must be logged in to review.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Check if already reviewed for this order
      if (orderId) {
        const q = query(
          collection(dbClient, "reviews"),
          where("orderId", "==", orderId),
          where("productId", "==", product.productId)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setError("You have already reviewed this product from this order.");
          setIsSubmitting(false);
          return;
        }
      }

      await addDoc(collection(dbClient, "reviews"), {
        productId: product.productId,
        productName: product.name,
        productImage: product.image || "",
        userId: user.uid,
        userName: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Verified Customer",
        rating,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        verified: true,
        orderId: orderId || null,
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-[var(--panel)] border border-[var(--input-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--input-border)] bg-[var(--glass)]">
          <h2 className="text-lg font-display font-semibold">Write a Review</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--glass-hover)] transition-colors text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4 flex items-center gap-4 bg-[var(--glass)]">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--input-border)] bg-[var(--glass)]">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                No Img
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
            <p className="text-xs text-muted mt-0.5">{product.variantLabel}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Rating */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted">
              Rate this product
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 transition-all ${
                    rating >= star
                      ? "text-[rgb(var(--gold-rgb))] scale-110"
                      : "text-[var(--input-placeholder)] hover:text-[var(--muted)]"
                  }`}
                >
                  <Star
                    size={28}
                    fill={rating >= star ? "currentColor" : "none"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted ml-1">
              Your Review
            </label>
            <div className="relative group">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={5}
                className="w-full p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] outline-none resize-none transition-all duration-200 focus:border-[rgb(var(--gold-rgb))] focus:ring-1 focus:ring-[rgb(var(--gold-rgb))/50] hover:border-[var(--input-border)]"
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-[var(--input-placeholder)] pointer-events-none">
                {text.length} chars
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs text-center bg-red-400/10 p-2 rounded-lg border border-red-400/20">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--input-border)] hover:bg-[var(--glass)] text-sm font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[rgb(var(--gold-rgb))] text-black text-sm font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

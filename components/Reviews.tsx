"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where, orderBy, getDocs } from "firebase/firestore";
import { Star, CheckCircle2, MessageSquare } from "lucide-react";
import { dbClient } from "@/libs/firebase-client";
import type { Review } from "@/types/reviews";
import { useAuthStore } from "@/store/useAppStore";
import type { Order, OrderItem } from "@/types/orders";
import WriteReviewModal from "@/components/WriteReviewModal";

export default function Reviews({ productId }: { productId: string }) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibleItem, setEligibleItem] = useState<OrderItem | null>(null);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !productId) return;

    const checkEligibility = async () => {
      try {
        // 1. Check if reviewed
        const reviewQ = query(
          collection(dbClient, "reviews"),
          where("userId", "==", user.uid),
          where("productId", "==", productId)
        );
        const reviewSnap = await getDocs(reviewQ);
        if (!reviewSnap.empty) {
          setHasReviewed(true);
          return;
        }

        // 2. Check for delivered order
        const orderQ = query(
          collection(dbClient, "orders"),
          where("userId", "==", user.uid),
          where("status", "==", "delivered")
        );
        const orderSnap = await getDocs(orderQ);

        for (const doc of orderSnap.docs) {
          const orderData = doc.data() as Order;
          const item = orderData.items.find((i) => i.productId === productId);
          if (item) {
            setEligibleItem(item);
            setEligibleOrderId(doc.id);
            break;
          }
        }
      } catch (err) {
        console.error("Error checking review eligibility:", err);
      }
    };

    checkEligibility();
  }, [user, productId]);

  useEffect(() => {
    if (!productId) return;

    const q = query(
      collection(dbClient, "reviews"),
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Review[];
        setReviews(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [productId]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-semibold">Customer Reviews</h3>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  fill={star <= Math.round(avg) ? "rgb(var(--gold-rgb))" : "none"}
                  stroke={star <= Math.round(avg) ? "none" : "currentColor"}
                  className={star <= Math.round(avg) ? "text-[rgb(var(--gold-rgb))]" : "text-muted"}
                />
              ))}
            </div>
            <div className="text-sm text-muted">
              {reviews.length ? (
                <>
                  <span className="font-medium text-foreground">{avg.toFixed(1)}</span> out of 5
                  <span className="mx-2">•</span>
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </>
              ) : (
                "No reviews yet"
              )}
            </div>
          </div>
        </div>

        {hasReviewed ? (
          <div className="text-sm text-green-400 font-medium flex items-center gap-2 px-5 py-2.5">
            <CheckCircle2 size={16} />
            You reviewed this product
          </div>
        ) : eligibleItem ? (
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="btn-cta text-sm px-5 py-2.5 w-fit"
          >
            Write a Review
          </button>
        ) : (
          <Link
            href="/orders"
            className="btn-secondary text-sm px-5 py-2.5 w-fit hidden"
          >
            Write a Review
          </Link>
        )}
      </div>

      <WriteReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={() => {
            setHasReviewed(true);
            setIsReviewModalOpen(false);
        }}
        product={eligibleItem!}
        orderId={eligibleOrderId!}
      />

      {/* Review List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed rounded-2xl transition-all"
            style={{
              borderColor: "var(--card-border)",
              background: "var(--card-bg-soft)"
            }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[var(--input-bg)] text-[rgb(var(--gold-rgb))]">
              <MessageSquare size={24} strokeWidth={1.5} />
            </div>
            <h4 className="text-lg font-medium mb-2">No reviews yet</h4>
            <p className="text-muted text-sm max-w-sm mb-6 leading-relaxed">
              Be the first to share your thoughts on this piece. Your feedback helps others make better choices.
            </p>
            <Link 
              href="/orders" 
              className="text-sm font-medium text-[rgb(var(--gold-rgb))] hover:underline flex items-center gap-2"
            >
              Purchased this? Write a review
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="p-5 rounded-2xl border transition-colors"
                style={{
                  background: "var(--card-bg-soft)",
                  borderColor: "var(--card-border)"
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold uppercase" style={{ background: "var(--input-bg)", color: "var(--input-text)" }}>
                      {review.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.userName}</span>
                        {review.verified && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                            <CheckCircle2 size={10} />
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            fill={star <= review.rating ? "rgb(var(--gold-rgb))" : "none"}
                            stroke={star <= review.rating ? "none" : "currentColor"}
                            className={star <= review.rating ? "text-[rgb(var(--gold-rgb))]" : "text-muted/40"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mt-3 text-sm leading-relaxed text-muted/90 pl-[52px]">
                  {review.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ReviewWithProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";

interface ReviewSectionProps {
  resourceId: string;
  uploaderId: string;
}

export function ReviewSection({ resourceId, uploaderId }: ReviewSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<ReviewWithProfile | null>(null);

  const loadReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*, profiles(name, profile_picture)")
      .eq("resource_id", resourceId)
      .order("created_at", { ascending: false });
    
    const reviewData = (data as ReviewWithProfile[]) || [];
    setReviews(reviewData);
    
    if (user) {
      const existing = reviewData.find(r => r.user_id === user.id);
      if (existing) {
        setUserReview(existing);
        setRating(existing.rating);
        setReviewText(existing.review_text || "");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, [resourceId]);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    if (user.id === uploaderId) {
      toast({ title: "You cannot review your own resource", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    if (userReview) {
      await supabase.from("reviews").update({ rating, review_text: reviewText || null }).eq("id", userReview.id);
    } else {
      await supabase.from("reviews").insert({
        resource_id: resourceId,
        user_id: user.id,
        rating,
        review_text: reviewText || null,
      });
    }
    toast({ title: userReview ? "Review updated" : "Review submitted" });
    await loadReviews();
    setSubmitting(false);
  };

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-4">Reviews</h2>

      {/* Write review */}
      {user && user.id !== uploaderId && (
        <div className="border rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">{userReview ? "Update your review" : "Write a review"}</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  className={`h-5 w-5 transition-colors ${
                    s <= (hoverRating || rating) ? "fill-foreground text-foreground" : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Share your thoughts..."
            rows={2}
            className="mb-3"
          />
          <Button size="sm" onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting ? "..." : (userReview ? "Update" : "Submit")}
          </Button>
        </div>
      )}

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{r.profiles?.name || "Anonymous"}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
              {r.review_text && <p className="text-sm text-muted-foreground">{r.review_text}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No reviews yet</p>
      )}
    </section>
  );
}

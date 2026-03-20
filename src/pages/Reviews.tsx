import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Star, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingReview {
  id: string;
  productId: string;
  productTitle?: string;
  authorName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export default function Reviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PendingReview[]>("/admin/reviews/pending")
      .then(setReviews)
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const approve = async (id: string) => {
    await api.patch(`/reviews/${id}/approve`)
      .then(() => { setReviews(prev => prev.filter(r => r.id !== id)); toast({ title: "Review approved" }); })
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }));
  };

  const remove = async (id: string) => {
    await api.delete(`/reviews/${id}`)
      .then(() => { setReviews(prev => prev.filter(r => r.id !== id)); toast({ title: "Review deleted" }); })
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }));
  };

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending Reviews</h1>
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-400">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No pending reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{r.authorName}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.productTitle && <p className="text-xs text-gray-400 mb-2">On: {r.productTitle}</p>}
                  <p className="text-sm text-gray-700">{r.reviewText}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => approve(r.id)}>
                    <Check className="h-4 w-4 mr-1" />Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

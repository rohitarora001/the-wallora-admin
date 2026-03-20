import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface OrderHistoryEntry {
  id: string;
  eventType: string;
  message: string;
  actor: string;
  metadata?: string;
  createdAt: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export default function OrderHistory() {
  const { id } = useParams();
  const [items, setItems] = useState<OrderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<PagedResult<OrderHistoryEntry>>(`/admin/orders/${id}/history?page=1&pageSize=100`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={`/orders/${id}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back to Order</Button>
          </Link>
          <h1 className="text-xl font-semibold">Order History Log</h1>
        </div>
        <a href={`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1"}/admin/orders/${id}/history/export?format=csv`}>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export Log</Button>
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading history...</p>
      ) : (
        <div className="space-y-3">
          {items.map((entry) => (
            <div key={entry.id} className="border rounded-lg bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{entry.eventType}</p>
                <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
              <p className="text-sm text-slate-700 mt-1">{entry.message}</p>
              <p className="text-xs text-slate-500 mt-1">Actor: {entry.actor}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

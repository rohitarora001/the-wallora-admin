import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Loader2, Package } from "lucide-react";

interface VendorOrderItem {
  productTitle: string;
  designImageUrl: string;
  sizeCode: string;
  sizeDimensions: string;
  finishName: string;
  quantity: number;
}

interface VendorOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  orderNotes: string | null;
  items: VendorOrderItem[];
  createdAt: string;
}

// Only statuses vendors are allowed to set, in forward-progression order
const VENDOR_STATUS_OPTIONS = [
  { value: "Received",     label: "Received" },
  { value: "ReadyToPrint", label: "Ready to Print" },
  { value: "Printed",      label: "Printed" },
  { value: "ReadyToShip",  label: "Ready to Ship" },
];

const STATUS_COLORS: Record<string, string> = {
  Confirmed:    "bg-blue-100 text-blue-800",
  Received:     "bg-yellow-100 text-yellow-800",
  ReadyToPrint: "bg-orange-100 text-orange-800",
  Printed:      "bg-purple-100 text-purple-800",
  ReadyToShip:  "bg-green-100 text-green-800",
};

export default function VendorOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError } = useQuery<VendorOrderDetail>({
    queryKey: ["vendor-order", id],
    queryFn: () => api.get<VendorOrderDetail>(`/vendor/orders/${id}`),
    enabled: !!id,
  });

  const [newStatus, setNewStatus] = useState("");

  const updateMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/vendor/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast({ title: "Status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["vendor-order", id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      setNewStatus("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Order not found or failed to load.
      </div>
    );
  }

  const displayStatus = (s: string) =>
    s === "ReadyToPrint" ? "Ready to Print" :
    s === "ReadyToShip"  ? "Ready to Ship"  : s;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">
            Received {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <span className={`ml-auto inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-700"}`}>
          {displayStatus(order.status)}
        </span>
      </div>

      {/* Update Status */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="font-medium mb-3">Update Production Status</h2>
        <div className="flex gap-3">
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {VENDOR_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value} disabled={s.value === order.status}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!newStatus || updateMutation.isPending}
            onClick={() => updateMutation.mutate(newStatus)}
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update
          </Button>
        </div>
      </div>

      {/* Order Notes */}
      {order.orderNotes && (
        <div className="rounded-lg border bg-amber-50 border-amber-200 p-4 text-sm">
          <p className="font-medium text-amber-800 mb-1">Order Notes</p>
          <p className="text-amber-700">{order.orderNotes}</p>
        </div>
      )}

      {/* Items */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-medium">Items to Print & Pack</h2>
        </div>
        <div className="divide-y">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 p-5">
              {/* Design thumbnail */}
              <div className="h-20 w-20 shrink-0 rounded-md border bg-slate-100 overflow-hidden">
                {item.designImageUrl ? (
                  <img src={item.designImageUrl} alt={item.productTitle} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-8 w-8 text-slate-300 m-auto mt-6" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{item.productTitle}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>Size: <strong className="text-slate-700">{item.sizeCode}</strong> ({item.sizeDimensions})</span>
                  <span>Finish: <strong className="text-slate-700">{item.finishName}</strong></span>
                  <span>Qty: <strong className="text-slate-700">{item.quantity}</strong></span>
                </div>
              </div>

              {/* Download design */}
              {item.designImageUrl && (
                <a
                  href={item.designImageUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

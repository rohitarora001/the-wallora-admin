import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, PackageCheck } from "lucide-react";

interface VendorOrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  productPreview: string;
  itemCount: number;
  createdAt: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PRODUCTION_STATUSES = [
  { value: "", label: "All" },
  { value: "Confirmed", label: "Confirmed (Awaiting Production)" },
  { value: "Received", label: "Received" },
  { value: "ReadyToPrint", label: "Ready to Print" },
  { value: "Printed", label: "Printed" },
  { value: "ReadyToShip", label: "Ready to Ship" },
];

const STATUS_COLORS: Record<string, string> = {
  Confirmed:    "bg-blue-100 text-blue-800",
  Received:     "bg-yellow-100 text-yellow-800",
  ReadyToPrint: "bg-orange-100 text-orange-800",
  Printed:      "bg-purple-100 text-purple-800",
  ReadyToShip:  "bg-emerald-100 text-emerald-800",
};

export default function VendorOrders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery<PagedResult<VendorOrderListItem>>({
    queryKey: ["vendor-orders", status, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (status) params.set("status", status);
      return api.get<PagedResult<VendorOrderListItem>>(`/vendor/orders?${params}`);
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Production Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">Orders ready to print, pack, and ship</p>
        </div>

        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {PRODUCTION_STATUSES.map((s) => (
              <SelectItem key={s.value || "all"} value={s.value || "all"}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load orders. Please try again.
        </div>
      )}

      {data && (
        <>
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Order #</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Items</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Count</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Received</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <PackageCheck className="mx-auto h-8 w-8 mb-2 opacity-40" />
                      No orders in the production queue
                    </td>
                  </tr>
                )}
                {data.items.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{order.productPreview}</td>
                    <td className="px-4 py-3 text-slate-600">{order.itemCount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {order.status === "ReadyToPrint"  ? "Ready to Print" :
                         order.status === "ReadyToShip"   ? "Ready to Ship"  :
                         order.status === "Confirmed"     ? "Awaiting Production" : order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/vendor/orders/${order.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.totalCount)} of {data.totalCount}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, FlaskConical, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  productPreview: string;
  totalAmount: number;
  podStatus: string;
  createdAt: string;
  isTest: boolean;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const STATUS_OPTIONS = ["All", "Pending", "Confirmed", "Received", "ReadyToPrint", "Printed", "ReadyToShip", "Processing", "Shipped", "Delivered", "Cancelled", "Failed", "Refunded"];

const STATUS_COLORS: Record<string, string> = {
  Pending:      "bg-slate-100 text-slate-700",
  Confirmed:    "bg-blue-100 text-blue-800",
  Received:     "bg-yellow-100 text-yellow-800",
  ReadyToPrint: "bg-orange-100 text-orange-800",
  Printed:      "bg-purple-100 text-purple-800",
  ReadyToShip:  "bg-emerald-100 text-emerald-800",
  Processing:   "bg-cyan-100 text-cyan-800",
  Shipped:      "bg-indigo-100 text-indigo-800",
  Delivered:    "bg-green-100 text-green-800",
  Cancelled:    "bg-red-100 text-red-700",
  Failed:       "bg-red-100 text-red-700",
  Refunded:     "bg-amber-100 text-amber-700",
};

const displayStatus = (s: string) =>
  s === "ReadyToPrint" ? "Ready to Print" :
  s === "ReadyToShip"  ? "Ready to Ship"  : s;
const POD_STATUS_OPTIONS = ["All", "Pending", "In Production", "Packed", "Shipped", "Delivered", "Failed"];

export default function Orders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("All");
  const [podStatus, setPodStatus] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const pageSize = 20;

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status !== "All") q.set("status", status);
    if (podStatus !== "All") q.set("podStatus", podStatus);
    if (search) q.set("search", search);
    if (dateFrom) q.set("from", new Date(dateFrom).toISOString());
    if (dateTo) q.set("to", new Date(dateTo).toISOString());

    api.get<PagedResult<OrderListItem>>(`/admin/orders?${q}`)
      .then((r) => {
        setOrders(r.items);
        setTotalCount(r.totalCount);
      })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [page, status, podStatus, search, dateFrom, dateTo, toast]);

  useEffect(() => { load(); }, [load]);

  const toggleTest = (id: string, current: boolean) => {
    setTogglingId(id);
    api.patch(`/admin/orders/${id}/test`, { isTest: !current })
      .then(() => {
        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, isTest: !current } : o));
        toast({ title: current ? "Marked as real order" : "Marked as test order" });
      })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setTogglingId(null));
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">All Orders</h1>
          <p className="text-sm text-slate-500">Search, filter, and manage order workflows.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Create Order</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">
        <form
          className="xl:col-span-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
        >
          <Input placeholder="Search by order id..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <Button type="submit" variant="outline"><Search className="h-4 w-4" /></Button>
        </form>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{displayStatus(s)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={podStatus} onValueChange={(v) => { setPodStatus(v); setPage(1); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{POD_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">POD Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No orders found.</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className={`hover:bg-slate-50 ${o.isTest ? "bg-amber-50/60" : ""}`}>
                <td className="px-4 py-3 font-mono text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    {o.orderNumber}
                    {o.isTest && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        <FlaskConical className="h-2.5 w-2.5" />TEST
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-700">{o.email}</td>
                <td className="px-4 py-3 max-w-[220px] truncate text-slate-600">{o.productPreview}</td>
                <td className="px-4 py-3 text-right font-medium">₹{o.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-slate-100 text-slate-700"}`}>{displayStatus(o.status)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${o.isTest ? "text-amber-600 hover:text-amber-700" : "text-slate-400 hover:text-amber-600"}`}
                      title={o.isTest ? "Unmark as test" : "Mark as test"}
                      disabled={togglingId === o.id}
                      onClick={() => toggleTest(o.id, o.isTest)}
                    >
                      <FlaskConical className="h-4 w-4" />
                    </Button>
                    <Link to={`/orders/${o.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{totalCount} total orders</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span>Page {page} / {Math.max(totalPages, 1)}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

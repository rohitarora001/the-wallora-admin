import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Plus, Search } from "lucide-react";
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
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const STATUS_OPTIONS = ["All", "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded"];
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
          <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{o.orderNumber}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-700">{o.email}</td>
                <td className="px-4 py-3 max-w-[220px] truncate text-slate-600">{o.productPreview}</td>
                <td className="px-4 py-3 text-right font-medium">₹{o.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-xs">{o.podStatus || o.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/orders/${o.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                  </Link>
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

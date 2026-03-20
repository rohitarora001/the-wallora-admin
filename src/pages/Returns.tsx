import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReturnRequestSummary {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  reasonLabel: string;
  additionalDetails?: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const STATUS_STYLES = {
  Pending:  "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-slate-100 text-slate-600",
};

export default function Returns() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [returns, setReturns] = useState<ReturnRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter !== "all") q.set("status", statusFilter);
    api.get<PagedResult<ReturnRequestSummary>>(`/returns?${q}`)
      .then(res => { setReturns(res.items); setTotalCount(res.totalCount); })
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [page, statusFilter, toast]);

  const filtered = search.trim()
    ? returns.filter(r =>
        r.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.reasonLabel.toLowerCase().includes(search.toLowerCase())
      )
    : returns;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />Returns
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalCount} total return request{totalCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9 w-56"
            placeholder="Search order / reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-slate-500 py-8 text-center">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <RotateCcw className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">No return requests found.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {["Order", "Reason", "Status", "Submitted", "Admin Notes", "Action"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/orders/${r.orderId}`)}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{r.orderNumber}</td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="text-slate-800 truncate">{r.reasonLabel}</p>
                    {r.additionalDetails && (
                      <p className="text-slate-400 text-xs truncate mt-0.5">{r.additionalDetails}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-slate-500 text-xs truncate">{r.adminNotes ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-blue-600 underline">View Order →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{totalCount} total</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded border text-xs disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span className="px-2 py-1">Page {page}</span>
            <button className="px-3 py-1.5 rounded border text-xs disabled:opacity-40" disabled={returns.length < pageSize} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

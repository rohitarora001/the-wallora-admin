import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, RotateCcw, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReturnRequestSummary {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  reasonLabel: string;
  additionalDetails?: string;
  status: "Pending" | "Approved" | "Rejected" | "PickupScheduled";
  adminNotes?: string;
  evidenceUrls: string[];
  returnAwbNumber?: string;
  returnLabelUrl?: string;
  pickupScheduledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const STATUS_STYLES: Record<string, string> = {
  Pending:         "bg-amber-100 text-amber-700",
  Approved:        "bg-green-100 text-green-700",
  Rejected:        "bg-slate-100 text-slate-600",
  PickupScheduled: "bg-blue-100 text-blue-700",
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

  // Accept / Reject modal state
  const [actionReturn, setActionReturn] = useState<{
    id: string;
    action: "approve" | "reject";
    orderNumber: string;
    reason: string;
  } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReturns = () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter !== "all") q.set("status", statusFilter);
    api.get<PagedResult<ReturnRequestSummary>>(`/returns?${q}`)
      .then(res => { setReturns(res.items); setTotalCount(res.totalCount); })
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const filtered = search.trim()
    ? returns.filter(r =>
        r.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.reasonLabel.toLowerCase().includes(search.toLowerCase())
      )
    : returns;

  const handleStatusUpdate = async () => {
    if (!actionReturn) return;
    if (actionReturn.action === "reject" && !adminNotes.trim()) return;

    setSubmitting(true);
    try {
      await api.patch(`/returns/${actionReturn.id}/status`, {
        status: actionReturn.action === "approve" ? "Approved" : "Rejected",
        adminNotes: adminNotes.trim() || undefined,
      });
      toast({
        title: actionReturn.action === "approve" ? "Return approved" : "Return rejected",
        description: actionReturn.action === "approve"
          ? "Reverse pickup will be scheduled automatically."
          : "Customer has been notified.",
      });
      setActionReturn(null);
      setAdminNotes("");
      fetchReturns();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="PickupScheduled">Pickup Scheduled</SelectItem>
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
                {["Order", "Reason / Evidence", "Status / AWB", "Submitted", "Admin Notes", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium ${i === 5 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                  {/* Order number */}
                  <td
                    className="px-4 py-3 font-mono text-xs font-semibold text-slate-800 cursor-pointer"
                    onClick={() => navigate(`/orders/${r.orderId}`)}
                  >
                    {r.orderNumber}
                  </td>

                  {/* Reason + evidence thumbnails */}
                  <td className="px-4 py-3 max-w-[240px]">
                    <p className="text-slate-800 truncate">{r.reasonLabel}</p>
                    {r.additionalDetails && (
                      <p className="text-slate-400 text-xs truncate mt-0.5">{r.additionalDetails}</p>
                    )}
                    {r.evidenceUrls && r.evidenceUrls.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {r.evidenceUrls.map((url: string, i: number) => {
                          const isVideo = /\.(mp4|mov|webm)$/i.test(url);
                          return isVideo ? (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 underline border rounded px-2 py-1"
                            >
                              Video {i + 1}
                            </a>
                          ) : (
                            <a key={i} href={url} target="_blank" rel="noreferrer">
                              <img
                                src={url}
                                alt={`Evidence ${i + 1}`}
                                className="h-16 w-16 object-cover rounded border cursor-pointer hover:opacity-80"
                              />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* Status badge + AWB info */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {r.status}
                    </span>
                    {r.status === "PickupScheduled" && r.returnAwbNumber && (
                      <div className="flex flex-col gap-1 mt-2 p-2 bg-blue-50 rounded text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">AWB:</span>
                          <span className="font-mono font-semibold">{r.returnAwbNumber}</span>
                        </div>
                        {r.returnLabelUrl && (
                          <a
                            href={r.returnLabelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            Download Label
                          </a>
                        )}
                        {r.pickupScheduledAt && (
                          <span className="text-muted-foreground">
                            Pickup: {new Date(r.pickupScheduledAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Submitted date */}
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>

                  {/* Admin notes */}
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-slate-500 text-xs truncate">{r.adminNotes ?? "—"}</p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              setActionReturn({
                                id: r.id,
                                action: "approve",
                                orderNumber: r.orderNumber,
                                reason: r.reasonLabel || r.reason,
                              });
                              setAdminNotes("");
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setActionReturn({
                                id: r.id,
                                action: "reject",
                                orderNumber: r.orderNumber,
                                reason: r.reasonLabel || r.reason,
                              });
                              setAdminNotes("");
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <span
                        className="text-xs text-blue-600 underline cursor-pointer"
                        onClick={() => navigate(`/orders/${r.orderId}`)}
                      >
                        View Order →
                      </span>
                    </div>
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

      {/* Accept / Reject Confirmation Dialog */}
      <Dialog open={actionReturn !== null} onOpenChange={() => setActionReturn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionReturn?.action === "approve" ? "Accept Return" : "Reject Return"}
            </DialogTitle>
            <DialogDescription>
              Order <strong>{actionReturn?.orderNumber}</strong> — {actionReturn?.reason}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="adminNotes">
              {actionReturn?.action === "reject" ? "Reason for rejection *" : "Admin notes (optional)"}
            </Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder={
                actionReturn?.action === "reject"
                  ? "Explain why this return is being rejected..."
                  : "Any notes for this approval..."
              }
              rows={3}
            />
            {actionReturn?.action === "reject" && !adminNotes.trim() && (
              <p className="text-xs text-red-500">Rejection reason is required.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionReturn(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={submitting || (actionReturn?.action === "reject" && !adminNotes.trim())}
              className={actionReturn?.action === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={actionReturn?.action === "reject" ? "destructive" : "default"}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionReturn?.action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

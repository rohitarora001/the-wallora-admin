import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileDown, Pencil, RotateCcw, Truck, CheckCircle, XCircle, PackageCheck, ExternalLink, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderItem {
  id: string;
  productTitle: string;
  sizeCode: string;
  finishName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  Pending:      ["Confirmed", "Failed", "Cancelled"],
  Confirmed:    ["Received", "Processing", "Cancelled", "Refunded"],
  Received:     ["ReadyToPrint", "Cancelled", "Refunded"],
  ReadyToPrint: ["Printed", "Cancelled", "Refunded"],
  Printed:      ["ReadyToShip", "Cancelled", "Refunded"],
  ReadyToShip:  ["Shipped", "Printed", "Cancelled", "Refunded"],
  Processing:   ["Shipped", "Received", "Cancelled", "Refunded"],
  Shipped:      ["Delivered", "Refunded"],
  Delivered:    ["Refunded"],
};

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

interface RefundStatusResponse {
  tracked: boolean;
  refundId?: string;
  status?: 'created' | 'processed' | 'failed';
  amountInPaise?: number;
  currency?: string;
  createdAt?: string;
  failureReason?: string;
}

interface ReturnRequestDetail {
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

interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  status: string;
  podPartner?: string;
  podStatus: string;
  trackingNumber?: string;
  trackingUrl?: string;
  nimbuspostAwb?: string;
  shippingLabelUrl?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  orderNotes?: string;
  items: OrderItem[];
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [nextStatus, setNextStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [returnRequest, setReturnRequest] = useState<ReturnRequestDetail | null>(null);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnActioning, setReturnActioning] = useState<"Approved" | "Rejected" | null>(null);
  const [approvingShipment, setApprovingShipment] = useState(false);
  const [undoCancelling, setUndoCancelling] = useState(false);
  const [refundStatus, setRefundStatus] = useState<RefundStatusResponse | null>(null);
  const [loadingRefundStatus, setLoadingRefundStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<OrderDetailResponse>(`/admin/orders/${id}`),
      api.get<ReturnRequestDetail>(`/returns/by-order/${id}`).catch(() => null),
    ])
      .then(([o, r]) => { setOrder(o); setReturnRequest(r); })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const updateStatus = async () => {
    if (!id || !nextStatus) return;
    if (nextStatus === "Shipped" && !trackingNumber.trim()) {
      toast({ title: "Tracking required", description: "Please enter a tracking number when marking as Shipped.", variant: "destructive" });
      return;
    }
    setStatusUpdating(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, {
        status: nextStatus,
        trackingNumber: trackingNumber.trim() || undefined,
        trackingUrl: trackingUrl.trim() || undefined,
      });
      setOrder((prev) => prev ? {
        ...prev,
        status: nextStatus,
        trackingNumber: trackingNumber.trim() || prev.trackingNumber,
        trackingUrl: trackingUrl.trim() || prev.trackingUrl,
      } : prev);
      setNextStatus("");
      setTrackingNumber("");
      setTrackingUrl("");
      toast({ title: "Status updated", description: `Order moved to ${nextStatus}.` });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to update status", variant: "destructive" });
    } finally {
      setStatusUpdating(false);
    }
  };

  const cancelOrder = async () => {
    if (!id) return;
    await api.post(`/orders/${id}/cancel`, {})
      .then(() => {
        setOrder((prev) => prev ? { ...prev, status: "Cancelled" } : prev);
        toast({ title: "Order cancelled" });
      })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }));
  };

  const approveShipment = async () => {
    if (!id) return;
    setApprovingShipment(true);
    try {
      const result = await api.post<{ awbNumber: string; labelUrl: string; trackingUrl: string }>(
        `/orders/${id}/approve-shipment`,
        {}
      );
      setOrder((prev) => prev ? {
        ...prev,
        status: "Shipped",
        nimbuspostAwb: result.awbNumber,
        shippingLabelUrl: result.labelUrl,
        trackingNumber: result.awbNumber,
        trackingUrl: result.trackingUrl,
      } : prev);
      toast({ title: "Shipment approved", description: `AWB: ${result.awbNumber}. Pickup scheduled for tomorrow.` });
    } catch (e: unknown) {
      toast({ title: "Shipment approval failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setApprovingShipment(false);
    }
  };

  const issueRefund = async () => {
    if (!id) return;
    if (!refundReason.trim()) {
      toast({ title: "Validation", description: "Please provide a refund reason.", variant: "destructive" });
      return;
    }

    await api.post(`/admin/orders/${id}/refund`, {
      amount: refundAmount.trim() ? Number(refundAmount) : undefined,
      reason: refundReason,
      notifyCustomer,
    })
      .then(() => {
        setOrder((prev) => prev ? { ...prev, status: "Refunded" } : prev);
        setRefundOpen(false);
        setRefundReason("");
        setRefundAmount("");
        toast({ title: "Refund issued successfully" });
      })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }));
  };

  const downloadPackingSlip = async () => {
    if (!id) return;
    try {
      const slip = await api.get<{
        orderNumber: string;
        customerName: string;
        shippingAddress: Record<string, string>;
        items: { productTitle: string; sizeCode: string; finishName: string; quantity: number }[];
      }>(`/admin/orders/${id}/packing-slip`);

      // Open a print-friendly window
      const win = window.open("", "_blank", "width=700,height=600");
      if (!win) return;
      win.document.write(`
        <html><head><title>Packing Slip — ${slip.orderNumber}</title>
        <style>body{font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto}h2{border-bottom:1px solid #ccc;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}@media print{button{display:none}}</style>
        </head><body>
        <h2>Packing Slip — ${slip.orderNumber}</h2>
        <p><strong>Ship To:</strong> ${slip.customerName}<br>${Object.values(slip.shippingAddress).filter(Boolean).join(", ")}</p>
        <table><thead><tr><th>Product</th><th>Size</th><th>Finish</th><th>Qty</th></tr></thead><tbody>
        ${slip.items.map(i => `<tr><td>${i.productTitle}</td><td>${i.sizeCode}</td><td>${i.finishName}</td><td>${i.quantity}</td></tr>`).join("")}
        </tbody></table>
        <br/><button onclick="window.print()">Print</button>
        </body></html>
      `);
      win.document.close();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to load packing slip", variant: "destructive" });
    }
  };

  const handleReturnAction = async (newStatus: "Approved" | "Rejected") => {
    if (!returnRequest) return;
    setReturnActioning(newStatus);
    try {
      const updated = await api.patch<ReturnRequestDetail>(`/returns/${returnRequest.id}/status`, {
        status: newStatus,
        adminNotes: returnNotes.trim() || undefined,
      });
      setReturnRequest(updated);
      setReturnNotes("");
      toast({ title: `Return ${newStatus.toLowerCase()}`, description: `Return request for ${order?.orderNumber} has been ${newStatus.toLowerCase()}.` });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to update return", variant: "destructive" });
    } finally {
      setReturnActioning(null);
    }
  };

  const handleUndoCancel = async () => {
    if (!id) return;
    if (!confirm('This will revert the order to Confirmed and return it to the processing queue. Are you sure?')) return;
    setUndoCancelling(true);
    try {
      await api.post(`/orders/${id}/undo-cancel`, {});
      setOrder((prev) => prev ? { ...prev, status: "Confirmed" } : prev);
      toast({ title: 'Order restored', description: 'Order reverted to Confirmed.' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed.', variant: 'destructive' });
    } finally {
      setUndoCancelling(false);
    }
  };

  const fetchRefundStatus = async () => {
    if (!id) return;
    setLoadingRefundStatus(true);
    try {
      const data = await api.get<RefundStatusResponse>(`/orders/${id}/refund-status`);
      setRefundStatus(data);
    } catch {
      toast({ title: 'Error', description: 'Could not fetch refund status.', variant: 'destructive' });
    } finally {
      setLoadingRefundStatus(false);
    }
  };

  const refundStatusColor = (s?: string) => {
    if (s === 'processed') return 'text-green-600 bg-green-50';
    if (s === 'failed')    return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  if (loading) return <p className="text-sm text-slate-500">Loading order...</p>;
  if (!order) return <p className="text-sm text-red-500">Order not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}><ArrowLeft className="h-4 w-4 mr-1" />Orders</Button>
          <h1 className="text-xl font-semibold">Order {order.orderNumber}</h1>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-700"}`}>{displayStatus(order.status)}</span>
          <span className="rounded-full px-2 py-1 text-xs bg-slate-100">{order.podStatus}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/orders/${order.id}/history`}><Button variant="outline" size="sm"><FileDown className="h-4 w-4 mr-1" />History Log</Button></Link>
          <Link to={`/orders/${order.id}/edit`}><Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1" />Edit Order</Button></Link>
          <Button variant="outline" size="sm" onClick={downloadPackingSlip}>Packing Slip</Button>
          <Button variant="outline" size="sm" className="text-amber-700" onClick={() => setRefundOpen(true)}>
            <RotateCcw className="h-4 w-4 mr-1" />Issue Refund
          </Button>
          {!["Cancelled", "Refunded", "Delivered"].includes(order.status) && (
            <Button size="sm" variant="destructive" onClick={cancelOrder}>Cancel Order</Button>
          )}
          {order.status === 'Cancelled' && (
            <Button
              variant="outline"
              className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
              onClick={handleUndoCancel}
              disabled={undoCancelling}
            >
              {undoCancelling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Undo Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Order Items</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b">
                  <th className="py-2">Product</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.productTitle}</td>
                    <td className="py-2 text-slate-600">{item.sizeCode} / {item.finishName}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">₹{item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Financial Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><strong>₹{order.subtotal.toFixed(2)}</strong></div>
            <div className="flex justify-between"><span>Shipping</span><strong>₹{order.shippingCost.toFixed(2)}</strong></div>
            <div className="flex justify-between"><span>Tax</span><strong>₹{order.taxAmount.toFixed(2)}</strong></div>
            <div className="flex justify-between text-base border-t pt-2"><span>Total</span><strong>₹{order.totalAmount.toFixed(2)}</strong></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.firstName} {order.lastName}</p>
            <p>{order.email}</p>
            {order.phone && <p>{order.phone}</p>}
            {order.orderNotes && <p className="text-slate-500">{order.orderNotes}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Shipping Address</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
            <p>{order.shippingAddress.country}</p>
            {order.podPartner && <p className="text-slate-500">POD Partner: {order.podPartner}</p>}
          </CardContent>
        </Card>
      </div>

      {/* ── Nimbuspost Approve Shipment Card ─────────────────────────── */}
      {order.status === "ReadyToShip" && !order.nimbuspostAwb && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
              <PackageCheck className="h-4 w-4" />
              Order Ready to Ship
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-emerald-700">
              <p>The vendor has packed and marked this order as ready. Approve to create a Nimbuspost booking and schedule courier pickup automatically.</p>
            </div>
            <Button
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={approvingShipment}
              onClick={approveShipment}
            >
              {approvingShipment ? "Creating booking…" : "Approve & Book Pickup"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── AWB / Label info (after approval) ────────────────────────── */}
      {order.nimbuspostAwb && (
        <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-600" />
              Nimbuspost Shipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-slate-500">AWB:</span>
              <span className="font-mono font-semibold">{order.nimbuspostAwb}</span>
            </div>
            {order.trackingUrl && (
              <div className="flex items-center gap-3">
                <span className="text-slate-500">Tracking:</span>
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline flex items-center gap-1">
                  Track shipment <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {order.shippingLabelUrl && (
              <div className="flex items-center gap-3">
                <span className="text-slate-500">Label:</span>
                <a href={order.shippingLabelUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline flex items-center gap-1">
                  Download PDF label <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Fulfillment Card ─────────────────────────────────────────── */}
      {(order.trackingNumber || (STATUS_TRANSITIONS[order.status]?.length > 0)) && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" />Fulfillment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {order.trackingNumber && (
              <div className="text-sm">
                <span className="text-slate-500">Tracking: </span>
                {order.trackingUrl
                  ? <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="font-mono text-blue-600 underline">{order.trackingNumber}</a>
                  : <span className="font-mono">{order.trackingNumber}</span>
                }
              </div>
            )}
            {STATUS_TRANSITIONS[order.status]?.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium text-slate-700">Update Status</p>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">New Status</Label>
                    <Select value={nextStatus} onValueChange={setNextStatus}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Select status…" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_TRANSITIONS[order.status].map((s) => (
                          <SelectItem key={s} value={s}>{displayStatus(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {nextStatus === "Shipped" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Tracking Number *</Label>
                        <Input className="w-44" placeholder="e.g. 123456789" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tracking URL</Label>
                        <Input className="w-64" placeholder="https://track.dtdc.com/..." value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
                      </div>
                    </>
                  )}
                  <Button size="sm" disabled={!nextStatus || statusUpdating} onClick={updateStatus}>
                    {statusUpdating ? "Updating…" : "Update Status"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Return Request Card ───────────────────────────────────────── */}
      {returnRequest && (
        <Card className={returnRequest.status === "Pending" ? "border-amber-300" : returnRequest.status === "Approved" ? "border-green-300" : "border-slate-200"}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Return Request
              <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                returnRequest.status === "Pending"  ? "bg-amber-100 text-amber-700" :
                returnRequest.status === "Approved" ? "bg-green-100 text-green-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                {returnRequest.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Reason</p>
                <p className="font-medium">{returnRequest.reasonLabel}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Submitted</p>
                <p>{new Date(returnRequest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            </div>
            {returnRequest.additionalDetails && (
              <div>
                <p className="text-slate-500 text-xs mb-1">Customer details</p>
                <p className="text-sm rounded-lg p-3 bg-slate-50 border">{returnRequest.additionalDetails}</p>
              </div>
            )}
            {returnRequest.adminNotes && (
              <div>
                <p className="text-slate-500 text-xs mb-1">Admin notes</p>
                <p className="text-sm rounded-lg p-3 bg-slate-50 border">{returnRequest.adminNotes}</p>
              </div>
            )}

            {returnRequest.status === "Pending" && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">Take Action</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Admin notes (optional — visible to customer)</Label>
                  <Textarea
                    value={returnNotes}
                    onChange={e => setReturnNotes(e.target.value)}
                    placeholder="e.g. We'll arrange a pickup within 2–3 business days…"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!!returnActioning}
                    onClick={() => handleReturnAction("Approved")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {returnActioning === "Approved" ? "Approving…" : "Approve Return"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    disabled={!!returnActioning}
                    onClick={() => handleReturnAction("Rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {returnActioning === "Rejected" ? "Rejecting…" : "Reject Return"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Refund Status Card ───────────────────────────────────────── */}
      {['Refunded', 'RefundInitiated', 'RefundFailed'].includes(order.status) && (
        <div className="border rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Refund Status</h3>
            <Button variant="ghost" size="sm" onClick={fetchRefundStatus} disabled={loadingRefundStatus}>
              {loadingRefundStatus
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <span className="text-xs">↻ Refresh</span>}
            </Button>
          </div>
          {refundStatus === null && (
            <p className="text-xs text-muted-foreground">Click Refresh to fetch live status from Razorpay.</p>
          )}
          {refundStatus?.tracked === false && (
            <p className="text-xs text-muted-foreground">Refund was processed manually — no Razorpay tracking available.</p>
          )}
          {refundStatus?.tracked !== false && refundStatus?.status && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${refundStatusColor(refundStatus.status)}`}>
                  {refundStatus.status}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Amount: </span>
                ₹{((refundStatus.amountInPaise ?? 0) / 100).toFixed(2)}
              </div>
              <div>
                <span className="text-muted-foreground">Initiated: </span>
                {refundStatus.createdAt ? new Date(refundStatus.createdAt).toLocaleString('en-IN') : '—'}
              </div>
              {refundStatus.failureReason && (
                <div className="text-red-600 text-xs mt-1">Failure reason: {refundStatus.failureReason}</div>
              )}
            </div>
          )}
        </div>
      )}

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="amount">Amount (optional, default full refund)</Label>
              <Input id="amount" type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reason">Reason for Refund</Label>
              <Textarea id="reason" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyCustomer} onChange={(e) => setNotifyCustomer(e.target.checked)} />
              Send email notification to customer
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button onClick={issueRefund}>Confirm & Issue Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

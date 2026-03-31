import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Loader2, RefreshCw, Search, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  extractShipmentRows,
  extractTrackingEvents,
  extractTrackingStatus,
  type NimbusEnvelope,
  type ShipmentRow,
  type ShipmentTrackingEvent,
} from "@/lib/shipmentTracking";

interface TrackingSnapshot {
  row: ShipmentRow;
  status: string;
  events: ShipmentTrackingEvent[];
}

const formatDateTime = (value: string): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN");
};

export default function Shipments() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingLoadingId, setTrackingLoadingId] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [search, setSearch] = useState("");
  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await api.get<NimbusEnvelope>("/admin/shipments");
      setRows(extractShipmentRows(response.data));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch shipments";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const filteredRows = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return rows;
    return rows.filter((row) =>
      [row.shipmentId, row.awb, row.orderNumber, row.courier, row.status]
        .join(" ")
        .toLowerCase()
        .includes(key));
  }, [rows, search]);

  const viewTracking = async (row: ShipmentRow) => {
    const hasAwb = !!row.awb;
    const trackingKey = hasAwb ? row.awb : row.shipmentId;
    if (!trackingKey) {
      toast({ title: "Unavailable", description: "Shipment does not have AWB or shipment ID.", variant: "destructive" });
      return;
    }

    setTrackingLoadingId(row.shipmentId || row.awb);
    try {
      const endpoint = hasAwb
        ? `/admin/shipments/awb/${encodeURIComponent(row.awb)}/tracking`
        : `/admin/shipments/${encodeURIComponent(row.shipmentId)}/tracking`;

      const response = await api.get<NimbusEnvelope>(endpoint);
      const events = extractTrackingEvents(response.data);
      const status = extractTrackingStatus(response.data, events);
      setSnapshot({ row, status, events });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch shipment tracking";
      toast({ title: "Tracking lookup failed", description: message, variant: "destructive" });
    } finally {
      setTrackingLoadingId("");
    }
  };

  const cancelShipment = async (row: ShipmentRow) => {
    if (!row.shipmentId) {
      toast({ title: "Unavailable", description: "Shipment ID is required to cancel a shipment.", variant: "destructive" });
      return;
    }

    if (!window.confirm(`Cancel shipment ${row.shipmentId}?`)) return;

    setCancellingId(row.shipmentId);
    try {
      await api.post<void>(`/admin/shipments/${encodeURIComponent(row.shipmentId)}/cancel`, {});
      toast({ title: "Shipment cancelled", description: `Shipment ${row.shipmentId} was cancelled.` });
      await load(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel shipment";
      toast({ title: "Cancel failed", description: message, variant: "destructive" });
    } finally {
      setCancellingId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Shipments</h1>
          <p className="text-sm text-slate-500">Monitor live courier status, AWB, and latest tracking checkpoints.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Refresh
        </Button>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shipment ID, AWB, order number..."
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Shipment ID</th>
              <th className="px-4 py-3 text-left">AWB</th>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Courier</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading shipments...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No shipments found.</td></tr>
            ) : filteredRows.map((row) => (
              <tr key={`${row.shipmentId}-${row.awb}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{row.shipmentId || "-"}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.awb || "-"}</td>
                <td className="px-4 py-3">{row.orderNumber || "-"}</td>
                <td className="px-4 py-3">{row.courier || "-"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                    {row.status || "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(row.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void viewTracking(row)}
                      disabled={trackingLoadingId === (row.shipmentId || row.awb)}
                    >
                      {trackingLoadingId === (row.shipmentId || row.awb)
                        ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        : <Truck className="h-3 w-3 mr-1" />}
                      Tracking
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => void cancelShipment(row)}
                      disabled={!row.shipmentId || cancellingId === row.shipmentId}
                    >
                      {cancellingId === row.shipmentId
                        ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        : <Ban className="h-3 w-3 mr-1" />}
                      Cancel
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {snapshot && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tracking Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div><span className="text-slate-500">Shipment ID:</span> <span className="font-mono">{snapshot.row.shipmentId || "-"}</span></div>
              <div><span className="text-slate-500">AWB:</span> <span className="font-mono">{snapshot.row.awb || "-"}</span></div>
              <div><span className="text-slate-500">Order:</span> <span>{snapshot.row.orderNumber || "-"}</span></div>
              <div>
                <span className="text-slate-500">Current Status:</span>{" "}
                <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700">
                  {snapshot.status || snapshot.row.status || "Unknown"}
                </span>
              </div>
            </div>

            {snapshot.events.length === 0 ? (
              <p className="text-slate-500">No tracking events available yet.</p>
            ) : (
              <div className="space-y-2">
                {snapshot.events.slice(0, 8).map((event, index) => (
                  <div key={`${event.timestamp}-${event.status}-${index}`} className="rounded-md border p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{event.status || "Status update"}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
                    </div>
                    {(event.location || event.remarks) && (
                      <p className="text-xs text-slate-600 mt-1">
                        {[event.location, event.remarks].filter(Boolean).join(" - ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


export interface NimbusEnvelope {
  status: boolean;
  message?: string;
  data?: unknown;
  rawJson?: string;
}

export interface ShipmentRow {
  shipmentId: string;
  awb: string;
  orderNumber: string;
  courier: string;
  status: string;
  updatedAt: string;
  raw: Record<string, unknown>;
}

export interface ShipmentTrackingEvent {
  status: string;
  location: string;
  remarks: string;
  timestamp: string;
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const pickString = (obj: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const pickArray = (obj: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }
  return [];
};

const extractObjects = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) return data.map(asRecord).filter((x): x is Record<string, unknown> => x !== null);
  const root = asRecord(data);
  if (!root) return [];

  const directArray = pickArray(root, ["shipments", "items", "rows", "results", "data", "list"]);
  if (directArray.length > 0) {
    return directArray.map(asRecord).filter((x): x is Record<string, unknown> => x !== null);
  }

  const nested = asRecord(root.data);
  if (nested) {
    const nestedArray = pickArray(nested, ["shipments", "items", "rows", "results", "data", "list"]);
    if (nestedArray.length > 0) {
      return nestedArray.map(asRecord).filter((x): x is Record<string, unknown> => x !== null);
    }
  }

  return [root];
};

export const extractShipmentRows = (data: unknown): ShipmentRow[] =>
  extractObjects(data).map((obj) => ({
    shipmentId: pickString(obj, ["shipment_id", "shipmentId", "id"]),
    awb: pickString(obj, ["awb_number", "awb", "awbNo", "awb_no"]),
    orderNumber: pickString(obj, ["order_number", "orderNo", "order_id", "orderId"]),
    courier: pickString(obj, ["courier_name", "courier", "courier_name_code", "partner"]),
    status: pickString(obj, ["current_status", "shipment_status", "status", "tracking_status"]),
    updatedAt: pickString(obj, ["updated_at", "last_update", "last_updated_at", "created_at"]),
    raw: obj,
  }));

export const extractTrackingEvents = (data: unknown): ShipmentTrackingEvent[] => {
  const root = asRecord(data);
  if (!root) return [];

  const candidates = [
    ...pickArray(root, ["history", "tracking", "tracking_history", "events", "scan", "scans"]),
    ...pickArray(asRecord(root.data) ?? {}, ["history", "tracking", "tracking_history", "events", "scan", "scans"]),
  ];

  return candidates
    .map(asRecord)
    .filter((x): x is Record<string, unknown> => x !== null)
    .map((row) => ({
      status: pickString(row, ["status", "activity", "checkpoint_status", "shipment_status"]),
      location: pickString(row, ["location", "city", "hub"]),
      remarks: pickString(row, ["remarks", "message", "description", "details"]),
      timestamp: pickString(row, ["date", "created_at", "event_time", "timestamp", "time"]),
    }));
};

export const extractTrackingStatus = (data: unknown, events: ShipmentTrackingEvent[]): string => {
  const root = asRecord(data);
  const fromRoot = root ? pickString(root, ["current_status", "status", "shipment_status", "tracking_status"]) : "";
  if (fromRoot) return fromRoot;
  const nested = asRecord(root?.data);
  const fromNested = nested ? pickString(nested, ["current_status", "status", "shipment_status", "tracking_status"]) : "";
  if (fromNested) return fromNested;
  return events[0]?.status ?? "";
};


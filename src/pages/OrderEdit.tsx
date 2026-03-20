import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EditableItem {
  id: string;
  productTitle: string;
  quantity: number;
  lineTotal: number;
}

interface OrderDetailResponse {
  id: string;
  orderNumber: string;
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
  shippingCost: number;
  taxAmount: number;
  orderNotes?: string;
  podPartner?: string;
  podStatus: string;
  items: EditableItem[];
}

export default function OrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<OrderDetailResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<OrderDetailResponse>(`/admin/orders/${id}`)
      .then(setForm)
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const subtotal = useMemo(
    () => (form?.items ?? []).reduce((sum, item) => sum + item.lineTotal, 0),
    [form?.items],
  );

  const setField = <K extends keyof OrderDetailResponse>(key: K, value: OrderDetailResponse[K]) =>
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);

  const setAddressField = (key: keyof OrderDetailResponse["shippingAddress"], value: string) =>
    setForm((prev) => prev ? {
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [key]: value },
    } : prev);

  const updateQuantity = (itemId: string, quantity: number) => {
    setForm((prev) => prev ? {
      ...prev,
      items: prev.items.map((item) => item.id === itemId
        ? { ...item, quantity, lineTotal: (item.lineTotal / Math.max(item.quantity, 1)) * quantity }
        : item),
    } : prev);
  };

  const save = async () => {
    if (!id || !form) return;
    setSaving(true);
    await api.put(`/admin/orders/${id}`, {
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      shippingAddress: {
        addressLine1: form.shippingAddress.line1,
        addressLine2: form.shippingAddress.line2 ?? "",
        city: form.shippingAddress.city,
        state: form.shippingAddress.state,
        zipCode: form.shippingAddress.zipCode,
        country: form.shippingAddress.country,
      },
      shippingCost: form.shippingCost,
      taxAmount: form.taxAmount,
      orderNotes: form.orderNotes ?? "",
      podPartner: form.podPartner ?? "",
      podStatus: form.podStatus ?? "Pending",
      items: form.items.map((item) => ({ itemId: item.id, quantity: item.quantity })),
    })
      .then(() => {
        toast({ title: "Changes saved successfully" });
        navigate(`/orders/${id}`);
      })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setSaving(false));
  };

  if (loading) return <p className="text-sm text-slate-500">Loading order...</p>;
  if (!form) return <p className="text-sm text-red-500">Order not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={`/orders/${id}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          </Link>
          <h1 className="text-xl font-semibold">Edit Order {form.orderNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/orders/${id}`)}>Cancel Changes</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Customer Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={(e) => setField("email", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} /></div>
              <div className="space-y-1"><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone ?? ""} onChange={(e) => setField("phone", e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Shipping Address</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Street</Label><Input value={form.shippingAddress.line1} onChange={(e) => setAddressField("line1", e.target.value)} /></div>
            <div className="space-y-1"><Label>Line 2</Label><Input value={form.shippingAddress.line2 ?? ""} onChange={(e) => setAddressField("line2", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>City</Label><Input value={form.shippingAddress.city} onChange={(e) => setAddressField("city", e.target.value)} /></div>
              <div className="space-y-1"><Label>State</Label><Input value={form.shippingAddress.state} onChange={(e) => setAddressField("state", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Zip</Label><Input value={form.shippingAddress.zipCode} onChange={(e) => setAddressField("zipCode", e.target.value)} /></div>
              <div className="space-y-1"><Label>Country</Label><Input value={form.shippingAddress.country} onChange={(e) => setAddressField("country", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Order Items</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b">
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.productTitle}</td>
                  <td className="py-2 text-right">
                    <Input
                      type="number"
                      min={1}
                      className="w-20 ml-auto"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value) || 1)}
                    />
                  </td>
                  <td className="py-2 text-right">₹{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">POD / Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>POD Partner</Label><Input value={form.podPartner ?? ""} onChange={(e) => setField("podPartner", e.target.value)} /></div>
            <div className="space-y-1"><Label>POD Status</Label><Input value={form.podStatus} onChange={(e) => setField("podStatus", e.target.value)} /></div>
            <div className="space-y-1"><Label>Order Notes</Label><Textarea value={form.orderNotes ?? ""} onChange={(e) => setField("orderNotes", e.target.value)} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Financials</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Shipping</Label><Input type="number" value={form.shippingCost} onChange={(e) => setField("shippingCost", Number(e.target.value) || 0)} /></div>
            <div className="space-y-1"><Label>Tax</Label><Input type="number" value={form.taxAmount} onChange={(e) => setField("taxAmount", Number(e.target.value) || 0)} /></div>
            <p className="text-sm font-medium border-t pt-2">Estimated Total: ₹{(subtotal + form.shippingCost + form.taxAmount).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

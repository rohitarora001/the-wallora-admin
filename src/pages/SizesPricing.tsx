import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GlobalSize {
  sizeCode: string;
  dimensions: string;
  priceModifier: number;
  orientation: string;
  sortOrder: number;
  productCount: number;
}

const emptyForm = { sizeCode: "", dimensions: "", orientation: "portrait", priceModifier: "0", sortOrder: "0" };

export default function SizesPricing() {
  const { toast } = useToast();
  const [sizes, setSizes] = useState<GlobalSize[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<GlobalSize | null>(null);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<GlobalSize[]>("/admin/sizes")
      .then(setSizes)
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const portraitSizes = sizes.filter(s => s.orientation === "portrait");
  const landscapeSizes = sizes.filter(s => s.orientation === "landscape");

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (s: GlobalSize) => {
    setEditing(s);
    setPrice(String(s.priceModifier));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put("/admin/sizes", {
        sizeCode: editing.sizeCode,
        orientation: editing.orientation,
        priceModifier: Number(price),
      });
      toast({ title: "Price updated", description: `${editing.sizeCode} (${editing.orientation}) updated across ${editing.productCount} products` });
      setEditOpen(false);
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Add ───────────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(emptyForm); setAddOpen(true); };

  const saveAdd = async () => {
    if (!form.sizeCode.trim() || !form.dimensions.trim()) {
      toast({ title: "Validation", description: "Size code and dimensions are required", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      const result = await api.post<{ addedToProducts: number }>("/admin/sizes", {
        sizeCode: form.sizeCode.trim(),
        dimensions: form.dimensions.trim(),
        orientation: form.orientation,
        priceModifier: Number(form.priceModifier),
        sortOrder: Number(form.sortOrder),
      });
      toast({ title: "Size added", description: `Added to ${result.addedToProducts} products` });
      setAddOpen(false);
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteSize = async (s: GlobalSize) => {
    if (!confirm(`Delete "${s.sizeCode}" (${s.orientation}) from all ${s.productCount} products? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/sizes/${encodeURIComponent(s.sizeCode)}/${s.orientation}`);
      toast({ title: "Size deleted", description: `Removed from ${s.productCount} products` });
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  // ── Table ─────────────────────────────────────────────────────────────────
  const SizeTable = ({ title, data }: { title: string; data: GlobalSize[] }) => (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Size Code</th>
              <th className="px-4 py-3 text-left">Dimensions</th>
              <th className="px-4 py-3 text-right">Price Modifier</th>
              <th className="px-4 py-3 text-center">Sort</th>
              <th className="px-4 py-3 text-center">Products</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map(s => (
              <tr key={`${s.sizeCode}-${s.orientation}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-medium">{s.sizeCode}</td>
                <td className="px-4 py-3 text-gray-600">{s.dimensions}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {s.priceModifier === 0 ? (
                    <span className="text-green-600">Base</span>
                  ) : (
                    <span>+₹{s.priceModifier.toLocaleString("en-IN")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-400">{s.sortOrder}</td>
                <td className="px-4 py-3 text-center text-gray-400">{s.productCount}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => deleteSize(s)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No sizes found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sizes & Pricing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update, add, or delete sizes. Changes apply to every product automatically.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />Add Size
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <SizeTable title="Portrait Sizes" data={portraitSizes} />
          <SizeTable title="Landscape Sizes" data={landscapeSizes} />
        </>
      )}

      {/* ── Edit dialog ─────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Price Modifier</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Size</span>
                  <p className="font-medium">{editing.sizeCode}</p>
                </div>
                <div>
                  <span className="text-gray-500">Orientation</span>
                  <p className="font-medium capitalize">{editing.orientation}</p>
                </div>
                <div>
                  <span className="text-gray-500">Dimensions</span>
                  <p className="font-medium">{editing.dimensions}</p>
                </div>
                <div>
                  <span className="text-gray-500">Affected Products</span>
                  <p className="font-medium">{editing.productCount}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Price Modifier (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-gray-400">Set to 0 for the base size (no additional cost)</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Update All Products"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add dialog ──────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Size</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Size Code <span className="text-gray-400 font-normal">(e.g. 12x18)</span></Label>
              <Input value={form.sizeCode} onChange={e => setForm(f => ({ ...f, sizeCode: e.target.value }))} placeholder="12x18" />
            </div>
            <div className="space-y-1">
              <Label>Dimensions <span className="text-gray-400 font-normal">(display label)</span></Label>
              <Input value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} placeholder='12" × 18"' />
            </div>
            <div className="space-y-1">
              <Label>Orientation</Label>
              <Select value={form.orientation} onValueChange={v => setForm(f => ({ ...f, orientation: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Price Modifier (₹)</Label>
              <Input type="number" min="0" step="100" value={form.priceModifier} onChange={e => setForm(f => ({ ...f, priceModifier: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Sort Order</Label>
              <Input type="number" min="0" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} placeholder="0" />
            </div>
            <p className="text-xs text-gray-400">The new size will be added to every existing product.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={saveAdd} disabled={adding}>{adding ? "Adding…" : "Add to All Products"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

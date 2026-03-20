import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FinishOption {
  id: string;
  name: string;
  description: string;
  priceModifier: number;
  iconCode: string;
  sortOrder: number;
}

const emptyForm = { id: "", name: "", description: "", priceModifier: 0, iconCode: "", sortOrder: 0 };

export default function FinishOptions() {
  const { toast } = useToast();
  const [options, setOptions] = useState<FinishOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinishOption | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<FinishOption[]>("/finish-options")
      .then(setOptions)
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (o: FinishOption) => { setEditing(o); setForm({ id: o.id, name: o.name, description: o.description, priceModifier: o.priceModifier, iconCode: o.iconCode, sortOrder: o.sortOrder }); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/finish-options/${editing.id}`, { name: form.name, description: form.description, priceModifier: Number(form.priceModifier), iconCode: form.iconCode, sortOrder: Number(form.sortOrder) });
        toast({ title: "Updated" });
      } else {
        await api.post("/finish-options", { id: form.id, name: form.name, description: form.description, priceModifier: Number(form.priceModifier), iconCode: form.iconCode, sortOrder: Number(form.sortOrder) });
        toast({ title: "Created" });
      }
      setDialogOpen(false);
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (o: FinishOption) => {
    if (!confirm(`Delete "${o.name}"?`)) return;
    await api.delete(`/finish-options/${o.id}`)
      .then(() => { toast({ title: "Deleted" }); load(); })
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }));
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} value={String(form[key])} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Finish Options</h1>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add Finish</Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">+Price</th>
                <th className="px-4 py-3 text-center">Sort</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {options.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.id}</td>
                  <td className="px-4 py-3 font-medium">{o.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[240px] truncate">{o.description}</td>
                  <td className="px-4 py-3 text-right">+₹{o.priceModifier.toFixed(0)}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{o.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(o)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => remove(o)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Finish Option" : "Add Finish Option"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editing && field("id", "ID (slug, e.g. gallery-wrap)")}
            {field("name", "Name")}
            {field("description", "Description")}
            {field("priceModifier", "Price Modifier (₹)", "number")}
            {field("iconCode", "Icon Code")}
            {field("sortOrder", "Sort Order", "number")}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

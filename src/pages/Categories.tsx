import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  slug: string;
  displayName: string;
  description: string | null;
  introText: string | null;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: Omit<Category, "slug"> & { slug: string } = {
  slug: "",
  displayName: "",
  description: "",
  introText: "",
  sortOrder: 0,
  isActive: true,
};

export default function Categories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Category[]>("/categories/all")
      .then(setCategories)
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      slug: c.slug,
      displayName: c.displayName,
      description: c.description ?? "",
      introText: c.introText ?? "",
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing.slug}`, {
          displayName: form.displayName,
          description: form.description || null,
          introText: form.introText || null,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        });
        toast({ title: "Updated" });
      } else {
        await api.post("/categories", {
          slug: form.slug,
          displayName: form.displayName,
          description: form.description || null,
          introText: form.introText || null,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        });
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

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.displayName}" (${c.slug})?`)) return;
    await api.delete(`/categories/${c.slug}`)
      .then(() => { toast({ title: "Deleted" }); load(); })
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }));
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type: "text" | "number" | "textarea" = "text"
  ) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      {type === "textarea" ? (
        <Textarea
          rows={3}
          value={String(form[key])}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <Input
          type={type}
          value={String(form[key])}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add Category</Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Display Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-center">Sort</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(c => (
                <tr key={c.slug} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.slug}</td>
                  <td className="px-4 py-3 font-medium">{c.displayName}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[260px] truncate">{c.description ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{c.sortOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => remove(c)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editing && field("slug", "Slug (e.g. TheGoats, Elevated)")}
            {field("displayName", "Display Name")}
            {field("description", "Short Description (meta tag)", "textarea")}
            {field("introText", "Intro Text (shown above products on shop page)", "textarea")}
            {field("sortOrder", "Sort Order", "number")}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active (visible on shop)</Label>
            </div>
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

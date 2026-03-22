import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, ImageIcon, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  slug: string;
  displayName: string;
  description: string | null;
  introText: string | null;
  heroImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ProductOption {
  id: string;
  title: string;
  slug: string;
  category: string;
  image: string;
}

interface ProductImagesResult {
  slug: string;
  title: string;
  images: string[];
}

const emptyForm: Omit<Category, "slug"> & { slug: string } = {
  slug: "",
  displayName: "",
  description: "",
  introText: "",
  heroImageUrl: "",
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

  // Image picker state
  const [categoryProducts, setCategoryProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Category[]>("/categories/all")
      .then(setCategories)
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resetPicker = () => {
    setCategoryProducts([]);
    setSelectedProduct(null);
    setProductImages([]);
  };

  const loadCategoryProducts = async (categorySlug: string) => {
    setLoadingProducts(true);
    resetPicker();
    try {
      // Fetch up to 200 products and filter client-side by category (case-insensitive)
      const data = await api.get<{ items: ProductOption[] }>("/admin/products?pageSize=200");
      const filtered = (data.items ?? []).filter(
        p => p.category.toLowerCase() === categorySlug.toLowerCase()
      );
      setCategoryProducts(filtered);
    } catch {
      // silent — picker just won't show products
    } finally {
      setLoadingProducts(false);
    }
  };

  const selectProduct = async (product: ProductOption) => {
    setSelectedProduct(product);
    setProductImages([]);
    setLoadingImages(true);
    try {
      const result = await api.get<ProductImagesResult>(`/admin/products/${product.slug}/images`);
      setProductImages(result.images);
    } catch (e: unknown) {
      toast({
        title: "Couldn't load images",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingImages(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    resetPicker();
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      slug: c.slug,
      displayName: c.displayName,
      description: c.description ?? "",
      introText: c.introText ?? "",
      heroImageUrl: c.heroImageUrl ?? "",
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    resetPicker();
    setDialogOpen(true);
    loadCategoryProducts(c.slug);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing.slug}`, {
          displayName: form.displayName,
          description: form.description || null,
          introText: form.introText || null,
          heroImageUrl: form.heroImageUrl || null,
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
          heroImageUrl: form.heroImageUrl || null,
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {!editing && field("slug", "Slug (e.g. TheGoats, Elevated)")}
            {field("displayName", "Display Name")}
            {field("description", "Short Description (meta tag)", "textarea")}
            {field("introText", "Intro Text (shown above products on shop page)", "textarea")}

            {/* ── Hero Image Picker ───────────────────────────────────────── */}
            <div className="space-y-2">
              <Label>
                Hero Image{" "}
                <span className="text-gray-400 font-normal">
                  (Collections dropdown thumbnail &amp; Shop page banner)
                </span>
              </Label>

              {editing ? (
                <>
                  {/* Step 1 — product grid for this category */}
                  {!selectedProduct && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500">
                        Select a design from this category to browse its images:
                      </p>
                      {loadingProducts ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading designs…
                        </div>
                      ) : categoryProducts.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2 italic">
                          No designs found for this category.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                          {categoryProducts.map(p => (
                            <button
                              key={p.id}
                              onClick={() => selectProduct(p)}
                              className="flex flex-col items-center gap-1 p-1.5 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                            >
                              <div className="w-full aspect-square rounded overflow-hidden bg-gray-100">
                                <img
                                  src={p.image}
                                  alt={p.title}
                                  className="w-full h-full object-cover"
                                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              </div>
                              <p className="text-[10px] font-medium text-gray-700 truncate w-full text-center leading-tight">
                                {p.title}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2 — images for the selected product */}
                  {selectedProduct && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setSelectedProduct(null); setProductImages([]); }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ChevronLeft className="h-3 w-3" />
                          Back to designs
                        </button>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs font-medium text-gray-700">{selectedProduct.title}</span>
                      </div>

                      {loadingImages ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading images from S3…
                        </div>
                      ) : productImages.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                          <ImageIcon className="h-4 w-4" />
                          No images found in S3 for this design.
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500">
                            {productImages.length} image{productImages.length !== 1 ? "s" : ""} — click to use as hero
                          </p>
                          <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                            {productImages.map(url => {
                              const selected = form.heroImageUrl === url;
                              return (
                                <button
                                  key={url}
                                  onClick={() => setForm(f => ({ ...f, heroImageUrl: url }))}
                                  className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[4/3] bg-gray-100 ${
                                    selected
                                      ? "border-blue-500 ring-2 ring-blue-200"
                                      : "border-transparent hover:border-gray-300"
                                  }`}
                                  title={url.split("/").pop()}
                                >
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  {selected && (
                                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                                      <div className="bg-blue-500 rounded-full p-1">
                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    </div>
                                  )}
                                  <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                                    {url.split("/").pop()}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 border-t" />
                    <span className="text-xs text-gray-400">or enter URL manually</span>
                    <div className="flex-1 border-t" />
                  </div>
                </>
              ) : null}

              {/* Manual URL input + preview — always shown */}
              <Input
                type="text"
                placeholder="https://…"
                value={String(form.heroImageUrl)}
                onChange={e => setForm(f => ({ ...f, heroImageUrl: e.target.value }))}
              />
              {form.heroImageUrl && (
                <div className="w-full h-28 rounded-lg overflow-hidden border bg-gray-50">
                  <img
                    src={String(form.heroImageUrl)}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).alt = "Image not found"; }}
                  />
                </div>
              )}
            </div>

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

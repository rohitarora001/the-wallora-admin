import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, GripVertical, Save, Eye, EyeOff, Search, Loader2, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HeroSlide {
  id: string | null;
  imageUrl: string;
  altText: string;
  accentColor: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ApiHeroSlide {
  id: string;
  imageUrl: string;
  altText: string;
  accentColor: string;
  linkUrl: string | null;
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
  category: string;
  images: string[];
}

const EMPTY_SLIDE: HeroSlide = {
  id: null,
  imageUrl: "",
  altText: "",
  accentColor: "#606C38",
  linkUrl: "/shop",
  sortOrder: 0,
  isActive: true,
};

export default function HeroSlides() {
  const { toast } = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<HeroSlide>(EMPTY_SLIDE);

  // Product picker state
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    api.get<ApiHeroSlide[]>("/admin/hero-slides")
      .then(data => {
        setSlides(data.map(s => ({ ...s })));
        setDirty(false);
      })
      .catch(e => toast({ title: "Error loading slides", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Load all products once for the dropdown
  useEffect(() => {
    api.get<{ items: ProductOption[] }>("/admin/products?pageSize=200")
      .then(data => setProducts(data.items ?? []))
      .catch(() => {/* silent — product picker just won't work */});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node))
        setProductDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectProduct = async (product: ProductOption) => {
    setSelectedProduct(product);
    setProductDropdownOpen(false);
    setProductSearch(product.title);
    setProductImages([]);
    setLoadingImages(true);

    // Auto-fill link URL to the product's shop category
    setForm(f => ({
      ...f,
      linkUrl: `/shop?category=${product.category}`,
      altText: f.altText || product.title,
    }));

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

  const clearProductPicker = () => {
    setSelectedProduct(null);
    setProductSearch("");
    setProductImages([]);
  };

  const pickImage = (url: string) => {
    setForm(f => ({ ...f, imageUrl: url }));
  };

  const openAdd = () => {
    setEditIndex(null);
    setForm({ ...EMPTY_SLIDE, sortOrder: slides.length });
    clearProductPicker();
    setDialogOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditIndex(idx);
    setForm({ ...slides[idx] });
    clearProductPicker();
    setDialogOpen(true);
  };

  const saveDialog = () => {
    if (!form.imageUrl.trim()) {
      toast({ title: "Image URL is required", variant: "destructive" });
      return;
    }
    setSlides(prev => {
      const next = [...prev];
      if (editIndex !== null) {
        next[editIndex] = { ...form };
      } else {
        next.push({ ...form });
      }
      return next;
    });
    setDirty(true);
    setDialogOpen(false);
  };

  const remove = (idx: number) => {
    if (!confirm("Remove this slide?")) return;
    setSlides(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sortOrder: i })));
    setDirty(true);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSlides(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((s, i) => ({ ...s, sortOrder: i }));
    });
    setDirty(true);
  };

  const moveDown = (idx: number) => {
    setSlides(prev => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((s, i) => ({ ...s, sortOrder: i }));
    });
    setDirty(true);
  };

  const toggleActive = (idx: number) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, isActive: !s.isActive } : s));
    setDirty(true);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        slides: slides.map((s, i) => ({
          id: s.id,
          imageUrl: s.imageUrl,
          altText: s.altText,
          accentColor: s.accentColor,
          linkUrl: s.linkUrl || null,
          sortOrder: i,
          isActive: s.isActive,
        })),
      };
      const updated = await api.put<ApiHeroSlide[]>("/admin/hero-slides", payload);
      setSlides(updated.map(s => ({ ...s })));
      setDirty(false);
      toast({ title: "Hero slides saved", description: `${updated.length} slide${updated.length !== 1 ? "s" : ""} updated.` });
    } catch (e: unknown) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero Slides</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Control the 3-panel art grid shown on the homepage. Drag to reorder, toggle to show/hide.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />Add Slide
          </Button>
          <Button size="sm" onClick={saveAll} disabled={!dirty || saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {dirty && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <span className="font-semibold">Unsaved changes</span>
          <span className="text-amber-500">— click "Save Changes" to publish.</span>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading slides…</p>
      ) : slides.length === 0 ? (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 mb-3">No slides configured.</p>
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />Add first slide
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {slides.map((slide, idx) => (
            <div
              key={slide.id ?? `new-${idx}`}
              className={`flex items-center gap-3 p-3 rounded-xl border bg-white transition-opacity ${!slide.isActive ? "opacity-50" : ""}`}
            >
              <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
              <span className="text-xs font-bold text-gray-400 w-5 text-center shrink-0">{idx + 1}</span>

              <div
                className="w-16 h-12 rounded-md overflow-hidden shrink-0 bg-gray-100 border"
                style={{ borderColor: slide.accentColor + "60" }}
              >
                {slide.imageUrl ? (
                  <img src={slide.imageUrl} alt={slide.altText} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
                )}
              </div>

              <div className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm" style={{ backgroundColor: slide.accentColor }} title={slide.accentColor} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{slide.altText || <span className="text-gray-300 italic">No alt text</span>}</p>
                <p className="text-xs text-gray-400 truncate">{slide.imageUrl || "—"}</p>
              </div>

              <button onClick={() => toggleActive(idx)} className="p-1.5 rounded text-gray-400 hover:text-gray-700 transition-colors"
                title={slide.isActive ? "Visible — click to hide" : "Hidden — click to show"}>
                {slide.isActive ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-gray-300" />}
              </button>

              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => moveDown(idx)} disabled={idx === slides.length - 1} className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => openEdit(idx)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-red-400 hover:text-red-600" onClick={() => remove(idx)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "Edit Slide" : "Add Slide"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {/* ── Product picker ──────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label>Pick from a product <span className="text-gray-400 font-normal">(optional)</span></Label>
              <div className="relative" ref={productDropdownRef}>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    <Input
                      placeholder="Search products…"
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setProductDropdownOpen(true); }}
                      onFocus={() => setProductDropdownOpen(true)}
                      className="pl-8"
                    />
                  </div>
                  {selectedProduct && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-gray-400 hover:text-gray-700" onClick={clearProductPicker}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {productDropdownOpen && filteredProducts.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-52 overflow-y-auto rounded-lg border bg-white shadow-lg">
                    {filteredProducts.slice(0, 30).map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectProduct(p)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b last:border-0"
                      >
                        <img src={p.image} alt={p.title} className="w-8 h-8 rounded object-cover shrink-0 bg-gray-100"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.title}</p>
                          <p className="text-xs text-gray-400 truncate">{p.category} · {p.slug}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* S3 image grid */}
              {loadingImages && (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading images from S3…
                </div>
              )}

              {!loadingImages && productImages.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">{productImages.length} image{productImages.length !== 1 ? "s" : ""} found — click to use</p>
                  <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-0.5">
                    {productImages.map(url => {
                      const selected = form.imageUrl === url;
                      return (
                        <button
                          key={url}
                          onClick={() => pickImage(url)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[4/3] bg-gray-100 ${
                            selected ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-gray-300"
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
                </div>
              )}

              {!loadingImages && selectedProduct && productImages.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <ImageIcon className="h-4 w-4" />
                  No images found in S3 for this product.
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-4">
              {/* ── Image URL (manual override) ──────────────────────── */}
              <div className="space-y-1.5">
                <Label>Image URL <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="https://the-wallora.s3.ap-south-1.amazonaws.com/…"
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                />
                {form.imageUrl && (
                  <div className="w-full h-32 rounded-lg overflow-hidden border bg-gray-50 mt-1">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).alt = "Image not found"; }} />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Alt Text</Label>
                <Input
                  placeholder="Marlboro Green — Elevated Collection"
                  value={form.altText}
                  onChange={e => setForm(f => ({ ...f, altText: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Link URL</Label>
                <Input
                  placeholder="/shop?category=elevated"
                  value={form.linkUrl ?? ""}
                  onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value || null }))}
                />
              </div>

              <div className="flex items-end gap-4">
                <div className="space-y-1.5 flex-1">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                      className="h-9 w-14 rounded border cursor-pointer p-1"
                    />
                    <Input
                      value={form.accentColor}
                      onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                      className="font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 w-24">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                <Label className="cursor-pointer">{form.isActive ? "Visible on homepage" : "Hidden"}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDialog}>{editIndex !== null ? "Update" : "Add Slide"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

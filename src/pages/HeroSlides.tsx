import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, GripVertical, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HeroSlide {
  id: string | null;       // null for new unsaved slides
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

  const openAdd = () => {
    setEditIndex(null);
    setForm({ ...EMPTY_SLIDE, sortOrder: slides.length });
    setDialogOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditIndex(idx);
    setForm({ ...slides[idx] });
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
    setSlides(prev => {
      const next = prev.filter((_, i) => i !== idx);
      // Re-number sort orders
      return next.map((s, i) => ({ ...s, sortOrder: i }));
    });
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
              {/* Drag handle */}
              <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />

              {/* Position badge */}
              <span className="text-xs font-bold text-gray-400 w-5 text-center shrink-0">
                {idx + 1}
              </span>

              {/* Thumbnail */}
              <div
                className="w-16 h-12 rounded-md overflow-hidden shrink-0 bg-gray-100 border"
                style={{ borderColor: slide.accentColor + "60" }}
              >
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt={slide.altText}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Accent color swatch */}
              <div
                className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm"
                style={{ backgroundColor: slide.accentColor }}
                title={slide.accentColor}
              />

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{slide.altText || <span className="text-gray-300 italic">No alt text</span>}</p>
                <p className="text-xs text-gray-400 truncate">{slide.imageUrl || "—"}</p>
              </div>

              {/* Active toggle */}
              <button
                onClick={() => toggleActive(idx)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-700 transition-colors"
                title={slide.isActive ? "Visible — click to hide" : "Hidden — click to show"}
              >
                {slide.isActive
                  ? <Eye className="h-4 w-4 text-green-500" />
                  : <EyeOff className="h-4 w-4 text-gray-300" />}
              </button>

              {/* Up/down arrows */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === slides.length - 1}
                  className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Edit / Delete */}
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => openEdit(idx)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 shrink-0 text-red-400 hover:text-red-600"
                onClick={() => remove(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "Edit Slide" : "Add Slide"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Image URL <span className="text-red-400">*</span></Label>
              <Input
                placeholder="https://the-wallora.s3.ap-south-1.amazonaws.com/..."
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              />
              {form.imageUrl && (
                <div className="w-full h-32 rounded-lg overflow-hidden border bg-gray-50 mt-1">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).alt = "Image not found"; }}
                  />
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
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
              <Label className="cursor-pointer">{form.isActive ? "Visible on homepage" : "Hidden"}</Label>
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

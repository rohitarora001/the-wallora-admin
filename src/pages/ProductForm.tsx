import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { adminApi } from "@/lib/adminApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Category = "Legends" | "Reality" | "Beyond" | "TheInfinite" | "Unapologetic" | "Stillness" | "TheGoats" | "Elevated";

interface AdminProductDetail {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  displayPrice: number;
  originalPrice?: number | null;
  image: string;
  hoverImage: string;
  roomImage: string;
  category: Category;
  description: string;
  shippingInfo: string;
  sku?: string;
  stockStatus?: string;
  isNew: boolean;
  isActive: boolean;
  orientation: string;
  sortOrder: number;
  updatedAt: string;
}

interface ProductFormState {
  title: string;
  category: Category;
  basePrice: string;
  displayPrice: string;
  originalPrice: string;
  image: string;
  hoverImage: string;
  roomImage: string;
  description: string;
  shippingInfo: string;
  sku: string;
  stockStatus: string;
  isNew: boolean;
  isActive: boolean;
  orientation: string;
  sortOrder: string;
}

type ProductImageField = "image" | "hoverImage" | "roomImage";

const IMAGE_TYPE_MAP: Record<ProductImageField, "design" | "hover" | "room"> = {
  image: "design",
  hoverImage: "hover",
  roomImage: "room",
};

const DEFAULT_STATE: ProductFormState = {
  title: "",
  category: "Legends",
  basePrice: "",
  displayPrice: "",
  originalPrice: "",
  image: "",
  hoverImage: "",
  roomImage: "",
  description: "",
  shippingInfo: "",
  sku: "",
  stockStatus: "In Stock",
  isNew: false,
  isActive: true,
  orientation: "portrait",
  sortOrder: "0",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProductForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<ProductFormState>(DEFAULT_STATE);
  const [existingSlug, setExistingSlug] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<ProductImageField, boolean>>({
    image: false,
    hoverImage: false,
    roomImage: false,
  });

  const autoSlug = useMemo(() => slugify(form.title), [form.title]);
  const slugValue = isEditMode ? existingSlug : autoSlug;

  useEffect(() => {
    if (!isEditMode || !id) return;

    setLoading(true);
    api.get<AdminProductDetail>(`/admin/products/${id}`)
      .then((product) => {
        setExistingSlug(product.slug);
        setUpdatedAt(product.updatedAt);

        setForm({
          title: product.title,
          category: product.category,
          basePrice: String(product.basePrice),
          displayPrice: String(product.displayPrice),
          originalPrice: product.originalPrice ? String(product.originalPrice) : "",
          image: product.image,
          hoverImage: product.hoverImage,
          roomImage: product.roomImage,
          description: product.description,
          shippingInfo: product.shippingInfo,
          sku: product.sku ?? "",
          stockStatus: product.stockStatus ?? "In Stock",
          isNew: product.isNew,
          isActive: product.isActive,
          orientation: product.orientation ?? "portrait",
          sortOrder: String(product.sortOrder),
        });
      })
      .catch((error: unknown) => {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load product",
          variant: "destructive",
        });
        navigate("/products");
      })
      .finally(() => setLoading(false));
  }, [id, isEditMode, navigate, toast]);

  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.image.trim() || !form.hoverImage.trim() || !form.roomImage.trim()) {
      return "Upload design image and both mockup images.";
    }
    if (!form.description.trim()) return "Description is required.";
    if (!form.shippingInfo.trim()) return "Shipping info is required.";

    const basePrice = Number(form.basePrice);
    const displayPrice = Number(form.displayPrice);
    const originalPrice = form.originalPrice.trim() ? Number(form.originalPrice) : null;

    if (Number.isNaN(displayPrice) || displayPrice <= 0) return "Display price must be greater than 0.";
    if (originalPrice !== null && (Number.isNaN(originalPrice) || originalPrice <= 0)) return "Original price must be greater than 0 when provided.";

    return null;
  };

  const uploadImage = async (field: ProductImageField, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!form.title.trim()) {
      toast({ title: "Enter a title first", description: "The image path is derived from the product title.", variant: "destructive" });
      return;
    }

    setUploading((prev) => ({ ...prev, [field]: true }));
    try {
      const result = await adminApi.uploadProductImage(file, autoSlug, form.category, IMAGE_TYPE_MAP[field]);
      setField(field, result.url);
      toast({
        title: "Image uploaded",
        description: file.name,
      });
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      toast({ title: "Validation error", description: validationError, variant: "destructive" });
      return;
    }

    const payload = {
      title: form.title.trim(),
      basePrice: Number(form.basePrice),
      displayPrice: Number(form.displayPrice),
      originalPrice: form.originalPrice.trim() ? Number(form.originalPrice) : null,
      image: form.image.trim(),
      hoverImage: form.hoverImage.trim(),
      roomImage: form.roomImage.trim(),
      category: form.category,
      description: form.description.trim(),
      shippingInfo: form.shippingInfo.trim(),
      sku: form.sku.trim(),
      stockStatus: form.stockStatus.trim() || "In Stock",
      isNew: form.isNew,
      sortOrder: Number(form.sortOrder) || 0,
      orientation: form.orientation || "portrait",
    };

    setSaving(true);
    try {
      if (isEditMode && id) {
        await api.put(`/products/${id}`, {
          ...payload,
          id,
          isActive: form.isActive,
        });
        toast({ title: "Product updated" });
      } else {
        await api.post("/products", payload);
        toast({ title: "Product created" });
      }

      navigate("/products");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading product...</p>;
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Products
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEditMode ? "Edit Product" : "Add Product"}</h1>
          {isEditMode && updatedAt && (
            <p className="text-sm text-gray-500">Last updated: {new Date(updatedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="Abstract Horizon"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slugValue} readOnly />
                <p className="text-xs text-gray-500">
                  {isEditMode ? "Slug is locked after creation." : "Slug will be generated from the title on save."}
                </p>
              </div>

              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(value: Category) => setField("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Legends">Legends</SelectItem>
                    <SelectItem value="Reality">Reality</SelectItem>
                    <SelectItem value="Beyond">Beyond</SelectItem>
                    <SelectItem value="TheInfinite">The Infinite</SelectItem>
                    <SelectItem value="Unapologetic">Unapologetic</SelectItem>
                    <SelectItem value="Stillness">Stillness</SelectItem>
                    <SelectItem value="TheGoats">The GOATs</SelectItem>
                    <SelectItem value="Elevated">Elevated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Orientation</Label>
                <Select value={form.orientation} onValueChange={(value) => setField("orientation", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => setField("sortOrder", event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="displayPrice">Display Price (USD)</Label>
                <Input
                  id="displayPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.displayPrice}
                  onChange={(event) => setField("displayPrice", event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="originalPrice">Original Price (optional)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.originalPrice}
                  onChange={(event) => setField("originalPrice", event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(event) => setField("sku", event.target.value)}
                  placeholder="TW-ART-001"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="stockStatus">Stock Status</Label>
                <Input
                  id="stockStatus"
                  value={form.stockStatus}
                  onChange={(event) => setField("stockStatus", event.target.value)}
                  placeholder="In Stock"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
              <div className="flex items-center gap-3">
                <Switch id="isNew" checked={form.isNew} onCheckedChange={(checked) => setField("isNew", checked)} />
                <Label htmlFor="isNew" className="cursor-pointer">Mark as New</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setField("isActive", checked)}
                  disabled={!isEditMode}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {isEditMode ? "Product is Active" : "Product is Active (enabled by default)"}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-500">
              Upload images instead of pasting URLs. Design image is processed by Lambda into optimised WebP variants (~10 s). Mockups are stored as-is.
            </p>
            {[
              { key: "image" as const, label: "Design Image (Listing / Shop)" },
              { key: "hoverImage" as const, label: "Mockup Image (Product Page - 1)" },
              { key: "roomImage" as const, label: "Mockup Image (Product Page - 2 / Room)" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2 rounded-md border p-3">
                <Label htmlFor={key}>{label}</Label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Input
                    id={key}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => void uploadImage(key, event.target.files)}
                    disabled={uploading[key] || saving}
                    className="md:max-w-sm"
                  />
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading[key] ? "Uploading..." : form[key] ? "Uploaded" : "No file uploaded yet"}
                  </div>
                </div>
                {form[key] && (
                  <div className="space-y-2">
                    <img src={form[key]} alt={label} className="h-28 w-28 rounded object-cover bg-slate-100 border" />
                    <p className="text-[11px] text-slate-500 break-all">{form[key]}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                rows={5}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="shippingInfo">Shipping Info</Label>
              <Textarea
                id="shippingInfo"
                value={form.shippingInfo}
                onChange={(event) => setField("shippingInfo", event.target.value)}
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sizes & Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              Sizes are global — managed in the <strong>Sizes &amp; Pricing</strong> section. All portrait or landscape sizes are automatically linked when the product is created based on the product orientation set above.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditMode ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}

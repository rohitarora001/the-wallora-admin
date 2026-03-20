import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Eye, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductDetailResponse {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  displayPrice: number;
  originalPrice?: number | null;
  image: string;
  hoverImage: string;
  roomImage: string;
  category: string;
  description: string;
  shippingInfo: string;
  isNew: boolean;
  isActive: boolean;
  sku: string;
  stockStatus: string;
}

interface ProductSalesPerformance {
  productId: string;
  title: string;
  unitsSold: number;
  revenue: number;
  conversionRate: number;
  wishlistAdds: number;
}

export default function ProductDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [sales, setSales] = useState<ProductSalesPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<ProductDetailResponse>(`/admin/products/${id}`),
      api.get<ProductSalesPerformance>(`/admin/products/${id}/sales-performance`),
    ])
      .then(([productResponse, salesResponse]) => {
        setProduct(productResponse);
        setSales(salesResponse);
      })
      .catch((e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to load", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const publish = async (active: boolean) => {
    if (!id || toggling) return;
    setToggling(true);
    const path = active ? `/admin/products/${id}/publish` : `/admin/products/${id}/archive`;
    try {
      await api.post(path, {});
      setProduct((prev) => prev ? { ...prev, isActive: active } : prev);
      toast({ title: active ? "Product published" : "Product archived", description: active ? "Now visible to customers." : "Hidden from the store." });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Action failed", variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading artwork...</p>;
  if (!product) return <p className="text-sm text-red-500">Artwork not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link to="/products">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          </Link>
          <h1 className="text-xl font-semibold">{product.title}</h1>
          <span className="rounded-full px-2 py-1 text-xs bg-slate-100">{product.isActive ? "Live" : "Archived"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-1" />Preview Site</a>
          </Button>
          <Link to={`/products/${product.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
          {product.isActive ? (
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => publish(false)} disabled={toggling}>
              <Trash2 className="h-4 w-4 mr-1" />{toggling ? "Archiving..." : "Archive Artwork"}
            </Button>
          ) : (
            <Button size="sm" onClick={() => publish(true)} disabled={toggling}>
              <Send className="h-4 w-4 mr-1" />{toggling ? "Publishing..." : "Publish Changes"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Artwork</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Design (Listing)</p>
                <img src={product.image} alt={`${product.title} design`} className="w-full h-52 object-cover rounded bg-slate-100" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Mockup 1 (Product Page)</p>
                <img src={product.hoverImage} alt={`${product.title} mockup 1`} className="w-full h-52 object-cover rounded bg-slate-100" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Mockup 2 (Room)</p>
                <img src={product.roomImage} alt={`${product.title} mockup 2`} className="w-full h-52 object-cover rounded bg-slate-100" />
              </div>
            </div>
            <p className="text-sm text-slate-700">{product.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pricing Calculator</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Base Price</span><strong>₹{product.basePrice.toFixed(2)}</strong></div>
            <div className="flex justify-between"><span>Display Price</span><strong>₹{product.displayPrice.toFixed(2)}</strong></div>
            {product.originalPrice && (
              <div className="flex justify-between"><span>Original Price</span><strong>₹{product.originalPrice.toFixed(2)}</strong></div>
            )}
            <div className="flex justify-between"><span>SKU</span><strong>{product.sku || "N/A"}</strong></div>
            <div className="flex justify-between"><span>Stock Status</span><strong>{product.stockStatus || "In Stock"}</strong></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Metadata</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-slate-500">Category:</span> {product.category}</p>
            <p><span className="text-slate-500">Slug:</span> {product.slug}</p>
            <p><span className="text-slate-500">Shipping:</span> {product.shippingInfo}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Sales Performance</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-slate-500">Units Sold:</span> {sales?.unitsSold ?? 0}</p>
            <p><span className="text-slate-500">Revenue:</span> ₹{(sales?.revenue ?? 0).toFixed(2)}</p>
            <p><span className="text-slate-500">Wishlist Adds:</span> {sales?.wishlistAdds ?? 0}</p>
            <p><span className="text-slate-500">Conversion Rate:</span> {(sales?.conversionRate ?? 0).toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

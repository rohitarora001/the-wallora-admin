import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductInventoryItem {
  id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  displayPrice: number;
  isActive: boolean;
  isNew: boolean;
  stockStatus: string;
  averageRating: number;
  reviewCount: number;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const CATEGORY_TABS = [
  { label: "All Works",      value: "" },
  { label: "The Infinite",  value: "TheInfinite" },
  { label: "Unapologetic",  value: "Unapologetic" },
  { label: "Stillness",     value: "Stillness" },
  { label: "The GOATs",     value: "TheGoats" },
  { label: "Elevated",      value: "Elevated" },
];

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductInventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryTab, setCategoryTab] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) q.set("search", search);
    if (categoryTab) q.set("category", categoryTab);

    api.get<PagedResult<ProductInventoryItem>>(`/admin/products?${q}`)
      .then((res) => {
        setProducts(res.items);
        setTotalCount(res.totalCount);
      })
      .catch((error) => toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      }))
      .finally(() => setLoading(false));
  }, [page, search, categoryTab, toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500">Manage artwork catalog, status, and publish flow.</p>
        </div>
        <Link to="/products/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Artwork</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={tab.value === categoryTab ? "default" : "outline"}
            onClick={() => { setCategoryTab(tab.value); setPage(1); }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <form
        className="max-w-md flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(searchInput);
        }}
      >
        <Input placeholder="Search artwork..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <Button type="submit" variant="outline"><Search className="h-4 w-4" /></Button>
        <Button type="button" variant="outline"><Filter className="h-4 w-4" /></Button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4 h-56 animate-pulse" />
        )) : products.map((product) => (
          <Link key={product.id} to={`/products/${product.id}`}>
            <div className="rounded-lg border bg-white overflow-hidden hover:shadow-sm transition-shadow">
              <img src={product.image} alt={product.title} className="h-40 w-full object-cover bg-slate-100" />
              <div className="p-3 space-y-1">
                <p className="font-medium text-slate-900 truncate">{product.title}</p>
                <p className="text-xs text-slate-500">{product.category}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>₹{product.displayPrice.toFixed(2)}</span>
                  <span>{product.stockStatus || (product.isActive ? "Live" : "Archived")}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{totalCount} artworks</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="px-2 py-1">Page {page}</span>
          <Button size="sm" variant="outline" disabled={products.length < pageSize} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

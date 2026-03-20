import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileDown, Mail, Search, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomerListItem {
  id: string;
  email: string;
  fullName: string;
  contact: string;
  location: string;
  orderCount: number;
  totalSpent: number;
  status: string;
  isVip: boolean;
  joinedAt: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const STATUS_TABS = ["All", "Active", "Inactive", "VIP"];

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) q.set("search", search);
    if (status !== "All") q.set("status", status);

    api.get<PagedResult<CustomerListItem>>(`/admin/customers?${q}`)
      .then((r) => {
        setCustomers(r.items);
        setTotalCount(r.totalCount);
      })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [page, search, status, toast]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">All Customers</h1>
          <p className="text-sm text-slate-500">Manage customer profiles and order value.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><FileDown className="h-4 w-4 mr-1" />Export</Button>
          <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Add Customer</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={status === tab ? "default" : "outline"}
            onClick={() => { setStatus(tab); setPage(1); }}
          >
            {tab}
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
        <Input placeholder="Search customers..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <Button type="submit" variant="outline"><Search className="h-4 w-4" /></Button>
      </form>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-right">Total Orders</th>
              <th className="px-4 py-3 text-right">Total Spent</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No customers found.</td></tr>
            ) : customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{customer.fullName}</p>
                  <p className="text-xs text-slate-400">{customer.email}</p>
                </td>
                <td className="px-4 py-3">{customer.contact}</td>
                <td className="px-4 py-3">{customer.location || "N/A"}</td>
                <td className="px-4 py-3 text-right">{customer.orderCount}</td>
                <td className="px-4 py-3 text-right">₹{customer.totalSpent.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-full px-2 py-1 text-xs bg-slate-100 text-slate-700">{customer.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/customers/${customer.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                    <Button variant="ghost" size="icon" title="Contact">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{totalCount} customers</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="px-2 py-1">Page {page} / {Math.max(totalPages, 1)}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

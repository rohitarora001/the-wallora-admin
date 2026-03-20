import { useEffect, useMemo, useState } from "react";
import { Bell, Download, HelpCircle, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

interface TopSellingArt {
  productId: string;
  title: string;
  artist: string;
  sales: number;
  status: string;
  thumbnail: string;
}

interface DashboardStats {
  totalRevenue: number;
  revenueToday: number;
  ordersTotal: number;
  ordersToday: number;
  totalCustomers: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  topSellingArt: TopSellingArt[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/admin/dashboard")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const maxRevenue = useMemo(() => {
    const values = stats?.monthlyRevenue.map((x) => x.revenue) ?? [];
    return Math.max(...values, 1);
  }, [stats]);

  if (loading) return <p className="text-sm text-gray-500">Loading dashboard...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Executive Dashboard</h1>
          <p className="text-sm text-slate-500">Revenue, orders, and top-selling artwork at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><HelpCircle className="h-4 w-4 mr-1" />Help</Button>
          <Button variant="outline" size="sm"><Bell className="h-4 w-4 mr-1" />Notifications</Button>
          <Button size="sm"><Download className="h-4 w-4 mr-1" />Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">Today: ₹{stats.revenueToday.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Orders</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.ordersTotal}</p>
            <p className="text-xs text-slate-500 mt-1">{stats.ordersToday} today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Customers</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            <p className="text-xs text-slate-500 mt-1">Active customer records</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.monthlyRevenue.map((point) => (
              <div key={point.month} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{point.month}</span>
                  <span>₹{point.revenue.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded">
                  <div
                    className="h-2 rounded bg-[#1d283a]"
                    style={{ width: `${Math.max(6, Math.round((point.revenue / maxRevenue) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Top Selling Art
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b">
                  <th className="py-2">Artwork</th>
                  <th className="py-2">Artist</th>
                  <th className="py-2 text-right">Sales</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.topSellingArt.map((art) => (
                  <tr key={art.productId} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <img src={art.thumbnail} alt={art.title} className="h-8 w-8 rounded object-cover bg-slate-100" />
                        <span className="font-medium">{art.title}</span>
                      </div>
                    </td>
                    <td className="py-2 text-slate-500">{art.artist}</td>
                    <td className="py-2 text-right">{art.sales}</td>
                    <td className="py-2 text-right">
                      <span className="rounded-full px-2 py-1 text-xs bg-slate-100 text-slate-700">{art.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">View Orders</Button>
          <Button variant="outline" size="sm">Manage Customers</Button>
          <Button variant="outline" size="sm">Manage Inventory</Button>
        </CardContent>
      </Card>
    </div>
  );
}

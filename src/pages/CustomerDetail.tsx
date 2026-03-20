import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, ShieldBan, ShieldCheck, UserCog } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  productPreview: string;
  totalAmount: number;
  itemCount: number;
  podStatus: string;
  createdAt: string;
}

interface CustomerDetailResponse {
  id: string;
  email: string;
  fullName: string;
  contact: string;
  location: string;
  status: string;
  isVip: boolean;
  totalSpent: number;
  totalOrders: number;
  joinedAt: string;
  recentOrders: OrderSummary[];
}

export default function CustomerDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<"Customer" | "Admin">("Customer");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<CustomerDetailResponse>(`/admin/customers/${id}`)
      .then(setCustomer)
      .catch((e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to load", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const isBanned = customer?.status === "Banned";

  const handleBanToggle = async () => {
    if (!id || acting) return;
    setActing(true);
    try {
      await api.patch(`/admin/users/${id}/ban`, { isBanned: !isBanned });
      setCustomer((prev) => prev ? { ...prev, status: isBanned ? "Active" : "Banned" } : prev);
      toast({ title: isBanned ? "User unbanned" : "User banned", description: isBanned ? "Account is now active." : "Account has been suspended." });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Action failed", variant: "destructive" });
    } finally {
      setActing(false);
      setBanDialogOpen(false);
    }
  };

  const handleRoleChange = async () => {
    if (!id || acting) return;
    setActing(true);
    try {
      await api.patch(`/admin/users/${id}/role`, { role: pendingRole });
      toast({ title: "Role updated", description: `User is now a ${pendingRole}.` });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Action failed", variant: "destructive" });
    } finally {
      setActing(false);
      setRoleDialogOpen(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading customer...</p>;
  if (!customer) return <p className="text-sm text-red-500">Customer not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link to="/customers">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          </Link>
          <h1 className="text-xl font-semibold">{customer.fullName}</h1>
          <span className={`rounded-full px-2 py-1 text-xs ${isBanned ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
            {customer.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1" />Contact Customer</Button>

          {/* Change Role */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <UserCog className="h-4 w-4 mr-1" />Change Role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setPendingRole("Customer"); setRoleDialogOpen(true); }}>
                Set as Customer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setPendingRole("Admin"); setRoleDialogOpen(true); }} className="text-red-600 focus:text-red-600">
                Set as Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Ban / Unban */}
          <Button
            variant="outline"
            size="sm"
            className={isBanned ? "text-green-700 border-green-300 hover:bg-green-50" : "text-red-600 border-red-200 hover:bg-red-50"}
            onClick={() => setBanDialogOpen(true)}
          >
            {isBanned ? <><ShieldCheck className="h-4 w-4 mr-1" />Unban User</> : <><ShieldBan className="h-4 w-4 mr-1" />Ban User</>}
          </Button>

          <Link to={`/orders?search=${encodeURIComponent(customer.email)}`}>
            <Button size="sm">View All Orders</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{customer.fullName}</p>
            <p>{customer.email}</p>
            <p>{customer.location || "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Total Spent</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{customer.totalSpent.toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Order Count</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{customer.totalOrders}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
        <CardContent>
          {customer.recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b">
                  <th className="py-2">Date</th>
                  <th className="py-2">Order ID</th>
                  <th className="py-2">Artwork</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {customer.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-2 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 font-mono text-xs">{order.orderNumber}</td>
                    <td className="py-2">{order.productPreview}</td>
                    <td className="py-2">{order.status}</td>
                    <td className="py-2 text-right">₹{order.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Ban confirmation */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isBanned ? "Unban this user?" : "Ban this user?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isBanned
                ? `${customer.fullName}'s account will be reactivated and they will be able to sign in again.`
                : `${customer.fullName}'s account will be suspended. They will not be able to sign in.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanToggle} className={isBanned ? "" : "bg-red-600 hover:bg-red-700"}>
              {acting ? "Processing..." : isBanned ? "Yes, unban" : "Yes, ban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role change confirmation */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change role to {pendingRole}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRole === "Admin"
                ? `This will give ${customer.fullName} full admin access to the dashboard. This action should be used with caution.`
                : `${customer.fullName} will be downgraded to a regular customer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} className={pendingRole === "Admin" ? "bg-red-600 hover:bg-red-700" : ""}>
              {acting ? "Processing..." : `Set as ${pendingRole}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, HelpCircle, Image, LayoutDashboard, Layers, LogOut, MessageSquare, Package, PrinterCheck, Ruler, RotateCcw, ShoppingCart, Star, Tag, Truck, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/shipments", label: "Shipments", icon: Truck },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/users/new", label: "Create User", icon: UserPlus },
  { to: "/products", label: "Products", icon: Package },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/finish-options", label: "Finish Options", icon: Layers },
  { to: "/categories",    label: "Categories",     icon: Tag },
  { to: "/hero-slides",   label: "Hero Slides",     icon: Image },
  { to: "/sizes-pricing", label: "Sizes & Pricing", icon: Ruler },
  { to: "/support",       label: "Support",         icon: MessageSquare },
  { to: "/returns",       label: "Returns",         icon: RotateCcw },
];

const vendorNavItems = [
  { to: "/vendor/orders", label: "Production Queue", icon: PrinterCheck, exact: false },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isVendor = user?.role === "Vendor";
  const navItems = isVendor ? vendorNavItems : adminNavItems;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#f6f7f7] text-slate-900">
      <aside className="w-64 shrink-0 border-r bg-white">
        <div className="px-5 py-5 border-b">
          <p className="text-xl font-semibold tracking-tight" style={{ fontFamily: "Public Sans, sans-serif" }}>TheWallora</p>
          <p className="text-xs text-slate-500 mt-1">{isVendor ? "Vendor Portal" : "Admin Dashboard"}</p>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[#1d283a] text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t mt-auto">
          <p className="text-xs text-slate-500 mb-2 truncate">{user?.email}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-white px-6 flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon"><HelpCircle className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, LockKeyhole, Mail, BarChart3, Users, Package } from "lucide-react";

export default function AdminLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== "Admin" && user.role !== "Vendor") {
        await logout();
        setError("Access denied. Admin and vendor accounts only.");
        return;
      }
      navigate(user.role === "Vendor" ? "/vendor/orders" : "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid w-full overflow-hidden rounded-3xl border border-white/15 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.5)] lg:grid-cols-2">

            {/* Left panel */}
            <div className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-10 text-white lg:flex lg:flex-col">
              <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
                Admin Portal
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-tight">
                Control your store in one place.
              </h1>
              <p className="mt-4 text-sm text-slate-200/90">
                Review orders, update inventory, and handle customer support with confidence.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 p-3">
                  <BarChart3 className="h-5 w-5 text-cyan-300" />
                  <p className="text-sm text-slate-100">Full dashboard analytics and revenue overview.</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 p-3">
                  <Package className="h-5 w-5 text-cyan-300" />
                  <p className="text-sm text-slate-100">Manage products, orders, and inventory in real time.</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 p-3">
                  <Users className="h-5 w-5 text-cyan-300" />
                  <p className="text-sm text-slate-100">Handle customer accounts and review moderation.</p>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="p-6 sm:p-10">
              <div className="mb-8">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to store
                </Link>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Sign In</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-600">Access your admin dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="h-11 pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      className="h-11 pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-2 h-11 w-full rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in to admin"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

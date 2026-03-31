import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import ProductForm from "@/pages/ProductForm";
import ProductDetail from "@/pages/ProductDetail";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import OrderEdit from "@/pages/OrderEdit";
import OrderHistory from "@/pages/OrderHistory";
import Shipments from "@/pages/Shipments";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Reviews from "@/pages/Reviews";
import FinishOptions from "@/pages/FinishOptions";
import SizesPricing from "@/pages/SizesPricing";
import SupportTickets from "@/pages/SupportTickets";
import SupportTicketDetail from "@/pages/SupportTicketDetail";
import Returns from "@/pages/Returns";
import Categories from "@/pages/Categories";
import HeroSlides from "@/pages/HeroSlides";
import VendorOrders from "@/pages/VendorOrders";
import VendorOrderDetail from "@/pages/VendorOrderDetail";
import CreateUser from "@/pages/CreateUser";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="orders" element={<Orders />} />
              <Route path="shipments" element={<Shipments />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="orders/:id/edit" element={<OrderEdit />} />
              <Route path="orders/:id/history" element={<OrderHistory />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="finish-options" element={<FinishOptions />} />
              <Route path="categories" element={<Categories />} />
              <Route path="hero-slides" element={<HeroSlides />} />
              <Route path="sizes-pricing" element={<SizesPricing />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="support/:id" element={<SupportTicketDetail />} />
              <Route path="returns" element={<Returns />} />
              <Route path="vendor/orders" element={<VendorOrders />} />
              <Route path="vendor/orders/:id" element={<VendorOrderDetail />} />
              <Route path="users/new" element={<CreateUser />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

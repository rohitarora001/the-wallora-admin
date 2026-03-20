import { api, getAccessToken } from "@/lib/api";
import type {
  AdminPaged,
  CustomerDetail,
  CustomerListItem,
  Dashboard,
  OrderDetailManagement,
  OrderEditForm,
  OrderHistoryEntry,
  OrderListItem,
  ProductAdminDetail,
  ProductInventoryItem,
  ProductSalesPerformance,
  RefundResult,
} from "@/types/admin";

export const adminApi = {
  uploadProductImage: async (
    file: File,
    slug: string,
    category: string,
    imageType: "design" | "hover" | "room",
  ) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("slug", slug);
    formData.append("category", category);
    formData.append("imageType", imageType);

    const token = getAccessToken();
    const res = await fetch(`${baseUrl}/admin/uploads/product-image`, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? body?.title ?? "Image upload failed");
    }

    return res.json() as Promise<{ url: string; key: string }>;
  },
  getDashboard: () => api.get<Dashboard>("/admin/dashboard"),
  getOrders: (query: URLSearchParams) => api.get<AdminPaged<OrderListItem>>(`/admin/orders?${query}`),
  getOrderDetail: (id: string) => api.get<OrderDetailManagement>(`/admin/orders/${id}`),
  updateOrder: (id: string, payload: OrderEditForm) => api.put<OrderDetailManagement>(`/admin/orders/${id}`, payload),
  refundOrder: (id: string, payload: { amount?: number; reason: string; notifyCustomer: boolean }) =>
    api.post<RefundResult>(`/admin/orders/${id}/refund`, payload),
  getOrderHistory: (id: string, query: URLSearchParams) =>
    api.get<AdminPaged<OrderHistoryEntry>>(`/admin/orders/${id}/history?${query}`),
  getCustomers: (query: URLSearchParams) => api.get<AdminPaged<CustomerListItem>>(`/admin/customers?${query}`),
  getCustomerDetail: (id: string) => api.get<CustomerDetail>(`/admin/customers/${id}`),
  getProducts: (query: URLSearchParams) => api.get<AdminPaged<ProductInventoryItem>>(`/admin/products?${query}`),
  getProductDetail: (id: string) => api.get<ProductAdminDetail>(`/admin/products/${id}`),
  getProductSalesPerformance: (id: string) => api.get<ProductSalesPerformance>(`/admin/products/${id}/sales-performance`),
  publishProduct: (id: string) => api.post<void>(`/admin/products/${id}/publish`, {}),
  archiveProduct: (id: string) => api.post<void>(`/admin/products/${id}/archive`, {}),
};

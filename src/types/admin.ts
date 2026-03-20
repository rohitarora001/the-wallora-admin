import type { PagedResult } from "@/types/api";

export interface Dashboard {
  totalRevenue: number;
  revenueToday: number;
  ordersTotal: number;
  ordersToday: number;
  totalCustomers: number;
  monthlyRevenue: { month: string; revenue: number }[];
  topSellingArt: { productId: string; title: string; artist: string; sales: number; status: string; thumbnail: string }[];
}

export interface OrderListItem {
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

export interface OrderDetailManagement {
  id: string;
  orderNumber: string;
  status: string;
  podPartner?: string;
  podStatus: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  orderNotes?: string;
  items: Array<{
    id: string;
    productTitle: string;
    sizeCode: string;
    finishName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export interface OrderEditForm {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingCost: number;
  taxAmount: number;
  orderNotes?: string;
  podPartner?: string;
  podStatus?: string;
  items: Array<{ itemId: string; quantity: number }>;
}

export interface RefundResult {
  orderId: string;
  refundId: string;
  amount: number;
  status: string;
  refundedAt: string;
}

export interface OrderHistoryEntry {
  id: string;
  eventType: string;
  message: string;
  actor: string;
  metadata?: string;
  createdAt: string;
}

export interface CustomerListItem {
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

export interface CustomerDetail {
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
  recentOrders: OrderListItem[];
}

export interface ProductInventoryItem {
  id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  basePrice: number;
  displayPrice: number;
  isActive: boolean;
  isNew: boolean;
  stockStatus: string;
  averageRating: number;
  reviewCount: number;
}

export interface ProductAdminDetail extends ProductInventoryItem {
  description: string;
  shippingInfo: string;
  sku: string;
  sizes: Array<{ id: string; sizeCode: string; dimensions: string; priceModifier: number; sortOrder: number }>;
}

export interface ProductSalesPerformance {
  productId: string;
  title: string;
  unitsSold: number;
  revenue: number;
  conversionRate: number;
  wishlistAdds: number;
}

export type AdminPaged<T> = PagedResult<T>;

export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "shipped"
  | "delivered";

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;    // e.g. "Red / Large"
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

export interface Order {
  id?: string;
  userId: string;
  phone: string;
  displayId?: string; // e.g. PB-2024-01-15-ABC123

  items: OrderItem[];

  subtotal: number;
  shipping: number;
  total: number;

  address: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  status: OrderStatus;

  createdAt: number;
  updatedAt: number;

  payment?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };
}

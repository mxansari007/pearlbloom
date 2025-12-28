export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "shipped"
  | "delivered";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id?: string;
  userId: string;
  phone: string;
  displayId?: string; // e.g. last 6 chars of order id

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

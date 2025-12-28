export type UserRole = "customer" | "admin";

export interface Address {
  id?: string; // Firestore doc id
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
  createdAt: number;
}

export interface AppUser {
  uid: string;
  phone: string;
  role: UserRole;

  firstName?: string;
  lastName?: string;
  email?: string;

  createdAt: number;
  lastLoginAt: number;
}

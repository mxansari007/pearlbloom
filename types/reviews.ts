export interface Review {
  id?: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string; // ISO string
  verified: boolean; // True if user purchased it
}

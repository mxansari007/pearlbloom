// src/types/products.ts
export type Marketplaces = {
  amazon?: string
  flipkart?: string
  meesho?: string
}

export type Product = {
  id: string
  title: string
  slug: string
  price?: number
  description?: string
  images: string[]
  metal?: string
  gemstone?: string
  brand?: string
  categories?: string[]
  sku?: string
  marketplaces?: Marketplaces
}

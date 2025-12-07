import type { Product } from '../types/products'
import catalog from '../data/catalog.json'

const products: Product[] = catalog as Product[]

export async function getAllProducts(): Promise<Product[]> { return products }
export async function getAllSlugs(): Promise<string[]> { return products.map(p => p.slug) }
export async function getProductBySlug(slug?: string): Promise<Product | undefined> {
  if (!slug) return undefined
  return products.find(p => p.slug === slug)
}

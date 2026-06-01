export interface Category {
  _id: string
  name: string
  slug: string
  parentId: string | null
  level: number
  image?: string
  icon?: string
  description?: string
  seoTitle?: string
  seoDescription?: string
  sortOrder?: number
  isActive: boolean
  isFeatured: boolean
  children?: Category[]
}

import Category, { ICategory } from '@/database/models/Category'
import mongoose from 'mongoose'

/**
 * Get immediate children of a parent category
 */
export async function getChildren(parentId: string | mongoose.Types.ObjectId | null): Promise<ICategory[]> {
  const query = parentId
    ? { parentId: new mongoose.Types.ObjectId(parentId.toString()), isActive: true }
    : { parentId: null, isActive: true }
  
  return Category.find(query).sort({ sortOrder: 1, name: 1 })
}

/**
 * Get all descendant category IDs recursively (including the passed categoryId)
 */
export async function getDescendants(categoryId: string | mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
  const allCategories = await Category.find({ isActive: true })
  
  const parentToChildren = new Map<string, string[]>()
  for (const cat of allCategories) {
    if (cat.parentId) {
      const parentIdStr = cat.parentId.toString()
      if (!parentToChildren.has(parentIdStr)) {
        parentToChildren.set(parentIdStr, [])
      }
      parentToChildren.get(parentIdStr)!.push(cat._id.toString())
    }
  }

  const ids: mongoose.Types.ObjectId[] = [new mongoose.Types.ObjectId(categoryId.toString())]
  const queue: string[] = [categoryId.toString()]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const children = parentToChildren.get(currentId) || []
    for (const childId of children) {
      ids.push(new mongoose.Types.ObjectId(childId))
      queue.push(childId)
    }
  }
  
  return ids
}

/**
 * Get all ancestors of a category (from parent up to root)
 */
export async function getAncestors(categoryId: string | mongoose.Types.ObjectId): Promise<ICategory[]> {
  const ancestors: ICategory[] = []
  let currentId = new mongoose.Types.ObjectId(categoryId.toString())
  
  while (currentId) {
    const category = await Category.findOne({ _id: currentId, isActive: true })
    if (!category) break
    
    ancestors.unshift(category) // Prepend to keep root-to-leaf order
    if (category.parentId) {
      currentId = category.parentId
    } else {
      break
    }
  }
  
  return ancestors
}

/**
 * Build a breadcrumb string: "Home > Fashion > Men's Fashion > Top Wear > T-Shirts"
 */
export async function buildBreadcrumb(categoryId: string | mongoose.Types.ObjectId): Promise<string> {
  const ancestors = await getAncestors(categoryId)
  return ['Home', ...ancestors.map(c => c.name)].join(' > ')
}

export interface CategoryTreeNode {
  id: string
  _id: string
  name: string
  slug: string
  parentId: string | null
  level: number
  image?: string
  icon?: string
  description?: string
  isFeatured: boolean
  children: CategoryTreeNode[]
}

/**
 * Build a complete categories tree starting from roots
 */
export async function buildTree(): Promise<CategoryTreeNode[]> {
  const allCategories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 })
  
  const categoryMap = new Map<string, CategoryTreeNode & { children: CategoryTreeNode[] }>()
  
  // Initialize all nodes
  allCategories.forEach(cat => {
    categoryMap.set(cat._id.toString(), {
      id: cat._id.toString(),
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId ? cat.parentId.toString() : null,
      level: cat.level,
      image: cat.image,
      icon: cat.icon,
      description: cat.description,
      isFeatured: cat.isFeatured,
      children: []
    })
  })
  
  const tree: CategoryTreeNode[] = []
  
  // Build relationship hierarchy
  categoryMap.forEach(node => {
    if (node.parentId) {
      const parent = categoryMap.get(node.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not active/found, treat as root
        tree.push(node)
      }
    } else {
      tree.push(node)
    }
  })
  
  return tree
}

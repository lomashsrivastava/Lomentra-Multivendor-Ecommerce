import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { verifyAuth, requireRole } from '@/middleware/auth'
import Store from '@/database/models/Store'
import Product from '@/database/models/Product'
import Order from '@/database/models/Order'
import Review from '@/database/models/Review'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Verify vendor credentials
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['vendor', 'admin'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // 2. Fetch merchant store
    const store = await Store.findOne({ vendorId: decodedUser.userId })
    if (!store) {
      return NextResponse.json({ error: 'Store not found. Please onboard first.' }, { status: 400 })
    }

    const storeId = store._id

    // 3. Fetch products stats
    const products = await Product.find({ storeId })
    const lowStockCount = products.filter((p) => p.stock <= 5 && p.status === 'active').length

    // 4. Fetch orders data for this store
    const orders = await Order.find({ storeId, paymentStatus: 'paid' })

    let totalRevenue = 0
    let salesCount = 0
    const categorySalesMap: Record<string, number> = {}
    const monthlyRevenueMap: Record<string, { revenue: number; sales: number }> = {}

    // Initialize recent 6 months mapping
    const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonthIdx = new Date().getMonth()
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12
      last6Months.push(monthsList[idx])
      monthlyRevenueMap[monthsList[idx]] = { revenue: 0, sales: 0 }
    }

    // Aggregate orders
    for (const order of orders) {
      totalRevenue += order.subtotal
      salesCount += 1

      // Month name
      const orderDate = new Date(order.createdAt)
      const orderMonth = monthsList[orderDate.getMonth()]
      if (monthlyRevenueMap[orderMonth] !== undefined) {
        monthlyRevenueMap[orderMonth].revenue += order.subtotal
        monthlyRevenueMap[orderMonth].sales += 1
      }

      // Categories
      for (const item of order.items) {
        // Query category from product if missing on order items, or use item details
        const prod = products.find((p) => p._id.toString() === item.productId.toString())
        const cat = prod?.category || 'general'
        categorySalesMap[cat] = (categorySalesMap[cat] || 0) + item.quantity
      }
    }

    // Convert monthly map to list
    const revenueOverTime = last6Months.map((m) => ({
      month: m,
      revenue: parseFloat(monthlyRevenueMap[m].revenue.toFixed(2)),
      sales: monthlyRevenueMap[m].sales,
    }))

    // Convert category map to list
    const categorySales = Object.entries(categorySalesMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))

    // 5. Fetch reviews statistics
    const reviews = await Review.find({ storeId })
    const totalReviews = reviews.length
    const averageRating =
      totalReviews > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0

    const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((r) => r.rating === stars).length,
    }))

    return NextResponse.json(
      {
        metrics: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          salesCount,
          averageRating,
          lowStockCount,
          totalReviews,
        },
        charts: {
          revenueOverTime,
          categorySales: categorySales.length > 0 ? categorySales : [{ name: 'None', value: 0 }],
          ratingDistribution,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Vendor analytics error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred building analytics' },
      { status: 500 }
    )
  }
}

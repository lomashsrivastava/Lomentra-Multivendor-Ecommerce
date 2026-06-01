import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { getChildren } from '@/services/categoryService'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params

    const parentId = id === 'null' || id === 'root' ? null : id
    const children = await getChildren(parentId)

    return NextResponse.json({ categories: children }, { status: 200 })
  } catch (error) {
    console.error('Fetch child categories error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred fetching child categories' },
      { status: 500 }
    )
  }
}

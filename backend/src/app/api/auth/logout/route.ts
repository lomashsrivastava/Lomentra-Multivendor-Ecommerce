import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 })

    // Clear the token cookie
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Invalidate immediately
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during logout' },
      { status: 500 }
    )
  }
}

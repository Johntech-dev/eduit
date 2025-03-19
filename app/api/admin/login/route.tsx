// For App Router (app/api/admin/login/route.ts)
import { NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'



export async function POST(request: Request) {
  const { username, password } = await request.json()
  
  // Compare with environment variables
  if (
    username === process.env.NEXT_PUBLIC_ADMIN_USERNAME && 
    password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  ) {
    // Create a JWT token
    const token = sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET || 'fallback-secret-please-change-in-production',
      { expiresIn: '7d' }
    )
    
    return NextResponse.json({ 
      success: true,
      token
    })
  }
  
  return NextResponse.json(
    { message: "Invalid credentials" },
    { status: 401 }
  )
}
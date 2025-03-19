// For App Router (app/api/admin/login/route.ts)
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { username, password } = await request.json()
  
  // Compare with environment variables
  // Note: process.env.ADMIN_PASSWORD is not exposed to the client
  if (
    username === process.env.NEXT_PUBLIC_ADMIN_USERNAME && 
    password === process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ success: true })
  }
  
  return NextResponse.json(
    { message: "Invalid credentials" },
    { status: 401 }
  )
}
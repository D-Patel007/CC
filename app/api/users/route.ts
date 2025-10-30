import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/users  -> list users with their listing counts
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { listings: true },
      },
    },
  })

  return NextResponse.json({ data: users })
}

// POST /api/users  -> create or update a user profile
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, avatarUrl, supabaseId } = body ?? {}

    if (!email && !supabaseId) {
      return NextResponse.json(
        { error: 'Either email or supabaseId must be provided' },
        { status: 400 }
      )
    }

    const where = supabaseId
      ? { supabaseId: String(supabaseId) }
      : { email: String(email) }

    const user = await prisma.user.upsert({
      where,
      update: {
        name: typeof name === 'string' ? name : undefined,
        email: email ? String(email) : undefined,
        avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : undefined,
        supabaseId: supabaseId ? String(supabaseId) : undefined,
      },
      create: {
        name: typeof name === 'string' ? name : null,
        email: email ? String(email) : null,
        avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
        supabaseId: supabaseId ? String(supabaseId) : null,
      },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (err) {
    console.error('POST /api/users failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

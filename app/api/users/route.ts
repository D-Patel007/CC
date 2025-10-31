import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/users  -> list users (profiles) with their listing counts
export async function GET() {
  const users = await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { listings: true },
      },
    },
  })

  return NextResponse.json({ data: users })
}


// POST /api/users  -> create or update a profile { name, avatarUrl, supabaseId }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, avatarUrl, supabaseId } = body ?? {}

    if (!supabaseId || typeof supabaseId !== 'string') {
      return NextResponse.json(
        { error: 'supabaseId is required to create or update a profile' },
        { status: 400 }
      )
    }

    const user = await prisma.profile.upsert({
      where: { supabaseId },
      update: {
        name: typeof name === 'string' ? name : undefined,
        avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : undefined,
      },
      create: {
        supabaseId,
        name: typeof name === 'string' ? name : null,
        avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
      },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (err) {
    console.error('POST /api/users failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'

// GET /api/users  -> list users (profiles) with their listing counts
export async function GET() {
  const supabase = await sbServer()
  
  const { data: users, error } = await supabase
    .from('Profile')
    .select(`
      *,
      listings:Listing(id)
    `)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('GET /api/users failed:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  // Transform to include listing count
  const usersWithCount = users?.map(user => ({
    ...user,
    _count: {
      listings: user.listings?.length || 0
    }
  }))

  return NextResponse.json({ data: usersWithCount })
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

    const supabase = await sbServer()
    
    // Check if profile exists
    const { data: existing } = await supabase
      .from('Profile')
      .select('id')
      .eq('supabaseId', supabaseId)
      .single()

    let user
    if (existing) {
      // Update existing profile
      const updateData: any = {}
      if (typeof name === 'string') updateData.name = name
      if (typeof avatarUrl === 'string') updateData.avatarUrl = avatarUrl

      const { data, error } = await supabase
        .from('Profile')
        .update(updateData)
        .eq('supabaseId', supabaseId)
        .select()
        .single()

      if (error) throw error
      user = data
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('Profile')
        .insert({
          supabaseId,
          name: typeof name === 'string' ? name : null,
          avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
        })
        .select()
        .single()

      if (error) throw error
      user = data
    }

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (err) {
    console.error('POST /api/users failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

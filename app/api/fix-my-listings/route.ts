import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

/**
 * Emergency endpoint to fix listings with wrong seller IDs
 * This should only be used once to fix data inconsistencies
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Use service role to bypass RLS
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔧 Fixing listings for user:', {
      profileId: user.id,
      supabaseId: user.supabaseId
    });

    // Find all listings that might belong to this user but have wrong seller ID
    // Check for listings with seller ID that doesn't match current user's profile ID
    const { data: wrongListings } = await serviceRoleClient
      .from('Listing')
      .select('id, title, sellerId')
      .neq('sellerId', user.id);

    console.log('Found listings with other seller IDs:', wrongListings);

    // Get the user's supabaseId to check if any profiles match
    const { data: allProfiles } = await serviceRoleClient
      .from('Profile')
      .select('id, supabaseId, name')
      .eq('supabaseId', user.supabaseId);

    console.log('All profiles with this supabaseId:', allProfiles);

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({
        error: 'No profiles found',
        currentProfileId: user.id
      }, { status: 404 });
    }

    // Get all profile IDs associated with this user
    const profileIds = allProfiles.map(p => p.id);
    
    // Find listings that belong to any of these profile IDs
    const { data: userListings } = await serviceRoleClient
      .from('Listing')
      .select('id, title, sellerId')
      .in('sellerId', profileIds);

    console.log('Listings found for all profile IDs:', userListings);

    // Update all listings to use the current profile ID
    const { data: updated, error: updateError } = await serviceRoleClient
      .from('Listing')
      .update({ sellerId: user.id })
      .in('sellerId', profileIds)
      .neq('sellerId', user.id)
      .select();

    if (updateError) {
      console.error('Error updating listings:', updateError);
      return NextResponse.json({
        error: 'Failed to update listings',
        details: updateError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated?.length || 0} listings`,
      updated: updated,
      currentProfileId: user.id,
      allProfileIds: profileIds
    });
  } catch (error) {
    console.error('Error in fix-my-listings:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

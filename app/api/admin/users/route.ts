import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';
import { requireFullAdmin } from '@/lib/admin-middleware';

const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFullAdmin(req);
    if (authResult instanceof NextResponse) return authResult;
    const { admin } = authResult;

    const supabase = await sbServer();
    const url = new URL(req.url);

    const search = url.searchParams.get('search')?.trim();
    const role = url.searchParams.get('role')?.trim();
    const status = url.searchParams.get('status')?.trim();
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const limitParam = parseInt(url.searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(limitParam, 1), MAX_LIMIT);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('Profile')
      .select('id, name, verifiedEmail, role, isSuspended, isAdmin, createdAt, supabaseId', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(`name.ilike.%${escaped}%,verifiedEmail.ilike.%${escaped}%`);
    }

    if (role === 'admin' || role === 'user' || role === 'moderator') {
      query = query.eq('role', role);
    }

    if (status === 'suspended') {
      query = query.eq('isSuspended', true);
    } else if (status === 'active') {
      query = query.eq('isSuspended', false);
    }

    const { data: profiles, error, count } = await query;

    if (error) {
      console.error('Failed to fetch admin users:', error);
      return NextResponse.json(
        { error: 'Failed to load users' },
        { status: 500 }
      );
    }

    const userIds = profiles?.map((profile) => profile.id) || [];

    const listingsCountMap = new Map<number, number>();
    const buyerTransactionMap = new Map<number, number>();
    const sellerTransactionMap = new Map<number, number>();

    if (userIds.length > 0) {
      const { data: listingsData, error: listingsError } = await supabase
        .from('Listing')
        .select('sellerId')
        .in('sellerId', userIds);

      if (listingsError) {
        console.error('Failed to fetch listings count:', listingsError);
      } else {
        listingsData?.forEach((row) => {
          const sellerId = row.sellerId as number | null;
          if (!sellerId) return;
          listingsCountMap.set(sellerId, (listingsCountMap.get(sellerId) || 0) + 1);
        });
      }

      const { data: buyerTransactions, error: buyerError } = await supabase
        .from('Transaction')
        .select('buyerId')
        .in('buyerId', userIds);

      if (buyerError) {
        console.error('Failed to fetch buyer transactions count:', buyerError);
      } else {
        buyerTransactions?.forEach((row) => {
          const buyerId = row.buyerId as number | null;
          if (!buyerId) return;
          buyerTransactionMap.set(buyerId, (buyerTransactionMap.get(buyerId) || 0) + 1);
        });
      }

      const { data: sellerTransactions, error: sellerError } = await supabase
        .from('Transaction')
        .select('sellerId')
        .in('sellerId', userIds);

      if (sellerError) {
        console.error('Failed to fetch seller transactions count:', sellerError);
      } else {
        sellerTransactions?.forEach((row) => {
          const sellerId = row.sellerId as number | null;
          if (!sellerId) return;
          sellerTransactionMap.set(sellerId, (sellerTransactionMap.get(sellerId) || 0) + 1);
        });
      }
    }

    const users = (profiles || []).map((profile) => ({
      id: profile.id,
      name: profile.name,
      email: profile.verifiedEmail,
      role: profile.role,
      isSuspended: profile.isSuspended,
      isAdmin: profile.isAdmin,
      createdAt: profile.createdAt,
      listingsCount: listingsCountMap.get(profile.id) || 0,
      transactionsCount:
        (buyerTransactionMap.get(profile.id) || 0) +
        (sellerTransactionMap.get(profile.id) || 0),
    }));

    return NextResponse.json({
      data: users,
      pagination: {
        total: count ?? users.length,
        page,
        limit,
      },
      currentAdminId: admin.id,
    });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

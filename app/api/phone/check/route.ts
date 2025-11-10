import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-middleware';

// GET /api/phone/check - Check if phone verification is set up
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const supabase = await sbServer();

    // Try to fetch profile WITH phone verification fields
    const { data: profileWithPhone, error: withPhoneError } = await supabase
      .from('Profile')
      .select('id, phone, phoneVerified')
  .eq('supabaseId', user.supabaseId)
      .maybeSingle();

    if (withPhoneError) {
      return NextResponse.json({
        status: 'error',
        message: 'Phone verification columns NOT found',
        error: withPhoneError,
        action: 'Run supabase-phone-verification.sql in Supabase SQL Editor'
      });
    }

    // Try to fetch profile WITHOUT phone verification fields
    const { data: profileBasic, error: basicError } = await supabase
      .from('Profile')
      .select('id, name')
  .eq('supabaseId', user.supabaseId)
      .maybeSingle();

    return NextResponse.json({
      status: 'success',
      message: 'Phone verification is set up correctly!',
      profile: profileWithPhone,
      basicProfile: profileBasic,
      hasPhoneColumn: profileWithPhone !== null
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}

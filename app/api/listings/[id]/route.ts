import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/listings/[id]
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const listingId = Number(id);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { category: true, seller: true },
  });

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  return NextResponse.json(listing);
}

// PATCH /api/listings/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const listingId = Number(id);

  const contentType = req.headers.get('content-type') || '';
  let data: any = {};

  if (contentType.includes('application/json')) {
    data = await req.json();
  } else {
    const form = await req.formData();
    if (form.get('markSold')) {
      data.isSold = true;
    }
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data,
  });

  return NextResponse.json(updated);
}

// DELETE /api/listings/[id]
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const listingId = Number(id);

  await prisma.listing.delete({
    where: { id: listingId },
  });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const listing = await prisma.listing.findUnique({
    where: { id: Number(id) },
  });

  return NextResponse.json(listing);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  const updatedListing = await prisma.listing.update({
    where: { id: Number(id) },
    data: body,
  });

  return NextResponse.json(updatedListing);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const deletedListing = await prisma.listing.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json(deletedListing);
}

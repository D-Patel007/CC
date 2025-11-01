import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // Replace the logic below with your actual data fetching or handling
  return new Response(`Listing ID is ${id}`, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

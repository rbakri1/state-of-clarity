import { NextResponse } from "next/server";
import { getPopularBriefs } from "@/lib/services/brief-service";

export async function GET() {
  const briefs = await getPopularBriefs(10);

  return NextResponse.json(briefs, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

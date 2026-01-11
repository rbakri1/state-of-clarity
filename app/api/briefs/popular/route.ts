import { NextRequest, NextResponse } from "next/server";
import { getPopularBriefs } from "@/lib/services/brief-service";
import { popularBriefsQuerySchema } from "@/lib/validation/brief-schemas";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");

  const validationResult = popularBriefsQuerySchema.safeParse({
    limit: limitParam ?? undefined,
  });

  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error.errors[0].message },
      { status: 400 }
    );
  }

  const briefs = await getPopularBriefs(validationResult.data.limit);

  return NextResponse.json(briefs, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

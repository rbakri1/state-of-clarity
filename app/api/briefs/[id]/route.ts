import { NextRequest, NextResponse } from "next/server";
import { getBriefById } from "@/lib/services/brief-service";
import { briefIdSchema } from "@/lib/validation/brief-schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const validationResult = briefIdSchema.safeParse(id);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error.errors[0].message },
      { status: 400 }
    );
  }

  const brief = await getBriefById(validationResult.data);

  if (!brief) {
    return NextResponse.json({ error: "Brief not found" }, { status: 404 });
  }

  const etag = `"${brief.updated_at}"`;
  const ifNoneMatch = request.headers.get("if-none-match");

  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 });
  }

  return NextResponse.json(brief, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      ETag: etag,
    },
  });
}

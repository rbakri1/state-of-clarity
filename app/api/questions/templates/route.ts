import { createServerSupabaseClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("question_templates")
    .select("id, category, question_text")
    .order("display_order", { ascending: true });

  if (category) {
    query = query.ilike("category", category);
  } else {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

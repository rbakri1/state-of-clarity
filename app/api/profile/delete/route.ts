import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
  requireAuth,
} from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (body.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Please type DELETE to confirm account deletion" },
        { status: 400 }
      );
    }

    const adminClient = createServiceRoleClient();

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error("Failed to delete user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account. Please try again or contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your account has been permanently deleted.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

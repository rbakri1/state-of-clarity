import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload avatar" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: user.id, avatar_url: avatarUrl })
          .select()
          .single();

        if (insertError) {
          return NextResponse.json(
            { error: "Failed to create profile with avatar" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          profile: newProfile,
          avatar_url: avatarUrl,
        });
      }

      return NextResponse.json(
        { error: "Failed to update profile with avatar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: updatedProfile,
      avatar_url: avatarUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

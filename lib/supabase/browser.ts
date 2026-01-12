/**
 * Browser-only Supabase Client
 *
 * Use this in client components (with "use client" directive).
 * IMPORTANT: Uses cookies for session storage to ensure consistency between client and server.
 */

import { createBrowserClient as createClient } from "@supabase/ssr";

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Read cookie from document.cookie
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find(c => c.startsWith(`${name}=`));
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
        },
        set(name: string, value: string, options: any) {
          // Write cookie to document.cookie
          let cookie = `${name}=${encodeURIComponent(value)}`;
          if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
          if (options.path) cookie += `; path=${options.path}`;
          if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
          if (options.secure) cookie += '; secure';
          document.cookie = cookie;
        },
        remove(name: string, options: any) {
          // Remove cookie by setting expiry to past
          let cookie = `${name}=; max-age=0`;
          if (options.path) cookie += `; path=${options.path}`;
          document.cookie = cookie;
        },
      },
    }
  );
}

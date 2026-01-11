# Caching Architecture

State of Clarity uses a multi-layer caching strategy to ensure fast brief loading and reduce database load.

## Cache Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Cache                            │
│  SWR client-side caching with automatic revalidation             │
├─────────────────────────────────────────────────────────────────┤
│                         CDN / Edge Cache                         │
│  HTTP Cache-Control headers for Vercel Edge Network              │
├─────────────────────────────────────────────────────────────────┤
│                         Vercel KV (Redis)                        │
│  Server-side key-value cache with TTL                            │
├─────────────────────────────────────────────────────────────────┤
│                         Supabase (PostgreSQL)                    │
│  Primary data store                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Browser Cache (SWR)

**Location:** Client-side  
**Library:** `swr`  
**Config:** `/lib/swr/config.ts`

SWR provides stale-while-revalidate semantics for React components:

- Shows cached data immediately
- Revalidates in background
- Deduplicates requests within 2 seconds
- Retries failed requests 3 times

```typescript
import useSWR from "swr";

const { data, error, isLoading } = useSWR<Brief>(`/api/briefs/${id}`);
```

### 2. CDN / Edge Cache

**Location:** Vercel Edge Network  
**Config:** HTTP headers in API routes

API endpoints return `Cache-Control` headers that tell Vercel's CDN how long to cache responses:

| Resource | Cache-Control Header |
|----------|---------------------|
| Individual brief | `public, s-maxage=60, stale-while-revalidate=300` |
| Popular briefs | `public, s-maxage=300, stale-while-revalidate=600` |
| Static assets (/_next/static) | `public, immutable, max-age=31536000` |
| Images | `public, max-age=86400` |

### 3. Vercel KV (Server-side)

**Location:** Server/Edge Functions  
**Library:** `@vercel/kv`  
**Config:** `/lib/cache/kv-client.ts`

Redis-based caching for server-side operations:

- Falls back to in-memory cache for local development
- Automatic connection to Vercel KV when deployed
- Graceful degradation on connection errors

## TTL Values

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `brief:{id}` | 300s (5 min) | Individual brief data |
| `briefs:popular` | 600s (10 min) | Top 10 popular briefs by clarity score |

## Cache Key Naming Convention

Format: `{resource}:{identifier}` or `{resource}:{collection}`

Examples:
- `brief:abc123-def456` - Single brief by ID
- `briefs:popular` - Collection of popular briefs

## Core Utilities

### withCache

Wraps any async function with caching:

```typescript
import { withCache } from "@/lib/cache/with-cache";

const result = await withCache(
  "brief:123",           // cache key
  () => fetchFromDB(),   // function to cache
  300                    // TTL in seconds
);
```

### invalidateCache

Clears a specific cache key:

```typescript
import { invalidateCache } from "@/lib/cache/invalidate";

await invalidateCache("brief:123");
```

### invalidatePattern

Clears all keys matching a pattern:

```typescript
import { invalidatePattern } from "@/lib/cache/invalidate";

await invalidatePattern("brief:*"); // Clear all brief caches
```

## Adding Caching to a New Endpoint

### Step 1: Add Service Function with Cache

```typescript
// /lib/services/your-service.ts
import { withCache } from "@/lib/cache/with-cache";
import { createServiceRoleClient } from "@/lib/supabase/client";

const YOUR_RESOURCE_TTL = 300; // 5 minutes

export async function getYourResource(id: string) {
  return withCache(
    `your-resource:${id}`,
    async () => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("your_table")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    YOUR_RESOURCE_TTL
  );
}
```

### Step 2: Create API Route with HTTP Caching

```typescript
// /app/api/your-resource/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getYourResource } from "@/lib/services/your-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resource = await getYourResource(id);

  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const etag = `"${resource.updated_at}"`;
  const ifNoneMatch = request.headers.get("if-none-match");

  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 });
  }

  return NextResponse.json(resource, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "ETag": etag,
    },
  });
}
```

### Step 3: Add Cache Invalidation on Updates

```typescript
// In your update function
import { invalidateCache } from "@/lib/cache/invalidate";

export async function updateYourResource(id: string, data: UpdateData) {
  const result = await performUpdate(id, data);
  
  if (result) {
    await invalidateCache(`your-resource:${id}`);
    await invalidateCache("your-resources:collection"); // if applicable
  }
  
  return result;
}
```

### Step 4: Use SWR in Client Components

```typescript
"use client";
import useSWR from "swr";

function YourComponent({ id }: { id: string }) {
  const { data, error, isLoading } = useSWR(`/api/your-resource/${id}`);
  
  if (isLoading) return <Skeleton />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <ErrorMessage error={error} />;
  
  return <YourResourceView data={data} />;
}
```

## Cache Invalidation Strategy

### Automatic Invalidation

Caches are automatically invalidated when:
1. **Brief updated** → `brief:{id}` + `briefs:popular` cleared
2. **Brief classification changed** → `brief:{id}` + `briefs:popular` cleared
3. **New brief created** → `briefs:popular` cleared (new brief cached via warming)

### Cache Warming

When a new brief is created, the cache is immediately warmed:

```typescript
import { createBrief } from "@/lib/services/brief-service";

// This automatically warms the cache after insert
const brief = await createBrief(briefData);
```

### Manual Flush

Admins can manually flush cache via API:

```bash
# Flush all caches
curl -X POST /api/admin/cache-flush \
  -H "Authorization: Bearer $TOKEN"

# Flush specific pattern
curl -X POST /api/admin/cache-flush \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "brief:*"}'
```

## Error Handling

The caching system is designed to never break the application:

1. **Cache read errors** → Log and proceed with fresh fetch
2. **Cache write errors** → Log and continue (data still returned)
3. **KV connection errors** → Detected and skipped gracefully
4. **Health check** → `isHealthy()` available for monitoring

```typescript
import { isHealthy } from "@/lib/cache/kv-client";

if (await isHealthy()) {
  console.log("Cache is operational");
}
```

## Local Development

When `KV_REST_API_URL` and `KV_REST_API_TOKEN` are not set, the caching system automatically falls back to an in-memory implementation. This provides the same API but stores data in a local Map.

To use Vercel KV in development:
1. Create a KV store in Vercel dashboard
2. Add credentials to `.env.local`:
   ```
   KV_REST_API_URL=https://your-store.kv.vercel-storage.com
   KV_REST_API_TOKEN=your-token
   ```

## Monitoring

All cache operations are logged with prefixes:

- `[Cache] HIT: key` - Cache hit
- `[Cache] MISS: key` - Cache miss, fetching fresh data
- `[Cache] INVALIDATED: key` - Key was deleted
- `[Cache] Error reading/writing key` - Cache operation failed
- `[Cache Warming] Warming cache for key` - Pre-populating cache

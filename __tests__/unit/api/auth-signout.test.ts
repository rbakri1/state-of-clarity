/**
 * Auth Signout API Route Unit Tests
 *
 * Tests for the signout endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => ({ value: `mock-${name}` })),
    set: vi.fn(),
  })),
}));

// Mock Supabase SSR
const mockSignOut = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}));

import { POST } from '@/app/api/auth/signout/route';

describe('Auth Signout API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({});
  });

  describe('POST /api/auth/signout', () => {
    it('should sign out user and redirect to home', async () => {
      const request = new NextRequest('http://localhost/api/auth/signout', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(mockSignOut).toHaveBeenCalled();
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('http://localhost/');
    });

    it('should redirect to origin root', async () => {
      const request = new NextRequest('https://example.com/api/auth/signout', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.headers.get('location')).toBe('https://example.com/');
    });
  });
});

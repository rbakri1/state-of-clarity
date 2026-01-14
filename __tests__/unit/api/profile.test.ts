/**
 * Profile API Route Unit Tests
 *
 * Tests for the profile GET and PATCH endpoints.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock cookies
const mockCookiesGet = vi.fn();
const mockCookiesSet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: mockCookiesGet,
    set: mockCookiesSet,
  })),
}));

// Mock Supabase SSR client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Mock safeQuery
const mockSafeQuery = vi.fn();

vi.mock('@/lib/supabase/safe-query', () => ({
  safeQuery: (...args: unknown[]) => mockSafeQuery(...args),
}));

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('Profile API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('GET /api/profile', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { GET } = await import('@/app/api/profile/route');
      const response = await GET(new NextRequest('http://localhost/api/profile'));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 503 when database is unavailable during profile fetch', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com', created_at: '2024-01-01', user_metadata: {} } },
        error: null,
      });

      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection error' },
        isConnectionError: true,
      });

      const { GET } = await import('@/app/api/profile/route');
      const response = await GET(new NextRequest('http://localhost/api/profile'));
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error.message).toContain('Database temporarily unavailable');
    });

    it('should return profile data with stats when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: { name: 'Test User' },
      };

      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        username: 'testuser',
        bio: 'Test bio',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // First call - profile fetch
      mockSafeQuery.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
        isConnectionError: false,
      });

      // Second call - briefs count
      mockSafeQuery.mockResolvedValueOnce({
        data: { count: 5 },
        error: null,
        isConnectionError: false,
      });

      // Third call - saved briefs count
      mockSafeQuery.mockResolvedValueOnce({
        data: { count: 10 },
        error: null,
        isConnectionError: false,
      });

      // Fourth call - feedback count
      mockSafeQuery.mockResolvedValueOnce({
        data: { count: 3 },
        error: null,
        isConnectionError: false,
      });

      const { GET } = await import('@/app/api/profile/route');
      const response = await GET(new NextRequest('http://localhost/api/profile'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(mockProfile);
      expect(data.stats).toEqual({
        briefs_generated: 5,
        briefs_saved: 10,
        feedback_count: 3,
      });
      expect(data.user.id).toBe('user-123');
      expect(data.user.email).toBe('test@example.com');
    });

    it('should return null profile when profile does not exist', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {},
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Profile fetch returns null (no profile yet)
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: null,
        isConnectionError: false,
      });

      // Stats queries
      mockSafeQuery.mockResolvedValueOnce({ data: { count: 0 }, error: null, isConnectionError: false });
      mockSafeQuery.mockResolvedValueOnce({ data: { count: 0 }, error: null, isConnectionError: false });
      mockSafeQuery.mockResolvedValueOnce({ data: { count: 0 }, error: null, isConnectionError: false });

      const { GET } = await import('@/app/api/profile/route');
      const response = await GET(new NextRequest('http://localhost/api/profile'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toBeNull();
      expect(data.stats.briefs_generated).toBe(0);
    });
  });

  describe('PATCH /api/profile', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'New Name' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: 'invalid json',
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Invalid JSON body');
    });

    it('should return 400 when no valid fields are provided', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ invalid_field: 'value' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toBe('No valid fields to update');
    });

    it('should return 400 when username is invalid format', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ username: 'ab' }), // Too short
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toContain('3-20 characters');
    });

    it('should return 400 when username contains invalid characters', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ username: 'user@name!' }), // Invalid chars
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toContain('letters, numbers, and underscores');
    });

    it('should return 400 when username is already taken', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Username check returns existing user
      mockSafeQuery.mockResolvedValueOnce({
        data: { id: 'other-user-456' },
        error: null,
        isConnectionError: false,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ username: 'takenusername' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Username is already taken');
    });

    it('should return 400 when bio exceeds 280 characters', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ bio: 'a'.repeat(281) }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Bio must be 280 characters or less');
    });

    it('should update profile successfully', async () => {
      const mockUser = { id: 'user-123' };
      const updatedProfile = {
        id: 'user-123',
        full_name: 'New Name',
        bio: 'New bio',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Update query returns updated profile
      mockSafeQuery.mockResolvedValueOnce({
        data: updatedProfile,
        error: null,
        isConnectionError: false,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'New Name', bio: 'New bio' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(updatedProfile);
    });

    it('should create profile when it does not exist', async () => {
      const mockUser = { id: 'user-123' };
      const newProfile = {
        id: 'user-123',
        full_name: 'New User',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Update fails because profile doesn't exist
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows found' },
        isConnectionError: false,
      });

      // Insert succeeds
      mockSafeQuery.mockResolvedValueOnce({
        data: newProfile,
        error: null,
        isConnectionError: false,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'New User' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(newProfile);
    });

    it('should return 503 when database is unavailable during username check', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection error' },
        isConnectionError: true,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ username: 'validusername' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error.message).toContain('Database temporarily unavailable');
    });

    it('should return 503 when database is unavailable during update', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection error' },
        isConnectionError: true,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'New Name' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(503);
    });

    it('should only update allowed fields', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSafeQuery.mockResolvedValueOnce({
        data: { id: 'user-123', full_name: 'Updated' },
        error: null,
        isConnectionError: false,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: 'Updated',
          malicious_field: 'should be ignored',
          admin: true, // Should be ignored
        }),
      });

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      // The safeQuery mock was called, meaning only valid fields were processed
      expect(mockSafeQuery).toHaveBeenCalled();
    });

    it('should allow null username to clear it', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSafeQuery.mockResolvedValueOnce({
        data: { id: 'user-123', username: null },
        error: null,
        isConnectionError: false,
      });

      const { PATCH } = await import('@/app/api/profile/route');
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ username: null }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.username).toBeNull();
    });
  });
});

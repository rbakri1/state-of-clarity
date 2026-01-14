/**
 * Profile Avatar API Route Unit Tests
 *
 * Tests for the profile avatar POST endpoint.
 * Validates file type, file size, upload to Supabase storage,
 * and profile updates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock cookies
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

// Mock storage functions
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

// Mock database query chain functions
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    }),
  },
  from: vi.fn(),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

/**
 * Helper function to create a mock NextRequest with FormData containing a file
 */
function createMockRequest(file: File | null): NextRequest {
  const formData = new FormData();
  if (file) {
    formData.append('avatar', file);
  }
  return new NextRequest('http://localhost/api/profile/avatar', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Helper function to create a mock File object
 * For large file tests, we create actual content of the specified size
 */
function createMockFile(
  name: string,
  type: string,
  sizeInBytes?: number
): File {
  // Create content of the specified size or a small default
  const contentSize = sizeInBytes ?? 100;
  const content = new Uint8Array(contentSize);
  return new File([content], name, { type });
}

describe('Profile Avatar API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Reset query chain mocks
    mockSingle.mockReset();
    mockSelect.mockReset();
    mockEq.mockReset();
    mockUpdate.mockReset();
    mockInsert.mockReset();
  });

  describe('POST /api/profile/avatar', () => {
    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const file = createMockFile('avatar.jpg', 'image/jpeg');
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if no file provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const request = createMockRequest(null);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No file provided');
    });

    it('should return 400 for invalid file type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const file = createMockFile('avatar.pdf', 'application/pdf');
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid file type. Allowed: JPG, PNG, GIF, WebP');
    });

    it('should return 400 for file too large', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { POST } = await import('@/app/api/profile/avatar/route');
      // Create a file larger than 2MB (2 * 1024 * 1024 = 2097152 bytes)
      const file = createMockFile('avatar.jpg', 'image/jpeg', 3 * 1024 * 1024);
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File too large. Maximum size is 2MB');
    });

    it('should upload file to storage successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockProfile = { id: 'user-123', avatar_url: 'https://storage.example.com/avatars/user-123-12345.jpg' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/avatars/user-123-12345.jpg' },
      });

      // Set up query chain for update
      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const file = createMockFile('avatar.jpg', 'image/jpeg');
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(mockProfile);
      expect(data.avatar_url).toBe('https://storage.example.com/avatars/user-123-12345.jpg');

      // Verify storage.from was called with 'avatars'
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('avatars');

      // Verify upload was called with correct parameters
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^user-123-\d+\.jpg$/),
        expect.any(Buffer),
        {
          contentType: 'image/jpeg',
          upsert: true,
        }
      );
    });

    it('should return 500 on upload error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockUpload.mockResolvedValue({
        error: { message: 'Storage error' },
      });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const file = createMockFile('avatar.png', 'image/png');
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to upload avatar');
    });

    it('should update profile with avatar URL', async () => {
      const mockUser = { id: 'user-123' };
      const updatedProfile = {
        id: 'user-123',
        full_name: 'Test User',
        avatar_url: 'https://storage.example.com/avatars/user-123-12345.png',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/avatars/user-123-12345.png' },
      });

      // Set up query chain for successful update
      mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const file = createMockFile('avatar.png', 'image/png');
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(updatedProfile);
      expect(data.avatar_url).toBe('https://storage.example.com/avatars/user-123-12345.png');

      // Verify from was called with 'profiles'
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');

      // Verify update was called with avatar_url
      expect(mockUpdate).toHaveBeenCalledWith({
        avatar_url: 'https://storage.example.com/avatars/user-123-12345.png',
      });
    });

    it('should create new profile if none exists (PGRST116 error)', async () => {
      const mockUser = { id: 'user-123' };
      const newProfile = {
        id: 'user-123',
        avatar_url: 'https://storage.example.com/avatars/user-123-12345.webp',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/avatars/user-123-12345.webp' },
      });

      // First call - update fails with PGRST116 (no rows found)
      const mockUpdateSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });
      const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle });
      const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

      // Second call - insert succeeds
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: newProfile,
        error: null,
      });
      const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
      const mockInsertFn = vi.fn().mockReturnValue({ select: mockInsertSelect });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateFn })
        .mockReturnValueOnce({ insert: mockInsertFn });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const file = createMockFile('avatar.webp', 'image/webp');
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(newProfile);
      expect(data.avatar_url).toBe('https://storage.example.com/avatars/user-123-12345.webp');

      // Verify insert was called with correct data
      expect(mockInsertFn).toHaveBeenCalledWith({
        id: 'user-123',
        avatar_url: 'https://storage.example.com/avatars/user-123-12345.webp',
      });
    });

    it('should return 500 if profile update fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/avatars/user-123-12345.gif' },
      });

      // Update fails with a non-PGRST116 error
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'SOME_OTHER_ERROR', message: 'Database error' },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const file = createMockFile('avatar.gif', 'image/gif');
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update profile with avatar');
    });

    it('should return 500 if profile insert fails after PGRST116 error', async () => {
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/avatars/user-123-12345.jpg' },
      });

      // First call - update fails with PGRST116
      const mockUpdateSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });
      const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle });
      const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

      // Second call - insert also fails
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });
      const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
      const mockInsertFn = vi.fn().mockReturnValue({ select: mockInsertSelect });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateFn })
        .mockReturnValueOnce({ insert: mockInsertFn });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const file = createMockFile('avatar.jpg', 'image/jpeg');
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create profile with avatar');
    });

    it('should handle all valid image types', async () => {
      const validTypes = [
        { ext: 'jpg', mime: 'image/jpeg' },
        { ext: 'png', mime: 'image/png' },
        { ext: 'gif', mime: 'image/gif' },
        { ext: 'webp', mime: 'image/webp' },
      ];

      for (const { ext, mime } of validTypes) {
        vi.clearAllMocks();
        vi.resetModules();

        const mockUser = { id: 'user-123' };
        const mockProfile = { id: 'user-123', avatar_url: `https://storage.example.com/avatars/user-123-12345.${ext}` };

        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        mockUpload.mockResolvedValue({ error: null });
        mockGetPublicUrl.mockReturnValue({
          data: { publicUrl: `https://storage.example.com/avatars/user-123-12345.${ext}` },
        });

        const localMockSingle = vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        });
        const localMockSelect = vi.fn().mockReturnValue({ single: localMockSingle });
        const localMockEq = vi.fn().mockReturnValue({ select: localMockSelect });
        const localMockUpdate = vi.fn().mockReturnValue({ eq: localMockEq });
        mockSupabase.from.mockReturnValue({ update: localMockUpdate });

        const { POST } = await import('@/app/api/profile/avatar/route');
        const file = createMockFile(`avatar.${ext}`, mime);
        const request = createMockRequest(file);

        const response = await POST(request);

        expect(response.status).toBe(200);
      }
    });

    it('should reject files at exactly the size limit boundary', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { POST } = await import('@/app/api/profile/avatar/route');
      // Create a file exactly at 2MB + 1 byte
      const file = createMockFile('avatar.jpg', 'image/jpeg', 2 * 1024 * 1024 + 1);
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File too large. Maximum size is 2MB');
    });

    it('should accept files exactly at 2MB limit', async () => {
      const mockUser = { id: 'user-123' };
      const mockProfile = { id: 'user-123', avatar_url: 'https://storage.example.com/avatars/user-123-12345.jpg' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/avatars/user-123-12345.jpg' },
      });

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const { POST } = await import('@/app/api/profile/avatar/route');
      // File exactly at 2MB
      const file = createMockFile('avatar.jpg', 'image/jpeg', 2 * 1024 * 1024);
      const request = createMockRequest(file);

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should generate unique filename with user ID and timestamp', async () => {
      const mockUser = { id: 'user-abc-123' };
      const mockProfile = { id: 'user-abc-123', avatar_url: 'https://storage.example.com/avatars/test.png' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/avatars/test.png' },
      });

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const { POST } = await import('@/app/api/profile/avatar/route');
      const file = createMockFile('my-photo.PNG', 'image/png');
      const request = createMockRequest(file);

      await POST(request);

      // Verify the filename format includes user ID, timestamp, and lowercase extension
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^user-abc-123-\d+\.png$/),
        expect.any(Buffer),
        expect.any(Object)
      );
    });
  });
});

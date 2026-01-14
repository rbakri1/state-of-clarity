/**
 * BookmarkButton Component Tests
 *
 * Tests for the bookmark button component to ensure:
 * - Loading state is shown initially
 * - Authenticated users can save/unsave briefs
 * - Unauthenticated users see sign-in prompt
 * - Optimistic updates work correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BookmarkButton } from '@/app/components/BookmarkButton';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('BookmarkButton', () => {
  const defaultBriefId = 'test-brief-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: authenticated and not saved
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ saved: false, authenticated: true }),
    });
  });

  describe('Loading State', () => {
    it('should be disabled while loading', () => {
      render(<BookmarkButton briefId={defaultBriefId} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should enable button after loading', async () => {
      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Initial State', () => {
    it('should show unsaved state initially when not saved', async () => {
      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /save this brief/i });
        expect(button).toBeInTheDocument();
      });
    });

    it('should show saved state when already saved', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: true, authenticated: true }),
      });

      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /remove from saved/i });
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated User', () => {
    it('should show sign-in prompt when unauthenticated user clicks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: false, authenticated: false }),
      });

      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Sign in to save briefs')).toBeInTheDocument();
      });
    });

    it('should dismiss sign-in prompt when clicking Later', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: false, authenticated: false }),
      });

      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Sign in to save briefs')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Later'));

      await waitFor(() => {
        expect(screen.queryByText('Sign in to save briefs')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User', () => {
    it('should save brief when clicking unsaved button', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ saved: false, authenticated: true }),
        })
        .mockResolvedValueOnce({ ok: true });

      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button'));

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/briefs/${defaultBriefId}/save`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should unsave brief when clicking saved button', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ saved: true, authenticated: true }),
        })
        .mockResolvedValueOnce({ ok: true });

      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove from saved/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button'));

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/briefs/${defaultBriefId}/save`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should optimistically update UI when saving', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ saved: false, authenticated: true }),
        })
        .mockResolvedValueOnce({ ok: true });

      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save this brief/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button'));

      // Should immediately show saved state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove from saved/i })).toBeInTheDocument();
      });
    });

    it('should revert on save failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ saved: false, authenticated: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' }),
        });

      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save this brief/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button'));

      // Should revert to unsaved state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save this brief/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle initial fetch error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        // Should still render button even on error
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should show sign-in prompt on 401 error during save', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ saved: false, authenticated: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        });

      render(<BookmarkButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Sign in to save briefs')).toBeInTheDocument();
      });
    });
  });
});

/**
 * VoteButtons Component Tests
 *
 * Tests for the vote buttons component to ensure:
 * - Renders loading state
 * - Shows sign in prompt for unauthenticated users
 * - Handles upvote and downvote actions
 * - Optimistically updates UI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoteButtons from '@/app/components/VoteButtons';

// Mock Supabase browser client
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/browser', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('VoteButtons', () => {
  const defaultBriefId = 'test-brief-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ upvotes: 5, downvotes: 2, userVote: null }),
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      render(<VoteButtons briefId={defaultBriefId} />);

      // Check for loading skeleton (animate-pulse divs)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Unauthenticated State', () => {
    it('should show sign in prompt for unauthenticated users', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByText('Sign in to vote')).toBeInTheDocument();
      });
    });

    it('should display vote counts without buttons for unauthenticated users', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      // Should not have interactive vote buttons
      expect(screen.queryByRole('button', { name: /upvote/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /downvote/i })).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    it('should render vote buttons for authenticated users', async () => {
      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upvote/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /downvote/i })).toBeInTheDocument();
      });
    });

    it('should display vote counts', async () => {
      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should fetch initial vote state', async () => {
      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/briefs/${defaultBriefId}/vote`);
      });
    });
  });

  describe('Voting Actions', () => {
    it('should handle upvote click', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upvotes: 5, downvotes: 2, userVote: null }),
        })
        .mockResolvedValueOnce({ ok: true });

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upvote/i })).toBeInTheDocument();
      });

      const upvoteButton = screen.getByRole('button', { name: /upvote/i });
      await userEvent.click(upvoteButton);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/briefs/${defaultBriefId}/vote`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ vote_type: 'up' }),
        })
      );
    });

    it('should handle downvote click', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upvotes: 5, downvotes: 2, userVote: null }),
        })
        .mockResolvedValueOnce({ ok: true });

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /downvote/i })).toBeInTheDocument();
      });

      const downvoteButton = screen.getByRole('button', { name: /downvote/i });
      await userEvent.click(downvoteButton);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/briefs/${defaultBriefId}/vote`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ vote_type: 'down' }),
        })
      );
    });

    it('should handle removing vote by clicking same button', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upvotes: 5, downvotes: 2, userVote: 'up' }),
        })
        .mockResolvedValueOnce({ ok: true });

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upvote/i })).toBeInTheDocument();
      });

      const upvoteButton = screen.getByRole('button', { name: /upvote/i });
      await userEvent.click(upvoteButton);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/briefs/${defaultBriefId}/vote`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should optimistically update vote count', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upvotes: 5, downvotes: 2, userVote: null }),
        })
        .mockResolvedValueOnce({ ok: true });

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      const upvoteButton = screen.getByRole('button', { name: /upvote/i });
      await userEvent.click(upvoteButton);

      // Should optimistically update to 6
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });

    it('should revert on failed vote request', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upvotes: 5, downvotes: 2, userVote: null }),
        })
        .mockResolvedValueOnce({ ok: false });

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      const upvoteButton = screen.getByRole('button', { name: /upvote/i });
      await userEvent.click(upvoteButton);

      // Should revert back to 5 after failed request
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Vote State Visual Indicators', () => {
    it('should highlight upvote button when user has upvoted', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ upvotes: 5, downvotes: 2, userVote: 'up' }),
      });

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        const upvoteButton = screen.getByRole('button', { name: /upvote/i });
        expect(upvoteButton).toHaveClass('border-green-500');
      });
    });

    it('should highlight downvote button when user has downvoted', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ upvotes: 5, downvotes: 2, userVote: 'down' }),
      });

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        const downvoteButton = screen.getByRole('button', { name: /downvote/i });
        expect(downvoteButton).toHaveClass('border-red-500');
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable buttons while submitting', async () => {
      // Create a promise that we can control
      let resolveVote: () => void;
      const votePromise = new Promise<void>((resolve) => {
        resolveVote = resolve;
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upvotes: 5, downvotes: 2, userVote: null }),
        })
        .mockImplementationOnce(() => votePromise.then(() => ({ ok: true })));

      render(<VoteButtons briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upvote/i })).toBeInTheDocument();
      });

      const upvoteButton = screen.getByRole('button', { name: /upvote/i });
      await userEvent.click(upvoteButton);

      // Button should be disabled while submitting
      expect(upvoteButton).toBeDisabled();

      // Resolve the vote
      resolveVote!();
    });
  });
});

/**
 * FeedbackForm Component Tests
 *
 * Tests for the feedback form component to ensure:
 * - Loading skeleton is shown when isLoading
 * - All feedback buttons render correctly
 * - Upvote/downvote submissions work
 * - Content forms open for suggest source and spot error
 * - Content form submission works
 * - Success messages display after submission
 * - Auth modal opens for unauthenticated users
 * - Anonymous mode badge displays when isAnonymous
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackForm } from '@/app/components/FeedbackForm';

// Mock functions
const mockOpenModal = vi.fn();
let mockUserDisplay = {
  userId: 'user-123',
  displayName: 'Test User',
  isAnonymous: false,
  isAuthenticated: true,
  isLoading: false,
  user: { id: 'user-123', email: 'test@example.com' },
};

const mockInsert = vi.fn();

vi.mock('@/app/components/auth/AuthModal', () => ({
  useAuthModal: () => ({ openModal: mockOpenModal }),
}));

vi.mock('@/lib/user/useUserDisplay', () => ({
  useUserDisplay: () => mockUserDisplay,
}));

vi.mock('@/lib/supabase/browser', () => ({
  createBrowserClient: () => ({
    from: vi.fn().mockReturnValue({
      insert: mockInsert,
    }),
  }),
}));

describe('FeedbackForm', () => {
  const defaultBriefId = 'test-brief-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockInsert.mockResolvedValue({ error: null });
    mockUserDisplay = {
      userId: 'user-123',
      displayName: 'Test User',
      isAnonymous: false,
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-123', email: 'test@example.com' },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Loading State', () => {
    it('should render loading skeleton when isLoading is true', () => {
      mockUserDisplay = {
        ...mockUserDisplay,
        isLoading: true,
      };

      render(<FeedbackForm briefId={defaultBriefId} />);

      // Check for loading skeleton (animate-pulse divs)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Should not show feedback buttons
      expect(screen.queryByText('Helpful')).not.toBeInTheDocument();
    });
  });

  describe('Feedback Buttons', () => {
    it('should show all feedback buttons', () => {
      render(<FeedbackForm briefId={defaultBriefId} />);

      expect(screen.getByText('Helpful')).toBeInTheDocument();
      expect(screen.getByText('Not Helpful')).toBeInTheDocument();
      expect(screen.getByText('Suggest Source')).toBeInTheDocument();
      expect(screen.getByText('Spot Error')).toBeInTheDocument();
    });

    it('should show posting as indicator for authenticated users', () => {
      render(<FeedbackForm briefId={defaultBriefId} />);

      expect(screen.getByText(/Posting as:/)).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('Upvote Feedback', () => {
    it('should submit upvote feedback when Helpful button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const helpfulButton = screen.getByText('Helpful').closest('button')!;
      await user.click(helpfulButton);

      expect(mockInsert).toHaveBeenCalledWith({
        brief_id: defaultBriefId,
        user_id: 'user-123',
        type: 'upvote',
        content: null,
      });
    });

    it('should show success message after upvote', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const helpfulButton = screen.getByText('Helpful').closest('button')!;
      await user.click(helpfulButton);

      await waitFor(() => {
        expect(screen.getByText('Thanks for the feedback!')).toBeInTheDocument();
      });
    });

    it('should disable vote buttons after upvote', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const helpfulButton = screen.getByText('Helpful').closest('button')!;
      await user.click(helpfulButton);

      await waitFor(() => {
        expect(helpfulButton).toBeDisabled();
        expect(screen.getByText('Not Helpful').closest('button')).toBeDisabled();
      });
    });
  });

  describe('Downvote Feedback', () => {
    it('should submit downvote feedback when Not Helpful button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const notHelpfulButton = screen.getByText('Not Helpful').closest('button')!;
      await user.click(notHelpfulButton);

      expect(mockInsert).toHaveBeenCalledWith({
        brief_id: defaultBriefId,
        user_id: 'user-123',
        type: 'downvote',
        content: null,
      });
    });

    it('should show success message after downvote', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const notHelpfulButton = screen.getByText('Not Helpful').closest('button')!;
      await user.click(notHelpfulButton);

      await waitFor(() => {
        expect(screen.getByText('Thanks for letting us know')).toBeInTheDocument();
      });
    });
  });

  describe('Suggest Source Form', () => {
    it('should open content form when Suggest Source is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const suggestSourceButton = screen.getByText('Suggest Source').closest('button')!;
      await user.click(suggestSourceButton);

      expect(screen.getByText('Suggest a source URL or describe the source:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/https:\/\/example.com\/source/)).toBeInTheDocument();
    });

    it('should show Submit and Cancel buttons in content form', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const suggestSourceButton = screen.getByText('Suggest Source').closest('button')!;
      await user.click(suggestSourceButton);

      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should close content form when Cancel is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const suggestSourceButton = screen.getByText('Suggest Source').closest('button')!;
      await user.click(suggestSourceButton);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(screen.queryByText('Suggest a source URL or describe the source:')).not.toBeInTheDocument();
    });
  });

  describe('Spot Error Form', () => {
    it('should open content form when Spot Error is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const spotErrorButton = screen.getByText('Spot Error').closest('button')!;
      await user.click(spotErrorButton);

      expect(screen.getByText('Describe the error you found:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Describe what's incorrect/)).toBeInTheDocument();
    });
  });

  describe('Content Form Submission', () => {
    it('should submit content form successfully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      // Open the form
      const suggestSourceButton = screen.getByText('Suggest Source').closest('button')!;
      await user.click(suggestSourceButton);

      // Fill in the content
      const textarea = screen.getByPlaceholderText(/https:\/\/example.com\/source/);
      await user.type(textarea, 'https://example.com/new-source');

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);

      expect(mockInsert).toHaveBeenCalledWith({
        brief_id: defaultBriefId,
        user_id: 'user-123',
        type: 'suggest_source',
        content: 'https://example.com/new-source',
      });
    });

    it('should show success message after content submission', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      // Open the form
      const spotErrorButton = screen.getByText('Spot Error').closest('button')!;
      await user.click(spotErrorButton);

      // Fill in the content
      const textarea = screen.getByPlaceholderText(/Describe what's incorrect/);
      await user.type(textarea, 'There is a typo in the summary');

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Feedback submitted successfully')).toBeInTheDocument();
      });
    });

    it('should close content form after successful submission', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      // Open the form
      const suggestSourceButton = screen.getByText('Suggest Source').closest('button')!;
      await user.click(suggestSourceButton);

      // Fill in the content
      const textarea = screen.getByPlaceholderText(/https:\/\/example.com\/source/);
      await user.type(textarea, 'https://example.com/source');

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Suggest a source URL or describe the source:')).not.toBeInTheDocument();
      });
    });

    it('should disable submit button when content is empty', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const suggestSourceButton = screen.getByText('Suggest Source').closest('button')!;
      await user.click(suggestSourceButton);

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success Message', () => {
    it('should clear success message after 3 seconds', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const helpfulButton = screen.getByText('Helpful').closest('button')!;
      await user.click(helpfulButton);

      await waitFor(() => {
        expect(screen.getByText('Thanks for the feedback!')).toBeInTheDocument();
      });

      // Fast-forward 3 seconds
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByText('Thanks for the feedback!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated Users', () => {
    beforeEach(() => {
      mockUserDisplay = {
        ...mockUserDisplay,
        userId: null,
        isAuthenticated: false,
        user: null,
      };
    });

    it('should open auth modal when clicking upvote as unauthenticated user', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const helpfulButton = screen.getByText('Helpful').closest('button')!;
      await user.click(helpfulButton);

      expect(mockOpenModal).toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should open auth modal when clicking downvote as unauthenticated user', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const notHelpfulButton = screen.getByText('Not Helpful').closest('button')!;
      await user.click(notHelpfulButton);

      expect(mockOpenModal).toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should open auth modal when clicking Suggest Source as unauthenticated user', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const suggestSourceButton = screen.getByText('Suggest Source').closest('button')!;
      await user.click(suggestSourceButton);

      expect(mockOpenModal).toHaveBeenCalled();
      // Should not open content form
      expect(screen.queryByText('Suggest a source URL or describe the source:')).not.toBeInTheDocument();
    });

    it('should open auth modal when clicking Spot Error as unauthenticated user', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const spotErrorButton = screen.getByText('Spot Error').closest('button')!;
      await user.click(spotErrorButton);

      expect(mockOpenModal).toHaveBeenCalled();
      // Should not open content form
      expect(screen.queryByText('Describe the error you found:')).not.toBeInTheDocument();
    });

    it('should show sign in prompt for unauthenticated users', () => {
      render(<FeedbackForm briefId={defaultBriefId} />);

      expect(screen.getByText('Sign in')).toBeInTheDocument();
      expect(screen.getByText(/to submit feedback and help improve this brief/)).toBeInTheDocument();
    });

    it('should open auth modal when clicking sign in link', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const signInLink = screen.getByText('Sign in');
      await user.click(signInLink);

      expect(mockOpenModal).toHaveBeenCalled();
    });

    it('should not show posting as indicator for unauthenticated users', () => {
      render(<FeedbackForm briefId={defaultBriefId} />);

      expect(screen.queryByText(/Posting as:/)).not.toBeInTheDocument();
    });
  });

  describe('Anonymous Mode', () => {
    it('should show anonymous mode badge when isAnonymous is true', () => {
      mockUserDisplay = {
        ...mockUserDisplay,
        isAnonymous: true,
        displayName: 'Anonymous User',
      };

      render(<FeedbackForm briefId={defaultBriefId} />);

      expect(screen.getByText('Anonymous mode')).toBeInTheDocument();
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
    });

    it('should not show anonymous mode badge when isAnonymous is false', () => {
      mockUserDisplay = {
        ...mockUserDisplay,
        isAnonymous: false,
      };

      render(<FeedbackForm briefId={defaultBriefId} />);

      expect(screen.queryByText('Anonymous mode')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when submission fails', async () => {
      mockInsert.mockResolvedValue({ error: { message: 'Database error' } });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      const helpfulButton = screen.getByText('Helpful').closest('button')!;
      await user.click(helpfulButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to submit feedback. Please try again.')).toBeInTheDocument();
      });
    });

    it('should clear error when opening content form', async () => {
      mockInsert.mockResolvedValueOnce({ error: { message: 'Database error' } });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<FeedbackForm briefId={defaultBriefId} />);

      // Trigger an error
      const helpfulButton = screen.getByText('Helpful').closest('button')!;
      await user.click(helpfulButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to submit feedback. Please try again.')).toBeInTheDocument();
      });

      // Reset mock for next call
      mockInsert.mockResolvedValue({ error: null });

      // Open content form - should clear error
      const suggestSourceButton = screen.getByText('Suggest Source').closest('button')!;
      await user.click(suggestSourceButton);

      expect(screen.queryByText('Failed to submit feedback. Please try again.')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render section with correct heading', () => {
      render(<FeedbackForm briefId={defaultBriefId} />);

      expect(screen.getByRole('heading', { name: 'Help Improve This Brief' })).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<FeedbackForm briefId={defaultBriefId} />);

      expect(screen.getByText(/Found an issue or have a suggestion/)).toBeInTheDocument();
    });
  });
});

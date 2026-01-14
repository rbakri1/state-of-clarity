/**
 * SaveBriefButton Component Tests
 *
 * Tests for the save brief button component to ensure:
 * - Renders correct icon based on save state
 * - Shows loading state
 * - Handles save/unsave actions
 * - Opens auth modal for unauthenticated users
 * - Shows label when specified
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveBriefButton } from '@/app/components/SaveBriefButton';

// Mock Supabase browser client
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/browser', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  }),
}));

// Mock useAuthModal
const mockOpenModal = vi.fn();

vi.mock('@/app/components/auth/AuthModal', () => ({
  useAuthModal: () => ({
    openModal: mockOpenModal,
    closeModal: vi.fn(),
    isOpen: false,
  }),
}));

// Helper to create chainable mock
function createChainableMock(savedData: object | null = null) {
  const chainable: Record<string, any> = {};
  chainable.select = vi.fn().mockReturnValue(chainable);
  chainable.eq = vi.fn().mockReturnValue(chainable);
  chainable.single = vi.fn().mockResolvedValue({ data: savedData, error: null });
  chainable.delete = vi.fn().mockReturnValue(chainable);
  chainable.insert = vi.fn().mockResolvedValue({ data: {}, error: null });
  return chainable;
}

describe('SaveBriefButton', () => {
  const defaultBriefId = 'test-brief-123';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user with unsaved brief
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    mockFrom.mockReturnValue(createChainableMock(null));
  });

  describe('Rendering', () => {
    it('should render button', async () => {
      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should show loading spinner initially', () => {
      render(<SaveBriefButton briefId={defaultBriefId} />);

      // Should show loading spinner while checking save status
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show bookmark icon when not saved', async () => {
      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        const bookmarkIcon = document.querySelector('.lucide-bookmark');
        expect(bookmarkIcon).toBeInTheDocument();
      });
    });

    it('should show bookmark-check icon when saved', async () => {
      mockFrom.mockReturnValue(createChainableMock({ brief_id: defaultBriefId }));

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        const bookmarkCheckIcon = document.querySelector('.lucide-bookmark-check');
        expect(bookmarkCheckIcon).toBeInTheDocument();
      });
    });

    it('should have correct title when not saved', async () => {
      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByTitle('Save brief')).toBeInTheDocument();
      });
    });

    it('should have correct title when saved', async () => {
      mockFrom.mockReturnValue(createChainableMock({ brief_id: defaultBriefId }));

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByTitle('Remove from saved')).toBeInTheDocument();
      });
    });

    it('should apply custom className', async () => {
      render(<SaveBriefButton briefId={defaultBriefId} className="custom-class" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
      });
    });
  });

  describe('Label Display', () => {
    it('should not show label by default', async () => {
      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
        expect(screen.queryByText('Saved')).not.toBeInTheDocument();
      });
    });

    it('should show "Save" label when showLabel is true and not saved', async () => {
      render(<SaveBriefButton briefId={defaultBriefId} showLabel />);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('should show "Saved" label when showLabel is true and saved', async () => {
      mockFrom.mockReturnValue(createChainableMock({ brief_id: defaultBriefId }));

      render(<SaveBriefButton briefId={defaultBriefId} showLabel />);

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it('should open auth modal when clicked by unauthenticated user', async () => {
      const user = userEvent.setup();
      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button'));

      expect(mockOpenModal).toHaveBeenCalled();
    });

    it('should not attempt to save when unauthenticated', async () => {
      const user = userEvent.setup();
      const chainable = createChainableMock(null);
      mockFrom.mockReturnValue(chainable);

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button'));

      // Insert should not be called
      expect(chainable.insert).not.toHaveBeenCalled();
    });
  });

  describe('Save/Unsave Actions', () => {
    it('should call insert when clicking save on unsaved brief', async () => {
      const user = userEvent.setup();
      const chainable = createChainableMock(null);
      mockFrom.mockReturnValue(chainable);

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByTitle('Save brief')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(chainable.insert).toHaveBeenCalledWith({
          user_id: 'user-123',
          brief_id: defaultBriefId,
        });
      });
    });

    it('should call delete when clicking unsave on saved brief', async () => {
      const user = userEvent.setup();
      const chainable = createChainableMock({ brief_id: defaultBriefId });
      mockFrom.mockReturnValue(chainable);

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByTitle('Remove from saved')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(chainable.delete).toHaveBeenCalled();
      });
    });

    it('should have correct insert parameters', async () => {
      const user = userEvent.setup();
      const chainable = createChainableMock(null);
      mockFrom.mockReturnValue(chainable);

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByTitle('Save brief')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(chainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'user-123',
            brief_id: defaultBriefId,
          })
        );
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should subscribe to auth state changes on mount', () => {
      render(<SaveBriefButton briefId={defaultBriefId} />);

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should unsubscribe from auth state changes on unmount', () => {
      const mockUnsubscribe = vi.fn();
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const { unmount } = render(<SaveBriefButton briefId={defaultBriefId} />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should update save state when user signs in', async () => {
      // Start as unauthenticated
      mockGetUser.mockResolvedValue({ data: { user: null } });

      let authCallback: ((event: string, session: { user?: { id: string } } | null) => void) | null = null;
      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockFrom.mockReturnValue(createChainableMock({ brief_id: defaultBriefId }));

      render(<SaveBriefButton briefId={defaultBriefId} />);

      // Simulate user signing in
      await act(async () => {
        if (authCallback) {
          authCallback('SIGNED_IN', { user: { id: 'user-123' } });
        }
      });

      // Should check save status and update
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('saved_briefs');
      });
    });
  });

  describe('Visual States', () => {
    it('should have primary color class when saved', async () => {
      mockFrom.mockReturnValue(createChainableMock({ brief_id: defaultBriefId }));

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('text-primary');
      });
    });

    it('should not have primary color class when not saved', async () => {
      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).not.toHaveClass('text-primary');
      });
    });

    it('should have fill-current class on icon when saved', async () => {
      mockFrom.mockReturnValue(createChainableMock({ brief_id: defaultBriefId }));

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        const icon = document.querySelector('.lucide-bookmark-check');
        expect(icon).toHaveClass('fill-current');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle save error gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chainable = createChainableMock(null);
      chainable.insert = vi.fn().mockRejectedValue(new Error('Save failed'));
      mockFrom.mockReturnValue(chainable);

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByTitle('Save brief')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error toggling save:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should re-enable button after error', async () => {
      const user = userEvent.setup();
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const chainable = createChainableMock(null);
      chainable.insert = vi.fn().mockRejectedValue(new Error('Save failed'));
      mockFrom.mockReturnValue(chainable);

      render(<SaveBriefButton briefId={defaultBriefId} />);

      await waitFor(() => {
        expect(screen.getByTitle('Save brief')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });
  });
});

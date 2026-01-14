/**
 * SocialLoginButtons Component Tests
 *
 * Tests for the SocialLoginButtons component:
 * - Component renders all social provider buttons
 * - Button click triggers OAuth sign in
 * - Loading state displayed during authentication
 * - Error handling
 * - Disabled state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialLoginButtons } from '@/app/components/auth/SocialLoginButtons';

// Mock the auth providers
vi.mock('@/lib/auth/providers', () => ({
  SOCIAL_PROVIDERS: {
    google: { name: 'Google', bgColor: '#ffffff', textColor: '#1f2937' },
    apple: { name: 'Apple', bgColor: '#000000', textColor: '#ffffff' },
    twitter: { name: 'X', bgColor: '#000000', textColor: '#ffffff' },
  },
  signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
}));

describe('SocialLoginButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all social provider buttons', () => {
      render(<SocialLoginButtons />);

      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with x/i })).toBeInTheDocument();
    });

    it('should render Google button with correct styling', () => {
      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      expect(googleButton).toHaveStyle({ backgroundColor: '#ffffff', color: '#1f2937' });
    });

    it('should render Apple button with correct styling', () => {
      render(<SocialLoginButtons />);

      const appleButton = screen.getByRole('button', { name: /continue with apple/i });
      expect(appleButton).toHaveStyle({ backgroundColor: '#000000', color: '#ffffff' });
    });

    it('should render X (Twitter) button with correct styling', () => {
      render(<SocialLoginButtons />);

      const twitterButton = screen.getByRole('button', { name: /continue with x/i });
      expect(twitterButton).toHaveStyle({ backgroundColor: '#000000', color: '#ffffff' });
    });

    it('should render SVG icons for each provider', () => {
      render(<SocialLoginButtons />);

      // Each button should contain an SVG icon
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      buttons.forEach((button) => {
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('click handling', () => {
    it('should call signInWithOAuth with google when Google button is clicked', async () => {
      const user = userEvent.setup();
      const { signInWithOAuth } = await import('@/lib/auth/providers');

      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      expect(signInWithOAuth).toHaveBeenCalledWith('google');
    });

    it('should call signInWithOAuth with apple when Apple button is clicked', async () => {
      const user = userEvent.setup();
      const { signInWithOAuth } = await import('@/lib/auth/providers');

      render(<SocialLoginButtons />);

      const appleButton = screen.getByRole('button', { name: /continue with apple/i });
      await user.click(appleButton);

      expect(signInWithOAuth).toHaveBeenCalledWith('apple');
    });

    it('should call signInWithOAuth with twitter when X button is clicked', async () => {
      const user = userEvent.setup();
      const { signInWithOAuth } = await import('@/lib/auth/providers');

      render(<SocialLoginButtons />);

      const twitterButton = screen.getByRole('button', { name: /continue with x/i });
      await user.click(twitterButton);

      expect(signInWithOAuth).toHaveBeenCalledWith('twitter');
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when provider is authenticating', async () => {
      const user = userEvent.setup();
      const { signInWithOAuth } = await import('@/lib/auth/providers');
      vi.mocked(signInWithOAuth).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      // Should show loading spinner (svg with animate-spin class)
      await waitFor(() => {
        const loadingSpinner = googleButton.querySelector('.animate-spin');
        expect(loadingSpinner).toBeInTheDocument();
      });
    });

    it('should disable all buttons while one provider is loading', async () => {
      const user = userEvent.setup();
      const { signInWithOAuth } = await import('@/lib/auth/providers');
      vi.mocked(signInWithOAuth).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      // All buttons should be disabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /continue with apple/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /continue with x/i })).toBeDisabled();
      });
    });

    it('should re-enable buttons after authentication completes', async () => {
      const user = userEvent.setup();
      const { signInWithOAuth } = await import('@/lib/auth/providers');
      vi.mocked(signInWithOAuth).mockResolvedValue({ error: null });

      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue with google/i })).not.toBeDisabled();
        expect(screen.getByRole('button', { name: /continue with apple/i })).not.toBeDisabled();
        expect(screen.getByRole('button', { name: /continue with x/i })).not.toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('should call onError when authentication fails with error message', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      const { signInWithOAuth } = await import('@/lib/auth/providers');
      vi.mocked(signInWithOAuth).mockResolvedValue({
        error: { message: 'OAuth error occurred' },
      });

      render(<SocialLoginButtons onError={onError} />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('OAuth error occurred');
      });
    });

    it('should call onError with generic message when exception is thrown', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      const { signInWithOAuth } = await import('@/lib/auth/providers');
      vi.mocked(signInWithOAuth).mockRejectedValue(new Error('Network error'));

      render(<SocialLoginButtons onError={onError} />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Something went wrong. Please try again.');
      });
    });

    it('should not throw when onError is not provided', async () => {
      const user = userEvent.setup();
      const { signInWithOAuth } = await import('@/lib/auth/providers');
      vi.mocked(signInWithOAuth).mockResolvedValue({
        error: { message: 'OAuth error occurred' },
      });

      // Should not throw
      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      // Just verify it completes without throwing
      await waitFor(() => {
        expect(signInWithOAuth).toHaveBeenCalled();
      });
    });
  });

  describe('disabled state', () => {
    it('should disable all buttons when disabled prop is true', () => {
      render(<SocialLoginButtons disabled={true} />);

      expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /continue with apple/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /continue with x/i })).toBeDisabled();
    });

    it('should enable all buttons when disabled prop is false', () => {
      render(<SocialLoginButtons disabled={false} />);

      expect(screen.getByRole('button', { name: /continue with google/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /continue with apple/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /continue with x/i })).not.toBeDisabled();
    });

    it('should not trigger OAuth when disabled', async () => {
      const user = userEvent.setup();
      const { signInWithOAuth } = await import('@/lib/auth/providers');

      render(<SocialLoginButtons disabled={true} />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });

      // Attempt to click (should not work due to disabled state)
      await user.click(googleButton);

      expect(signInWithOAuth).not.toHaveBeenCalled();
    });
  });

  describe('button text', () => {
    it('should display "Continue with Google" for Google button', () => {
      render(<SocialLoginButtons />);
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    });

    it('should display "Continue with Apple" for Apple button', () => {
      render(<SocialLoginButtons />);
      expect(screen.getByText(/continue with apple/i)).toBeInTheDocument();
    });

    it('should display "Continue with X" for Twitter/X button', () => {
      render(<SocialLoginButtons />);
      expect(screen.getByText(/continue with x/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible button names', () => {
      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      const appleButton = screen.getByRole('button', { name: /continue with apple/i });
      const twitterButton = screen.getByRole('button', { name: /continue with x/i });

      expect(googleButton).toBeInTheDocument();
      expect(appleButton).toBeInTheDocument();
      expect(twitterButton).toBeInTheDocument();
    });

    it('should be focusable when not disabled', () => {
      render(<SocialLoginButtons />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('multiple clicks', () => {
    it('should prevent multiple simultaneous OAuth calls', async () => {
      const user = userEvent.setup();
      const { signInWithOAuth } = await import('@/lib/auth/providers');
      vi.mocked(signInWithOAuth).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      const appleButton = screen.getByRole('button', { name: /continue with apple/i });

      // Click Google first
      await user.click(googleButton);

      // Try to click Apple while Google is loading
      await user.click(appleButton);

      // Only Google should have been called
      expect(signInWithOAuth).toHaveBeenCalledTimes(1);
      expect(signInWithOAuth).toHaveBeenCalledWith('google');
    });
  });
});

/**
 * AuthModal Component Tests
 *
 * Tests for the AuthModal component and AuthModalProvider:
 * - Modal opens with correct mode (signin/signup)
 * - Modal closes properly
 * - Auth method tabs work (Password vs Magic Link)
 * - Magic link form validation
 * - Mode toggle works
 * - Email sent confirmation screen
 * - Context throws error when used outside provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import {
  AuthModalProvider,
  useAuthModal,
} from '@/app/components/auth/AuthModal';

// Mock the auth providers with real validation functions
vi.mock('@/lib/auth/providers', () => ({
  signInWithMagicLink: vi.fn().mockResolvedValue({ error: null }),
  isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
}));

import { signInWithMagicLink } from '@/lib/auth/providers';

// Mock the child components
vi.mock('@/app/components/auth/EmailPasswordForm', () => ({
  EmailPasswordForm: ({
    mode,
    email,
    onEmailChange,
  }: {
    mode: string;
    email: string;
    onEmailChange: (email: string) => void;
    onSuccess: () => void;
    onModeChange: (mode: 'signin' | 'signup') => void;
    onError: (error: string) => void;
  }) => (
    <div data-testid="email-password-form">
      <span data-testid="form-mode">{mode}</span>
      <input
        data-testid="password-form-email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('@/app/components/auth/SocialLoginButtons', () => ({
  SocialLoginButtons: ({
    disabled,
  }: {
    disabled?: boolean;
    onError?: (error: string) => void;
  }) => (
    <div data-testid="social-login-buttons" data-disabled={disabled}>
      Social Login Buttons
    </div>
  ),
}));

// Helper component to test useAuthModal hook
function TestConsumer() {
  const { isOpen, openModal, closeModal } = useAuthModal();
  return (
    <div>
      <span data-testid="is-open">{String(isOpen)}</span>
      <button data-testid="open-signin" onClick={() => openModal('signin')}>
        Open Sign In
      </button>
      <button data-testid="open-signup" onClick={() => openModal('signup')}>
        Open Sign Up
      </button>
      <button data-testid="close-modal" onClick={closeModal}>
        Close
      </button>
    </div>
  );
}

describe('AuthModalProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signInWithMagicLink).mockResolvedValue({ error: null });
  });

  describe('rendering', () => {
    it('should render children', () => {
      render(
        <AuthModalProvider>
          <div data-testid="child">Child Content</div>
        </AuthModalProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should not show modal initially', () => {
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      expect(screen.getByTestId('is-open').textContent).toBe('false');
      expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
    });
  });

  describe('modal open/close', () => {
    it('should open modal in signin mode', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });
      expect(screen.getByTestId('is-open').textContent).toBe('true');
    });

    it('should open modal in signup mode', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signup'));

      await waitFor(() => {
        expect(screen.getByText('Create an account')).toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      // Open modal
      await user.click(screen.getByTestId('open-signin'));
      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
      });
    });
  });

  describe('auth method tabs', () => {
    it('should render Password and Magic Link tabs', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /password/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /magic link/i })).toBeInTheDocument();
      });
    });

    it('should show Password form by default', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));

      await waitFor(() => {
        expect(screen.getByTestId('email-password-form')).toBeInTheDocument();
      });
    });

    it('should switch to Magic Link form when tab is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      // Click Magic Link tab
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      // Should now show magic link form (with "Send magic link" button)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
      });
    });

    it('should switch back to Password form when tab is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      // Switch to Magic Link
      await user.click(screen.getByRole('button', { name: /magic link/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
      });

      // Switch back to Password
      await user.click(screen.getByRole('button', { name: /password/i }));

      await waitFor(() => {
        expect(screen.getByTestId('email-password-form')).toBeInTheDocument();
      });
    });
  });

  describe('magic link form', () => {
    it('should render email input in magic link mode', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      });
    });

    it('should disable submit button when email is empty', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /send magic link/i });
        expect(submitButton).toBeDisabled();
      });
    });

    it('should enable submit button when email is entered', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /send magic link/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show email sent confirmation on success', async () => {
      const user = userEvent.setup();

      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send magic link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Check your email')).toBeInTheDocument();
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      });
    });

    it('should show error when magic link fails', async () => {
      const user = userEvent.setup();
      vi.mocked(signInWithMagicLink).mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      });

      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send magic link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
      });
    });
  });

  describe('mode toggle (magic link view)', () => {
    it('should show "Sign up" link in signin mode', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      await waitFor(() => {
        expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
      });
    });

    it('should show "Sign in" link in signup mode', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signup'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      await waitFor(() => {
        expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('should toggle from signin to signup when clicking link', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      // Click sign up link
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText('Create an account')).toBeInTheDocument();
      });
    });
  });

  describe('email sent screen', () => {
    it('should show try again button on email sent screen', async () => {
      const user = userEvent.setup();

      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send magic link/i }));

      await waitFor(() => {
        expect(screen.getByText('Check your email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should return to initial screen when clicking try again', async () => {
      const user = userEvent.setup();

      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));
      await user.click(screen.getByRole('button', { name: /magic link/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send magic link/i }));

      await waitFor(() => {
        expect(screen.getByText('Check your email')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });
    });
  });

  describe('social login buttons', () => {
    it('should render social login buttons', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));

      await waitFor(() => {
        expect(screen.getByTestId('social-login-buttons')).toBeInTheDocument();
      });
    });

    it('should show "Or continue with" divider', async () => {
      const user = userEvent.setup();
      render(
        <AuthModalProvider>
          <TestConsumer />
        </AuthModalProvider>
      );

      await user.click(screen.getByTestId('open-signin'));

      await waitFor(() => {
        expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
      });
    });
  });
});

describe('useAuthModal', () => {
  it('should throw error when used outside AuthModalProvider', () => {
    expect(() => {
      renderHook(() => useAuthModal());
    }).toThrow('useAuthModal must be used within an AuthModalProvider');
  });

  it('should return context values when used inside provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthModalProvider>{children}</AuthModalProvider>
    );

    const { result } = renderHook(() => useAuthModal(), { wrapper });

    expect(result.current).toHaveProperty('isOpen');
    expect(result.current).toHaveProperty('openModal');
    expect(result.current).toHaveProperty('closeModal');
    expect(typeof result.current.openModal).toBe('function');
    expect(typeof result.current.closeModal).toBe('function');
  });
});

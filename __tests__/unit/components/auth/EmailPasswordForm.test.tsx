/**
 * EmailPasswordForm Component Tests
 *
 * Tests for the EmailPasswordForm component covering:
 * - Component renders with correct mode (signin/signup)
 * - Form elements present
 * - Password visibility toggle
 * - Form submission
 * - Forgot password flow
 * - Mode toggle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailPasswordForm } from '@/app/components/auth/EmailPasswordForm';

// Mock the auth provider functions
vi.mock('@/lib/auth/providers', () => ({
  signInWithEmail: vi.fn().mockResolvedValue({ error: null }),
  signUpWithEmail: vi.fn().mockResolvedValue({ error: null, data: { user: { id: '123' }, session: { access_token: 'token' } } }),
  resetPassword: vi.fn().mockResolvedValue({ error: null }),
  isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  isValidPassword: (password: string) => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    return { valid: true };
  },
}));

import { signInWithEmail, signUpWithEmail, resetPassword } from '@/lib/auth/providers';

describe('EmailPasswordForm', () => {
  const defaultProps = {
    mode: 'signin' as const,
    email: '',
    onEmailChange: vi.fn(),
    onSuccess: vi.fn(),
    onModeChange: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signInWithEmail).mockResolvedValue({ error: null, data: { user: {}, session: {} } });
    vi.mocked(signUpWithEmail).mockResolvedValue({ error: null, data: { user: { id: '123' }, session: { access_token: 'token' } } });
    vi.mocked(resetPassword).mockResolvedValue({ error: null, data: {} });
  });

  describe('rendering', () => {
    it('should render email input', () => {
      render(<EmailPasswordForm {...defaultProps} />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render password input', () => {
      render(<EmailPasswordForm {...defaultProps} />);
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('should render sign in button in signin mode', () => {
      render(<EmailPasswordForm {...defaultProps} mode="signin" />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render create account button in signup mode', () => {
      render(<EmailPasswordForm {...defaultProps} mode="signup" />);
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render confirm password field in signup mode', () => {
      render(<EmailPasswordForm {...defaultProps} mode="signup" />);
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should not render confirm password field in signin mode', () => {
      render(<EmailPasswordForm {...defaultProps} mode="signin" />);
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    });

    it('should render forgot password link in signin mode', () => {
      render(<EmailPasswordForm {...defaultProps} mode="signin" />);
      expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
    });

    it('should not render forgot password link in signup mode', () => {
      render(<EmailPasswordForm {...defaultProps} mode="signup" />);
      expect(screen.queryByRole('button', { name: /forgot password/i })).not.toBeInTheDocument();
    });
  });

  describe('email input', () => {
    it('should display email value from props', () => {
      render(<EmailPasswordForm {...defaultProps} email="test@example.com" />);
      expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    });

    it('should call onEmailChange when email changes', async () => {
      const user = userEvent.setup();
      const onEmailChange = vi.fn();
      render(<EmailPasswordForm {...defaultProps} onEmailChange={onEmailChange} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'a');

      expect(onEmailChange).toHaveBeenCalled();
    });

    it('should have placeholder text', () => {
      render(<EmailPasswordForm {...defaultProps} />);
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });
  });

  describe('password visibility toggle', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<EmailPasswordForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');

      const hideButton = screen.getByRole('button', { name: /hide password/i });
      await user.click(hideButton);

      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle confirm password visibility in signup mode', async () => {
      const user = userEvent.setup();
      render(<EmailPasswordForm {...defaultProps} mode="signup" />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('form validation', () => {
    it('should disable submit button when email is empty', () => {
      render(<EmailPasswordForm {...defaultProps} email="" />);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when password is empty', async () => {
      render(<EmailPasswordForm {...defaultProps} email="test@example.com" />);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when email and password are provided', async () => {
      const user = userEvent.setup();
      render(<EmailPasswordForm {...defaultProps} email="test@example.com" />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should show error for short password', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();

      render(
        <EmailPasswordForm
          {...defaultProps}
          email="test@example.com"
          onError={onError}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Password must be at least 8 characters');
      });
    });

    it('should show error when passwords do not match in signup mode', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();

      render(
        <EmailPasswordForm
          {...defaultProps}
          mode="signup"
          email="test@example.com"
          onError={onError}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'differentpassword');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Passwords do not match');
      });
    });
  });

  describe('sign in', () => {
    it('should call signInWithEmail on valid submit', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(
        <EmailPasswordForm
          {...defaultProps}
          email="test@example.com"
          onSuccess={onSuccess}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state while signing in', async () => {
      const user = userEvent.setup();
      vi.mocked(signInWithEmail).mockImplementation(() =>
        new Promise((resolve) => setTimeout(() => resolve({ error: null, data: {} }), 100))
      );

      render(
        <EmailPasswordForm
          {...defaultProps}
          email="test@example.com"
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it('should show error for invalid credentials', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      vi.mocked(signInWithEmail).mockResolvedValue({
        error: { message: 'Invalid login credentials' },
        data: { user: null, session: null },
      });

      render(
        <EmailPasswordForm
          {...defaultProps}
          email="test@example.com"
          onError={onError}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Invalid email or password. Please try again.');
      });
    });
  });

  describe('sign up', () => {
    it('should call signUpWithEmail on valid submit', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(
        <EmailPasswordForm
          {...defaultProps}
          mode="signup"
          email="test@example.com"
          onSuccess={onSuccess}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(signUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state while signing up', async () => {
      const user = userEvent.setup();
      vi.mocked(signUpWithEmail).mockImplementation(() =>
        new Promise((resolve) => setTimeout(() => resolve({ error: null, data: {} }), 100))
      );

      render(
        <EmailPasswordForm
          {...defaultProps}
          mode="signup"
          email="test@example.com"
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });
  });

  describe('forgot password', () => {
    it('should show forgot password form when link is clicked', async () => {
      const user = userEvent.setup();
      render(<EmailPasswordForm {...defaultProps} mode="signin" />);

      const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i });
      await user.click(forgotPasswordButton);

      expect(screen.getByText(/send you a link to reset your password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should go back to signin form when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<EmailPasswordForm {...defaultProps} mode="signin" />);

      await user.click(screen.getByRole('button', { name: /forgot password/i }));
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /back to sign in/i }));
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should call resetPassword when form is submitted with valid email', async () => {
      const user = userEvent.setup();

      render(
        <EmailPasswordForm
          {...defaultProps}
          mode="signin"
          email="test@example.com"
        />
      );

      await user.click(screen.getByRole('button', { name: /forgot password/i }));
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(resetPassword).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show success message after reset email is sent', async () => {
      const user = userEvent.setup();

      render(
        <EmailPasswordForm
          {...defaultProps}
          mode="signin"
          email="test@example.com"
        />
      );

      await user.click(screen.getByRole('button', { name: /forgot password/i }));
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
      });
    });
  });

  describe('mode toggle', () => {
    it('should show sign up link in signin mode', () => {
      render(<EmailPasswordForm {...defaultProps} mode="signin" />);
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should show sign in link in signup mode', () => {
      render(<EmailPasswordForm {...defaultProps} mode="signup" />);
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    it('should call onModeChange when switching to signup', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      render(<EmailPasswordForm {...defaultProps} mode="signin" onModeChange={onModeChange} />);

      const signUpButton = screen.getAllByRole('button').find(
        btn => btn.textContent === 'Sign up'
      );
      await user.click(signUpButton!);

      expect(onModeChange).toHaveBeenCalledWith('signup');
    });

    it('should call onModeChange when switching to signin', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      render(<EmailPasswordForm {...defaultProps} mode="signup" onModeChange={onModeChange} />);

      const signInButton = screen.getAllByRole('button').find(
        btn => btn.textContent === 'Sign in'
      );
      await user.click(signInButton!);

      expect(onModeChange).toHaveBeenCalledWith('signin');
    });
  });
});

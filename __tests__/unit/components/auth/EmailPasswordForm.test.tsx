/**
 * EmailPasswordForm Component Tests
 *
 * Tests for the EmailPasswordForm component:
 * - Component renders with correct mode (signin/signup)
 * - Form elements present
 * - Password visibility toggle
 * - Form validation (email, password, confirm password)
 * - Sign in functionality
 * - Sign up functionality
 * - Forgot password flow
 * - Mode toggle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailPasswordForm } from '@/app/components/auth/EmailPasswordForm';

// Use vi.hoisted to create mocks that can be used in vi.mock
const { mockSignInWithEmail, mockSignUpWithEmail, mockResetPassword, mockIsValidEmail, mockIsValidPassword } = vi.hoisted(() => ({
  mockSignInWithEmail: vi.fn(),
  mockSignUpWithEmail: vi.fn(),
  mockResetPassword: vi.fn(),
  mockIsValidEmail: vi.fn(),
  mockIsValidPassword: vi.fn(),
}));

// Mock the auth providers
vi.mock('@/lib/auth/providers', () => ({
  signInWithEmail: mockSignInWithEmail,
  signUpWithEmail: mockSignUpWithEmail,
  resetPassword: mockResetPassword,
  isValidEmail: mockIsValidEmail,
  isValidPassword: mockIsValidPassword,
}));

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
    // Reset mock implementations to defaults
    mockIsValidEmail.mockImplementation((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    mockIsValidPassword.mockImplementation((password: string) => {
      if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
      }
      return { valid: true };
    });
    mockSignInWithEmail.mockResolvedValue({ error: null });
    mockSignUpWithEmail.mockResolvedValue({ error: null, data: { user: { id: '123' }, session: { access_token: 'token' } } });
    mockResetPassword.mockResolvedValue({ error: null });
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

      // Click toggle button
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      const hideButton = screen.getByRole('button', { name: /hide password/i });
      await user.click(hideButton);

      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle confirm password visibility in signup mode', async () => {
      const user = userEvent.setup();
      render(<EmailPasswordForm {...defaultProps} mode="signup" />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('form validation', () => {
    it('should call onError for invalid email', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      mockIsValidEmail.mockReturnValue(false);

      render(
        <EmailPasswordForm
          {...defaultProps}
          email="invalid"
          onError={onError}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Please enter a valid email address');
      });
    });

    it('should call onError for short password', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: false, message: 'Password must be at least 8 characters' });

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

    it('should call onError when passwords do not match in signup mode', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });

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

    it('should disable submit button when email or password is empty', () => {
      render(<EmailPasswordForm {...defaultProps} email="" />);

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
  });

  describe('sign in', () => {
    it('should call signInWithEmail on submit', async () => {
      const user = userEvent.setup();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });
      mockSignInWithEmail.mockResolvedValue({ error: null, data: { user: {}, session: {} } });

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
        expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state while signing in', async () => {
      const user = userEvent.setup();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });
      mockSignInWithEmail.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ error: null, data: {} }), 100)));

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
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });
      mockSignInWithEmail.mockResolvedValue({
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

    it('should show error for unconfirmed email', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });
      mockSignInWithEmail.mockResolvedValue({
        error: { message: 'Email not confirmed' },
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
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Please confirm your email address before signing in.');
      });
    });
  });

  describe('sign up', () => {
    it('should call signUpWithEmail on submit', async () => {
      const user = userEvent.setup();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });
      mockSignUpWithEmail.mockResolvedValue({
        error: null,
        data: { user: { id: '123' }, session: { access_token: 'token' } },
      });

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
        expect(mockSignUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state while signing up', async () => {
      const user = userEvent.setup();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });
      mockSignUpWithEmail.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ error: null, data: {} }), 100)));

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

    it('should show error for existing account', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });
      mockSignUpWithEmail.mockResolvedValue({
        error: { message: 'User already registered' },
        data: { user: null, session: null },
      });

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
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('An account with this email already exists. Try signing in.');
      });
    });

    it('should show confirmation message when email confirmation is needed', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      const onSuccess = vi.fn();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });
      mockSignUpWithEmail.mockResolvedValue({
        error: null,
        data: { user: { id: '123' }, session: null },
      });

      render(
        <EmailPasswordForm
          {...defaultProps}
          mode="signup"
          email="test@example.com"
          onError={onError}
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
        expect(onError).toHaveBeenCalledWith('Check your email to confirm your account.');
        expect(onSuccess).toHaveBeenCalled();
      });
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

    it('should call resetPassword when form is submitted', async () => {
      const user = userEvent.setup();
      mockIsValidEmail.mockReturnValue(true);
      mockResetPassword.mockResolvedValue({ error: null });

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
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show success message after reset email is sent', async () => {
      const user = userEvent.setup();
      mockIsValidEmail.mockReturnValue(true);
      mockResetPassword.mockResolvedValue({ error: null });

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

    it('should show error for invalid email in forgot password form', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      mockIsValidEmail.mockReturnValue(false);

      render(
        <EmailPasswordForm
          {...defaultProps}
          mode="signin"
          email="invalid"
          onError={onError}
        />
      );

      await user.click(screen.getByRole('button', { name: /forgot password/i }));
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Please enter a valid email address');
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

      // Find the Sign up button in the mode toggle section (not in a form)
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

      // Find the Sign in button in the mode toggle section
      const signInButton = screen.getAllByRole('button').find(
        btn => btn.textContent === 'Sign in'
      );
      await user.click(signInButton!);

      expect(onModeChange).toHaveBeenCalledWith('signin');
    });
  });

  describe('input disabling during loading', () => {
    it('should disable inputs while submitting', async () => {
      const user = userEvent.setup();
      mockIsValidEmail.mockReturnValue(true);
      mockIsValidPassword.mockReturnValue({ valid: true });
      mockSignInWithEmail.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ error: null, data: {} }), 100)));

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

      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });
  });
});

/**
 * Header Component Tests
 *
 * Tests for the main header component to ensure:
 * - Component renders without crashing
 * - Key UI elements are present (logo, nav links, auth buttons)
 * - Mobile menu opens/closes correctly
 * - User menu shows correct state for authenticated/unauthenticated users
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/layout/header';

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/',
}));

// Mock Supabase client - authenticated user
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: null,
  },
};

const mockUnsubscribe = vi.fn();
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();

const createMockSupabase = () => ({
  auth: {
    getUser: mockGetUser,
    onAuthStateChange: mockOnAuthStateChange,
    signOut: mockSignOut,
  },
});

vi.mock('@/lib/supabase/browser', () => ({
  createBrowserClient: () => createMockSupabase(),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
    mockSignOut.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should display the logo and brand name', () => {
      render(<Header />);
      expect(screen.getByText('State of Clarity')).toBeInTheDocument();
    });

    it('should have a link to home page from logo', () => {
      render(<Header />);
      const homeLinks = screen.getAllByRole('link', { name: /state of clarity/i });
      expect(homeLinks[0]).toHaveAttribute('href', '/');
    });

    it('should apply custom className when provided', () => {
      render(<Header className="custom-class" />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('custom-class');
    });
  });

  describe('Navigation Links', () => {
    it('should display Ask Anything link', () => {
      render(<Header />);
      expect(screen.getByRole('link', { name: /ask anything/i })).toBeInTheDocument();
    });

    it('should display Explore link', () => {
      render(<Header />);
      expect(screen.getByRole('link', { name: /explore/i })).toBeInTheDocument();
    });

    it('should display About link', () => {
      render(<Header />);
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    });

    it('should have correct hrefs for navigation links', () => {
      render(<Header />);
      expect(screen.getByRole('link', { name: /ask anything/i })).toHaveAttribute('href', '/ask');
      expect(screen.getByRole('link', { name: /explore/i })).toHaveAttribute('href', '/explore');
      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about');
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it('should show Sign In link when not authenticated', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('should show Sign Up link when not authenticated', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
      });
    });

    it('should have correct hrefs for auth links', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/signin');
        expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/auth/signup');
      });
    });

    it('should not show user menu when not authenticated', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.queryByTestId('user-menu-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authenticated State', () => {
    it('should show user menu button when authenticated', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });
    });

    it('should display user name in menu button', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    it('should display email prefix when no full name', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            ...mockUser,
            user_metadata: {},
          },
        },
      });

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
      });
    });

    it('should not show Sign In/Sign Up links when authenticated', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      // Only the mobile menu should have auth links when authenticated
      const signInLinks = screen.queryAllByRole('link', { name: /^sign in$/i });
      expect(signInLinks.length).toBe(0);
    });
  });

  describe('User Menu Dropdown', () => {
    it('should open dropdown when user menu button is clicked', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();

      const menuButton = screen.getByTestId('user-menu-button');
      await userEvent.click(menuButton);

      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
    });

    it('should show Profile link in dropdown', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('user-menu-button'));

      expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument();
    });

    it('should show Settings link in dropdown', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('user-menu-button'));

      expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
    });

    it('should show Sign Out button in dropdown', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('user-menu-button'));

      expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
    });

    it('should have correct aria-expanded attribute', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      const menuButton = screen.getByTestId('user-menu-button');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(menuButton);

      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Sign Out', () => {
    it('should call signOut when Sign Out is clicked', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('user-menu-button'));
      await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should redirect to home page after sign out', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('user-menu-button'));
      await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should close user menu after sign out', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('user-menu-button'));
      await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mobile Menu', () => {
    it('should have mobile menu button', () => {
      render(<Header />);
      const mobileMenuButton = screen.getByRole('button', { name: /open menu/i });
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('should toggle aria-expanded on mobile menu button', async () => {
      render(<Header />);
      const mobileMenuButton = screen.getByRole('button', { name: /open menu/i });

      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(mobileMenuButton);

      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should change aria-label when menu is opened', async () => {
      render(<Header />);
      const mobileMenuButton = screen.getByRole('button', { name: /open menu/i });

      await userEvent.click(mobileMenuButton);

      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    });

    it('should show mobile navigation when menu is opened', async () => {
      render(<Header />);
      const mobileMenuButton = screen.getByRole('button', { name: /open menu/i });

      await userEvent.click(mobileMenuButton);

      const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
      expect(mobileNav).toBeInTheDocument();
    });

    it('should close mobile menu when backdrop is clicked', async () => {
      render(<Header />);
      const mobileMenuButton = screen.getByRole('button', { name: /open menu/i });

      await userEvent.click(mobileMenuButton);

      // The backdrop has the class bg-ink-800/20
      const backdrop = document.querySelector('.bg-ink-800\\/20');
      expect(backdrop).toBeInTheDocument();

      if (backdrop) {
        fireEvent.click(backdrop);
      }

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
      });
    });
  });

  describe('Auth State Change Subscription', () => {
    it('should subscribe to auth state changes on mount', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });
    });

    it('should unsubscribe from auth state changes on unmount', async () => {
      const { unmount } = render(<Header />);

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('User Avatar', () => {
    it('should show default avatar icon when no avatar URL', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      // The User icon should be rendered (inside the button)
      const button = screen.getByTestId('user-menu-button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should show avatar image when avatar URL is provided', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            ...mockUser,
            user_metadata: {
              ...mockUser.user_metadata,
              avatar_url: 'https://example.com/avatar.jpg',
            },
          },
        },
      });

      const { container } = render(<Header />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      });

      // Query for img elements directly since they have empty alt attributes
      const avatarImages = container.querySelectorAll('img[src="https://example.com/avatar.jpg"]');
      expect(avatarImages.length).toBeGreaterThan(0);
    });
  });
});

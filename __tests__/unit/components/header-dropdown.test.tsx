/**
 * Header User Menu Dropdown Tests
 *
 * Tests for the profile dropdown in the header component to ensure:
 * - Dropdown opens when button is clicked
 * - Dropdown closes when clicking outside
 * - Dropdown closes when pressing Escape key
 * - Dropdown closes when clicking menu items
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/layout/header';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Supabase client
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signOut: vi.fn().mockResolvedValue({}),
  },
};

vi.mock('@/lib/supabase/browser', () => ({
  createBrowserClient: () => mockSupabase,
}));

describe('Header User Menu Dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should open dropdown when user menu button is clicked', async () => {
    render(<Header />);

    // Wait for user to load
    await waitFor(() => {
      expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
    });

    // Dropdown should not be visible initially
    expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();

    // Click the user menu button
    const menuButton = screen.getByTestId('user-menu-button');
    await userEvent.click(menuButton);

    // Dropdown should now be visible
    expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', async () => {
    render(
      <div>
        <Header />
        <div data-testid="outside-element">Outside content</div>
      </div>
    );

    // Wait for user to load and open dropdown
    await waitFor(() => {
      expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
    });

    const menuButton = screen.getByTestId('user-menu-button');
    await userEvent.click(menuButton);

    // Verify dropdown is open
    expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();

    // Click outside the dropdown using mousedown event (which is what the handler listens to)
    const outsideElement = screen.getByTestId('outside-element');
    fireEvent.mouseDown(outsideElement);

    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown when pressing Escape key', async () => {
    render(<Header />);

    // Wait for user to load and open dropdown
    await waitFor(() => {
      expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
    });

    const menuButton = screen.getByTestId('user-menu-button');
    await userEvent.click(menuButton);

    // Verify dropdown is open
    expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();

    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown when clicking a menu item', async () => {
    render(<Header />);

    // Wait for user to load and open dropdown
    await waitFor(() => {
      expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
    });

    const menuButton = screen.getByTestId('user-menu-button');
    await userEvent.click(menuButton);

    // Verify dropdown is open
    expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();

    // Click the Settings link
    const settingsLink = screen.getByRole('menuitem', { name: /settings/i });
    await userEvent.click(settingsLink);

    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
    });
  });

  it('should not close dropdown when clicking inside the dropdown', async () => {
    render(<Header />);

    // Wait for user to load and open dropdown
    await waitFor(() => {
      expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
    });

    const menuButton = screen.getByTestId('user-menu-button');
    await userEvent.click(menuButton);

    // Verify dropdown is open
    const dropdown = screen.getByTestId('user-menu-dropdown');
    expect(dropdown).toBeInTheDocument();

    // Click inside the dropdown (on the dropdown container itself)
    fireEvent.mouseDown(dropdown);

    // Dropdown should still be open
    expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
  });

  it('should toggle dropdown when clicking the button multiple times', async () => {
    render(<Header />);

    // Wait for user to load
    await waitFor(() => {
      expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
    });

    const menuButton = screen.getByTestId('user-menu-button');

    // First click - open
    await userEvent.click(menuButton);
    expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();

    // Second click - close
    await userEvent.click(menuButton);
    await waitFor(() => {
      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
    });

    // Third click - open again
    await userEvent.click(menuButton);
    expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
  });
});

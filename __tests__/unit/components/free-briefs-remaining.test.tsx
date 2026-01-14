/**
 * FreeBriefsRemaining Component Tests
 *
 * Tests for the free briefs remaining banner.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FreeBriefsRemaining } from '@/app/components/FreeBriefsRemaining';

// Mock usePaywall hook
const mockUsePaywall = vi.fn();
vi.mock('@/lib/paywall/usePaywall', () => ({
  usePaywall: () => mockUsePaywall(),
}));

describe('FreeBriefsRemaining', () => {
  describe('Loading State', () => {
    it('should render nothing when loading', () => {
      mockUsePaywall.mockReturnValue({
        briefsRemaining: 3,
        isAuthenticated: false,
        isLoading: true,
        limit: 3,
      });

      const { container } = render(<FreeBriefsRemaining />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Authenticated User', () => {
    it('should render nothing when user is authenticated', () => {
      mockUsePaywall.mockReturnValue({
        briefsRemaining: 3,
        isAuthenticated: true,
        isLoading: false,
        limit: 3,
      });

      const { container } = render(<FreeBriefsRemaining />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Anonymous User - Multiple Briefs Remaining', () => {
    it('should show blue style for multiple briefs remaining', () => {
      mockUsePaywall.mockReturnValue({
        briefsRemaining: 3,
        isAuthenticated: false,
        isLoading: false,
        limit: 3,
      });

      render(<FreeBriefsRemaining />);

      expect(screen.getByText('3 free briefs remaining')).toBeInTheDocument();
      const container = screen.getByText('3 free briefs remaining').parentElement;
      expect(container).toHaveClass('bg-blue-50');
    });

    it('should show limit info', () => {
      mockUsePaywall.mockReturnValue({
        briefsRemaining: 2,
        isAuthenticated: false,
        isLoading: false,
        limit: 3,
      });

      render(<FreeBriefsRemaining />);

      expect(screen.getByText('(of 3 free)')).toBeInTheDocument();
    });
  });

  describe('Anonymous User - One Brief Remaining', () => {
    it('should show amber/warning style for 1 brief remaining', () => {
      mockUsePaywall.mockReturnValue({
        briefsRemaining: 1,
        isAuthenticated: false,
        isLoading: false,
        limit: 3,
      });

      render(<FreeBriefsRemaining />);

      expect(screen.getByText('1 free brief remaining')).toBeInTheDocument();
      const container = screen.getByText('1 free brief remaining').parentElement;
      expect(container).toHaveClass('bg-amber-50');
    });
  });

  describe('Anonymous User - No Briefs Remaining', () => {
    it('should show red/error style for 0 briefs remaining', () => {
      mockUsePaywall.mockReturnValue({
        briefsRemaining: 0,
        isAuthenticated: false,
        isLoading: false,
        limit: 3,
      });

      render(<FreeBriefsRemaining />);

      expect(screen.getByText(/You've used all free briefs/)).toBeInTheDocument();
      const container = screen.getByText(/You've used all free briefs/).parentElement;
      expect(container).toHaveClass('bg-red-50');
    });

    it('should prompt user to sign up', () => {
      mockUsePaywall.mockReturnValue({
        briefsRemaining: 0,
        isAuthenticated: false,
        isLoading: false,
        limit: 3,
      });

      render(<FreeBriefsRemaining />);

      expect(screen.getByText(/Sign up to continue reading/)).toBeInTheDocument();
    });
  });
});

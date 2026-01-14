/**
 * CreditBalance Component Tests
 *
 * Tests for the credit balance display component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CreditBalance } from '@/app/components/CreditBalance';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CreditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    it('should render nothing when user is not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { container } = render(<CreditBalance />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Authenticated State', () => {
    it('should display credit balance for authenticated user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ balance: 10 }),
      });

      render(<CreditBalance />);

      await waitFor(() => {
        expect(screen.getByText('10 credits')).toBeInTheDocument();
      });
    });

    it('should link to credits page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ balance: 5 }),
      });

      render(<CreditBalance />);

      await waitFor(() => {
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/credits');
      });
    });
  });

  describe('Low Balance Warning', () => {
    it('should show warning style for low balance (2 or less)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ balance: 2 }),
      });

      render(<CreditBalance />);

      await waitFor(() => {
        const link = screen.getByRole('link');
        expect(link).toHaveClass('bg-amber-100');
      });
    });

    it('should show warning style for balance of 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ balance: 1 }),
      });

      render(<CreditBalance />);

      await waitFor(() => {
        const link = screen.getByRole('link');
        expect(link).toHaveClass('bg-amber-100');
      });
    });

    it('should not show warning style for balance above 2', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ balance: 3 }),
      });

      render(<CreditBalance />);

      await waitFor(() => {
        const link = screen.getByRole('link');
        expect(link).not.toHaveClass('bg-amber-100');
        expect(link).toHaveClass('bg-gray-100');
      });
    });
  });

  describe('Zero Balance', () => {
    it('should show buy credits button for zero balance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ balance: 0 }),
      });

      render(<CreditBalance />);

      await waitFor(() => {
        expect(screen.getByText('Buy credits')).toBeInTheDocument();
      });
    });

    it('should have primary button style for zero balance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ balance: 0 }),
      });

      render(<CreditBalance />);

      await waitFor(() => {
        const link = screen.getByRole('link');
        expect(link).toHaveClass('bg-primary');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(<CreditBalance />);

      await waitFor(() => {
        // Should render nothing on error
        expect(container.firstChild).toBeNull();
      });
    });

    it('should handle non-401 error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { container } = render(<CreditBalance />);

      await waitFor(() => {
        // Should render nothing on server error
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ balance: 10 }),
      });

      render(<CreditBalance className="custom-class" />);

      await waitFor(() => {
        const link = screen.getByRole('link');
        expect(link).toHaveClass('custom-class');
      });
    });
  });
});

/**
 * ErrorMessage Component Tests
 *
 * Tests for the error message display component to ensure:
 * - Renders error title and message
 * - Shows retry button when onRetry is provided
 * - Toggles error details visibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from '@/app/components/ErrorMessage';

describe('ErrorMessage', () => {
  const defaultProps = {
    title: 'Test Error',
    message: 'Something went wrong',
  };

  describe('Basic Rendering', () => {
    it('should render error title', () => {
      render(<ErrorMessage {...defaultProps} />);

      expect(screen.getByText('Test Error')).toBeInTheDocument();
    });

    it('should render error message', () => {
      render(<ErrorMessage {...defaultProps} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render alert icon', () => {
      render(<ErrorMessage {...defaultProps} />);

      // Check that the container has the alert styling
      const container = screen.getByText('Test Error').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('should not render retry button when onRetry is not provided', () => {
      render(<ErrorMessage {...defaultProps} />);

      expect(screen.queryByText('Try again')).not.toBeInTheDocument();
    });

    it('should render retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage {...defaultProps} onRetry={onRetry} />);

      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn();
      render(<ErrorMessage {...defaultProps} onRetry={onRetry} />);

      const retryButton = screen.getByText('Try again');
      await userEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Details Toggle', () => {
    it('should not render details button when details is not provided', () => {
      render(<ErrorMessage {...defaultProps} />);

      expect(screen.queryByText('Show details')).not.toBeInTheDocument();
    });

    it('should render details button when details is provided', () => {
      render(
        <ErrorMessage
          {...defaultProps}
          details="Detailed error information"
        />
      );

      expect(screen.getByText('Show details')).toBeInTheDocument();
    });

    it('should not show details initially', () => {
      render(
        <ErrorMessage
          {...defaultProps}
          details="Detailed error information"
        />
      );

      expect(screen.queryByText('Detailed error information')).not.toBeInTheDocument();
    });

    it('should show details when Show details button is clicked', async () => {
      render(
        <ErrorMessage
          {...defaultProps}
          details="Detailed error information"
        />
      );

      const showDetailsButton = screen.getByText('Show details');
      await userEvent.click(showDetailsButton);

      expect(screen.getByText('Detailed error information')).toBeInTheDocument();
    });

    it('should toggle button text when details are shown', async () => {
      render(
        <ErrorMessage
          {...defaultProps}
          details="Detailed error information"
        />
      );

      const showDetailsButton = screen.getByText('Show details');
      await userEvent.click(showDetailsButton);

      expect(screen.getByText('Hide details')).toBeInTheDocument();
      expect(screen.queryByText('Show details')).not.toBeInTheDocument();
    });

    it('should hide details when Hide details button is clicked', async () => {
      render(
        <ErrorMessage
          {...defaultProps}
          details="Detailed error information"
        />
      );

      // Show details
      await userEvent.click(screen.getByText('Show details'));
      expect(screen.getByText('Detailed error information')).toBeInTheDocument();

      // Hide details
      await userEvent.click(screen.getByText('Hide details'));
      expect(screen.queryByText('Detailed error information')).not.toBeInTheDocument();
    });
  });

  describe('Combined Features', () => {
    it('should render both retry button and details button', () => {
      const onRetry = vi.fn();
      render(
        <ErrorMessage
          {...defaultProps}
          onRetry={onRetry}
          details="Error details"
        />
      );

      expect(screen.getByText('Try again')).toBeInTheDocument();
      expect(screen.getByText('Show details')).toBeInTheDocument();
    });

    it('should handle retry click while details are shown', async () => {
      const onRetry = vi.fn();
      render(
        <ErrorMessage
          {...defaultProps}
          onRetry={onRetry}
          details="Error details"
        />
      );

      // Show details
      await userEvent.click(screen.getByText('Show details'));
      expect(screen.getByText('Error details')).toBeInTheDocument();

      // Click retry
      await userEvent.click(screen.getByText('Try again'));
      expect(onRetry).toHaveBeenCalledTimes(1);

      // Details should still be visible
      expect(screen.getByText('Error details')).toBeInTheDocument();
    });
  });
});

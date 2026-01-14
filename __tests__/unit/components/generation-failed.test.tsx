/**
 * GenerationFailed Component Tests
 *
 * Tests for the generation failed error display.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GenerationFailed from '@/app/components/GenerationFailed';

describe('GenerationFailed', () => {
  const defaultProps = {
    question: 'What is the impact of AI on jobs?',
    onTryAgain: vi.fn(),
  };

  describe('Display Content', () => {
    it('should display error heading', () => {
      render(<GenerationFailed {...defaultProps} />);

      expect(screen.getByText(/couldn't generate a high-quality brief/i)).toBeInTheDocument();
    });

    it('should display the user question', () => {
      render(<GenerationFailed {...defaultProps} />);

      expect(screen.getByText(/What is the impact of AI on jobs\?/)).toBeInTheDocument();
    });

    it('should show quality explanation', () => {
      render(<GenerationFailed {...defaultProps} />);

      expect(screen.getByText(/quality assurance system/i)).toBeInTheDocument();
    });

    it('should display suggestions section', () => {
      render(<GenerationFailed {...defaultProps} />);

      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(screen.getByText(/Try rephrasing your question/i)).toBeInTheDocument();
    });
  });

  describe('Credit Refund', () => {
    it('should show default 1 credit refunded', () => {
      render(<GenerationFailed {...defaultProps} />);

      expect(screen.getByText(/1 credit refunded/i)).toBeInTheDocument();
    });

    it('should show plural credits when multiple refunded', () => {
      render(<GenerationFailed {...defaultProps} creditsRefunded={3} />);

      expect(screen.getByText(/3 credits refunded/i)).toBeInTheDocument();
    });

    it('should show singular credit for 1', () => {
      render(<GenerationFailed {...defaultProps} creditsRefunded={1} />);

      expect(screen.getByText(/1 credit refunded/i)).toBeInTheDocument();
      expect(screen.queryByText(/1 credits/i)).not.toBeInTheDocument();
    });
  });

  describe('Auto Retry', () => {
    it('should show auto retry suggestion by default', () => {
      render(<GenerationFailed {...defaultProps} />);

      expect(screen.getByText(/automatic retry system/i)).toBeInTheDocument();
    });

    it('should hide auto retry suggestion when disabled', () => {
      render(<GenerationFailed {...defaultProps} hasAutoRetry={false} />);

      expect(screen.queryByText(/automatic retry system/i)).not.toBeInTheDocument();
    });
  });

  describe('Try Again Button', () => {
    it('should display Try Again button', () => {
      render(<GenerationFailed {...defaultProps} />);

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should call onTryAgain when button clicked', () => {
      const onTryAgain = vi.fn();
      render(<GenerationFailed {...defaultProps} onTryAgain={onTryAgain} />);

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(onTryAgain).toHaveBeenCalledTimes(1);
    });
  });
});

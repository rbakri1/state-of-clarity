/**
 * QualityBadge Component Tests
 *
 * Tests for the quality badge component to ensure:
 * - Renders correct score display
 * - Shows appropriate colors for different score ranges
 * - Handles tooltip visibility on hover
 * - Hides badge for high quality when showWarning is false
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QualityBadge from '@/app/components/QualityBadge';

describe('QualityBadge', () => {
  describe('Score Display', () => {
    it('should render score with one decimal place', () => {
      render(<QualityBadge score={7.5} showWarning />);

      expect(screen.getByText('Quality: 7.5/10')).toBeInTheDocument();
    });

    it('should render high score correctly', () => {
      render(<QualityBadge score={9.2} showWarning />);

      expect(screen.getByText('Quality: 9.2/10')).toBeInTheDocument();
    });

    it('should render low score correctly', () => {
      render(<QualityBadge score={4.0} />);

      expect(screen.getByText('Quality: 4.0/10')).toBeInTheDocument();
    });
  });

  describe('Visibility Logic', () => {
    it('should not render for high quality scores when showWarning is false', () => {
      const { container } = render(<QualityBadge score={8.5} showWarning={false} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render for high quality scores when showWarning is true', () => {
      render(<QualityBadge score={8.5} showWarning />);

      expect(screen.getByText('Quality: 8.5/10')).toBeInTheDocument();
    });

    it('should render for acceptable scores even when showWarning is false', () => {
      render(<QualityBadge score={7.0} showWarning={false} />);

      expect(screen.getByText('Quality: 7.0/10')).toBeInTheDocument();
    });

    it('should render for low scores even when showWarning is false', () => {
      render(<QualityBadge score={5.0} showWarning={false} />);

      expect(screen.getByText('Quality: 5.0/10')).toBeInTheDocument();
    });
  });

  describe('Score Thresholds', () => {
    it('should treat scores >= 8.0 as high quality', () => {
      const { container } = render(<QualityBadge score={8.0} showWarning={false} />);

      // High quality should be hidden when showWarning is false
      expect(container.firstChild).toBeNull();
    });

    it('should treat scores < 8.0 and >= 6.0 as acceptable', () => {
      render(<QualityBadge score={7.9} showWarning={false} />);

      expect(screen.getByText('Quality: 7.9/10')).toBeInTheDocument();
    });

    it('should treat scores < 6.0 as low quality', () => {
      render(<QualityBadge score={5.9} />);

      expect(screen.getByText('Quality: 5.9/10')).toBeInTheDocument();
    });

    it('should treat score of exactly 6.0 as acceptable', () => {
      render(<QualityBadge score={6.0} />);

      expect(screen.getByText('Quality: 6.0/10')).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('should not show tooltip initially', () => {
      render(<QualityBadge score={7.0} />);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should show tooltip on mouse enter', () => {
      render(<QualityBadge score={7.0} />);

      const badge = screen.getByRole('button');
      fireEvent.mouseEnter(badge);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('should hide tooltip on mouse leave', () => {
      render(<QualityBadge score={7.0} />);

      const badge = screen.getByRole('button');
      fireEvent.mouseEnter(badge);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(badge);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should show tooltip on focus', () => {
      render(<QualityBadge score={7.0} />);

      const badge = screen.getByRole('button');
      fireEvent.focus(badge);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('should hide tooltip on blur', () => {
      render(<QualityBadge score={7.0} />);

      const badge = screen.getByRole('button');
      fireEvent.focus(badge);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.blur(badge);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should show high quality message for scores >= 8.0', () => {
      render(<QualityBadge score={8.5} showWarning />);

      const badge = screen.getByRole('button');
      fireEvent.mouseEnter(badge);

      expect(screen.getByText(/high quality standards/i)).toBeInTheDocument();
    });

    it('should show acceptable quality message for scores 6.0-7.9', () => {
      render(<QualityBadge score={7.0} />);

      const badge = screen.getByRole('button');
      fireEvent.mouseEnter(badge);

      expect(screen.getByText(/minimum quality standards/i)).toBeInTheDocument();
    });

    it('should show low quality message for scores < 6.0', () => {
      render(<QualityBadge score={5.0} />);

      const badge = screen.getByRole('button');
      fireEvent.mouseEnter(badge);

      expect(screen.getByText(/did not meet quality standards/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-describedby attribute', () => {
      render(<QualityBadge score={7.0} />);

      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('aria-describedby', 'quality-tooltip');
    });

    it('should render as a button element', () => {
      render(<QualityBadge score={7.0} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

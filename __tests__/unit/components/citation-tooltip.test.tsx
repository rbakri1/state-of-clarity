/**
 * CitationTooltip Component Tests
 *
 * Tests for the citation tooltip component to ensure:
 * - Renders citation number correctly
 * - Shows tooltip on hover with source information
 * - Hides tooltip on mouse leave
 * - Handles political lean display and styling
 * - Formats dates correctly
 * - Handles click events
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CitationTooltip, CitationSource } from '@/app/components/CitationTooltip';

describe('CitationTooltip', () => {
  const defaultSource: CitationSource = {
    id: 'source-1',
    title: 'Test Article Title',
    publisher: 'Test Publisher',
    publication_date: '2024-01-15',
    political_lean: 'center',
    credibility_score: 8.5,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render citation number correctly', () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      expect(screen.getByText('[1]')).toBeInTheDocument();
    });

    it('should render different citation numbers', () => {
      render(<CitationTooltip source={defaultSource} citationNumber={42} />);

      expect(screen.getByText('[42]')).toBeInTheDocument();
    });

    it('should not show tooltip initially', () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      expect(screen.queryByText('Test Article Title')).not.toBeInTheDocument();
    });
  });

  describe('Tooltip Visibility', () => {
    it('should show tooltip on mouse enter after delay', async () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      // Tooltip should not be visible immediately
      expect(screen.queryByText('Test Article Title')).not.toBeInTheDocument();

      // Advance timer past the delay
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    });

    it('should hide tooltip on mouse leave', async () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText('Test Article Title')).toBeInTheDocument();

      fireEvent.mouseLeave(trigger);

      expect(screen.queryByText('Test Article Title')).not.toBeInTheDocument();
    });

    it('should cancel tooltip if mouse leaves before delay completes', () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(50);
      });

      fireEvent.mouseLeave(trigger);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.queryByText('Test Article Title')).not.toBeInTheDocument();
    });
  });

  describe('Tooltip Content', () => {
    it('should display source title', async () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    });

    it('should display publisher', async () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText(/Test Publisher/)).toBeInTheDocument();
    });

    it('should display formatted date', async () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('should display credibility score', async () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText('Credibility:')).toBeInTheDocument();
      expect(screen.getByText('8.5/10')).toBeInTheDocument();
    });
  });

  describe('Political Lean Display', () => {
    it.each([
      ['left', 'Left'],
      ['center-left', 'Center-Left'],
      ['center', 'Center'],
      ['center-right', 'Center-Right'],
      ['right', 'Right'],
    ])('should format %s as %s', async (lean, expected) => {
      const source: CitationSource = {
        ...defaultSource,
        political_lean: lean as CitationSource['political_lean'],
      };

      render(<CitationTooltip source={source} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should display Unknown for null political lean', async () => {
      const source: CitationSource = {
        ...defaultSource,
        political_lean: null,
      };

      render(<CitationTooltip source={source} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should display Unknown for unknown political lean', async () => {
      const source: CitationSource = {
        ...defaultSource,
        political_lean: 'unknown',
      };

      render(<CitationTooltip source={source} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Null Handling', () => {
    it('should display Unknown publisher when publisher is null', async () => {
      const source: CitationSource = {
        ...defaultSource,
        publisher: null,
      };

      render(<CitationTooltip source={source} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText(/Unknown publisher/)).toBeInTheDocument();
    });

    it('should display Unknown date when publication_date is null', async () => {
      const source: CitationSource = {
        ...defaultSource,
        publication_date: null,
      };

      render(<CitationTooltip source={source} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText(/Unknown date/)).toBeInTheDocument();
    });

    it('should not display credibility score when null', async () => {
      const source: CitationSource = {
        ...defaultSource,
        credibility_score: null,
      };

      render(<CitationTooltip source={source} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.queryByText('Credibility:')).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onCitationClick when clicked', () => {
      const handleClick = vi.fn();
      render(
        <CitationTooltip
          source={defaultSource}
          citationNumber={1}
          onCitationClick={handleClick}
        />
      );

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.click(trigger);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onCitationClick is not provided', () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;

      expect(() => fireEvent.click(trigger)).not.toThrow();
    });
  });

  describe('Tooltip Hover Persistence', () => {
    it('should keep tooltip visible when hovering over tooltip itself', async () => {
      render(<CitationTooltip source={defaultSource} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const tooltip = screen.getByText('Test Article Title').closest('div[class*="absolute"]');
      expect(tooltip).toBeInTheDocument();

      // Move mouse to tooltip (tooltip has onMouseEnter/onMouseLeave handlers)
      fireEvent.mouseEnter(tooltip!);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Tooltip should still be visible when hovering over it
      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should handle invalid date string gracefully', async () => {
      const source: CitationSource = {
        ...defaultSource,
        publication_date: 'invalid-date',
      };

      render(<CitationTooltip source={source} citationNumber={1} />);

      const trigger = screen.getByText('[1]').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      // JavaScript Date parsing of 'invalid-date' returns 'Invalid Date'
      expect(screen.getByText(/Invalid Date/)).toBeInTheDocument();
    });
  });
});

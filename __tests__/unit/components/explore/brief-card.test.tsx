/**
 * BriefCard Component Tests
 *
 * Tests for the brief card component to ensure:
 * - Renders correctly with all required elements
 * - Displays correct clarity score with appropriate styling
 * - Shows reading time calculation
 * - Handles tag clicks properly
 * - Links to correct brief page
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BriefCard } from '@/components/explore/brief-card';
import type { Brief } from '@/lib/types/brief';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Helper function to create a mock brief
function createMockBrief(overrides: Partial<Brief> = {}): Brief {
  return {
    id: 'test-brief-123',
    question: 'What is the meaning of life?',
    summaries: [
      {
        level: 'undergrad',
        content: 'This is a test summary content that explains the meaning of life in simple terms.',
        word_count: 100,
        reading_time_minutes: 1,
      },
    ],
    narrative: 'A detailed narrative about the meaning of life.',
    structured_data: {},
    clarity_score: 8.5,
    sources: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    metadata: {
      tags: ['philosophy', 'life', 'meaning'],
    },
    ...overrides,
  };
}

describe('BriefCard', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const brief = createMockBrief();
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('What is the meaning of life?')).toBeInTheDocument();
    });

    it('should render the question as title', () => {
      const brief = createMockBrief({ question: 'How does gravity work?' });
      render(<BriefCard brief={brief} />);

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('How does gravity work?');
    });

    it('should render link to brief detail page', () => {
      const brief = createMockBrief({ id: 'brief-456' });
      render(<BriefCard brief={brief} />);

      const link = screen.getByRole('link', { name: /read brief/i });
      expect(link).toHaveAttribute('href', '/brief/brief-456');
    });

    it('should render excerpt from summary content', () => {
      const brief = createMockBrief({
        summaries: [
          {
            level: 'undergrad',
            content: 'This is the excerpt text that should be displayed on the card.',
            word_count: 10,
            reading_time_minutes: 1,
          },
        ],
      });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('This is the excerpt text that should be displayed on the card.')).toBeInTheDocument();
    });

    it('should truncate long excerpts', () => {
      const longContent = 'A'.repeat(150);
      const brief = createMockBrief({
        summaries: [
          {
            level: 'undergrad',
            content: longContent,
            word_count: 150,
            reading_time_minutes: 1,
          },
        ],
      });
      render(<BriefCard brief={brief} />);

      // Excerpt should be truncated to 117 chars + "..."
      const excerptElement = screen.getByText(/A+\.\.\./);
      expect(excerptElement.textContent?.length).toBeLessThanOrEqual(120);
    });

    it('should fall back to narrative if no summaries', () => {
      const brief = createMockBrief({
        summaries: [],
        narrative: 'This is the narrative fallback content.',
      });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('This is the narrative fallback content.')).toBeInTheDocument();
    });
  });

  describe('Clarity Score Display', () => {
    it('should display clarity score with one decimal place', () => {
      const brief = createMockBrief({ clarity_score: 8.5 });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('8.5/10')).toBeInTheDocument();
    });

    it('should handle clarity score as object with overall property', () => {
      const brief = createMockBrief({
        clarity_score: {
          overall: 7.2,
          dimensions: {
            first_principles: 7,
            internal_consistency: 7,
            evidence_quality: 7,
            accessibility: 7,
            objectivity: 7,
          },
          critique: 'Good brief',
        },
      });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('7.2/10')).toBeInTheDocument();
    });

    it('should normalize scores greater than 10 (0-100 scale)', () => {
      const brief = createMockBrief({ clarity_score: 85 });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('8.5/10')).toBeInTheDocument();
    });

    it('should apply success styles for high scores (>= 8.5)', () => {
      const brief = createMockBrief({ clarity_score: 9.0 });
      render(<BriefCard brief={brief} />);

      const scoreElement = screen.getByText('9.0/10').closest('div');
      expect(scoreElement).toHaveClass('bg-success-light');
      expect(scoreElement).toHaveClass('text-success-dark');
    });

    it('should apply warning styles for medium scores (>= 7.0, < 8.5)', () => {
      const brief = createMockBrief({ clarity_score: 7.5 });
      render(<BriefCard brief={brief} />);

      const scoreElement = screen.getByText('7.5/10').closest('div');
      expect(scoreElement).toHaveClass('bg-warning-light');
      expect(scoreElement).toHaveClass('text-warning-dark');
    });

    it('should apply error styles for low scores (< 7.0)', () => {
      const brief = createMockBrief({ clarity_score: 5.0 });
      render(<BriefCard brief={brief} />);

      const scoreElement = screen.getByText('5.0/10').closest('div');
      expect(scoreElement).toHaveClass('bg-error-light');
      expect(scoreElement).toHaveClass('text-error-dark');
    });
  });

  describe('Reading Time', () => {
    it('should display reading time', () => {
      const brief = createMockBrief({
        summaries: [
          {
            level: 'undergrad',
            content: 'Short content.',
            word_count: 50,
            reading_time_minutes: 1,
          },
        ],
      });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('1 min')).toBeInTheDocument();
    });

    it('should calculate reading time based on word count (200 wpm)', () => {
      // 400 words should be 2 minutes
      const words = Array(400).fill('word').join(' ');
      const brief = createMockBrief({
        summaries: [
          {
            level: 'undergrad',
            content: words,
            word_count: 400,
            reading_time_minutes: 2,
          },
        ],
      });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('2 min')).toBeInTheDocument();
    });

    it('should show minimum 1 minute for very short content', () => {
      const brief = createMockBrief({
        summaries: [
          {
            level: 'undergrad',
            content: 'Hi',
            word_count: 1,
            reading_time_minutes: 1,
          },
        ],
      });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('1 min')).toBeInTheDocument();
    });
  });

  describe('Tags', () => {
    it('should render tags', () => {
      const brief = createMockBrief({
        metadata: { tags: ['science', 'physics', 'education'] },
      });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('science')).toBeInTheDocument();
      expect(screen.getByText('physics')).toBeInTheDocument();
      expect(screen.getByText('education')).toBeInTheDocument();
    });

    it('should limit displayed tags to 3', () => {
      const brief = createMockBrief({
        metadata: { tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] },
      });
      render(<BriefCard brief={brief} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.queryByText('tag4')).not.toBeInTheDocument();
      expect(screen.queryByText('tag5')).not.toBeInTheDocument();
    });

    it('should not render tags section when no tags exist', () => {
      const brief = createMockBrief({ metadata: { tags: [] } });
      render(<BriefCard brief={brief} />);

      // Check that there are no tag buttons
      const tagButtons = screen.queryAllByRole('button');
      expect(tagButtons).toHaveLength(0);
    });

    it('should not render tags section when metadata is undefined', () => {
      const brief = createMockBrief({ metadata: undefined });
      render(<BriefCard brief={brief} />);

      const tagButtons = screen.queryAllByRole('button');
      expect(tagButtons).toHaveLength(0);
    });
  });

  describe('Tag Interactions', () => {
    it('should call onTagClick when a tag is clicked', () => {
      const onTagClick = vi.fn();
      const brief = createMockBrief({
        metadata: { tags: ['science', 'physics'] },
      });
      render(<BriefCard brief={brief} onTagClick={onTagClick} />);

      fireEvent.click(screen.getByText('science'));

      expect(onTagClick).toHaveBeenCalledWith('science');
      expect(onTagClick).toHaveBeenCalledTimes(1);
    });

    it('should prevent event propagation when tag is clicked', () => {
      const onTagClick = vi.fn();
      const brief = createMockBrief({
        metadata: { tags: ['science'] },
      });
      render(<BriefCard brief={brief} onTagClick={onTagClick} />);

      const tagButton = screen.getByText('science');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

      fireEvent(tagButton, clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not throw when clicking tag without onTagClick handler', () => {
      const brief = createMockBrief({
        metadata: { tags: ['science'] },
      });
      render(<BriefCard brief={brief} />);

      expect(() => {
        fireEvent.click(screen.getByText('science'));
      }).not.toThrow();
    });

    it('should apply cursor-pointer class when onTagClick is provided', () => {
      const onTagClick = vi.fn();
      const brief = createMockBrief({
        metadata: { tags: ['science'] },
      });
      render(<BriefCard brief={brief} onTagClick={onTagClick} />);

      const tagButton = screen.getByText('science');
      expect(tagButton).toHaveClass('cursor-pointer');
    });

    it('should apply cursor-default class when onTagClick is not provided', () => {
      const brief = createMockBrief({
        metadata: { tags: ['science'] },
      });
      render(<BriefCard brief={brief} />);

      const tagButton = screen.getByText('science');
      expect(tagButton).toHaveClass('cursor-default');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible link label', () => {
      const brief = createMockBrief({ question: 'What is AI?' });
      render(<BriefCard brief={brief} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Read brief: What is AI?');
    });

    it('should have aria-hidden on decorative icons', () => {
      const brief = createMockBrief();
      const { container } = render(<BriefCard brief={brief} />);

      // Both Target and Clock icons should be aria-hidden
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Summary Object Format', () => {
    it('should handle summaries as Record format', () => {
      const brief = createMockBrief({
        summaries: {
          child: 'Child level summary',
          teen: 'Teen level summary',
          undergrad: 'Undergrad level summary',
          postdoc: 'Postdoc level summary',
        } as unknown as Brief['summaries'],
      });
      render(<BriefCard brief={brief} />);

      // Should use the first value from the object
      expect(screen.getByText('Child level summary')).toBeInTheDocument();
    });
  });
});

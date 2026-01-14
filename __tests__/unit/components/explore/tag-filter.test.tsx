/**
 * TagFilter Component Tests
 *
 * Tests for the tag filter component to ensure:
 * - Renders correctly with tags
 * - Shows loading skeleton state
 * - Handles empty tags state
 * - Toggle tags correctly
 * - Shows correct visual state for selected/unselected tags
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagFilter } from '@/components/explore/tag-filter';

interface TagWithCount {
  tag: string;
  count: number;
}

const mockTags: TagWithCount[] = [
  { tag: 'technology', count: 15 },
  { tag: 'science', count: 12 },
  { tag: 'philosophy', count: 8 },
  { tag: 'economics', count: 5 },
];

describe('TagFilter', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />);

      expect(screen.getByText('Filter by Tags')).toBeInTheDocument();
    });

    it('should render all tags', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />);

      expect(screen.getByText('technology')).toBeInTheDocument();
      expect(screen.getByText('science')).toBeInTheDocument();
      expect(screen.getByText('philosophy')).toBeInTheDocument();
      expect(screen.getByText('economics')).toBeInTheDocument();
    });

    it('should render tag counts', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />);

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render tags as buttons', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    it('should render heading with correct text', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />);

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Filter by Tags');
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading is true', () => {
      const onTagToggle = vi.fn();
      const { container } = render(
        <TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} isLoading={true} />
      );

      // Check for skeleton elements with animate-pulse class
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show heading in loading state', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} isLoading={true} />
      );

      expect(screen.getByText('Filter by Tags')).toBeInTheDocument();
    });

    it('should not render tag buttons in loading state', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} isLoading={true} />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render 8 skeleton placeholders', () => {
      const onTagToggle = vi.fn();
      const { container } = render(
        <TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} isLoading={true} />
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(8);
    });
  });

  describe('Empty State', () => {
    it('should return null when tags array is empty', () => {
      const onTagToggle = vi.fn();
      const { container } = render(
        <TagFilter tags={[]} selectedTags={[]} onTagToggle={onTagToggle} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render heading when tags are empty', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={[]} selectedTags={[]} onTagToggle={onTagToggle} />);

      expect(screen.queryByText('Filter by Tags')).not.toBeInTheDocument();
    });
  });

  describe('Tag Toggle Functionality', () => {
    it('should call onTagToggle when a tag is clicked', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />);

      fireEvent.click(screen.getByText('technology'));

      expect(onTagToggle).toHaveBeenCalledWith('technology');
      expect(onTagToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onTagToggle with correct tag when different tags are clicked', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />);

      fireEvent.click(screen.getByText('science'));
      expect(onTagToggle).toHaveBeenCalledWith('science');

      fireEvent.click(screen.getByText('philosophy'));
      expect(onTagToggle).toHaveBeenCalledWith('philosophy');
    });

    it('should call onTagToggle for already selected tags (to deselect)', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter tags={mockTags} selectedTags={['technology']} onTagToggle={onTagToggle} />
      );

      fireEvent.click(screen.getByText('technology'));

      expect(onTagToggle).toHaveBeenCalledWith('technology');
    });
  });

  describe('Selected State Styling', () => {
    it('should apply active styles to selected tags', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter tags={mockTags} selectedTags={['technology']} onTagToggle={onTagToggle} />
      );

      const technologyButton = screen.getByText('technology').closest('button');
      expect(technologyButton).toHaveClass('bg-sage-500');
      expect(technologyButton).toHaveClass('text-white');
    });

    it('should apply inactive styles to unselected tags', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter tags={mockTags} selectedTags={['technology']} onTagToggle={onTagToggle} />
      );

      const scienceButton = screen.getByText('science').closest('button');
      expect(scienceButton).toHaveClass('bg-ivory-200');
      expect(scienceButton).toHaveClass('text-ink-600');
    });

    it('should support multiple selected tags', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selectedTags={['technology', 'science']}
          onTagToggle={onTagToggle}
        />
      );

      const technologyButton = screen.getByText('technology').closest('button');
      const scienceButton = screen.getByText('science').closest('button');

      expect(technologyButton).toHaveClass('bg-sage-500');
      expect(scienceButton).toHaveClass('bg-sage-500');
    });

    it('should apply different count badge styles for selected vs unselected', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter tags={mockTags} selectedTags={['technology']} onTagToggle={onTagToggle} />
      );

      // Find the count badge for technology (selected)
      const technologyButton = screen.getByText('technology').closest('button');
      const selectedCountBadge = technologyButton?.querySelector('span:last-child');
      expect(selectedCountBadge).toHaveClass('bg-sage-600');
      expect(selectedCountBadge).toHaveClass('text-sage-100');

      // Find the count badge for science (unselected)
      const scienceButton = screen.getByText('science').closest('button');
      const unselectedCountBadge = scienceButton?.querySelector('span:last-child');
      expect(unselectedCountBadge).toHaveClass('bg-ivory-400');
      expect(unselectedCountBadge).toHaveClass('text-ink-500');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-pressed attribute on tag buttons', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter tags={mockTags} selectedTags={['technology']} onTagToggle={onTagToggle} />
      );

      const technologyButton = screen.getByText('technology').closest('button');
      const scienceButton = screen.getByText('science').closest('button');

      expect(technologyButton).toHaveAttribute('aria-pressed', 'true');
      expect(scienceButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update aria-pressed when selection changes', () => {
      const onTagToggle = vi.fn();
      const { rerender } = render(
        <TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />
      );

      const technologyButton = screen.getByText('technology').closest('button');
      expect(technologyButton).toHaveAttribute('aria-pressed', 'false');

      rerender(
        <TagFilter tags={mockTags} selectedTags={['technology']} onTagToggle={onTagToggle} />
      );

      expect(technologyButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have type="button" on all tag buttons', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single tag', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter tags={[{ tag: 'solo', count: 1 }]} selectedTags={[]} onTagToggle={onTagToggle} />
      );

      expect(screen.getByText('solo')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should handle tag with zero count', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter
          tags={[{ tag: 'empty', count: 0 }]}
          selectedTags={[]}
          onTagToggle={onTagToggle}
        />
      );

      expect(screen.getByText('empty')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle tag with high count', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter
          tags={[{ tag: 'popular', count: 9999 }]}
          selectedTags={[]}
          onTagToggle={onTagToggle}
        />
      );

      expect(screen.getByText('popular')).toBeInTheDocument();
      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    it('should handle tags with special characters', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter
          tags={[{ tag: 'C++', count: 5 }]}
          selectedTags={[]}
          onTagToggle={onTagToggle}
        />
      );

      expect(screen.getByText('C++')).toBeInTheDocument();
    });

    it('should handle selectedTags that do not exist in tags array', () => {
      const onTagToggle = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selectedTags={['nonexistent']}
          onTagToggle={onTagToggle}
        />
      );

      // Should still render normally without errors
      expect(screen.getByText('technology')).toBeInTheDocument();
      // All visible tags should be unselected
      const technologyButton = screen.getByText('technology').closest('button');
      expect(technologyButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Default Props', () => {
    it('should default isLoading to false', () => {
      const onTagToggle = vi.fn();
      render(<TagFilter tags={mockTags} selectedTags={[]} onTagToggle={onTagToggle} />);

      // Should render tags, not skeleton
      expect(screen.getByText('technology')).toBeInTheDocument();
    });
  });
});

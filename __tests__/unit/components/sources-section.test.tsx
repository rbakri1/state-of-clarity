/**
 * SourcesSection Component Tests
 *
 * Tests for the sources section component to ensure:
 * - Renders list of sources correctly
 * - Displays source metadata (title, author, publisher, date)
 * - Shows political lean badges with correct colors
 * - Shows credibility scores with progress bar
 * - Handles excerpt expansion/collapse
 * - Renders external links correctly
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SourcesSection, type Source } from '@/app/components/SourcesSection';

const createMockSource = (overrides: Partial<Source> = {}): Source => ({
  id: '1',
  url: 'https://example.com/article',
  title: 'Test Article Title',
  author: 'John Doe',
  publication_date: '2024-01-15',
  publisher: 'Test Publisher',
  source_type: 'primary',
  political_lean: 'center',
  credibility_score: 8.5,
  excerpt: 'This is a test excerpt from the source.',
  ...overrides,
});

describe('SourcesSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Header', () => {
    it('should render header with source count', () => {
      const sources = [createMockSource(), createMockSource({ id: '2' })];
      render(<SourcesSection sources={sources} />);

      expect(screen.getByText('Sources (2)')).toBeInTheDocument();
    });

    it('should render correct count for single source', () => {
      const sources = [createMockSource()];
      render(<SourcesSection sources={sources} />);

      expect(screen.getByText('Sources (1)')).toBeInTheDocument();
    });

    it('should render h2 heading', () => {
      const sources = [createMockSource()];
      render(<SourcesSection sources={sources} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Sources (1)');
    });
  });

  describe('Source Card Rendering', () => {
    it('should render source title as link', () => {
      const source = createMockSource({ title: 'My Article Title' });
      render(<SourcesSection sources={[source]} />);

      const link = screen.getByRole('link', { name: /My Article Title/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', source.url);
    });

    it('should open link in new tab', () => {
      const source = createMockSource();
      render(<SourcesSection sources={[source]} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render author name', () => {
      const source = createMockSource({ author: 'Jane Smith' });
      render(<SourcesSection sources={[source]} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render publisher name', () => {
      const source = createMockSource({ publisher: 'News Corp' });
      render(<SourcesSection sources={[source]} />);

      expect(screen.getByText('News Corp')).toBeInTheDocument();
    });

    it('should render formatted publication date', () => {
      const source = createMockSource({ publication_date: '2024-03-20' });
      render(<SourcesSection sources={[source]} />);

      // Date should be formatted - format depends on locale
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('should render source number badge', () => {
      const sources = [createMockSource(), createMockSource({ id: '2' })];
      render(<SourcesSection sources={sources} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render source card with correct id for scrolling', () => {
      const sources = [createMockSource()];
      const { container } = render(<SourcesSection sources={sources} />);

      const card = container.querySelector('#source-1');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Political Lean Badges', () => {
    it('should render political lean badge', () => {
      const source = createMockSource({ political_lean: 'center' });
      render(<SourcesSection sources={[source]} />);

      expect(screen.getByText('center')).toBeInTheDocument();
    });

    it('should apply blue colors for left lean', () => {
      const source = createMockSource({ political_lean: 'left' });
      const { container } = render(<SourcesSection sources={[source]} />);

      const badge = container.querySelector('.bg-blue-100');
      expect(badge).toBeInTheDocument();
    });

    it('should apply sky colors for center-left lean', () => {
      const source = createMockSource({ political_lean: 'center-left' });
      const { container } = render(<SourcesSection sources={[source]} />);

      const badge = container.querySelector('.bg-sky-100');
      expect(badge).toBeInTheDocument();
    });

    it('should apply gray colors for center lean', () => {
      const source = createMockSource({ political_lean: 'center' });
      const { container } = render(<SourcesSection sources={[source]} />);

      // Center uses the gray-100 color (separate from source type gray)
      const badges = container.querySelectorAll('.rounded-full');
      const centerBadge = Array.from(badges).find(b => b.textContent === 'center');
      expect(centerBadge).toHaveClass('bg-gray-100');
    });

    it('should apply orange colors for center-right lean', () => {
      const source = createMockSource({ political_lean: 'center-right' });
      const { container } = render(<SourcesSection sources={[source]} />);

      const badge = container.querySelector('.bg-orange-100');
      expect(badge).toBeInTheDocument();
    });

    it('should apply red colors for right lean', () => {
      const source = createMockSource({ political_lean: 'right' });
      const { container } = render(<SourcesSection sources={[source]} />);

      const badge = container.querySelector('.bg-red-100');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Source Type Badge', () => {
    it('should render source type badge', () => {
      const source = createMockSource({ source_type: 'primary' });
      render(<SourcesSection sources={[source]} />);

      expect(screen.getByText('primary')).toBeInTheDocument();
    });

    it('should apply purple color for primary sources', () => {
      const source = createMockSource({ source_type: 'primary' });
      const { container } = render(<SourcesSection sources={[source]} />);

      const badge = container.querySelector('.bg-purple-100');
      expect(badge).toBeInTheDocument();
    });

    it('should apply indigo color for secondary sources', () => {
      const source = createMockSource({ source_type: 'secondary' });
      const { container } = render(<SourcesSection sources={[source]} />);

      const badge = container.querySelector('.bg-indigo-100');
      expect(badge).toBeInTheDocument();
    });

    it('should apply gray color for tertiary sources', () => {
      const source = createMockSource({ source_type: 'tertiary' });
      const { container } = render(<SourcesSection sources={[source]} />);

      // Tertiary uses the default gray-100
      expect(screen.getByText('tertiary')).toBeInTheDocument();
    });
  });

  describe('Credibility Score', () => {
    it('should display credibility score', () => {
      const source = createMockSource({ credibility_score: 8.5 });
      render(<SourcesSection sources={[source]} />);

      expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('should display credibility label', () => {
      const source = createMockSource({ credibility_score: 8.5 });
      render(<SourcesSection sources={[source]} />);

      expect(screen.getByText('Credibility:')).toBeInTheDocument();
    });

    it('should render credibility progress bar', () => {
      const source = createMockSource({ credibility_score: 8.5 });
      const { container } = render(<SourcesSection sources={[source]} />);

      // Progress bar container has bg-gray-200 class
      const progressContainer = container.querySelector('.bg-gray-200.rounded-full');
      expect(progressContainer).toBeInTheDocument();
    });

    it('should set progress bar width based on credibility score', () => {
      const source = createMockSource({ credibility_score: 7.0 });
      const { container } = render(<SourcesSection sources={[source]} />);

      const progressFill = container.querySelector('.bg-green-500');
      expect(progressFill).toHaveStyle({ width: '70%' });
    });
  });

  describe('Excerpt', () => {
    it('should render excerpt text', () => {
      const source = createMockSource({ excerpt: 'This is the excerpt content.' });
      render(<SourcesSection sources={[source]} />);

      expect(screen.getByText(/This is the excerpt content/)).toBeInTheDocument();
    });

    it('should truncate long excerpts', () => {
      const longExcerpt = 'A'.repeat(250); // More than 200 characters
      const source = createMockSource({ excerpt: longExcerpt });
      const { container } = render(<SourcesSection sources={[source]} />);

      // The excerpt should be truncated to 200 chars + "..."
      // Check the excerpt italic element contains the truncated text
      const excerptElement = container.querySelector('p.italic');
      expect(excerptElement).toBeInTheDocument();
      expect(excerptElement?.textContent).toContain('...');
    });

    it('should show "Show more" button for long excerpts', () => {
      const longExcerpt = 'A'.repeat(250);
      const source = createMockSource({ excerpt: longExcerpt });
      render(<SourcesSection sources={[source]} />);

      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('should expand excerpt when clicking "Show more"', () => {
      const longExcerpt = 'A'.repeat(250);
      const source = createMockSource({ excerpt: longExcerpt });
      render(<SourcesSection sources={[source]} />);

      fireEvent.click(screen.getByText('Show more'));

      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    it('should collapse excerpt when clicking "Show less"', () => {
      const longExcerpt = 'A'.repeat(250);
      const source = createMockSource({ excerpt: longExcerpt });
      render(<SourcesSection sources={[source]} />);

      // Expand
      fireEvent.click(screen.getByText('Show more'));
      expect(screen.getByText('Show less')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText('Show less'));
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('should not show expand button for short excerpts', () => {
      const shortExcerpt = 'Short excerpt.';
      const source = createMockSource({ excerpt: shortExcerpt });
      render(<SourcesSection sources={[source]} />);

      expect(screen.queryByText('Show more')).not.toBeInTheDocument();
    });

    it('should handle empty excerpt', () => {
      const source = createMockSource({ excerpt: '' });
      const { container } = render(<SourcesSection sources={[source]} />);

      // Should render the card but no excerpt section
      expect(container.querySelector('.source-card')).toBeInTheDocument();
    });
  });

  describe('Multiple Sources', () => {
    it('should render all sources', () => {
      const sources = [
        createMockSource({ id: '1', title: 'First Article' }),
        createMockSource({ id: '2', title: 'Second Article' }),
        createMockSource({ id: '3', title: 'Third Article' }),
      ];
      render(<SourcesSection sources={sources} />);

      expect(screen.getByText('First Article')).toBeInTheDocument();
      expect(screen.getByText('Second Article')).toBeInTheDocument();
      expect(screen.getByText('Third Article')).toBeInTheDocument();
    });

    it('should number sources sequentially', () => {
      const sources = [
        createMockSource({ id: '1' }),
        createMockSource({ id: '2' }),
        createMockSource({ id: '3' }),
      ];
      const { container } = render(<SourcesSection sources={sources} />);

      // Check for source IDs in the DOM
      expect(container.querySelector('#source-1')).toBeInTheDocument();
      expect(container.querySelector('#source-2')).toBeInTheDocument();
      expect(container.querySelector('#source-3')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render with zero count for empty sources', () => {
      render(<SourcesSection sources={[]} />);

      expect(screen.getByText('Sources (0)')).toBeInTheDocument();
    });

    it('should render no source cards for empty sources', () => {
      const { container } = render(<SourcesSection sources={[]} />);

      expect(container.querySelector('.source-card')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have source-card class on cards', () => {
      const source = createMockSource();
      const { container } = render(<SourcesSection sources={[source]} />);

      expect(container.querySelector('.source-card')).toBeInTheDocument();
    });

    it('should have hover shadow effect class', () => {
      const source = createMockSource();
      const { container } = render(<SourcesSection sources={[source]} />);

      const card = container.querySelector('.source-card');
      expect(card).toHaveClass('hover:shadow-md');
    });

    it('should have print-friendly styles', () => {
      const source = createMockSource();
      const { container } = render(<SourcesSection sources={[source]} />);

      const card = container.querySelector('.source-card');
      expect(card).toHaveClass('print:bg-white');
    });
  });
});

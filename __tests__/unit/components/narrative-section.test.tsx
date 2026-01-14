/**
 * NarrativeSection Component Tests
 *
 * Tests for the narrative section component to ensure:
 * - Renders narrative text correctly
 * - Parses citation markers [1], [2], etc.
 * - Renders CitationTooltip components for valid citations
 * - Handles invalid citation numbers gracefully
 * - Splits text into paragraphs correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { NarrativeSection } from '@/app/components/NarrativeSection';

const mockSources = [
  {
    id: '1',
    url: 'https://example.com/source1',
    title: 'First Source Title',
    author: 'John Doe',
    publisher: 'News Publisher',
    publication_date: '2024-01-15',
    source_type: 'primary' as const,
    political_lean: 'center' as const,
    credibility_score: 8.5,
    excerpt: 'This is an excerpt from the first source.',
  },
  {
    id: '2',
    url: 'https://example.com/source2',
    title: 'Second Source Title',
    author: 'Jane Smith',
    publisher: 'Academic Journal',
    publication_date: '2024-02-20',
    source_type: 'secondary' as const,
    political_lean: 'center-left' as const,
    credibility_score: 9.0,
    excerpt: 'This is an excerpt from the second source.',
  },
];

describe('NarrativeSection', () => {
  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render narrative text', () => {
      const narrative = 'This is a simple narrative without any citations.';
      render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      expect(screen.getByText(narrative)).toBeInTheDocument();
    });

    it('should render within prose container', () => {
      const narrative = 'Test narrative content.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const proseContainer = container.querySelector('.prose');
      expect(proseContainer).toBeInTheDocument();
    });

    it('should render in prose-clarity style', () => {
      const narrative = 'Test narrative content.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const proseContainer = container.querySelector('.prose-clarity');
      expect(proseContainer).toBeInTheDocument();
    });

    it('should set max-width to 65ch', () => {
      const narrative = 'Test narrative content.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const proseContainer = container.querySelector('.prose');
      expect(proseContainer).toHaveStyle({ maxWidth: '65ch' });
    });
  });

  describe('Paragraph Handling', () => {
    it('should split narrative into paragraphs on double newlines', () => {
      const narrative = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3);
    });

    it('should render each paragraph with mb-4 class', () => {
      const narrative = 'First paragraph.\n\nSecond paragraph.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const paragraphs = container.querySelectorAll('p');
      paragraphs.forEach(p => {
        expect(p).toHaveClass('mb-4');
      });
    });

    it('should render paragraphs with leading-relaxed class', () => {
      const narrative = 'First paragraph.\n\nSecond paragraph.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const paragraphs = container.querySelectorAll('p');
      paragraphs.forEach(p => {
        expect(p).toHaveClass('leading-relaxed');
      });
    });

    it('should handle single paragraph narrative', () => {
      const narrative = 'This is a single paragraph with no breaks.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(1);
    });
  });

  describe('Citation Parsing', () => {
    it('should render citation markers as superscript', () => {
      const narrative = 'This is a fact [1] from a source.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const superscript = container.querySelector('sup');
      expect(superscript).toBeInTheDocument();
      expect(superscript).toHaveTextContent('[1]');
    });

    it('should render multiple citations in same paragraph', () => {
      const narrative = 'First fact [1] and second fact [2].';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const superscripts = container.querySelectorAll('sup');
      expect(superscripts).toHaveLength(2);
      expect(superscripts[0]).toHaveTextContent('[1]');
      expect(superscripts[1]).toHaveTextContent('[2]');
    });

    it('should preserve text before citation', () => {
      const narrative = 'Some important text [1] after citation.';
      render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      expect(screen.getByText(/Some important text/)).toBeInTheDocument();
    });

    it('should preserve text after citation', () => {
      const narrative = 'Before citation [1] after citation.';
      render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      expect(screen.getByText(/after citation/)).toBeInTheDocument();
    });
  });

  describe('Invalid Citations', () => {
    it('should render citation as plain text when source not found', () => {
      const narrative = 'This references a non-existent source [99].';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const superscript = container.querySelector('sup');
      expect(superscript).toBeInTheDocument();
      expect(superscript).toHaveTextContent('[99]');
      // Should have muted foreground color for invalid citation
      expect(superscript).toHaveClass('text-muted-foreground');
    });

    it('should handle citation number 0 (no matching source)', () => {
      const narrative = 'Invalid citation [0].';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const superscript = container.querySelector('sup');
      expect(superscript).toBeInTheDocument();
      expect(superscript).toHaveClass('text-muted-foreground');
    });
  });

  describe('Empty States', () => {
    it('should render empty state when narrative is empty', () => {
      const { container } = render(<NarrativeSection narrative="" sources={mockSources} />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(1);
      expect(paragraphs[0]).toHaveTextContent('');
    });

    it('should handle empty sources array', () => {
      const narrative = 'Text with citation [1].';
      const { container } = render(<NarrativeSection narrative={narrative} sources={[]} />);

      // Should still render the citation marker as plain text
      const superscript = container.querySelector('sup');
      expect(superscript).toBeInTheDocument();
    });
  });

  describe('Text with Citations', () => {
    it('should handle citation at beginning of text', () => {
      const narrative = '[1] This starts with a citation.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const superscript = container.querySelector('sup');
      expect(superscript).toBeInTheDocument();
      expect(screen.getByText(/This starts with a citation/)).toBeInTheDocument();
    });

    it('should handle citation at end of text', () => {
      const narrative = 'This ends with a citation [1]';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const superscript = container.querySelector('sup');
      expect(superscript).toBeInTheDocument();
      expect(screen.getByText(/This ends with a citation/)).toBeInTheDocument();
    });

    it('should handle consecutive citations', () => {
      const narrative = 'Multiple sources support this [1][2].';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const superscripts = container.querySelectorAll('sup');
      expect(superscripts).toHaveLength(2);
    });
  });

  describe('Styling', () => {
    it('should have text-base class on paragraphs', () => {
      const narrative = 'Test paragraph.';
      const { container } = render(<NarrativeSection narrative={narrative} sources={mockSources} />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('text-base');
    });
  });
});

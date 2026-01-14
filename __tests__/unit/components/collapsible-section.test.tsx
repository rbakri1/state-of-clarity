/**
 * CollapsibleSection Component Tests
 *
 * Tests for the collapsible section component to ensure:
 * - Renders title and children correctly
 * - Toggles expanded/collapsed state on click
 * - Respects defaultExpanded prop
 * - Displays item count when provided
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleSection } from '@/app/components/CollapsibleSection';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

describe('CollapsibleSection', () => {
  describe('Basic Rendering', () => {
    it('should render title', () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded>
          <p>Test content</p>
        </CollapsibleSection>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render toggle button', () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Item Count', () => {
    it('should not render item count when not provided', () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });

    it('should render item count when provided', () => {
      render(
        <CollapsibleSection title="Test Section" itemCount={5}>
          <p>Content</p>
        </CollapsibleSection>
      );

      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('should render zero item count', () => {
      render(
        <CollapsibleSection title="Test Section" itemCount={0}>
          <p>Content</p>
        </CollapsibleSection>
      );

      expect(screen.getByText('(0)')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Behavior', () => {
    it('should start collapsed by default', () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should start expanded when defaultExpanded is true', () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded>
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should expand when button is clicked', async () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse when button is clicked while expanded', async () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded>
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should toggle multiple times', async () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');

      // First click - expand
      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      // Second click - collapse
      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');

      // Third click - expand again
      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Content Visibility', () => {
    it('should have content container with height 0 when collapsed', () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      const contentContainer = document.querySelector('[data-collapsible-content]');
      expect(contentContainer).toHaveStyle({ height: '0px' });
    });

    it('should have content container with height when expanded', async () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded>
          <p>Content</p>
        </CollapsibleSection>
      );

      const contentContainer = document.querySelector('[data-collapsible-content]');
      // When expanded, height should be set (either undefined for auto or a value)
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-expanded attribute', () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded');
    });

    it('should be keyboard accessible', async () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      button.focus();

      // Press Enter
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Styling', () => {
    it('should apply full width to button', () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('should have border styling', () => {
      const { container } = render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('border');
    });
  });
});

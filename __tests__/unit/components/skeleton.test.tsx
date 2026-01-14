/**
 * Skeleton Component Tests
 *
 * Tests for the skeleton loading component to ensure:
 * - Renders correct structure for each variant
 * - Has proper accessibility attributes
 * - Applies animation classes
 * - Handles custom classNames
 * - Respects lines prop for paragraph variant
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '@/app/components/Skeleton';

describe('Skeleton', () => {
  describe('Default/Text Variant', () => {
    it('should render with default text variant', () => {
      render(<Skeleton />);

      const skeleton = document.querySelector('[aria-hidden="true"]');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have animation class', () => {
      render(<Skeleton />);

      const skeleton = document.querySelector('[aria-hidden="true"]');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should have correct base classes for text variant', () => {
      render(<Skeleton />);

      const skeleton = document.querySelector('[aria-hidden="true"]');
      expect(skeleton).toHaveClass('bg-gray-200');
      expect(skeleton).toHaveClass('rounded');
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-full');
    });

    it('should be hidden from screen readers', () => {
      render(<Skeleton />);

      const skeleton = document.querySelector('[aria-hidden="true"]');
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" />);

      const skeleton = document.querySelector('[aria-hidden="true"]');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('Paragraph Variant', () => {
    it('should render multiple lines', () => {
      render(<Skeleton variant="paragraph" />);

      // Default is 3 lines
      const container = document.querySelector('.space-y-2');
      expect(container).toBeInTheDocument();

      const lines = container?.querySelectorAll('.animate-pulse');
      expect(lines?.length).toBe(3);
    });

    it('should render custom number of lines', () => {
      render(<Skeleton variant="paragraph" lines={5} />);

      const container = document.querySelector('.space-y-2');
      const lines = container?.querySelectorAll('.animate-pulse');
      expect(lines?.length).toBe(5);
    });

    it('should make last line shorter', () => {
      render(<Skeleton variant="paragraph" lines={3} />);

      const container = document.querySelector('.space-y-2');
      const lines = container?.querySelectorAll('.animate-pulse');

      // First two lines should be full width
      expect(lines?.[0]).toHaveClass('w-full');
      expect(lines?.[1]).toHaveClass('w-full');

      // Last line should be 3/4 width
      expect(lines?.[2]).toHaveClass('w-3/4');
    });

    it('should have aria-hidden on container', () => {
      render(<Skeleton variant="paragraph" />);

      const container = document.querySelector('.space-y-2');
      expect(container).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply custom className to container', () => {
      render(<Skeleton variant="paragraph" className="custom-paragraph" />);

      const container = document.querySelector('.space-y-2');
      expect(container).toHaveClass('custom-paragraph');
    });
  });

  describe('Card Variant', () => {
    it('should render card structure', () => {
      render(<Skeleton variant="card" />);

      const card = document.querySelector('.rounded-lg.border');
      expect(card).toBeInTheDocument();
    });

    it('should have border styling', () => {
      render(<Skeleton variant="card" />);

      const card = document.querySelector('.rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-gray-200');
    });

    it('should have padding', () => {
      render(<Skeleton variant="card" />);

      const card = document.querySelector('.rounded-lg');
      expect(card).toHaveClass('p-4');
    });

    it('should have spacing between elements', () => {
      render(<Skeleton variant="card" />);

      const card = document.querySelector('.rounded-lg');
      expect(card).toHaveClass('space-y-3');
    });

    it('should render title skeleton', () => {
      render(<Skeleton variant="card" />);

      // Title is 2/3 width
      const title = document.querySelector('.w-2\\/3.h-4');
      expect(title).toBeInTheDocument();
    });

    it('should render content lines', () => {
      render(<Skeleton variant="card" />);

      // Content lines container
      const contentContainer = document.querySelector('.space-y-2');
      expect(contentContainer).toBeInTheDocument();

      // Should have 3 content lines with varying widths
      expect(document.querySelector('.w-5\\/6')).toBeInTheDocument();
      expect(document.querySelector('.w-4\\/6')).toBeInTheDocument();
    });

    it('should render button skeleton', () => {
      render(<Skeleton variant="card" />);

      // Button is h-8 w-24
      const button = document.querySelector('.h-8.w-24');
      expect(button).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Skeleton variant="card" className="custom-card" />);

      const card = document.querySelector('.rounded-lg');
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('Avatar Variant', () => {
    it('should render circular shape', () => {
      render(<Skeleton variant="avatar" />);

      const avatar = document.querySelector('[aria-hidden="true"]');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('should have default dimensions', () => {
      render(<Skeleton variant="avatar" />);

      const avatar = document.querySelector('[aria-hidden="true"]');
      expect(avatar).toHaveClass('h-10');
      expect(avatar).toHaveClass('w-10');
    });

    it('should have animation class', () => {
      render(<Skeleton variant="avatar" />);

      const avatar = document.querySelector('[aria-hidden="true"]');
      expect(avatar).toHaveClass('animate-pulse');
    });

    it('should apply custom className', () => {
      render(<Skeleton variant="avatar" className="custom-avatar" />);

      const avatar = document.querySelector('[aria-hidden="true"]');
      expect(avatar).toHaveClass('custom-avatar');
    });
  });

  describe('Button Variant', () => {
    it('should render button shape', () => {
      render(<Skeleton variant="button" />);

      const button = document.querySelector('[aria-hidden="true"]');
      expect(button).toHaveClass('rounded-md');
    });

    it('should have default dimensions', () => {
      render(<Skeleton variant="button" />);

      const button = document.querySelector('[aria-hidden="true"]');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-24');
    });

    it('should have animation class', () => {
      render(<Skeleton variant="button" />);

      const button = document.querySelector('[aria-hidden="true"]');
      expect(button).toHaveClass('animate-pulse');
    });

    it('should apply custom className', () => {
      render(<Skeleton variant="button" className="custom-button" />);

      const button = document.querySelector('[aria-hidden="true"]');
      expect(button).toHaveClass('custom-button');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode background class for text variant', () => {
      render(<Skeleton variant="text" />);

      const skeleton = document.querySelector('[aria-hidden="true"]');
      expect(skeleton).toHaveClass('dark:bg-gray-700');
    });

    it('should have dark mode border class for card variant', () => {
      render(<Skeleton variant="card" />);

      const card = document.querySelector('.rounded-lg');
      expect(card).toHaveClass('dark:border-gray-700');
    });
  });

  describe('Edge Cases', () => {
    it('should handle lines=1 for paragraph variant', () => {
      render(<Skeleton variant="paragraph" lines={1} />);

      const container = document.querySelector('.space-y-2');
      const lines = container?.querySelectorAll('.animate-pulse');
      expect(lines?.length).toBe(1);

      // Single line should be 3/4 width (last line logic)
      expect(lines?.[0]).toHaveClass('w-3/4');
    });

    it('should handle lines=0 for paragraph variant', () => {
      render(<Skeleton variant="paragraph" lines={0} />);

      const container = document.querySelector('.space-y-2');
      const lines = container?.querySelectorAll('.animate-pulse');
      expect(lines?.length).toBe(0);
    });

    it('should handle unknown variant (fallback to text)', () => {
      // @ts-expect-error - Testing unknown variant
      render(<Skeleton variant="unknown" />);

      const skeleton = document.querySelector('[aria-hidden="true"]');
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-full');
    });

    it('should handle empty className', () => {
      render(<Skeleton className="" />);

      const skeleton = document.querySelector('[aria-hidden="true"]');
      expect(skeleton).toBeInTheDocument();
    });
  });
});

/**
 * Footer Component Tests
 *
 * Tests for the footer component to ensure:
 * - Component renders without crashing
 * - Key UI elements are present (logo, brand, links, copyright)
 * - Navigation links work correctly
 * - Legal links are present
 * - Dynamic copyright year is correct
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should display the brand name', () => {
      render(<Footer />);
      expect(screen.getByText('State of Clarity')).toBeInTheDocument();
    });

    it('should have a link to home page from logo', () => {
      render(<Footer />);
      const homeLink = screen.getByRole('link', { name: /state of clarity/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should apply custom className when provided', () => {
      render(<Footer className="custom-footer-class" />);
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('custom-footer-class');
    });

    it('should display the tagline', () => {
      render(<Footer />);
      expect(screen.getByText(/ai-powered policy briefs/i)).toBeInTheDocument();
    });

    it('should display the slogan', () => {
      render(<Footer />);
      expect(screen.getByText(/evidence-based\. non-partisan\./i)).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have a Navigate section heading', () => {
      render(<Footer />);
      expect(screen.getByRole('heading', { name: /navigate/i })).toBeInTheDocument();
    });

    it('should display About link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    });

    it('should display Ask Anything link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /ask anything/i })).toBeInTheDocument();
    });

    it('should have correct href for About link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about');
    });

    it('should have correct href for Ask Anything link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /ask anything/i })).toHaveAttribute('href', '/ask');
    });

    it('should have footer navigation landmark', () => {
      render(<Footer />);
      expect(screen.getByRole('navigation', { name: /footer navigation/i })).toBeInTheDocument();
    });
  });

  describe('Legal Links', () => {
    it('should have a Legal section heading', () => {
      render(<Footer />);
      expect(screen.getByRole('heading', { name: /legal/i })).toBeInTheDocument();
    });

    it('should display Privacy Policy link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
    });

    it('should display Terms of Service link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /terms of service/i })).toBeInTheDocument();
    });

    it('should have correct href for Privacy Policy link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
    });

    it('should have correct href for Terms of Service link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
    });

    it('should have legal navigation landmark', () => {
      render(<Footer />);
      expect(screen.getByRole('navigation', { name: /legal/i })).toBeInTheDocument();
    });
  });

  describe('Copyright', () => {
    it('should display copyright text', () => {
      render(<Footer />);
      expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
    });

    it('should display current year in copyright', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    });

    it('should display State of Clarity in copyright', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`${currentYear} State of Clarity`))).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('should have proper grid layout with three columns', () => {
      const { container } = render(<Footer />);
      // Check for the grid container
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    it('should have a divider before copyright section', () => {
      const { container } = render(<Footer />);
      const divider = container.querySelector('.border-t');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Footer />);
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBe(2); // Navigate and Legal
    });

    it('should have multiple navigation regions with proper labels', () => {
      render(<Footer />);
      const navigations = screen.getAllByRole('navigation');
      expect(navigations.length).toBe(2);
    });

    it('should have list structure for links', () => {
      render(<Footer />);
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBe(2); // Nav links and legal links
    });
  });
});

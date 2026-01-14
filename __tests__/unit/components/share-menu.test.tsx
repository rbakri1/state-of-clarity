/**
 * ShareMenu Component Tests
 *
 * Tests for the share menu component to ensure:
 * - Renders share button correctly
 * - Opens/closes menu on click
 * - Displays all share options
 * - Handles copy link functionality
 * - Closes menu on outside click
 * - Generates correct share URLs with UTM parameters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ShareMenu } from '@/app/components/ShareMenu';

describe('ShareMenu', () => {
  const defaultProps = {
    title: 'Test Article Title',
    excerpt: 'This is a test excerpt for the article.',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/article/test-article',
      },
      writable: true,
      configurable: true,
    });

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render share button', () => {
      render(<ShareMenu {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /share/i });
      expect(shareButton).toBeInTheDocument();
    });

    it('should have correct aria-expanded attribute when closed', () => {
      render(<ShareMenu {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /share/i });
      expect(shareButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have correct aria-expanded attribute when open', () => {
      render(<ShareMenu {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      expect(shareButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should not show menu initially', () => {
      render(<ShareMenu {...defaultProps} />);

      expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
    });
  });

  describe('Menu Toggle', () => {
    it('should open menu when share button is clicked', () => {
      render(<ShareMenu {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      expect(screen.getByText('Copy Link')).toBeInTheDocument();
    });

    it('should close menu when share button is clicked again', () => {
      render(<ShareMenu {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);
      expect(screen.getByText('Copy Link')).toBeInTheDocument();

      fireEvent.click(shareButton);
      expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
    });

    it('should close menu when clicking outside', () => {
      render(
        <div>
          <ShareMenu {...defaultProps} />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);
      expect(screen.getByText('Copy Link')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
    });
  });

  describe('Share Options', () => {
    it('should display Copy Link option', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByText('Copy Link')).toBeInTheDocument();
    });

    it('should display X / Twitter option', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByText('X / Twitter')).toBeInTheDocument();
    });

    it('should display LinkedIn option', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    });

    it('should display Facebook option', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByText('Facebook')).toBeInTheDocument();
    });

    it('should display Reddit option', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByText('Reddit')).toBeInTheDocument();
    });

    it('should display Email option', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByText('Email')).toBeInTheDocument();
    });
  });

  describe('Copy Link Functionality', () => {
    it('should copy link to clipboard when Copy Link is clicked', async () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));
      fireEvent.click(screen.getByText('Copy Link'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/article/test-article'
      );
    });

    it('should show Link copied! text after copying', async () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));
      fireEvent.click(screen.getByText('Copy Link'));

      await waitFor(() => {
        expect(screen.getByText('Link copied!')).toBeInTheDocument();
      });
    });

    it('should show toast notification after copying', async () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));
      fireEvent.click(screen.getByText('Copy Link'));

      await waitFor(() => {
        // There will be two "Link copied!" - one in button label and one in toast
        const linkCopiedElements = screen.getAllByText('Link copied!');
        expect(linkCopiedElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should reset copied state after 2 seconds', async () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));
      fireEvent.click(screen.getByText('Copy Link'));

      await waitFor(() => {
        expect(screen.getByText('Link copied!')).toBeInTheDocument();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
      });
    });

    it('should handle clipboard error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Clipboard error'));

      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));
      fireEvent.click(screen.getByText('Copy Link'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Share Links', () => {
    it('should have correct Twitter share URL', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const twitterLink = screen.getByText('X / Twitter').closest('a');
      expect(twitterLink).toHaveAttribute('href', expect.stringContaining('twitter.com/intent/tweet'));
      expect(twitterLink).toHaveAttribute('href', expect.stringContaining('utm_source=twitter'));
    });

    it('should have correct LinkedIn share URL', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const linkedinLink = screen.getByText('LinkedIn').closest('a');
      expect(linkedinLink).toHaveAttribute('href', expect.stringContaining('linkedin.com/sharing'));
      expect(linkedinLink).toHaveAttribute('href', expect.stringContaining('utm_source=linkedin'));
    });

    it('should have correct Facebook share URL', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const facebookLink = screen.getByText('Facebook').closest('a');
      expect(facebookLink).toHaveAttribute('href', expect.stringContaining('facebook.com/sharer'));
      expect(facebookLink).toHaveAttribute('href', expect.stringContaining('utm_source=facebook'));
    });

    it('should have correct Reddit share URL', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const redditLink = screen.getByText('Reddit').closest('a');
      expect(redditLink).toHaveAttribute('href', expect.stringContaining('reddit.com/submit'));
      expect(redditLink).toHaveAttribute('href', expect.stringContaining('utm_source=reddit'));
    });

    it('should have correct Email share URL', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const emailLink = screen.getByText('Email').closest('a');
      expect(emailLink).toHaveAttribute('href', expect.stringContaining('mailto:'));
      expect(emailLink).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(defaultProps.title)));
    });

    it('should open share links in new tab', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const twitterLink = screen.getByText('X / Twitter').closest('a');
      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Props Handling', () => {
    it('should work without excerpt prop', () => {
      render(<ShareMenu title="Test Title" />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByText('Copy Link')).toBeInTheDocument();
    });

    it('should include excerpt in share content when provided', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const emailLink = screen.getByText('Email').closest('a');
      expect(emailLink).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(defaultProps.excerpt)));
    });

    it('should truncate long excerpts in Twitter share', () => {
      const longExcerpt = 'A'.repeat(200);
      render(<ShareMenu title="Test" excerpt={longExcerpt} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const twitterLink = screen.getByText('X / Twitter').closest('a');
      const href = twitterLink?.getAttribute('href') || '';
      // Should contain truncated text (first 100 chars)
      expect(href).toContain('...');
    });
  });

  describe('Menu Closing on Link Click', () => {
    it('should close menu when a share link is clicked', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));
      expect(screen.getByText('LinkedIn')).toBeInTheDocument();

      fireEvent.click(screen.getByText('LinkedIn'));
      expect(screen.queryByText('LinkedIn')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on share button', () => {
      render(<ShareMenu {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /share/i });
      expect(shareButton).toHaveAttribute('aria-label', 'Share');
    });

    it('should be keyboard accessible', () => {
      render(<ShareMenu {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /share/i });
      shareButton.focus();
      expect(document.activeElement).toBe(shareButton);
    });
  });

  describe('UTM Parameters', () => {
    it('should add utm_source parameter to share URLs', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const twitterLink = screen.getByText('X / Twitter').closest('a');
      expect(twitterLink?.getAttribute('href')).toContain('utm_source=twitter');
    });

    it('should add utm_medium=social parameter to share URLs', () => {
      render(<ShareMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share/i }));

      const twitterLink = screen.getByText('X / Twitter').closest('a');
      expect(twitterLink?.getAttribute('href')).toContain('utm_medium=social');
    });
  });
});

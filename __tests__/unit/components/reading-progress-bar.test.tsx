/**
 * ReadingProgressBar Component Tests
 *
 * Tests for the reading progress bar component to ensure:
 * - Renders correctly with proper accessibility attributes
 * - Shows correct progress based on scroll position
 * - Handles contentSelector prop
 * - Cleans up event listeners on unmount
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { ReadingProgressBar } from '@/app/components/ReadingProgressBar';

describe('ReadingProgressBar', () => {
  let originalInnerHeight: number;
  let originalScrollY: number;
  let scrollHandlers: ((e?: Event) => void)[];
  let resizeHandlers: ((e?: Event) => void)[];
  let rafCallback: ((time: number) => void) | null = null;

  beforeEach(() => {
    scrollHandlers = [];
    resizeHandlers = [];
    rafCallback = null;

    // Save original values
    originalInnerHeight = window.innerHeight;
    originalScrollY = window.scrollY;

    // Mock window properties
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });

    // Mock document properties
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      writable: true,
      configurable: true,
    });

    // Mock addEventListener and removeEventListener
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;

    vi.spyOn(window, 'addEventListener').mockImplementation((type, handler) => {
      if (type === 'scroll') {
        scrollHandlers.push(handler as () => void);
      } else if (type === 'resize') {
        resizeHandlers.push(handler as () => void);
      }
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((type, handler) => {
      if (type === 'scroll') {
        scrollHandlers = scrollHandlers.filter(h => h !== handler);
      } else if (type === 'resize') {
        resizeHandlers = resizeHandlers.filter(h => h !== handler);
      }
    });

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallback = callback;
      return 1;
    });

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
      rafCallback = null;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();

    // Restore original values
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'scrollY', {
      value: originalScrollY,
      writable: true,
      configurable: true,
    });
  });

  describe('Rendering', () => {
    it('should render the progress bar container', () => {
      render(<ReadingProgressBar />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(<ReadingProgressBar />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Reading progress');
    });

    it('should have data attribute for styling', () => {
      render(<ReadingProgressBar />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('data-reading-progress');
    });
  });

  describe('Progress Calculation', () => {
    it('should show 0% progress when at top of page', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

      render(<ReadingProgressBar />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should show 100% progress when at bottom of page', () => {
      // scrollableHeight = 2000 - 800 = 1200
      Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true });

      render(<ReadingProgressBar />);

      // Execute the rAF callback
      if (rafCallback) {
        act(() => {
          rafCallback!(0);
        });
      }

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should show 50% progress when at middle of page', () => {
      // scrollableHeight = 2000 - 800 = 1200
      // 50% = 600
      Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });

      render(<ReadingProgressBar />);

      // Execute the rAF callback
      if (rafCallback) {
        act(() => {
          rafCallback!(0);
        });
      }

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should handle non-scrollable content', () => {
      // Document height less than or equal to window height
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 800,
        configurable: true,
      });

      render(<ReadingProgressBar />);

      // Execute the rAF callback
      if (rafCallback) {
        act(() => {
          rafCallback!(0);
        });
      }

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Scroll Events', () => {
    it('should register scroll event listener', () => {
      render(<ReadingProgressBar />);

      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });

    it('should register resize event listener', () => {
      render(<ReadingProgressBar />);

      expect(window.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      );
    });

    it('should update progress on scroll', () => {
      render(<ReadingProgressBar />);

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { value: 300, configurable: true });

      // Trigger scroll handler
      if (scrollHandlers.length > 0) {
        act(() => {
          scrollHandlers[0]();
        });
      }

      // Execute the rAF callback
      if (rafCallback) {
        act(() => {
          rafCallback!(0);
        });
      }

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');
    });

    it('should use requestAnimationFrame for scroll updates', () => {
      render(<ReadingProgressBar />);

      // Trigger scroll handler
      if (scrollHandlers.length > 0) {
        act(() => {
          scrollHandlers[0]();
        });
      }

      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Content Selector', () => {
    it('should accept contentSelector prop', () => {
      const { container } = render(<ReadingProgressBar contentSelector="#main-content" />);

      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it('should fall back to document when content element not found', () => {
      render(<ReadingProgressBar contentSelector="#non-existent" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = render(<ReadingProgressBar />);

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    it('should cancel animation frame on unmount', () => {
      const { unmount } = render(<ReadingProgressBar />);

      // Trigger scroll to schedule a rAF
      if (scrollHandlers.length > 0) {
        act(() => {
          scrollHandlers[0]();
        });
      }

      unmount();

      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Visual Progress Bar', () => {
    it('should have inner progress element', () => {
      render(<ReadingProgressBar />);

      const progressBar = screen.getByRole('progressbar');
      const innerBar = progressBar.querySelector('div');
      expect(innerBar).toBeInTheDocument();
    });

    it('should have correct width style based on progress', () => {
      Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });

      render(<ReadingProgressBar />);

      // Execute the rAF callback
      if (rafCallback) {
        act(() => {
          rafCallback!(0);
        });
      }

      const progressBar = screen.getByRole('progressbar');
      const innerBar = progressBar.querySelector('div');
      expect(innerBar).toHaveStyle({ width: '50%' });
    });
  });

  describe('Edge Cases', () => {
    it('should clamp progress to 0 when scrolled above start', () => {
      Object.defineProperty(window, 'scrollY', { value: -100, configurable: true });

      render(<ReadingProgressBar />);

      // Execute the rAF callback
      if (rafCallback) {
        act(() => {
          rafCallback!(0);
        });
      }

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should clamp progress to 100 when scrolled beyond end', () => {
      Object.defineProperty(window, 'scrollY', { value: 5000, configurable: true });

      render(<ReadingProgressBar />);

      // Execute the rAF callback
      if (rafCallback) {
        act(() => {
          rafCallback!(0);
        });
      }

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });
});

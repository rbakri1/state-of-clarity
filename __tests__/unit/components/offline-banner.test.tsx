/**
 * OfflineBanner Component Tests
 *
 * Tests for the offline banner component to ensure:
 * - Renders nothing when online
 * - Renders banner when offline
 * - Responds to online/offline events
 * - Displays correct message and icon
 * - Properly cleans up event listeners
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { OfflineBanner } from '@/app/components/OfflineBanner';

describe('OfflineBanner', () => {
  let onlineHandlers: ((e?: Event) => void)[];
  let offlineHandlers: ((e?: Event) => void)[];
  let originalNavigatorOnLine: boolean;

  beforeEach(() => {
    onlineHandlers = [];
    offlineHandlers = [];

    // Save original value
    originalNavigatorOnLine = navigator.onLine;

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Mock addEventListener and removeEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation((type, handler) => {
      if (type === 'online') {
        onlineHandlers.push(handler as () => void);
      } else if (type === 'offline') {
        offlineHandlers.push(handler as () => void);
      }
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((type, handler) => {
      if (type === 'online') {
        onlineHandlers = onlineHandlers.filter(h => h !== handler);
      } else if (type === 'offline') {
        offlineHandlers = offlineHandlers.filter(h => h !== handler);
      }
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();

    // Restore original value
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorOnLine,
      writable: true,
      configurable: true,
    });
  });

  describe('Initial State', () => {
    it('should render nothing when initially online', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const { container } = render(<OfflineBanner />);

      expect(container.firstChild).toBeNull();
    });

    it('should render banner when initially offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(<OfflineBanner />);

      expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should register online event listener', () => {
      render(<OfflineBanner />);

      expect(window.addEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
    });

    it('should register offline event listener', () => {
      render(<OfflineBanner />);

      expect(window.addEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });

    it('should show banner when going offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const { container } = render(<OfflineBanner />);

      // Initially no banner
      expect(container.firstChild).toBeNull();

      // Simulate going offline
      act(() => {
        offlineHandlers.forEach(handler => handler());
      });

      // Banner should appear
      expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    });

    it('should hide banner when going online', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(<OfflineBanner />);

      // Initially banner is shown
      expect(screen.getByText(/You're offline/)).toBeInTheDocument();

      // Simulate going online
      act(() => {
        onlineHandlers.forEach(handler => handler());
      });

      // Banner should disappear
      expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument();
    });

    it('should handle multiple online/offline transitions', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const { container } = render(<OfflineBanner />);

      // Initially no banner
      expect(container.firstChild).toBeNull();

      // Go offline
      act(() => {
        offlineHandlers.forEach(handler => handler());
      });
      expect(screen.getByText(/You're offline/)).toBeInTheDocument();

      // Go online
      act(() => {
        onlineHandlers.forEach(handler => handler());
      });
      expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument();

      // Go offline again
      act(() => {
        offlineHandlers.forEach(handler => handler());
      });
      expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    });
  });

  describe('Banner Content', () => {
    it('should display correct message', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(<OfflineBanner />);

      expect(screen.getByText(/You're offline. Some features may be unavailable./)).toBeInTheDocument();
    });

    it('should have WifiOff icon', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(<OfflineBanner />);

      // The icon is an SVG with class w-4 h-4
      const banner = screen.getByText(/You're offline/).closest('div');
      const iconContainer = banner?.querySelector('svg');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have fixed positioning', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(<OfflineBanner />);

      const banner = screen.getByText(/You're offline/).closest('.fixed');
      expect(banner).toBeInTheDocument();
    });

    it('should have top-0 positioning', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(<OfflineBanner />);

      const banner = screen.getByText(/You're offline/).closest('.top-0');
      expect(banner).toBeInTheDocument();
    });

    it('should have high z-index for visibility', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(<OfflineBanner />);

      const banner = screen.getByText(/You're offline/).closest('.z-50');
      expect(banner).toBeInTheDocument();
    });

    it('should have yellow/warning background color', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(<OfflineBanner />);

      const banner = screen.getByText(/You're offline/).closest('.bg-yellow-500');
      expect(banner).toBeInTheDocument();
    });

    it('should have centered text', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(<OfflineBanner />);

      const banner = screen.getByText(/You're offline/).closest('.text-center');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should remove online event listener on unmount', () => {
      const { unmount } = render(<OfflineBanner />);

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
    });

    it('should remove offline event listener on unmount', () => {
      const { unmount } = render(<OfflineBanner />);

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });
  });
});

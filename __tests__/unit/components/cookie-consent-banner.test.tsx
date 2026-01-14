/**
 * CookieConsentBanner Component Tests
 *
 * Tests for the cookie consent banner component to ensure:
 * - Component renders when no consent has been given
 * - Component hides when consent exists
 * - Accept button stores consent and hides banner
 * - Decline button stores decline and hides banner
 * - Privacy policy link is present
 * - Helper functions work correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CookieConsentBanner,
  getConsentStatus,
  hasAcceptedCookies,
} from '@/components/cookie-consent-banner';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render banner when no consent exists', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
      });
    });

    it('should not render banner when consent already exists', async () => {
      localStorageMock.setItem(
        'cookie-consent',
        JSON.stringify({ value: 'accepted', timestamp: new Date().toISOString() })
      );

      render(<CookieConsentBanner />);

      // Wait a tick for useEffect to run
      await waitFor(() => {
        expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
      });
    });

    it('should not render banner when declined consent exists', async () => {
      localStorageMock.setItem(
        'cookie-consent',
        JSON.stringify({ value: 'declined', timestamp: new Date().toISOString() })
      );

      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Banner Content', () => {
    it('should display information about essential cookies', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByText(/essential cookies/i)).toBeInTheDocument();
      });
    });

    it('should display information about analytics cookies', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByText(/analytics cookies/i)).toBeInTheDocument();
      });
    });

    it('should have a link to privacy policy', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
        expect(privacyLink).toBeInTheDocument();
        expect(privacyLink).toHaveAttribute('href', '/privacy');
      });
    });
  });

  describe('Buttons', () => {
    it('should display Accept button', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
      });
    });

    it('should display Decline button', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accept Action', () => {
    it('should hide banner when Accept is clicked', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
      });

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await userEvent.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
      });
    });

    it('should store accepted consent in localStorage when Accept is clicked', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /accept/i }));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cookie-consent',
        expect.stringContaining('"value":"accepted"')
      );
    });

    it('should include timestamp when storing accepted consent', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /accept/i }));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cookie-consent',
        expect.stringContaining('"timestamp"')
      );
    });
  });

  describe('Decline Action', () => {
    it('should hide banner when Decline is clicked', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
      });

      const declineButton = screen.getByRole('button', { name: /decline/i });
      await userEvent.click(declineButton);

      await waitFor(() => {
        expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
      });
    });

    it('should store declined consent in localStorage when Decline is clicked', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /decline/i }));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cookie-consent',
        expect.stringContaining('"value":"declined"')
      );
    });

    it('should include timestamp when storing declined consent', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /decline/i }));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cookie-consent',
        expect.stringContaining('"timestamp"')
      );
    });
  });

  describe('Helper Functions', () => {
    describe('getConsentStatus', () => {
      it('should return null when no consent exists', () => {
        expect(getConsentStatus()).toBeNull();
      });

      it('should return "accepted" when accepted consent exists', () => {
        localStorageMock.setItem(
          'cookie-consent',
          JSON.stringify({ value: 'accepted', timestamp: new Date().toISOString() })
        );

        expect(getConsentStatus()).toBe('accepted');
      });

      it('should return "declined" when declined consent exists', () => {
        localStorageMock.setItem(
          'cookie-consent',
          JSON.stringify({ value: 'declined', timestamp: new Date().toISOString() })
        );

        expect(getConsentStatus()).toBe('declined');
      });

      it('should handle legacy string format', () => {
        localStorageMock.setItem('cookie-consent', 'accepted');

        expect(getConsentStatus()).toBe('accepted');
      });

      it('should return null for invalid JSON', () => {
        localStorageMock.setItem('cookie-consent', 'invalid-json{');

        expect(getConsentStatus()).toBeNull();
      });

      it('should return null for invalid value in JSON', () => {
        localStorageMock.setItem(
          'cookie-consent',
          JSON.stringify({ value: 'invalid', timestamp: new Date().toISOString() })
        );

        expect(getConsentStatus()).toBeNull();
      });
    });

    describe('hasAcceptedCookies', () => {
      it('should return false when no consent exists', () => {
        expect(hasAcceptedCookies()).toBe(false);
      });

      it('should return true when accepted consent exists', () => {
        localStorageMock.setItem(
          'cookie-consent',
          JSON.stringify({ value: 'accepted', timestamp: new Date().toISOString() })
        );

        expect(hasAcceptedCookies()).toBe(true);
      });

      it('should return false when declined consent exists', () => {
        localStorageMock.setItem(
          'cookie-consent',
          JSON.stringify({ value: 'declined', timestamp: new Date().toISOString() })
        );

        expect(hasAcceptedCookies()).toBe(false);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have interactive buttons', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(2);
      });
    });

    it('should have a focusable privacy policy link', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
        expect(privacyLink).toBeInTheDocument();
      });
    });
  });

  describe('Styling and Position', () => {
    it('should be fixed to the bottom of the page', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        const banner = screen.getByText(/we use cookies/i).closest('div.fixed');
        expect(banner).toBeInTheDocument();
        expect(banner).toHaveClass('bottom-0');
      });
    });

    it('should have high z-index for visibility', async () => {
      render(<CookieConsentBanner />);

      await waitFor(() => {
        const banner = screen.getByText(/we use cookies/i).closest('div.fixed');
        expect(banner).toHaveClass('z-50');
      });
    });
  });
});

/**
 * BriefPreview Component Tests
 *
 * Tests for the brief preview component to ensure:
 * - Renders question as heading
 * - Shows truncated narrative (20% of words)
 * - Displays clarity score badge when score > 0
 * - Hides clarity score badge when score is 0
 * - Applies correct CSS class based on clarity score
 * - Sign up/sign in buttons call openModal correctly
 * - Shows preview count from localStorage
 * - Increments preview count on mount
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BriefPreview } from '@/app/components/BriefPreview';

// Mock useAuthModal hook
const mockOpenModal = vi.fn();
vi.mock('@/app/components/auth/AuthModal', () => ({
  useAuthModal: () => ({
    openModal: mockOpenModal,
    closeModal: vi.fn(),
    isOpen: false,
  }),
}));

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

describe('BriefPreview', () => {
  const defaultProps = {
    question: 'What is the impact of climate change?',
    narrative:
      'Climate change is affecting ecosystems worldwide. Rising temperatures are causing polar ice caps to melt at unprecedented rates. Sea levels are rising, threatening coastal communities. Extreme weather events are becoming more frequent and severe. Agricultural patterns are shifting, impacting food security globally.',
    clarityScore: 7.5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Question Display', () => {
    it('should render the question as a heading', () => {
      render(<BriefPreview {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(defaultProps.question);
    });

    it('should render different questions correctly', () => {
      const customQuestion = 'How does AI affect employment?';
      render(<BriefPreview {...defaultProps} question={customQuestion} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        customQuestion
      );
    });
  });

  describe('Narrative Truncation', () => {
    it('should show approximately 20% of the narrative words', () => {
      render(<BriefPreview {...defaultProps} />);

      // The narrative has 50 words, so 20% = 10 words (ceiling)
      // "Climate change is affecting ecosystems worldwide. Rising temperatures are causing polar"
      const words = defaultProps.narrative.split(/\s+/);
      const expectedWordCount = Math.ceil(words.length * 0.2);
      const expectedText = words.slice(0, expectedWordCount).join(' ') + '...';

      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('should truncate short narratives correctly', () => {
      const shortNarrative = 'This is a short test narrative.';
      render(<BriefPreview {...defaultProps} narrative={shortNarrative} />);

      // 6 words * 0.2 = 1.2, ceiling = 2 words
      // "This is..."
      expect(screen.getByText('This is...')).toBeInTheDocument();
    });

    it('should handle single word narratives', () => {
      const singleWord = 'Test';
      render(<BriefPreview {...defaultProps} narrative={singleWord} />);

      // 1 word * 0.2 = 0.2, ceiling = 1 word
      expect(screen.getByText('Test...')).toBeInTheDocument();
    });
  });

  describe('Clarity Score Badge', () => {
    it('should display clarity score badge when score > 0', () => {
      render(<BriefPreview {...defaultProps} clarityScore={8.5} />);

      expect(screen.getByText('8.5/10')).toBeInTheDocument();
    });

    it('should hide clarity score badge when score is 0', () => {
      render(<BriefPreview {...defaultProps} clarityScore={0} />);

      expect(screen.queryByText('/10')).not.toBeInTheDocument();
    });

    it('should hide clarity score badge when score is not provided', () => {
      const { clarityScore: _, ...propsWithoutScore } = defaultProps;
      render(<BriefPreview {...propsWithoutScore} />);

      expect(screen.queryByText('/10')).not.toBeInTheDocument();
    });

    it('should display score with correct format', () => {
      render(<BriefPreview {...defaultProps} clarityScore={9} />);

      expect(screen.getByText('9/10')).toBeInTheDocument();
    });
  });

  describe('Clarity Score CSS Classes', () => {
    it('should apply "high" class for scores >= 8', () => {
      const { container } = render(
        <BriefPreview {...defaultProps} clarityScore={8} />
      );

      const badge = container.querySelector('.clarity-score-badge');
      expect(badge).toHaveClass('high');
    });

    it('should apply "high" class for score of 10', () => {
      const { container } = render(
        <BriefPreview {...defaultProps} clarityScore={10} />
      );

      const badge = container.querySelector('.clarity-score-badge');
      expect(badge).toHaveClass('high');
    });

    it('should apply "medium" class for scores >= 6 and < 8', () => {
      const { container } = render(
        <BriefPreview {...defaultProps} clarityScore={6} />
      );

      const badge = container.querySelector('.clarity-score-badge');
      expect(badge).toHaveClass('medium');
    });

    it('should apply "medium" class for score of 7', () => {
      const { container } = render(
        <BriefPreview {...defaultProps} clarityScore={7} />
      );

      const badge = container.querySelector('.clarity-score-badge');
      expect(badge).toHaveClass('medium');
    });

    it('should apply "low" class for scores < 6', () => {
      const { container } = render(
        <BriefPreview {...defaultProps} clarityScore={5} />
      );

      const badge = container.querySelector('.clarity-score-badge');
      expect(badge).toHaveClass('low');
    });

    it('should apply "low" class for score of 1', () => {
      const { container } = render(
        <BriefPreview {...defaultProps} clarityScore={1} />
      );

      const badge = container.querySelector('.clarity-score-badge');
      expect(badge).toHaveClass('low');
    });

    it('should apply "low" class for score just below 6', () => {
      const { container } = render(
        <BriefPreview {...defaultProps} clarityScore={5.9} />
      );

      const badge = container.querySelector('.clarity-score-badge');
      expect(badge).toHaveClass('low');
    });
  });

  describe('Sign Up Button', () => {
    it('should call openModal with "signup" when sign up button is clicked', () => {
      render(<BriefPreview {...defaultProps} />);

      const signUpButton = screen.getByRole('button', {
        name: /sign up to read full brief/i,
      });
      fireEvent.click(signUpButton);

      expect(mockOpenModal).toHaveBeenCalledWith('signup');
      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sign In Button', () => {
    it('should call openModal with "signin" when sign in button is clicked', () => {
      render(<BriefPreview {...defaultProps} />);

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      expect(mockOpenModal).toHaveBeenCalledWith('signin');
      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('Preview Count - localStorage Integration', () => {
    it('should show preview count from localStorage', () => {
      localStorageMock.setItem('soc_preview_count', '5');

      render(<BriefPreview {...defaultProps} />);

      // Component increments on mount, so 5 + 1 = 6
      expect(screen.getByText(/Preview #6/)).toBeInTheDocument();
    });

    it('should increment preview count on mount', () => {
      localStorageMock.setItem('soc_preview_count', '2');

      render(<BriefPreview {...defaultProps} />);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'soc_preview_count',
        '3'
      );
    });

    it('should start at 1 when no previous count exists', () => {
      render(<BriefPreview {...defaultProps} />);

      expect(screen.getByText(/Preview #1/)).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'soc_preview_count',
        '1'
      );
    });

    it('should handle invalid localStorage values gracefully', () => {
      localStorageMock.setItem('soc_preview_count', 'invalid');

      render(<BriefPreview {...defaultProps} />);

      // parseInt of 'invalid' returns NaN, which when added to 1 becomes NaN
      // The component should handle this - checking that it doesn't crash
      expect(screen.getByText(/Preview #/)).toBeInTheDocument();
    });
  });

  describe('CTA Section Content', () => {
    it('should display continue reading heading', () => {
      render(<BriefPreview {...defaultProps} />);

      expect(
        screen.getByRole('heading', { name: /continue reading this brief/i })
      ).toBeInTheDocument();
    });

    it('should display percentage seen message', () => {
      render(<BriefPreview {...defaultProps} />);

      // The narrative has 42 words, 20% = ceil(8.4) = 9 words shown
      // hiddenPercentage = round((42-9)/42 * 100) = round(78.57) = 79%
      // Shown = 100 - 79 = 21%
      expect(screen.getByText(/You've seen 21% of this brief/)).toBeInTheDocument();
    });

    it('should display free account message', () => {
      render(<BriefPreview {...defaultProps} />);

      expect(
        screen.getByText(/Free account includes unlimited briefs/)
      ).toBeInTheDocument();
    });
  });
});

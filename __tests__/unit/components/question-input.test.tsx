/**
 * QuestionInput Component Tests
 *
 * Tests for the question input component to ensure:
 * - Renders correctly with placeholder
 * - Handles user input
 * - Submits form on button click
 * - Shows loading state during submission
 * - Handles suggestions dropdown
 * - Keyboard navigation works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionInput from '@/app/components/QuestionInput';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('QuestionInput', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    mockOnSubmit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with placeholder text', () => {
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      expect(screen.getByPlaceholderText('Ask any policy question...')).toBeInTheDocument();
    });

    it('should render submit button with "Get Brief" text', () => {
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: 'Get Brief' })).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      // The Search icon from lucide-react should be present
      const searchIcon = document.querySelector('.lucide-search');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should render with initial value when provided', () => {
      render(<QuestionInput onSubmit={mockOnSubmit} initialValue="Test question" />);

      expect(screen.getByDisplayValue('Test question')).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should update input value when user types', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await user.type(input, 'What is healthcare policy?');

      expect(input).toHaveValue('What is healthcare policy?');
    });

    it('should enable submit button when input has value', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Get Brief' });
      expect(submitButton).toBeDisabled();

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await user.type(input, 'Test');

      expect(submitButton).not.toBeDisabled();
    });

    it('should keep submit button disabled for whitespace-only input', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await user.type(input, '   ');

      const submitButton = screen.getByRole('button', { name: 'Get Brief' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with trimmed value when form is submitted', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await user.type(input, '  Test question  ');

      const submitButton = screen.getByRole('button', { name: 'Get Brief' });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('Test question');
    });

    it('should show loading state during submission', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await user.type(input, 'Test question');

      const submitButton = screen.getByRole('button', { name: 'Get Brief' });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(input).toBeDisabled();

      // Resolve the promise
      await act(async () => {
        resolveSubmit!();
      });
    });

    it('should not submit with empty input', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const form = screen.getByRole('button', { name: 'Get Brief' }).closest('form');
      await user.type(form!, '{enter}');

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Suggestions Dropdown', () => {
    it('should fetch suggestions when input has at least 2 characters', async () => {
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await act(async () => {
        input.focus();
        await userEvent.type(input, 'te', { delay: 0 });
      });

      // Wait for debounce (150ms)
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/questions/suggest?q=te'),
          expect.any(Object)
        );
      });
    });

    it('should not fetch suggestions for single character input', async () => {
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await act(async () => {
        input.focus();
        await userEvent.type(input, 't', { delay: 0 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should display suggestions when API returns results', async () => {
      const suggestions = [
        { text: 'What is healthcare policy?', source: 'template', category: 'health' },
        { text: 'What is education policy?', source: 'history' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(suggestions),
      });

      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await act(async () => {
        input.focus();
        await userEvent.type(input, 'wh', { delay: 0 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByText('What is healthcare policy?')).toBeInTheDocument();
        expect(screen.getByText('What is education policy?')).toBeInTheDocument();
      });
    });

    it('should show source labels for suggestions', async () => {
      const suggestions = [
        { text: 'Question 1', source: 'template' as const },
        { text: 'Question 2', source: 'history' as const },
        { text: 'Question 3', source: 'ai' as const },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(suggestions),
      });

      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await act(async () => {
        input.focus();
        await userEvent.type(input, 'qu', { delay: 0 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByText('Curated')).toBeInTheDocument();
        expect(screen.getByText('Popular')).toBeInTheDocument();
        // The AI source label includes a sparkle emoji
        expect(screen.getByText(/AI/)).toBeInTheDocument();
      });
    });

    it('should render suggestion buttons that can be clicked', async () => {
      vi.useRealTimers();
      const suggestions = [
        { text: 'Selected question', source: 'template' as const },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(suggestions),
      });

      const user = userEvent.setup();
      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await user.type(input, 'se');

      // Wait for suggestions to appear
      await waitFor(() => {
        expect(screen.getByText('Selected question')).toBeInTheDocument();
      });

      // Verify the suggestion button is rendered and clickable
      const suggestionButton = screen.getByText('Selected question').closest('button');
      expect(suggestionButton).toBeInTheDocument();
      expect(suggestionButton).toHaveAttribute('type', 'button');
    });

    it('should show loading state while fetching suggestions', async () => {
      let resolveFetch: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      mockFetch.mockReturnValue(fetchPromise);

      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await act(async () => {
        input.focus();
        await userEvent.type(input, 'te', { delay: 0 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Should show loading message
      await waitFor(() => {
        expect(screen.getByText('Loading suggestions...')).toBeInTheDocument();
      });

      // Resolve the fetch
      await act(async () => {
        resolveFetch!({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close dropdown on Escape key', async () => {
      const suggestions = [
        { text: 'Test suggestion', source: 'template' as const },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(suggestions),
      });

      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await act(async () => {
        input.focus();
        await userEvent.type(input, 'te', { delay: 0 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByText('Test suggestion')).toBeInTheDocument();
      });

      vi.useRealTimers();
      await userEvent.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Test suggestion')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown on Tab key', async () => {
      const suggestions = [
        { text: 'Test suggestion', source: 'template' as const },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(suggestions),
      });

      render(<QuestionInput onSubmit={mockOnSubmit} />);

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await act(async () => {
        input.focus();
        await userEvent.type(input, 'te', { delay: 0 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByText('Test suggestion')).toBeInTheDocument();
      });

      vi.useRealTimers();
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.queryByText('Test suggestion')).not.toBeInTheDocument();
      });
    });
  });

  describe('Ref Methods', () => {
    it('should expose focus method via ref', () => {
      const ref = { current: null as any };
      render(<QuestionInput onSubmit={mockOnSubmit} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current.focus).toBe('function');
    });

    it('should expose setValue method via ref', () => {
      const ref = { current: null as any };
      render(<QuestionInput onSubmit={mockOnSubmit} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current.setValue).toBe('function');
    });

    it('should update input value when setValue is called via ref', async () => {
      vi.useRealTimers();
      const ref = { current: null as any };
      render(<QuestionInput onSubmit={mockOnSubmit} ref={ref} />);

      await act(async () => {
        ref.current.setValue('New value from ref');
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.getByPlaceholderText('Ask any policy question...')).toHaveValue('New value from ref');
    });
  });

  describe('Click Outside', () => {
    it('should close dropdown when clicking outside', async () => {
      const suggestions = [
        { text: 'Test suggestion', source: 'template' as const },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(suggestions),
      });

      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <QuestionInput onSubmit={mockOnSubmit} />
        </div>
      );

      const input = screen.getByPlaceholderText('Ask any policy question...');
      await act(async () => {
        input.focus();
        await userEvent.type(input, 'te', { delay: 0 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByText('Test suggestion')).toBeInTheDocument();
      });

      vi.useRealTimers();
      const outsideElement = screen.getByTestId('outside');
      await userEvent.click(outsideElement);

      await waitFor(() => {
        expect(screen.queryByText('Test suggestion')).not.toBeInTheDocument();
      });
    });
  });
});

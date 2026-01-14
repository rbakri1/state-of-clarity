/**
 * SearchInput Component Tests
 *
 * Tests for the search input component to ensure:
 * - Renders correctly with placeholder and input
 * - Handles value changes with debouncing
 * - Shows and operates clear button correctly
 * - Syncs with external value changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '@/components/explore/search-input';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      expect(screen.getByPlaceholderText('Search briefs...')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} placeholder="Find articles..." />);

      expect(screen.getByPlaceholderText('Find articles...')).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      const onChange = vi.fn();
      render(<SearchInput value="initial search" onChange={onChange} />);

      expect(screen.getByRole('textbox')).toHaveValue('initial search');
    });

    it('should apply custom className', () => {
      const onChange = vi.fn();
      const { container } = render(
        <SearchInput value="" onChange={onChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render search icon', () => {
      const onChange = vi.fn();
      const { container } = render(<SearchInput value="" onChange={onChange} />);

      // Search icon is rendered as SVG
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should update local value immediately on input', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(input, { target: { value: 'test query' } });
      });

      expect(input).toHaveValue('test query');
    });

    it('should call onChange after debounce delay', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(input, { target: { value: 'search term' } });
      });

      // Should not be called immediately
      expect(onChange).not.toHaveBeenCalled();

      // Fast-forward 300ms (debounce delay)
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onChange).toHaveBeenCalledWith('search term');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should only call onChange once for rapid typing', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');

      await act(async () => {
        fireEvent.change(input, { target: { value: 's' } });
        vi.advanceTimersByTime(100);
        fireEvent.change(input, { target: { value: 'se' } });
        vi.advanceTimersByTime(100);
        fireEvent.change(input, { target: { value: 'sea' } });
        vi.advanceTimersByTime(100);
        fireEvent.change(input, { target: { value: 'sear' } });
      });

      // Should not be called yet (debounce not complete)
      expect(onChange).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Should only be called once with final value
      expect(onChange).toHaveBeenCalledWith('sear');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange if value matches prop', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="existing" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await act(async () => {
        // Type something different then revert to original
        fireEvent.change(input, { target: { value: 'different' } });
        vi.advanceTimersByTime(100);
        fireEvent.change(input, { target: { value: 'existing' } });
        vi.advanceTimersByTime(300);
      });

      // Should not be called since final value matches prop
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Clear Button', () => {
    it('should not show clear button when input is empty', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    it('should show clear button when input has value', () => {
      const onChange = vi.fn();
      render(<SearchInput value="search term" onChange={onChange} />);

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="search term" onChange={onChange} />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await act(async () => {
        fireEvent.click(clearButton);
      });

      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should call onChange with empty string when cleared', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="search term" onChange={onChange} />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await act(async () => {
        fireEvent.click(clearButton);
      });

      // Clear is immediate, not debounced
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('should hide clear button after clearing', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="search term" onChange={onChange} />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await act(async () => {
        fireEvent.click(clearButton);
      });

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    it('should have accessible label for clear button', () => {
      const onChange = vi.fn();
      render(<SearchInput value="test" onChange={onChange} />);

      const clearButton = screen.getByRole('button');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
    });
  });

  describe('Value Synchronization', () => {
    it('should sync local value when prop value changes', async () => {
      const onChange = vi.fn();
      const { rerender } = render(<SearchInput value="initial" onChange={onChange} />);

      expect(screen.getByRole('textbox')).toHaveValue('initial');

      await act(async () => {
        rerender(<SearchInput value="updated from url" onChange={onChange} />);
      });

      expect(screen.getByRole('textbox')).toHaveValue('updated from url');
    });

    it('should handle prop value being cleared', async () => {
      const onChange = vi.fn();
      const { rerender } = render(<SearchInput value="some value" onChange={onChange} />);

      expect(screen.getByRole('textbox')).toHaveValue('some value');

      await act(async () => {
        rerender(<SearchInput value="" onChange={onChange} />);
      });

      expect(screen.getByRole('textbox')).toHaveValue('');
    });
  });

  describe('Styling', () => {
    it('should apply correct input styles', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-xl');
    });

    it('should render search icon', () => {
      const onChange = vi.fn();
      const { container } = render(<SearchInput value="" onChange={onChange} />);

      const searchIcon = container.querySelector('svg');
      expect(searchIcon).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string input', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="test" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(input, { target: { value: '' } });
        vi.advanceTimersByTime(300);
      });

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('should handle whitespace-only input', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(input, { target: { value: '   ' } });
        vi.advanceTimersByTime(300);
      });

      expect(onChange).toHaveBeenCalledWith('   ');
    });

    it('should handle special characters in input', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      const specialChars = '@#$%^&*()[]{}|\\';
      await act(async () => {
        fireEvent.change(input, { target: { value: specialChars } });
        vi.advanceTimersByTime(300);
      });

      expect(onChange).toHaveBeenCalledWith(specialChars);
    });

    it('should cleanup timeout on unmount', () => {
      const onChange = vi.fn();
      const { unmount } = render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      unmount();

      // Advance time - should not throw or call onChange after unmount
      vi.advanceTimersByTime(300);

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

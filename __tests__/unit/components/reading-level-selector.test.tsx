/**
 * ReadingLevelSelector Component Tests
 *
 * Tests for the reading level selector component to ensure:
 * - Renders all three reading levels (Simple, Standard, Advanced)
 * - Correctly highlights the selected level
 * - Calls onLevelChange callback when clicking buttons
 * - Handles compact mode styling
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReadingLevelSelector } from '@/app/components/ReadingLevelSelector';

describe('ReadingLevelSelector', () => {
  describe('Rendering', () => {
    it('should render all three reading level buttons', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: 'Simple' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Standard' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Advanced' })).toBeInTheDocument();
    });

    it('should render buttons in correct order', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveTextContent('Simple');
      expect(buttons[1]).toHaveTextContent('Standard');
      expect(buttons[2]).toHaveTextContent('Advanced');
    });
  });

  describe('Selected State', () => {
    it('should highlight Simple when selected', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="simple" onLevelChange={mockOnChange} />);

      const simpleButton = screen.getByRole('button', { name: 'Simple' });
      expect(simpleButton).toHaveClass('bg-primary');
      expect(simpleButton).toHaveClass('text-primary-foreground');
    });

    it('should highlight Standard when selected', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      const standardButton = screen.getByRole('button', { name: 'Standard' });
      expect(standardButton).toHaveClass('bg-primary');
      expect(standardButton).toHaveClass('text-primary-foreground');
    });

    it('should highlight Advanced when selected', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="advanced" onLevelChange={mockOnChange} />);

      const advancedButton = screen.getByRole('button', { name: 'Advanced' });
      expect(advancedButton).toHaveClass('bg-primary');
      expect(advancedButton).toHaveClass('text-primary-foreground');
    });

    it('should not highlight unselected buttons', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      const simpleButton = screen.getByRole('button', { name: 'Simple' });
      const advancedButton = screen.getByRole('button', { name: 'Advanced' });

      expect(simpleButton).not.toHaveClass('bg-primary');
      expect(advancedButton).not.toHaveClass('bg-primary');
      expect(simpleButton).toHaveClass('bg-transparent');
      expect(advancedButton).toHaveClass('bg-transparent');
    });
  });

  describe('Click Handling', () => {
    it('should call onLevelChange with "simple" when clicking Simple', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Simple' }));
      expect(mockOnChange).toHaveBeenCalledWith('simple');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should call onLevelChange with "standard" when clicking Standard', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="simple" onLevelChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Standard' }));
      expect(mockOnChange).toHaveBeenCalledWith('standard');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should call onLevelChange with "advanced" when clicking Advanced', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="simple" onLevelChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
      expect(mockOnChange).toHaveBeenCalledWith('advanced');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should call onLevelChange even when clicking already selected level', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Standard' }));
      expect(mockOnChange).toHaveBeenCalledWith('standard');
    });
  });

  describe('Compact Mode', () => {
    it('should use compact styling when compact=true', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} compact={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('px-3');
        expect(button).toHaveClass('py-1.5');
      });
    });

    it('should use regular styling when compact=false', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} compact={false} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('px-4');
        expect(button).toHaveClass('py-2');
      });
    });

    it('should use regular styling by default', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('px-4');
        expect(button).toHaveClass('py-2');
      });
    });

    it('should use compact gap when compact=true', () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <ReadingLevelSelector level="standard" onLevelChange={mockOnChange} compact={true} />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('gap-1');
    });

    it('should use regular gap when compact=false', () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <ReadingLevelSelector level="standard" onLevelChange={mockOnChange} compact={false} />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('gap-2');
    });
  });

  describe('Styling', () => {
    it('should have rounded-full class on all buttons', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('rounded-full');
      });
    });

    it('should have text-sm font-medium on all buttons', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('text-sm');
        expect(button).toHaveClass('font-medium');
      });
    });

    it('should have transition-all for animations', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-all');
      });
    });

    it('should have border on unselected buttons', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      const simpleButton = screen.getByRole('button', { name: 'Simple' });
      expect(simpleButton).toHaveClass('border');
    });

    it('should have shadow-sm on selected button', () => {
      const mockOnChange = vi.fn();
      render(<ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />);

      const standardButton = screen.getByRole('button', { name: 'Standard' });
      expect(standardButton).toHaveClass('shadow-sm');
    });
  });

  describe('Container', () => {
    it('should render as flex container', () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <ReadingLevelSelector level="standard" onLevelChange={mockOnChange} />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
    });
  });
});

/**
 * EthicsModal Component Tests
 *
 * Tests for the ethics acknowledgment modal.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EthicsModal from '@/components/accountability/ethics-modal';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('EthicsModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    targetEntity: 'John Smith',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Opens with Entity Name', () => {
    it('should display the target entity name when open', () => {
      render(<EthicsModal {...defaultProps} />);

      expect(screen.getByText(/you are about to investigate:/i)).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('should display ethics acknowledgment title', () => {
      render(<EthicsModal {...defaultProps} />);

      expect(screen.getByText('Ethics Acknowledgment')).toBeInTheDocument();
    });

    it('should display all 5 ethical principles', () => {
      render(<EthicsModal {...defaultProps} />);

      expect(screen.getByText(/innocent until proven guilty/i)).toBeInTheDocument();
      expect(screen.getByText(/correlation does not equal causation/i)).toBeInTheDocument();
      expect(screen.getByText(/theoretical possibilities, NOT confirmed wrongdoing/i)).toBeInTheDocument();
      expect(screen.getByText(/verified through traditional investigative methods/i)).toBeInTheDocument();
      expect(screen.getByText(/use responsibly and ethically/i)).toBeInTheDocument();
    });
  });

  describe('Checkbox Enables Proceed Button', () => {
    it('should have proceed button disabled by default', () => {
      render(<EthicsModal {...defaultProps} />);

      const proceedButton = screen.getByRole('button', { name: /proceed with investigation/i });
      expect(proceedButton).toBeDisabled();
    });

    it('should enable proceed button when checkbox is checked', () => {
      render(<EthicsModal {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const proceedButton = screen.getByRole('button', { name: /proceed with investigation/i });
      expect(proceedButton).not.toBeDisabled();
    });

    it('should disable proceed button when checkbox is unchecked after being checked', () => {
      render(<EthicsModal {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      
      fireEvent.click(checkbox);
      expect(screen.getByRole('button', { name: /proceed with investigation/i })).not.toBeDisabled();
      
      fireEvent.click(checkbox);
      expect(screen.getByRole('button', { name: /proceed with investigation/i })).toBeDisabled();
    });
  });

  describe('Cancel Button', () => {
    it('should call onOpenChange with false when cancel is clicked', () => {
      const onOpenChange = vi.fn();
      render(<EthicsModal {...defaultProps} onOpenChange={onOpenChange} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Proceed Button', () => {
    it('should navigate to generate page when proceed is clicked after acknowledging', () => {
      const onOpenChange = vi.fn();
      render(<EthicsModal {...defaultProps} onOpenChange={onOpenChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const proceedButton = screen.getByRole('button', { name: /proceed with investigation/i });
      fireEvent.click(proceedButton);

      expect(mockPush).toHaveBeenCalledWith('/accountability/generate?entity=John%20Smith');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not navigate when proceed button is clicked while disabled', () => {
      render(<EthicsModal {...defaultProps} />);

      const proceedButton = screen.getByRole('button', { name: /proceed with investigation/i });
      fireEvent.click(proceedButton);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should encode special characters in entity name', () => {
      const onOpenChange = vi.fn();
      render(<EthicsModal {...defaultProps} targetEntity="Company & Co" onOpenChange={onOpenChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const proceedButton = screen.getByRole('button', { name: /proceed with investigation/i });
      fireEvent.click(proceedButton);

      expect(mockPush).toHaveBeenCalledWith('/accountability/generate?entity=Company%20%26%20Co');
    });
  });

  describe('Proceed Button Disabled When Checkbox Unchecked', () => {
    it('should have cursor-not-allowed class when checkbox unchecked', () => {
      render(<EthicsModal {...defaultProps} />);

      const proceedButton = screen.getByRole('button', { name: /proceed with investigation/i });
      expect(proceedButton.className).toContain('cursor-not-allowed');
    });

    it('should not have cursor-not-allowed class when checkbox checked', () => {
      render(<EthicsModal {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const proceedButton = screen.getByRole('button', { name: /proceed with investigation/i });
      expect(proceedButton.className).not.toContain('cursor-not-allowed');
    });
  });
});

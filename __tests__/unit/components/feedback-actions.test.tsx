/**
 * FeedbackActions Component Tests
 *
 * Tests for the feedback actions buttons.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeedbackActions from '@/app/components/FeedbackActions';

// Mock the modal components
vi.mock('@/app/components/SuggestSourceModal', () => ({
  default: ({ open, onOpenChange, briefId }: { open: boolean; onOpenChange: (v: boolean) => void; briefId: string }) => (
    open ? <div data-testid="suggest-source-modal">Suggest Source Modal - {briefId}</div> : null
  ),
}));

vi.mock('@/app/components/SpotErrorModal', () => ({
  default: ({ open, onOpenChange, briefId }: { open: boolean; onOpenChange: (v: boolean) => void; briefId: string }) => (
    open ? <div data-testid="spot-error-modal">Spot Error Modal - {briefId}</div> : null
  ),
}));

vi.mock('@/app/components/ProposeEditModal', () => ({
  default: ({ open, onOpenChange, briefId }: { open: boolean; onOpenChange: (v: boolean) => void; briefId: string }) => (
    open ? <div data-testid="propose-edit-modal">Propose Edit Modal - {briefId}</div> : null
  ),
}));

describe('FeedbackActions', () => {
  const defaultBriefId = 'test-brief-123';

  describe('Button Rendering', () => {
    it('should render all three action buttons', () => {
      render(<FeedbackActions briefId={defaultBriefId} />);

      expect(screen.getByText('Suggest Source')).toBeInTheDocument();
      expect(screen.getByText('Spot Error')).toBeInTheDocument();
      expect(screen.getByText('Propose Edit')).toBeInTheDocument();
    });
  });

  describe('Suggest Source Modal', () => {
    it('should open suggest source modal on button click', () => {
      render(<FeedbackActions briefId={defaultBriefId} />);

      expect(screen.queryByTestId('suggest-source-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Suggest Source'));

      expect(screen.getByTestId('suggest-source-modal')).toBeInTheDocument();
    });

    it('should pass briefId to suggest source modal', () => {
      render(<FeedbackActions briefId={defaultBriefId} />);

      fireEvent.click(screen.getByText('Suggest Source'));

      expect(screen.getByText(`Suggest Source Modal - ${defaultBriefId}`)).toBeInTheDocument();
    });
  });

  describe('Spot Error Modal', () => {
    it('should open spot error modal on button click', () => {
      render(<FeedbackActions briefId={defaultBriefId} />);

      expect(screen.queryByTestId('spot-error-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Spot Error'));

      expect(screen.getByTestId('spot-error-modal')).toBeInTheDocument();
    });

    it('should pass briefId to spot error modal', () => {
      render(<FeedbackActions briefId={defaultBriefId} />);

      fireEvent.click(screen.getByText('Spot Error'));

      expect(screen.getByText(`Spot Error Modal - ${defaultBriefId}`)).toBeInTheDocument();
    });
  });

  describe('Propose Edit Modal', () => {
    it('should open propose edit modal on button click', () => {
      render(<FeedbackActions briefId={defaultBriefId} />);

      expect(screen.queryByTestId('propose-edit-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Propose Edit'));

      expect(screen.getByTestId('propose-edit-modal')).toBeInTheDocument();
    });

    it('should pass briefId to propose edit modal', () => {
      render(<FeedbackActions briefId={defaultBriefId} />);

      fireEvent.click(screen.getByText('Propose Edit'));

      expect(screen.getByText(`Propose Edit Modal - ${defaultBriefId}`)).toBeInTheDocument();
    });
  });

  describe('Modal Independence', () => {
    it('should only open one modal at a time when clicking buttons sequentially', () => {
      render(<FeedbackActions briefId={defaultBriefId} />);

      // Open suggest source
      fireEvent.click(screen.getByText('Suggest Source'));
      expect(screen.getByTestId('suggest-source-modal')).toBeInTheDocument();

      // Open spot error (previous modal stays open since we're not closing it)
      fireEvent.click(screen.getByText('Spot Error'));
      expect(screen.getByTestId('spot-error-modal')).toBeInTheDocument();
    });
  });
});

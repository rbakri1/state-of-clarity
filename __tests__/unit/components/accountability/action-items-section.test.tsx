/**
 * ActionItemsSection Component Tests
 *
 * Tests for the Investigation Action Items section.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionItemsSection from '@/components/accountability/action-items-section';
import type { ActionItem } from '@/lib/types/accountability';

const createMockActionItem = (overrides: Partial<ActionItem> = {}): ActionItem => ({
  actionId: 'action-1',
  priority: 2,
  action: 'Test Action',
  rationale: 'Test rationale',
  dataSource: 'Test data source',
  expectedEvidence: 'Test expected evidence',
  relatedScenarios: [],
  ...overrides,
});

describe('ActionItemsSection', () => {
  describe('Section Heading', () => {
    it('should render the section heading', () => {
      render(<ActionItemsSection actionItems={[createMockActionItem()]} />);

      expect(screen.getByText('Investigation Action Items')).toBeInTheDocument();
    });

    it('should render section heading even with empty items', () => {
      render(<ActionItemsSection actionItems={[]} />);

      expect(screen.getByText('Investigation Action Items')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no action items', () => {
      render(<ActionItemsSection actionItems={[]} />);

      expect(screen.getByText('No action items identified')).toBeInTheDocument();
    });

    it('should not display ethics reminder when no action items', () => {
      render(<ActionItemsSection actionItems={[]} />);

      expect(screen.queryByText(/Investigation Roadmap/i)).not.toBeInTheDocument();
    });

    it('should not display completion counter when no action items', () => {
      render(<ActionItemsSection actionItems={[]} />);

      expect(screen.queryByText(/of.*completed/i)).not.toBeInTheDocument();
    });
  });

  describe('Ethics Reminder', () => {
    it('should display investigation roadmap reminder when items exist', () => {
      render(<ActionItemsSection actionItems={[createMockActionItem()]} />);

      expect(screen.getByText(/Investigation Roadmap/)).toBeInTheDocument();
      expect(screen.getByText(/Use checkboxes to track your progress/i)).toBeInTheDocument();
    });
  });

  describe('Priority Grouping', () => {
    it('should display Priority 1 (High) group heading', () => {
      const items = [createMockActionItem({ priority: 1 })];
      render(<ActionItemsSection actionItems={items} />);

      const headings = screen.getAllByText('Priority 1 (High)');
      expect(headings.length).toBeGreaterThanOrEqual(1);
      const groupHeading = headings.find(el => el.tagName === 'H3' && el.className.includes('text-lg'));
      expect(groupHeading).toBeInTheDocument();
    });

    it('should display Priority 2 (Medium) group heading', () => {
      const items = [createMockActionItem({ priority: 2 })];
      render(<ActionItemsSection actionItems={items} />);

      const headings = screen.getAllByText('Priority 2 (Medium)');
      expect(headings.length).toBeGreaterThanOrEqual(1);
      const groupHeading = headings.find(el => el.tagName === 'H3' && el.className.includes('text-lg'));
      expect(groupHeading).toBeInTheDocument();
    });

    it('should display Priority 3 (Low) group heading', () => {
      const items = [createMockActionItem({ priority: 3 })];
      render(<ActionItemsSection actionItems={items} />);

      const headings = screen.getAllByText('Priority 3 (Low)');
      expect(headings.length).toBeGreaterThanOrEqual(1);
      const groupHeading = headings.find(el => el.tagName === 'H3' && el.className.includes('text-lg'));
      expect(groupHeading).toBeInTheDocument();
    });

    it('should group items by priority correctly', () => {
      const items = [
        createMockActionItem({ actionId: '1', priority: 1, action: 'High Priority Action' }),
        createMockActionItem({ actionId: '2', priority: 2, action: 'Medium Priority Action' }),
        createMockActionItem({ actionId: '3', priority: 3, action: 'Low Priority Action' }),
      ];
      render(<ActionItemsSection actionItems={items} />);

      expect(screen.getByText('High Priority Action')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority Action')).toBeInTheDocument();
      expect(screen.getByText('Low Priority Action')).toBeInTheDocument();
    });

    it('should not display empty priority groups', () => {
      const items = [createMockActionItem({ priority: 2 })];
      render(<ActionItemsSection actionItems={items} />);

      const p1Headings = screen.queryAllByText('Priority 1 (High)');
      const p1GroupHeading = p1Headings.find(el => el.tagName === 'H3' && el.className.includes('text-lg'));
      expect(p1GroupHeading).toBeUndefined();

      const p2Headings = screen.getAllByText('Priority 2 (Medium)');
      const p2GroupHeading = p2Headings.find(el => el.tagName === 'H3' && el.className.includes('text-lg'));
      expect(p2GroupHeading).toBeInTheDocument();

      const p3Headings = screen.queryAllByText('Priority 3 (Low)');
      const p3GroupHeading = p3Headings.find(el => el.tagName === 'H3' && el.className.includes('text-lg'));
      expect(p3GroupHeading).toBeUndefined();
    });
  });

  describe('Priority Badges', () => {
    it('should apply correct color classes for priority 1', () => {
      const items = [createMockActionItem({ priority: 1 })];
      render(<ActionItemsSection actionItems={items} />);

      const badge = screen.getByText('Priority 1 (High)', { selector: 'span.text-xs' });
      expect(badge.className).toContain('bg-error-light');
      expect(badge.className).toContain('text-error-dark');
    });

    it('should apply correct color classes for priority 2', () => {
      const items = [createMockActionItem({ priority: 2 })];
      render(<ActionItemsSection actionItems={items} />);

      const badge = screen.getByText('Priority 2 (Medium)', { selector: 'span.text-xs' });
      expect(badge.className).toContain('bg-warning-light');
      expect(badge.className).toContain('text-warning-dark');
    });

    it('should apply correct color classes for priority 3', () => {
      const items = [createMockActionItem({ priority: 3 })];
      render(<ActionItemsSection actionItems={items} />);

      const badge = screen.getByText('Priority 3 (Low)', { selector: 'span.text-xs' });
      expect(badge.className).toContain('bg-ivory-200');
      expect(badge.className).toContain('text-ink-600');
    });
  });

  describe('Action Item Content', () => {
    it('should display action and rationale', () => {
      const item = createMockActionItem({
        action: 'Review financial records',
        rationale: 'To identify discrepancies',
      });
      render(<ActionItemsSection actionItems={[item]} />);

      expect(screen.getByText('Review financial records')).toBeInTheDocument();
      expect(screen.getByText('To identify discrepancies')).toBeInTheDocument();
    });

    it('should display data source and expected evidence', () => {
      const item = createMockActionItem({
        dataSource: 'Companies House API',
        expectedEvidence: 'Director appointment dates',
      });
      render(<ActionItemsSection actionItems={[item]} />);

      expect(screen.getByText('Data Source')).toBeInTheDocument();
      expect(screen.getByText('Companies House API')).toBeInTheDocument();
      expect(screen.getByText('Expected Evidence')).toBeInTheDocument();
      expect(screen.getByText('Director appointment dates')).toBeInTheDocument();
    });

    it('should display estimated time when provided', () => {
      const item = createMockActionItem({
        estimatedTime: '2-3 hours',
      });
      render(<ActionItemsSection actionItems={[item]} />);

      expect(screen.getByText(/Est. Time:/)).toBeInTheDocument();
      expect(screen.getByText('2-3 hours')).toBeInTheDocument();
    });

    it('should display legal considerations when provided', () => {
      const item = createMockActionItem({
        legalConsiderations: ['Data protection', 'GDPR compliance'],
      });
      render(<ActionItemsSection actionItems={[item]} />);

      expect(screen.getByText('Legal Considerations:')).toBeInTheDocument();
      expect(screen.getByText('• Data protection')).toBeInTheDocument();
      expect(screen.getByText('• GDPR compliance')).toBeInTheDocument();
    });

    it('should not display extra section when no estimated time or legal considerations', () => {
      const item = createMockActionItem({
        estimatedTime: undefined,
        legalConsiderations: [],
      });
      render(<ActionItemsSection actionItems={[item]} />);

      expect(screen.queryByText(/Est. Time:/)).not.toBeInTheDocument();
      expect(screen.queryByText('Legal Considerations:')).not.toBeInTheDocument();
    });
  });

  describe('Checkbox Tracking', () => {
    it('should toggle checkbox when clicked', () => {
      const item = createMockActionItem();
      render(<ActionItemsSection actionItems={[item]} />);

      const toggleButton = screen.getByRole('button', { name: /mark as complete/i });
      fireEvent.click(toggleButton);

      expect(screen.getByRole('button', { name: /mark as incomplete/i })).toBeInTheDocument();
    });

    it('should update completion counter when checkbox is toggled', () => {
      const items = [
        createMockActionItem({ actionId: '1' }),
        createMockActionItem({ actionId: '2' }),
      ];
      render(<ActionItemsSection actionItems={items} />);

      expect(screen.getByText('0 of 2 completed')).toBeInTheDocument();

      const toggleButtons = screen.getAllByRole('button', { name: /mark as complete/i });
      fireEvent.click(toggleButtons[0]);

      expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();
    });

    it('should apply strikethrough when item is completed', () => {
      const item = createMockActionItem({ action: 'Strikethrough Test' });
      render(<ActionItemsSection actionItems={[item]} />);

      const toggleButton = screen.getByRole('button', { name: /mark as complete/i });
      fireEvent.click(toggleButton);

      const actionText = screen.getByText('Strikethrough Test');
      expect(actionText.className).toContain('line-through');
    });

    it('should apply reduced opacity when item is completed', () => {
      const item = createMockActionItem();
      const { container } = render(<ActionItemsSection actionItems={[item]} />);

      const toggleButton = screen.getByRole('button', { name: /mark as complete/i });
      fireEvent.click(toggleButton);

      const card = container.querySelector('.opacity-60');
      expect(card).toBeInTheDocument();
    });

    it('should uncheck when clicked again', () => {
      const item = createMockActionItem();
      render(<ActionItemsSection actionItems={[item]} />);

      const toggleButton = screen.getByRole('button', { name: /mark as complete/i });
      fireEvent.click(toggleButton);

      expect(screen.getByText('1 of 1 completed')).toBeInTheDocument();

      const toggleButtonAgain = screen.getByRole('button', { name: /mark as incomplete/i });
      fireEvent.click(toggleButtonAgain);

      expect(screen.getByText('0 of 1 completed')).toBeInTheDocument();
    });
  });

  describe('Multiple Items', () => {
    it('should render all action items', () => {
      const items = [
        createMockActionItem({ actionId: '1', action: 'Action One' }),
        createMockActionItem({ actionId: '2', action: 'Action Two' }),
        createMockActionItem({ actionId: '3', action: 'Action Three' }),
      ];
      render(<ActionItemsSection actionItems={items} />);

      expect(screen.getByText('Action One')).toBeInTheDocument();
      expect(screen.getByText('Action Two')).toBeInTheDocument();
      expect(screen.getByText('Action Three')).toBeInTheDocument();
    });

    it('should track checkbox states independently', () => {
      const items = [
        createMockActionItem({ actionId: '1', action: 'Action One' }),
        createMockActionItem({ actionId: '2', action: 'Action Two' }),
      ];
      render(<ActionItemsSection actionItems={items} />);

      const toggleButtons = screen.getAllByRole('button', { name: /mark as complete/i });
      fireEvent.click(toggleButtons[0]);

      expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();

      const actionOne = screen.getByText('Action One');
      const actionTwo = screen.getByText('Action Two');
      expect(actionOne.className).toContain('line-through');
      expect(actionTwo.className).not.toContain('line-through');
    });
  });

  describe('Accessibility', () => {
    it('should have section labeled by heading', () => {
      render(<ActionItemsSection actionItems={[createMockActionItem()]} />);

      const section = screen.getByRole('region', { name: /investigation action items/i });
      expect(section).toBeInTheDocument();
    });

    it('should have accessible checkbox buttons', () => {
      render(<ActionItemsSection actionItems={[createMockActionItem()]} />);

      const toggleButton = screen.getByRole('button', { name: /mark as complete/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });
});

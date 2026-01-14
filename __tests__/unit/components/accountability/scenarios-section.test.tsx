/**
 * ScenariosSection Component Tests
 *
 * Tests for the Theoretical Corruption Scenarios section.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScenariosSection from '@/components/accountability/scenarios-section';
import type { CorruptionScenario } from '@/lib/types/accountability';

const createMockScenario = (overrides: Partial<CorruptionScenario> = {}): CorruptionScenario => ({
  scenarioId: 'scenario-1',
  title: 'Test Scenario',
  description: 'A test scenario description',
  mechanism: 'Test mechanism',
  incentiveStructure: 'Test incentive',
  enablingPositions: [],
  potentialConflicts: [],
  redFlags: [],
  innocentExplanations: [],
  riskLevel: 'medium',
  detectionDifficulty: 'moderate',
  historicalPrecedents: [],
  ...overrides,
});

describe('ScenariosSection', () => {
  describe('Section Heading', () => {
    it('should render the section heading', () => {
      render(<ScenariosSection scenarios={[createMockScenario()]} />);

      expect(screen.getByText('Theoretical Corruption Scenarios')).toBeInTheDocument();
    });

    it('should render section heading even with empty scenarios', () => {
      render(<ScenariosSection scenarios={[]} />);

      expect(screen.getByText('Theoretical Corruption Scenarios')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no scenarios', () => {
      render(<ScenariosSection scenarios={[]} />);

      expect(screen.getByText('No scenarios identified')).toBeInTheDocument();
    });

    it('should not display ethics reminder when no scenarios', () => {
      render(<ScenariosSection scenarios={[]} />);

      expect(screen.queryByText(/hypothetical scenarios only/i)).not.toBeInTheDocument();
    });
  });

  describe('Ethics Reminder', () => {
    it('should display ethics reminder when scenarios exist', () => {
      render(<ScenariosSection scenarios={[createMockScenario()]} />);

      expect(screen.getByText(/hypothetical scenarios only/i)).toBeInTheDocument();
      expect(screen.getByText(/Always assume innocence until proven otherwise/i)).toBeInTheDocument();
    });
  });

  describe('Risk Level Badges', () => {
    it('should display Critical Risk badge for critical risk level', () => {
      const scenario = createMockScenario({ riskLevel: 'critical' });
      render(<ScenariosSection scenarios={[scenario]} />);

      expect(screen.getByText('Critical Risk')).toBeInTheDocument();
    });

    it('should display High Risk badge for high risk level', () => {
      const scenario = createMockScenario({ riskLevel: 'high' });
      render(<ScenariosSection scenarios={[scenario]} />);

      expect(screen.getByText('High Risk')).toBeInTheDocument();
    });

    it('should display Medium Risk badge for medium risk level', () => {
      const scenario = createMockScenario({ riskLevel: 'medium' });
      render(<ScenariosSection scenarios={[scenario]} />);

      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    });

    it('should display Low Risk badge for low risk level', () => {
      const scenario = createMockScenario({ riskLevel: 'low' });
      render(<ScenariosSection scenarios={[scenario]} />);

      expect(screen.getByText('Low Risk')).toBeInTheDocument();
    });

    it('should apply correct color classes for high/critical risk', () => {
      const scenario = createMockScenario({ riskLevel: 'high' });
      render(<ScenariosSection scenarios={[scenario]} />);

      const badge = screen.getByText('High Risk');
      expect(badge.className).toContain('bg-error-light');
      expect(badge.className).toContain('text-error-dark');
    });

    it('should apply correct color classes for medium risk', () => {
      const scenario = createMockScenario({ riskLevel: 'medium' });
      render(<ScenariosSection scenarios={[scenario]} />);

      const badge = screen.getByText('Medium Risk');
      expect(badge.className).toContain('bg-warning-light');
      expect(badge.className).toContain('text-warning-dark');
    });

    it('should apply correct color classes for low risk', () => {
      const scenario = createMockScenario({ riskLevel: 'low' });
      render(<ScenariosSection scenarios={[scenario]} />);

      const badge = screen.getByText('Low Risk');
      expect(badge.className).toContain('bg-ivory-200');
      expect(badge.className).toContain('text-ink-600');
    });
  });

  describe('Scenario Cards', () => {
    it('should render scenario title and description', () => {
      const scenario = createMockScenario({
        title: 'Procurement Manipulation',
        description: 'Rigging government contracts',
      });
      render(<ScenariosSection scenarios={[scenario]} />);

      expect(screen.getByText('Procurement Manipulation')).toBeInTheDocument();
      expect(screen.getByText('Rigging government contracts')).toBeInTheDocument();
    });

    it('should render multiple scenarios', () => {
      const scenarios = [
        createMockScenario({ scenarioId: '1', title: 'Scenario One' }),
        createMockScenario({ scenarioId: '2', title: 'Scenario Two' }),
        createMockScenario({ scenarioId: '3', title: 'Scenario Three' }),
      ];
      render(<ScenariosSection scenarios={scenarios} />);

      expect(screen.getByText('Scenario One')).toBeInTheDocument();
      expect(screen.getByText('Scenario Two')).toBeInTheDocument();
      expect(screen.getByText('Scenario Three')).toBeInTheDocument();
    });
  });

  describe('Expandable Content', () => {
    it('should expand when card is clicked', () => {
      const scenario = createMockScenario({
        mechanism: 'Detailed mechanism description',
        enablingPositions: ['Director position'],
      });
      render(<ScenariosSection scenarios={[scenario]} />);

      const cardButton = screen.getByRole('button', { name: /test scenario/i });
      fireEvent.click(cardButton);

      expect(screen.getByText('Enabling Positions')).toBeInTheDocument();
      expect(screen.getByText('Director position')).toBeInTheDocument();
    });

    it('should display enabling positions when expanded', () => {
      const scenario = createMockScenario({
        enablingPositions: ['Board Member', 'Committee Chair'],
      });
      render(<ScenariosSection scenarios={[scenario]} />);

      const cardButton = screen.getByRole('button', { name: /test scenario/i });
      fireEvent.click(cardButton);

      expect(screen.getByText('Board Member')).toBeInTheDocument();
      expect(screen.getByText('Committee Chair')).toBeInTheDocument();
    });

    it('should display red flags when expanded', () => {
      const scenario = createMockScenario({
        redFlags: ['Unusual timing', 'Hidden connections'],
      });
      render(<ScenariosSection scenarios={[scenario]} />);

      const cardButton = screen.getByRole('button', { name: /test scenario/i });
      fireEvent.click(cardButton);

      expect(screen.getByText('Red Flags')).toBeInTheDocument();
      expect(screen.getByText('Unusual timing')).toBeInTheDocument();
      expect(screen.getByText('Hidden connections')).toBeInTheDocument();
    });

    it('should display innocent explanations highlighted in green when expanded', () => {
      const scenario = createMockScenario({
        innocentExplanations: ['Legitimate business reason', 'Standard practice'],
      });
      render(<ScenariosSection scenarios={[scenario]} />);

      const cardButton = screen.getByRole('button', { name: /test scenario/i });
      fireEvent.click(cardButton);

      expect(screen.getByText('Innocent Explanations')).toBeInTheDocument();
      expect(screen.getByText('Legitimate business reason')).toBeInTheDocument();
      expect(screen.getByText('Standard practice')).toBeInTheDocument();

      const explanationsContainer = screen.getByText('Innocent Explanations').closest('div');
      const parentContainer = explanationsContainer?.parentElement;
      expect(parentContainer?.className).toContain('bg-success-light');
    });

    it('should display mechanism when expanded', () => {
      const scenario = createMockScenario({
        mechanism: 'Through shell companies and intermediaries',
      });
      render(<ScenariosSection scenarios={[scenario]} />);

      const cardButton = screen.getByRole('button', { name: /test scenario/i });
      fireEvent.click(cardButton);

      expect(screen.getByText('Mechanism')).toBeInTheDocument();
      expect(screen.getByText('Through shell companies and intermediaries')).toBeInTheDocument();
    });

    it('should display detection difficulty when expanded', () => {
      const scenario = createMockScenario({
        detectionDifficulty: 'very_difficult',
      });
      render(<ScenariosSection scenarios={[scenario]} />);

      const cardButton = screen.getByRole('button', { name: /test scenario/i });
      fireEvent.click(cardButton);

      expect(screen.getByText('Detection Difficulty:')).toBeInTheDocument();
      expect(screen.getByText('very difficult')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-expanded attribute', () => {
      render(<ScenariosSection scenarios={[createMockScenario()]} />);

      const cardButton = screen.getByRole('button', { name: /test scenario/i });
      expect(cardButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(cardButton);
      expect(cardButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have section labeled by heading', () => {
      render(<ScenariosSection scenarios={[createMockScenario()]} />);

      const section = screen.getByRole('region', { name: /theoretical corruption scenarios/i });
      expect(section).toBeInTheDocument();
    });
  });
});

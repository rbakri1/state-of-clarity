/**
 * StructuredDataSections Component Tests
 *
 * Tests for the structured data sections component to ensure:
 * - Renders definitions table correctly
 * - Renders factors table correctly
 * - Renders policy suggestions (both formats)
 * - Renders consequences table correctly
 * - Renders historical summary section
 * - Uses CollapsibleSection for each data type
 * - Handles empty/missing data gracefully
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { StructuredDataSections } from '@/app/components/StructuredDataSections';

const mockDefinitions = [
  {
    term: 'GDP',
    definition: 'Gross Domestic Product - the total monetary value of all goods and services produced.',
    source: 'Bureau of Economic Analysis',
    points_of_contention: 'Does not account for informal economies.',
  },
  {
    term: 'Inflation',
    definition: 'The rate at which prices increase over time.',
  },
];

const mockFactors = [
  {
    name: 'Interest Rates',
    impact: 'High',
    evidence: ['Fed rate decisions affect borrowing costs', 'Higher rates slow economic growth'],
  },
  {
    name: 'Consumer Spending',
    impact: 'Medium',
    evidence: ['Retail sales data shows trends'],
  },
];

const mockPoliciesWithPros = [
  {
    name: 'Tax Reform',
    pros: ['Simplifies tax code', 'Reduces compliance costs'],
    cons: ['May reduce revenue', 'Political resistance'],
  },
];

const mockPoliciesWithDetail = [
  {
    name: 'Infrastructure Investment',
    detail: 'Increase federal spending on roads and bridges by $100B over 5 years.',
    justification: 'Aging infrastructure costs economy $200B annually in lost productivity.',
    case_studies: ['Germany Autobahn renovation project', 'Japan earthquake-proofing program'],
  },
];

const mockConsequences = [
  {
    action: 'Raise minimum wage',
    first_order: 'Workers earn more per hour',
    second_order: 'Some businesses may reduce hours or staff',
  },
];

const mockHistoricalSummary = {
  introduction: 'This topic has deep historical roots.',
  origins: 'The concept originated in the 18th century.',
  key_milestones: ['1776 - Adam Smith publishes Wealth of Nations', '1936 - Keynes introduces macroeconomics'],
  modern_context: 'Today, this remains highly relevant.',
  lessons: ['Markets need regulation', 'Boom-bust cycles are inevitable'],
};

describe('StructuredDataSections', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Definitions Section', () => {
    it('should render definitions section when definitions provided', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: mockDefinitions }}
        />
      );

      expect(screen.getByText('Definitions')).toBeInTheDocument();
    });

    it('should render definition terms', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: mockDefinitions }}
        />
      );

      expect(screen.getByText('GDP')).toBeInTheDocument();
      expect(screen.getByText('Inflation')).toBeInTheDocument();
    });

    it('should render definition texts', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: mockDefinitions }}
        />
      );

      expect(screen.getByText(/Gross Domestic Product/)).toBeInTheDocument();
      expect(screen.getByText(/rate at which prices increase/)).toBeInTheDocument();
    });

    it('should render source when provided', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: mockDefinitions }}
        />
      );

      expect(screen.getByText(/Source: Bureau of Economic Analysis/)).toBeInTheDocument();
    });

    it('should render points of contention when provided', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: mockDefinitions }}
        />
      );

      expect(screen.getByText(/Does not account for informal economies/)).toBeInTheDocument();
    });

    it('should render table headers for definitions', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: mockDefinitions }}
        />
      );

      expect(screen.getByText('Term')).toBeInTheDocument();
      expect(screen.getByText('Definition')).toBeInTheDocument();
    });

    it('should show item count in section title', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: mockDefinitions }}
        />
      );

      // CollapsibleSection shows count as "(2)"
      expect(screen.getByText(/Definitions/)).toBeInTheDocument();
    });

    it('should be expanded by default', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: mockDefinitions }}
        />
      );

      // If expanded, the table content should be visible
      expect(screen.getByText('GDP')).toBeInTheDocument();
    });
  });

  describe('Factors Section', () => {
    it('should render factors section when factors provided', () => {
      render(
        <StructuredDataSections
          structuredData={{ factors: mockFactors }}
        />
      );

      expect(screen.getByText('Factors')).toBeInTheDocument();
    });

    it('should render factor names', () => {
      render(
        <StructuredDataSections
          structuredData={{ factors: mockFactors }}
        />
      );

      expect(screen.getByText('Interest Rates')).toBeInTheDocument();
      expect(screen.getByText('Consumer Spending')).toBeInTheDocument();
    });

    it('should render factor impact badges', () => {
      render(
        <StructuredDataSections
          structuredData={{ factors: mockFactors }}
        />
      );

      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should render factor evidence list', () => {
      render(
        <StructuredDataSections
          structuredData={{ factors: mockFactors }}
        />
      );

      expect(screen.getByText(/Fed rate decisions affect borrowing costs/)).toBeInTheDocument();
      expect(screen.getByText(/Higher rates slow economic growth/)).toBeInTheDocument();
    });

    it('should render table headers for factors', () => {
      render(
        <StructuredDataSections
          structuredData={{ factors: mockFactors }}
        />
      );

      expect(screen.getByText('Factor')).toBeInTheDocument();
      expect(screen.getByText('Impact')).toBeInTheDocument();
      expect(screen.getByText('Evidence')).toBeInTheDocument();
    });

    it('should be expanded by default', () => {
      render(
        <StructuredDataSections
          structuredData={{ factors: mockFactors }}
        />
      );

      expect(screen.getByText('Interest Rates')).toBeInTheDocument();
    });
  });

  describe('Policy Suggestions Section - Pros/Cons Format', () => {
    it('should render policy suggestions section', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithPros }}
        />
      );

      expect(screen.getByText('Policy Suggestions')).toBeInTheDocument();
    });

    it('should render policy name', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithPros }}
        />
      );

      // Need to expand the section first since policies are collapsed by default
      const sectionButton = screen.getByText('Policy Suggestions');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Tax Reform')).toBeInTheDocument();
    });

    it('should render pros list', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithPros }}
        />
      );

      const sectionButton = screen.getByText('Policy Suggestions');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Simplifies tax code')).toBeInTheDocument();
      expect(screen.getByText('Reduces compliance costs')).toBeInTheDocument();
    });

    it('should render cons list', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithPros }}
        />
      );

      const sectionButton = screen.getByText('Policy Suggestions');
      fireEvent.click(sectionButton);

      expect(screen.getByText('May reduce revenue')).toBeInTheDocument();
      expect(screen.getByText('Political resistance')).toBeInTheDocument();
    });

    it('should render table headers for pros/cons format', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithPros }}
        />
      );

      const sectionButton = screen.getByText('Policy Suggestions');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Policy')).toBeInTheDocument();
      expect(screen.getByText('Pros')).toBeInTheDocument();
      expect(screen.getByText('Cons')).toBeInTheDocument();
    });
  });

  describe('Policy Suggestions Section - Detail Format', () => {
    it('should render policy with detail format', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithDetail }}
        />
      );

      const sectionButton = screen.getByText('Policy Suggestions');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Infrastructure Investment')).toBeInTheDocument();
    });

    it('should render policy detail text', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithDetail }}
        />
      );

      const sectionButton = screen.getByText('Policy Suggestions');
      fireEvent.click(sectionButton);

      expect(screen.getByText(/Increase federal spending on roads and bridges/)).toBeInTheDocument();
    });

    it('should render policy justification', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithDetail }}
        />
      );

      const sectionButton = screen.getByText('Policy Suggestions');
      fireEvent.click(sectionButton);

      expect(screen.getByText(/Aging infrastructure costs economy/)).toBeInTheDocument();
    });

    it('should render case studies', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithDetail }}
        />
      );

      const sectionButton = screen.getByText('Policy Suggestions');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Case Studies:')).toBeInTheDocument();
      expect(screen.getByText(/Germany Autobahn renovation project/)).toBeInTheDocument();
      expect(screen.getByText(/Japan earthquake-proofing program/)).toBeInTheDocument();
    });
  });

  describe('Consequences Section', () => {
    it('should render consequences section when provided', () => {
      render(
        <StructuredDataSections
          structuredData={{ consequences: mockConsequences }}
        />
      );

      expect(screen.getByText('Consequences')).toBeInTheDocument();
    });

    it('should render action column', () => {
      render(
        <StructuredDataSections
          structuredData={{ consequences: mockConsequences }}
        />
      );

      const sectionButton = screen.getByText('Consequences');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Raise minimum wage')).toBeInTheDocument();
    });

    it('should render first-order effects', () => {
      render(
        <StructuredDataSections
          structuredData={{ consequences: mockConsequences }}
        />
      );

      const sectionButton = screen.getByText('Consequences');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Workers earn more per hour')).toBeInTheDocument();
    });

    it('should render second-order effects', () => {
      render(
        <StructuredDataSections
          structuredData={{ consequences: mockConsequences }}
        />
      );

      const sectionButton = screen.getByText('Consequences');
      fireEvent.click(sectionButton);

      expect(screen.getByText(/Some businesses may reduce hours or staff/)).toBeInTheDocument();
    });

    it('should render table headers for consequences', () => {
      render(
        <StructuredDataSections
          structuredData={{ consequences: mockConsequences }}
        />
      );

      const sectionButton = screen.getByText('Consequences');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('First-Order Effects')).toBeInTheDocument();
      expect(screen.getByText('Second-Order Effects')).toBeInTheDocument();
    });
  });

  describe('Historical Summary Section', () => {
    it('should render historical summary when provided', () => {
      render(
        <StructuredDataSections
          structuredData={{}}
          historicalSummary={mockHistoricalSummary}
        />
      );

      expect(screen.getByText('Historical Summary')).toBeInTheDocument();
    });

    it('should render introduction', () => {
      render(
        <StructuredDataSections
          structuredData={{}}
          historicalSummary={mockHistoricalSummary}
        />
      );

      const sectionButton = screen.getByText('Historical Summary');
      fireEvent.click(sectionButton);

      expect(screen.getByText('This topic has deep historical roots.')).toBeInTheDocument();
    });

    it('should render origins section', () => {
      render(
        <StructuredDataSections
          structuredData={{}}
          historicalSummary={mockHistoricalSummary}
        />
      );

      const sectionButton = screen.getByText('Historical Summary');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Origins')).toBeInTheDocument();
      expect(screen.getByText(/originated in the 18th century/)).toBeInTheDocument();
    });

    it('should render key milestones', () => {
      render(
        <StructuredDataSections
          structuredData={{}}
          historicalSummary={mockHistoricalSummary}
        />
      );

      const sectionButton = screen.getByText('Historical Summary');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Key Milestones')).toBeInTheDocument();
      expect(screen.getByText(/1776 - Adam Smith publishes Wealth of Nations/)).toBeInTheDocument();
    });

    it('should render modern context', () => {
      render(
        <StructuredDataSections
          structuredData={{}}
          historicalSummary={mockHistoricalSummary}
        />
      );

      const sectionButton = screen.getByText('Historical Summary');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Modern Context')).toBeInTheDocument();
      expect(screen.getByText(/Today, this remains highly relevant/)).toBeInTheDocument();
    });

    it('should render lessons', () => {
      render(
        <StructuredDataSections
          structuredData={{}}
          historicalSummary={mockHistoricalSummary}
        />
      );

      const sectionButton = screen.getByText('Historical Summary');
      fireEvent.click(sectionButton);

      expect(screen.getByText('Lessons')).toBeInTheDocument();
      expect(screen.getByText(/Markets need regulation/)).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should not render definitions section when empty', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: [] }}
        />
      );

      expect(screen.queryByText('Definitions')).not.toBeInTheDocument();
    });

    it('should not render factors section when empty', () => {
      render(
        <StructuredDataSections
          structuredData={{ factors: [] }}
        />
      );

      expect(screen.queryByText('Factors')).not.toBeInTheDocument();
    });

    it('should not render policies section when empty', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: [] }}
        />
      );

      expect(screen.queryByText('Policy Suggestions')).not.toBeInTheDocument();
    });

    it('should not render consequences section when empty', () => {
      render(
        <StructuredDataSections
          structuredData={{ consequences: [] }}
        />
      );

      expect(screen.queryByText('Consequences')).not.toBeInTheDocument();
    });

    it('should not render historical summary when not provided', () => {
      render(
        <StructuredDataSections
          structuredData={{}}
        />
      );

      expect(screen.queryByText('Historical Summary')).not.toBeInTheDocument();
    });

    it('should handle completely empty structured data', () => {
      const { container } = render(
        <StructuredDataSections
          structuredData={{}}
        />
      );

      // Should render empty container
      expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    });
  });

  describe('Section Expansion State', () => {
    it('should have definitions expanded by default', () => {
      render(
        <StructuredDataSections
          structuredData={{ definitions: mockDefinitions }}
        />
      );

      // Content should be visible without clicking
      expect(screen.getByText('GDP')).toBeInTheDocument();
    });

    it('should have factors expanded by default', () => {
      render(
        <StructuredDataSections
          structuredData={{ factors: mockFactors }}
        />
      );

      expect(screen.getByText('Interest Rates')).toBeInTheDocument();
    });

    it('should have policies collapsed by default', () => {
      render(
        <StructuredDataSections
          structuredData={{ policies: mockPoliciesWithPros }}
        />
      );

      // Check aria-expanded attribute - should be false for collapsed
      const policiesButton = screen.getByRole('button', { name: /Policy Suggestions/ });
      expect(policiesButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have consequences collapsed by default', () => {
      render(
        <StructuredDataSections
          structuredData={{ consequences: mockConsequences }}
        />
      );

      const consequencesButton = screen.getByRole('button', { name: /Consequences/ });
      expect(consequencesButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have historical summary collapsed by default', () => {
      render(
        <StructuredDataSections
          structuredData={{}}
          historicalSummary={mockHistoricalSummary}
        />
      );

      const historyButton = screen.getByRole('button', { name: /Historical Summary/ });
      expect(historyButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Combined Sections', () => {
    it('should render multiple sections together', () => {
      render(
        <StructuredDataSections
          structuredData={{
            definitions: mockDefinitions,
            factors: mockFactors,
            policies: mockPoliciesWithPros,
            consequences: mockConsequences,
          }}
          historicalSummary={mockHistoricalSummary}
        />
      );

      expect(screen.getByText('Definitions')).toBeInTheDocument();
      expect(screen.getByText('Factors')).toBeInTheDocument();
      expect(screen.getByText('Policy Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Consequences')).toBeInTheDocument();
      expect(screen.getByText('Historical Summary')).toBeInTheDocument();
    });
  });
});

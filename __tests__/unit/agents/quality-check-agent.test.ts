/**
 * Quality Check Agent Unit Tests
 *
 * Tests for quality score calculation and investigation result persistence.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearMockData, seedMockData, getMockData } from '../../mocks/supabase';

// Mock Supabase before importing
vi.mock('@supabase/supabase-js', async () => {
  const { createMockSupabaseClient } = await import('../../mocks/supabase');
  return {
    createClient: vi.fn(() => createMockSupabaseClient()),
  };
});

import { qualityCheckNode } from '@/lib/agents/quality-check-agent';
import type { AccountabilityState } from '@/lib/agents/accountability-tracker-orchestrator';
import type { UKProfileData } from '@/lib/types/accountability';

function createTestState(
  targetEntity: string,
  overrides: Partial<AccountabilityState> = {}
): AccountabilityState {
  return {
    targetEntity,
    investigationId: 'test-investigation-123',
    entityType: null,
    profileData: null,
    corruptionScenarios: null,
    actionItems: null,
    qualityScore: null,
    qualityNotes: null,
    error: null,
    completedSteps: [],
    callbacks: null,
    ...overrides,
  };
}

function createMockProfileData(): UKProfileData {
  return {
    fullName: 'Test Person',
    aliases: [],
    currentPositions: [
      {
        title: 'Director',
        organization: 'Test Company Ltd',
        startDate: '2020-01-01',
        description: 'Managing director',
        sourceUrl: 'https://example.com/source',
      },
    ],
    pastPositions: [],
    companiesHouseEntities: [
      {
        companyNumber: '12345678',
        companyName: 'Test Company Ltd',
        role: 'Director',
        appointedOn: '2020-01-01',
        companyStatus: 'Active',
        sourceUrl: 'https://beta.companieshouse.gov.uk/company/12345678',
      },
    ],
    registerOfInterests: [],
    charityInvolvements: [],
    politicalDonations: [],
    governmentContracts: [],
    sources: [],
    dataCompleteness: {
      hasCompaniesHouse: true,
      hasRegisterOfInterests: false,
      hasCharityData: false,
      hasDonationsData: false,
      hasContractsData: false,
      completenessScore: 0.2,
    },
  };
}

function createMockScenarios() {
  return [
    {
      scenarioId: 'scenario-1',
      title: 'Potential Conflict',
      description: 'Test scenario description',
      mechanism: 'Test mechanism',
      incentiveStructure: 'Test incentive',
      enablingPositions: ['Director'],
      potentialConflicts: [],
      redFlags: [],
      innocentExplanations: ['Test explanation'],
      riskLevel: 'medium' as const,
      detectionDifficulty: 'moderate' as const,
      historicalPrecedents: [],
    },
    {
      scenarioId: 'scenario-2',
      title: 'Potential Issue',
      description: 'Another test scenario',
      mechanism: 'Test mechanism',
      incentiveStructure: 'Test incentive',
      enablingPositions: ['Director'],
      potentialConflicts: [],
      redFlags: [],
      innocentExplanations: ['Test explanation'],
      riskLevel: 'low' as const,
      detectionDifficulty: 'easy' as const,
      historicalPrecedents: [],
    },
    {
      scenarioId: 'scenario-3',
      title: 'Third Scenario',
      description: 'Third test scenario',
      mechanism: 'Test mechanism',
      incentiveStructure: 'Test incentive',
      enablingPositions: ['Director'],
      potentialConflicts: [],
      redFlags: [],
      innocentExplanations: ['Test explanation'],
      riskLevel: 'low' as const,
      detectionDifficulty: 'easy' as const,
      historicalPrecedents: [],
    },
  ];
}

describe('Quality Check Agent', () => {
  beforeEach(() => {
    clearMockData();
    // Seed some sources
    seedMockData('accountability_investigation_sources', [
      { id: 'source-1', investigation_id: 'test-investigation-123', source_type: 'companies_house', url: 'https://example.com/1', accessed_at: new Date().toISOString() },
      { id: 'source-2', investigation_id: 'test-investigation-123', source_type: 'charity_commission', url: 'https://example.com/2', accessed_at: new Date().toISOString() },
      { id: 'source-3', investigation_id: 'test-investigation-123', source_type: 'electoral_commission', url: 'https://example.com/3', accessed_at: new Date().toISOString() },
      { id: 'source-4', investigation_id: 'test-investigation-123', source_type: 'contracts_finder', url: 'https://example.com/4', accessed_at: new Date().toISOString() },
    ]);
    // Seed investigation record
    seedMockData('accountability_investigations', [
      { id: 'test-investigation-123', target_entity: 'Test Person', user_id: 'user-1' },
    ]);
  });

  describe('Quality Score Calculation', () => {
    it('should calculate quality score based on sources and scenarios', async () => {
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        actionItems: [],
      });

      const result = await qualityCheckNode(state);

      expect(result.qualityScore).toBeDefined();
      expect(typeof result.qualityScore).toBe('number');
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(10);
    });

    it('should return quality notes explaining the score breakdown', async () => {
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        actionItems: [],
      });

      const result = await qualityCheckNode(state);

      expect(result.qualityNotes).toBeDefined();
      expect(Array.isArray(result.qualityNotes)).toBe(true);
      expect(result.qualityNotes!.length).toBeGreaterThan(0);
    });

    it('should pass quality gate with sufficient sources and scenarios', async () => {
      // Add more sources
      seedMockData('accountability_investigation_sources', [
        { id: 'source-1', investigation_id: 'test-investigation-123', source_type: 'companies_house', url: 'https://example.com/1', accessed_at: new Date().toISOString() },
        { id: 'source-2', investigation_id: 'test-investigation-123', source_type: 'charity_commission', url: 'https://example.com/2', accessed_at: new Date().toISOString() },
        { id: 'source-3', investigation_id: 'test-investigation-123', source_type: 'electoral_commission', url: 'https://example.com/3', accessed_at: new Date().toISOString() },
        { id: 'source-4', investigation_id: 'test-investigation-123', source_type: 'contracts_finder', url: 'https://example.com/4', accessed_at: new Date().toISOString() },
        { id: 'source-5', investigation_id: 'test-investigation-123', source_type: 'other', url: 'https://example.com/5', accessed_at: new Date().toISOString() },
        { id: 'source-6', investigation_id: 'test-investigation-123', source_type: 'other', url: 'https://example.com/6', accessed_at: new Date().toISOString() },
        { id: 'source-7', investigation_id: 'test-investigation-123', source_type: 'other', url: 'https://example.com/7', accessed_at: new Date().toISOString() },
      ]);

      const scenarios = [
        ...createMockScenarios(),
        {
          scenarioId: 'scenario-4',
          title: 'Fourth Scenario',
          description: 'Fourth test',
          mechanism: 'Test',
          incentiveStructure: 'Test',
          enablingPositions: ['Director'],
          potentialConflicts: [],
          redFlags: [],
          innocentExplanations: ['Test'],
          riskLevel: 'low' as const,
          detectionDifficulty: 'easy' as const,
          historicalPrecedents: [],
        },
        {
          scenarioId: 'scenario-5',
          title: 'Fifth Scenario',
          description: 'Fifth test',
          mechanism: 'Test',
          incentiveStructure: 'Test',
          enablingPositions: ['Director'],
          potentialConflicts: [],
          redFlags: [],
          innocentExplanations: ['Test'],
          riskLevel: 'low' as const,
          detectionDifficulty: 'easy' as const,
          historicalPrecedents: [],
        },
        {
          scenarioId: 'scenario-6',
          title: 'Sixth Scenario',
          description: 'Sixth test',
          mechanism: 'Test',
          incentiveStructure: 'Test',
          enablingPositions: ['Director'],
          potentialConflicts: [],
          redFlags: [],
          innocentExplanations: ['Test'],
          riskLevel: 'low' as const,
          detectionDifficulty: 'easy' as const,
          historicalPrecedents: [],
        },
      ];

      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: scenarios,
        actionItems: [],
      });

      const result = await qualityCheckNode(state);

      // 7+ sources = 5 points, 6 scenarios = 5 points = 10 total
      expect(result.qualityScore).toBe(10);
      expect(result.qualityNotes!.some((n: string) => n.includes('passed'))).toBe(true);
    });

    it('should fail quality gate with insufficient data', async () => {
      seedMockData('accountability_investigation_sources', [
        { id: 'source-1', investigation_id: 'test-investigation-123', source_type: 'companies_house', url: 'https://example.com/1', accessed_at: new Date().toISOString() },
      ]);

      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: [], // No scenarios
        actionItems: [],
      });

      const result = await qualityCheckNode(state);

      expect(result.qualityScore).toBeLessThan(6);
      expect(result.qualityNotes!.some((n: string) => n.includes('FAILED'))).toBe(true);
    });
  });

  describe('Database Persistence', () => {
    it('should persist investigation results to database', async () => {
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        actionItems: [{ actionId: 'action-1', description: 'Test action', category: 'foia_request' as const, priority: 'medium' as const, estimatedEffort: 'hours' as const, nextSteps: [] }],
      });

      await qualityCheckNode(state);

      const investigations = getMockData('accountability_investigations');
      const updated = investigations.find((i: any) => i.id === 'test-investigation-123');
      expect(updated).toBeDefined();
    });
  });

  describe('Completed Steps', () => {
    it('should add quality_check to completedSteps', async () => {
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        actionItems: [],
      });

      const result = await qualityCheckNode(state);

      expect(result.completedSteps).toContain('quality_check');
    });
  });

  describe('Callbacks', () => {
    it('should call onAgentStarted callback if provided', async () => {
      const onAgentStarted = vi.fn();
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        actionItems: [],
        callbacks: {
          onAgentStarted,
          onAgentCompleted: vi.fn(),
        },
      });

      await qualityCheckNode(state);

      expect(onAgentStarted).toHaveBeenCalledWith('quality_check');
    });

    it('should call onAgentCompleted callback with duration', async () => {
      const onAgentCompleted = vi.fn();
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        actionItems: [],
        callbacks: {
          onAgentStarted: vi.fn(),
          onAgentCompleted,
        },
      });

      await qualityCheckNode(state);

      expect(onAgentCompleted).toHaveBeenCalledWith('quality_check', expect.any(Number));
    });

    it('should call onStageChanged callback with checking', async () => {
      const onStageChanged = vi.fn();
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        actionItems: [],
        callbacks: {
          onStageChanged,
        },
      });

      await qualityCheckNode(state);

      expect(onStageChanged).toHaveBeenCalledWith('checking');
    });

    it('should work without callbacks (optional)', async () => {
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        actionItems: [],
        callbacks: null,
      });

      const result = await qualityCheckNode(state);

      expect(result.qualityScore).toBeDefined();
      expect(result.completedSteps).toContain('quality_check');
    });
  });

  describe('Default Profile Handling', () => {
    it('should create default profile when profileData is null', async () => {
      const state = createTestState('Unknown Person', {
        profileData: null,
        corruptionScenarios: createMockScenarios(),
        actionItems: [],
      });

      const result = await qualityCheckNode(state);

      expect(result.qualityScore).toBeDefined();
      expect(result.completedSteps).toContain('quality_check');
    });
  });

  describe('Empty Scenarios Handling', () => {
    it('should handle null corruption scenarios', async () => {
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: null,
        actionItems: [],
      });

      const result = await qualityCheckNode(state);

      expect(result.qualityScore).toBeDefined();
      // 4 sources = 2.5 points, 0 scenarios = 0 points = 2.5 total
      expect(result.qualityScore).toBe(2.5);
    });

    it('should handle empty action items', async () => {
      const state = createTestState('Test Person', {
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        actionItems: null,
      });

      const result = await qualityCheckNode(state);

      expect(result.qualityScore).toBeDefined();
      expect(result.completedSteps).toContain('quality_check');
    });
  });
});

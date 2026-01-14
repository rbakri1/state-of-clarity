/**
 * Accountability Service Unit Tests
 *
 * Tests for the accountability service functions including quality score calculation
 * and CRUD operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearMockData, mockSupabaseClient, seedMockData, getMockData } from '../../mocks/supabase';
import type { UKProfileData, CorruptionScenario, AccountabilityInvestigation } from '@/lib/types/accountability';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient,
}));

import {
  calculateQualityScore,
  createInvestigation,
  getInvestigation,
  updateInvestigationResults,
  listUserInvestigations,
  addInvestigationSource,
  getInvestigationSources,
} from '@/lib/services/accountability-service';

const createMockProfileData = (): UKProfileData => ({
  fullName: 'Test Person',
  aliases: [],
  currentPositions: [],
  pastPositions: [],
  companiesHouseEntities: [],
  registerOfInterests: [],
  charityInvolvements: [],
  politicalDonations: [],
  governmentContracts: [],
  sources: [],
  dataCompleteness: {
    hasCompaniesHouse: false,
    hasRegisterOfInterests: false,
    hasCharityData: false,
    hasDonationsData: false,
    hasContractsData: false,
    completenessScore: 0,
  },
});

const createMockScenario = (id: string): CorruptionScenario => ({
  scenarioId: id,
  title: `Test Scenario ${id}`,
  description: 'Test description',
  mechanism: 'Test mechanism',
  incentiveStructure: 'Test incentive',
  enablingPositions: [],
  potentialConflicts: [],
  redFlags: [],
  innocentExplanations: [],
  riskLevel: 'medium',
  detectionDifficulty: 'moderate',
  historicalPrecedents: [],
});

describe('Accountability Service', () => {
  describe('calculateQualityScore', () => {
    it('should return score 0 for 0 sources and 0 scenarios', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [],
        data_sources_count: 0,
      };

      const result = calculateQualityScore(investigation);

      expect(result.score).toBe(0);
      expect(result.notes).toContain('Sources: 0 sources (0-3) = 0 points');
      expect(result.notes).toContain('Scenarios: 0 scenarios (<3) = 0 points');
      expect(result.notes).toContain('QUALITY GATE FAILED');
    });

    it('should return score 5.0 for 5 sources and 4 scenarios', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [
          createMockScenario('1'),
          createMockScenario('2'),
          createMockScenario('3'),
          createMockScenario('4'),
        ],
        data_sources_count: 5,
      };

      const result = calculateQualityScore(investigation);

      expect(result.score).toBe(5);
      expect(result.notes).toContain('Sources: 5 sources (4-6) = 2.5 points');
      expect(result.notes).toContain('Scenarios: 4 scenarios (3-5) = 2.5 points');
      expect(result.notes).toContain('QUALITY GATE FAILED');
    });

    it('should return score 10.0 for 10 sources and 7 scenarios', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [
          createMockScenario('1'),
          createMockScenario('2'),
          createMockScenario('3'),
          createMockScenario('4'),
          createMockScenario('5'),
          createMockScenario('6'),
          createMockScenario('7'),
        ],
        data_sources_count: 10,
      };

      const result = calculateQualityScore(investigation);

      expect(result.score).toBe(10);
      expect(result.notes).toContain('Sources: 10 sources (7+) = 5.0 points');
      expect(result.notes).toContain('Scenarios: 7 scenarios (6+) = 5.0 points');
      expect(result.notes).toContain('Quality gate passed');
    });

    it('should include "QUALITY GATE FAILED" note when score < 6.0', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [
          createMockScenario('1'),
          createMockScenario('2'),
        ],
        data_sources_count: 3,
      };

      const result = calculateQualityScore(investigation);

      expect(result.score).toBeLessThan(6.0);
      expect(result.notes).toContain('QUALITY GATE FAILED');
    });

    it('should include "Quality gate passed" note when score >= 6.0', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [
          createMockScenario('1'),
          createMockScenario('2'),
          createMockScenario('3'),
          createMockScenario('4'),
          createMockScenario('5'),
          createMockScenario('6'),
        ],
        data_sources_count: 4,
      };

      const result = calculateQualityScore(investigation);

      expect(result.score).toBeGreaterThanOrEqual(6.0);
      expect(result.notes).toContain('Quality gate passed');
    });

    it('should handle null/undefined corruption_scenarios gracefully', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: null as unknown as CorruptionScenario[],
        data_sources_count: 5,
      };

      const result = calculateQualityScore(investigation);

      expect(result.score).toBe(2.5);
      expect(result.notes).toContain('Scenarios: 0 scenarios (<3) = 0 points');
    });

    it('should handle undefined data_sources_count gracefully', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [
          createMockScenario('1'),
          createMockScenario('2'),
          createMockScenario('3'),
        ],
        data_sources_count: undefined as unknown as number,
      };

      const result = calculateQualityScore(investigation);

      expect(result.score).toBe(2.5);
      expect(result.notes).toContain('Sources: 0 sources (0-3) = 0 points');
    });

    it('should round score to 1 decimal place', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [
          createMockScenario('1'),
          createMockScenario('2'),
          createMockScenario('3'),
        ],
        data_sources_count: 4,
      };

      const result = calculateQualityScore(investigation);

      expect(result.score).toBe(5);
      expect(result.notes).toContain('Total score: 5/10');
    });

    it('should correctly score edge case with 3 sources (boundary)', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [],
        data_sources_count: 3,
      };

      const result = calculateQualityScore(investigation);

      expect(result.notes).toContain('Sources: 3 sources (0-3) = 0 points');
    });

    it('should correctly score edge case with 4 sources (boundary)', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [],
        data_sources_count: 4,
      };

      const result = calculateQualityScore(investigation);

      expect(result.notes).toContain('Sources: 4 sources (4-6) = 2.5 points');
    });

    it('should correctly score edge case with 6 sources (boundary)', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [],
        data_sources_count: 6,
      };

      const result = calculateQualityScore(investigation);

      expect(result.notes).toContain('Sources: 6 sources (4-6) = 2.5 points');
    });

    it('should correctly score edge case with 7 sources (boundary)', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [],
        data_sources_count: 7,
      };

      const result = calculateQualityScore(investigation);

      expect(result.notes).toContain('Sources: 7 sources (7+) = 5.0 points');
    });

    it('should correctly score 3 scenarios (boundary)', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [
          createMockScenario('1'),
          createMockScenario('2'),
          createMockScenario('3'),
        ],
        data_sources_count: 0,
      };

      const result = calculateQualityScore(investigation);

      expect(result.notes).toContain('Scenarios: 3 scenarios (3-5) = 2.5 points');
    });

    it('should correctly score 6 scenarios (boundary)', () => {
      const investigation = {
        profile_data: createMockProfileData(),
        corruption_scenarios: [
          createMockScenario('1'),
          createMockScenario('2'),
          createMockScenario('3'),
          createMockScenario('4'),
          createMockScenario('5'),
          createMockScenario('6'),
        ],
        data_sources_count: 0,
      };

      const result = calculateQualityScore(investigation);

      expect(result.notes).toContain('Scenarios: 6 scenarios (6+) = 5.0 points');
    });
  });

  describe('createInvestigation', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      clearMockData();
    });

    it('should create a new investigation and return id', async () => {
      const targetEntity = 'John Smith';
      const userId = 'user-123';
      const entityType = 'individual' as const;
      const ethicsAcknowledgedAt = new Date('2026-01-14T12:00:00Z');

      const result = await createInvestigation(targetEntity, userId, entityType, ethicsAcknowledgedAt);

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.id).not.toBe('');
    });

    it('should store investigation data correctly', async () => {
      const targetEntity = 'Test Corp';
      const userId = 'user-456';
      const entityType = 'organization' as const;
      const ethicsAcknowledgedAt = new Date('2026-01-14T12:00:00Z');

      await createInvestigation(targetEntity, userId, entityType, ethicsAcknowledgedAt);

      const storedData = getMockData('accountability_investigations');
      expect(storedData.length).toBe(1);
      expect(storedData[0].target_entity).toBe(targetEntity);
      expect(storedData[0].user_id).toBe(userId);
      expect(storedData[0].entity_type).toBe(entityType);
    });

    it('should throw descriptive error on database failure', async () => {
      const originalFrom = mockSupabaseClient.from;
      (mockSupabaseClient as any).from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          })),
        })),
      }));

      await expect(
        createInvestigation('Test', 'user-123', 'individual', new Date())
      ).rejects.toThrow('Failed to create investigation: Database connection failed');

      (mockSupabaseClient as any).from = originalFrom;
    });
  });

  describe('getInvestigation', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      clearMockData();
    });

    it('should return investigation when found', async () => {
      const mockInvestigation: Partial<AccountabilityInvestigation> = {
        id: 'inv-123',
        user_id: 'user-123',
        target_entity: 'John Smith',
        entity_type: 'individual',
        ethics_acknowledged_at: '2026-01-14T12:00:00Z',
        profile_data: {} as UKProfileData,
        corruption_scenarios: [],
        action_items: [],
        quality_score: null,
        quality_notes: null,
        generation_time_ms: null,
        data_sources_count: 0,
        is_public: false,
        created_at: '2026-01-14T12:00:00Z',
        updated_at: '2026-01-14T12:00:00Z',
      };

      seedMockData('accountability_investigations', [mockInvestigation]);

      const result = await getInvestigation('inv-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('inv-123');
      expect(result?.target_entity).toBe('John Smith');
    });

    it('should return null when investigation not found', async () => {
      seedMockData('accountability_investigations', []);

      const result = await getInvestigation('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateInvestigationResults', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      clearMockData();
    });

    it('should update investigation with partial data', async () => {
      const mockInvestigation = {
        id: 'inv-123',
        user_id: 'user-123',
        target_entity: 'John Smith',
        entity_type: 'individual',
        ethics_acknowledged_at: '2026-01-14T12:00:00Z',
        profile_data: {},
        corruption_scenarios: [],
        action_items: [],
        quality_score: null,
        quality_notes: null,
        generation_time_ms: null,
        data_sources_count: 0,
        is_public: false,
        created_at: '2026-01-14T12:00:00Z',
        updated_at: '2026-01-14T12:00:00Z',
      };

      seedMockData('accountability_investigations', [mockInvestigation]);

      await updateInvestigationResults('inv-123', {
        quality_score: 8.5,
        quality_notes: ['Quality gate passed'],
        generation_time_ms: 5000,
        data_sources_count: 10,
      });

      const storedData = getMockData('accountability_investigations');
      expect(storedData[0].quality_score).toBe(8.5);
      expect(storedData[0].quality_notes).toEqual(['Quality gate passed']);
      expect(storedData[0].generation_time_ms).toBe(5000);
      expect(storedData[0].data_sources_count).toBe(10);
    });

    it('should only update provided fields', async () => {
      const originalProfileData = { fullName: 'John Smith' };
      const mockInvestigation = {
        id: 'inv-123',
        user_id: 'user-123',
        target_entity: 'John Smith',
        entity_type: 'individual',
        ethics_acknowledged_at: '2026-01-14T12:00:00Z',
        profile_data: originalProfileData,
        corruption_scenarios: [],
        action_items: [],
        quality_score: 5.0,
        quality_notes: ['Existing note'],
        generation_time_ms: 1000,
        data_sources_count: 3,
        is_public: false,
        created_at: '2026-01-14T12:00:00Z',
        updated_at: '2026-01-14T12:00:00Z',
      };

      seedMockData('accountability_investigations', [mockInvestigation]);

      await updateInvestigationResults('inv-123', {
        quality_score: 9.0,
      });

      const storedData = getMockData('accountability_investigations');
      expect(storedData[0].quality_score).toBe(9.0);
      expect(storedData[0].generation_time_ms).toBe(1000);
      expect(storedData[0].data_sources_count).toBe(3);
    });
  });

  describe('listUserInvestigations', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      clearMockData();
    });

    it('should return investigations ordered by created_at DESC', async () => {
      const mockInvestigations = [
        {
          id: 'inv-1',
          user_id: 'user-123',
          target_entity: 'First Investigation',
          entity_type: 'individual',
          created_at: '2026-01-10T12:00:00Z',
          updated_at: '2026-01-10T12:00:00Z',
        },
        {
          id: 'inv-2',
          user_id: 'user-123',
          target_entity: 'Second Investigation',
          entity_type: 'individual',
          created_at: '2026-01-14T12:00:00Z',
          updated_at: '2026-01-14T12:00:00Z',
        },
        {
          id: 'inv-3',
          user_id: 'user-123',
          target_entity: 'Third Investigation',
          entity_type: 'organization',
          created_at: '2026-01-12T12:00:00Z',
          updated_at: '2026-01-12T12:00:00Z',
        },
      ];

      seedMockData('accountability_investigations', mockInvestigations);

      const result = await listUserInvestigations('user-123');

      expect(result.length).toBe(3);
      expect(result[0].id).toBe('inv-2');
      expect(result[1].id).toBe('inv-3');
      expect(result[2].id).toBe('inv-1');
    });

    it('should return empty array when no investigations found', async () => {
      seedMockData('accountability_investigations', []);

      const result = await listUserInvestigations('user-123');

      expect(result).toEqual([]);
    });

    it('should only return investigations for the specified user', async () => {
      const mockInvestigations = [
        {
          id: 'inv-1',
          user_id: 'user-123',
          target_entity: 'User 123 Investigation',
          entity_type: 'individual',
          created_at: '2026-01-14T12:00:00Z',
        },
        {
          id: 'inv-2',
          user_id: 'user-456',
          target_entity: 'User 456 Investigation',
          entity_type: 'individual',
          created_at: '2026-01-14T12:00:00Z',
        },
      ];

      seedMockData('accountability_investigations', mockInvestigations);

      const result = await listUserInvestigations('user-123');

      expect(result.length).toBe(1);
      expect(result[0].user_id).toBe('user-123');
    });
  });

  describe('addInvestigationSource', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      clearMockData();
    });

    it('should add source and return id', async () => {
      const source = {
        source_type: 'companies_house' as const,
        url: 'https://find-and-update.company-information.service.gov.uk/company/12345678',
        title: 'Company Details',
        accessed_at: '2026-01-14T12:00:00Z',
        data_extracted: { companyName: 'Test Ltd' },
        verification_status: 'verified' as const,
      };

      const result = await addInvestigationSource('inv-123', source);

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    it('should store source with investigation_id', async () => {
      const source = {
        source_type: 'web_search' as const,
        url: 'https://example.com/article',
        title: 'News Article',
        accessed_at: '2026-01-14T12:00:00Z',
        data_extracted: null,
        verification_status: 'unverified' as const,
      };

      await addInvestigationSource('inv-123', source);

      const storedData = getMockData('accountability_investigation_sources');
      expect(storedData.length).toBe(1);
      expect(storedData[0].investigation_id).toBe('inv-123');
      expect(storedData[0].source_type).toBe('web_search');
      expect(storedData[0].url).toBe('https://example.com/article');
    });
  });

  describe('getInvestigationSources', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      clearMockData();
    });

    it('should return sources for investigation ordered by accessed_at DESC', async () => {
      const mockSources = [
        {
          id: 'src-1',
          investigation_id: 'inv-123',
          source_type: 'companies_house',
          url: 'https://example.com/1',
          title: 'First Source',
          accessed_at: '2026-01-10T12:00:00Z',
          created_at: '2026-01-10T12:00:00Z',
        },
        {
          id: 'src-2',
          investigation_id: 'inv-123',
          source_type: 'web_search',
          url: 'https://example.com/2',
          title: 'Second Source',
          accessed_at: '2026-01-14T12:00:00Z',
          created_at: '2026-01-14T12:00:00Z',
        },
      ];

      seedMockData('accountability_investigation_sources', mockSources);

      const result = await getInvestigationSources('inv-123');

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('src-2');
      expect(result[1].id).toBe('src-1');
    });

    it('should return empty array when no sources found', async () => {
      seedMockData('accountability_investigation_sources', []);

      const result = await getInvestigationSources('inv-123');

      expect(result).toEqual([]);
    });

    it('should only return sources for the specified investigation', async () => {
      const mockSources = [
        {
          id: 'src-1',
          investigation_id: 'inv-123',
          source_type: 'companies_house',
          url: 'https://example.com/1',
          accessed_at: '2026-01-14T12:00:00Z',
        },
        {
          id: 'src-2',
          investigation_id: 'inv-456',
          source_type: 'web_search',
          url: 'https://example.com/2',
          accessed_at: '2026-01-14T12:00:00Z',
        },
      ];

      seedMockData('accountability_investigation_sources', mockSources);

      const result = await getInvestigationSources('inv-123');

      expect(result.length).toBe(1);
      expect(result[0].investigation_id).toBe('inv-123');
    });
  });
});

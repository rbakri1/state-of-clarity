/**
 * Accountability Service Unit Tests
 *
 * Tests for the accountability service functions including quality score calculation
 * and CRUD operations.
 */

import { describe, it, expect } from 'vitest';
import { calculateQualityScore } from '@/lib/services/accountability-service';
import type { UKProfileData, CorruptionScenario } from '@/lib/types/accountability';

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
});

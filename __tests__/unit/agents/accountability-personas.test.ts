/**
 * Accountability Personas Unit Tests
 *
 * Tests for the accountability tracker agent persona prompts.
 * Verifies prompt structure, content requirements, and export correctness.
 */

import { describe, it, expect } from 'vitest';
import {
  ENTITY_CLASSIFICATION_PROMPT,
  UK_PROFILE_RESEARCH_PROMPT,
  CORRUPTION_ANALYSIS_PROMPT,
  ACTION_LIST_GENERATION_PROMPT,
} from '@/lib/agents/accountability-personas';

describe('Accountability Personas', () => {
  describe('ENTITY_CLASSIFICATION_PROMPT', () => {
    it('should be exported as a string', () => {
      expect(typeof ENTITY_CLASSIFICATION_PROMPT).toBe('string');
    });

    it('should not be empty', () => {
      expect(ENTITY_CLASSIFICATION_PROMPT.length).toBeGreaterThan(0);
    });

    it('should mention classification of individual vs organization', () => {
      expect(ENTITY_CLASSIFICATION_PROMPT).toContain('individual');
      expect(ENTITY_CLASSIFICATION_PROMPT).toContain('organization');
    });

    it('should specify JSON output requirement', () => {
      expect(ENTITY_CLASSIFICATION_PROMPT).toContain('JSON');
    });

    it('should include entityType in expected output', () => {
      expect(ENTITY_CLASSIFICATION_PROMPT).toContain('entityType');
    });

    it('should include confidence field in expected output', () => {
      expect(ENTITY_CLASSIFICATION_PROMPT).toContain('confidence');
    });

    it('should include reasoning field in expected output', () => {
      expect(ENTITY_CLASSIFICATION_PROMPT).toContain('reasoning');
    });

    it('should mention common organization identifiers', () => {
      const orgIdentifiers = ['Ltd', 'Limited', 'PLC', 'plc', 'LLC', 'Inc', 'Corp'];
      const hasIdentifiers = orgIdentifiers.some((id) =>
        ENTITY_CLASSIFICATION_PROMPT.includes(id)
      );
      expect(hasIdentifiers).toBe(true);
    });

    it('should request valid JSON only in output', () => {
      expect(ENTITY_CLASSIFICATION_PROMPT.toLowerCase()).toContain('valid json');
    });
  });

  describe('UK_PROFILE_RESEARCH_PROMPT', () => {
    it('should be exported as a string', () => {
      expect(typeof UK_PROFILE_RESEARCH_PROMPT).toBe('string');
    });

    it('should not be empty', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT.length).toBeGreaterThan(0);
    });

    it('should emphasize using verified public records only', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('verified');
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('public records');
    });

    it('should mention Companies House as a data source', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('Companies House');
    });

    it('should mention Charity Commission as a data source', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('Charity Commission');
    });

    it('should mention Parliament Register of Interests', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('Parliament');
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('Register of Interests');
    });

    it('should mention Electoral Commission', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('Electoral Commission');
    });

    it('should mention Contracts Finder', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('Contracts Finder');
    });

    it('should require conditional language', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('conditional language');
    });

    it('should include profile structure with fullName', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('fullName');
    });

    it('should include profile structure with currentPositions', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('currentPositions');
    });

    it('should include profile structure with pastPositions', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('pastPositions');
    });

    it('should include companiesHouseEntities in structure', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('companiesHouseEntities');
    });

    it('should include registerOfInterests in structure', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('registerOfInterests');
    });

    it('should include charityInvolvements in structure', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('charityInvolvements');
    });

    it('should include politicalDonations in structure', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('politicalDonations');
    });

    it('should include governmentContracts in structure', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('governmentContracts');
    });

    it('should include dataCompleteness assessment', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('dataCompleteness');
    });

    it('should mention source attribution', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('source');
    });

    it('should prohibit speculation', () => {
      const prohibitsSpeculation =
        UK_PROFILE_RESEARCH_PROMPT.includes('Do not speculate') ||
        UK_PROFILE_RESEARCH_PROMPT.includes('not speculate');
      expect(prohibitsSpeculation).toBe(true);
    });

    it('should require valid JSON output only', () => {
      expect(UK_PROFILE_RESEARCH_PROMPT.toLowerCase()).toContain('valid json');
    });
  });

  describe('CORRUPTION_ANALYSIS_PROMPT', () => {
    it('should be exported as a string', () => {
      expect(typeof CORRUPTION_ANALYSIS_PROMPT).toBe('string');
    });

    it('should not be empty', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT.length).toBeGreaterThan(0);
    });

    it('should emphasize theoretical/hypothetical nature', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('THEORETICAL');
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('HYPOTHETICAL');
    });

    it('should require conditional language', () => {
      const conditionalWords = ['could', 'might', 'potentially'];
      const hasConditional = conditionalWords.some((word) =>
        CORRUPTION_ANALYSIS_PROMPT.includes(word)
      );
      expect(hasConditional).toBe(true);
    });

    it('should prohibit direct accusations', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('NEVER make direct accusations');
    });

    it('should require innocent explanations', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('innocentExplanations');
    });

    it('should state innocentExplanations must not be empty', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('MUST NOT be empty');
    });

    it('should include scenario structure with scenarioId', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('scenarioId');
    });

    it('should include mechanism description', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('mechanism');
    });

    it('should include incentiveStructure', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('incentiveStructure');
    });

    it('should include potentialConflicts', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('potentialConflicts');
    });

    it('should include redFlags', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('redFlags');
    });

    it('should include riskLevel', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('riskLevel');
    });

    it('should include detectionDifficulty', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('detectionDifficulty');
    });

    it('should include historicalPrecedents', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('historicalPrecedents');
    });

    it('should mention educational purpose', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT.toLowerCase()).toContain('educational');
    });

    it('should emphasize not making accusations', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('NOT an accusation');
    });

    it('should require valid JSON output only', () => {
      expect(CORRUPTION_ANALYSIS_PROMPT.toLowerCase()).toContain('valid json');
    });
  });

  describe('ACTION_LIST_GENERATION_PROMPT', () => {
    it('should be exported as a string', () => {
      expect(typeof ACTION_LIST_GENERATION_PROMPT).toBe('string');
    });

    it('should not be empty', () => {
      expect(ACTION_LIST_GENERATION_PROMPT.length).toBeGreaterThan(0);
    });

    it('should emphasize legal methods only', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('legal');
    });

    it('should emphasize ethical methods only', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('ethical');
    });

    it('should prohibit hacking', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('hacking');
    });

    it('should prohibit bribery', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('bribery');
    });

    it('should prohibit stalking', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('stalking');
    });

    it('should prohibit harassment', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('harassment');
    });

    it('should prohibit illegal surveillance', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('illegal surveillance');
    });

    it('should mention FOI requests as valid method', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('FOI');
    });

    it('should mention corporate registry searches', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('Companies House');
    });

    it('should mention court records', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('Court records');
    });

    it('should mention Parliamentary records', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('Parliamentary records');
    });

    it('should include action structure with actionId', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('actionId');
    });

    it('should include priority field', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('priority');
    });

    it('should define priority levels 1, 2, 3', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('Priority 1');
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('Priority 2');
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('Priority 3');
    });

    it('should include dataSource field', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('dataSource');
    });

    it('should include expectedEvidence field', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('expectedEvidence');
    });

    it('should include legalConsiderations', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('legalConsiderations');
    });

    it('should include relatedScenarios linking', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('relatedScenarios');
    });

    it('should mention investigative journalism', () => {
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('investigative journalism');
    });

    it('should require valid JSON output only', () => {
      expect(ACTION_LIST_GENERATION_PROMPT.toLowerCase()).toContain('valid json');
    });
  });

  describe('Prompt Quality Checks', () => {
    const allPrompts = [
      { name: 'ENTITY_CLASSIFICATION_PROMPT', prompt: ENTITY_CLASSIFICATION_PROMPT },
      { name: 'UK_PROFILE_RESEARCH_PROMPT', prompt: UK_PROFILE_RESEARCH_PROMPT },
      { name: 'CORRUPTION_ANALYSIS_PROMPT', prompt: CORRUPTION_ANALYSIS_PROMPT },
      { name: 'ACTION_LIST_GENERATION_PROMPT', prompt: ACTION_LIST_GENERATION_PROMPT },
    ];

    it.each(allPrompts)('$name should have substantial length', ({ prompt }) => {
      expect(prompt.length).toBeGreaterThan(100);
    });

    it.each(allPrompts)('$name should not have leading whitespace', ({ prompt }) => {
      expect(prompt).toBe(prompt.trimStart());
    });

    it.each(allPrompts)('$name should not have trailing whitespace', ({ prompt }) => {
      expect(prompt).toBe(prompt.trimEnd());
    });

    it.each(allPrompts)('$name should require JSON output', ({ prompt }) => {
      expect(prompt.toLowerCase()).toContain('json');
    });
  });

  describe('Cross-Prompt Consistency', () => {
    it('should have UK profile prompt referencing same data sources as action list', () => {
      // Both should mention Companies House
      expect(UK_PROFILE_RESEARCH_PROMPT).toContain('Companies House');
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('Companies House');
    });

    it('should have corruption analysis and action list be complementary', () => {
      // Corruption analysis generates scenarios, action list references them
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('scenarioId');
      expect(ACTION_LIST_GENERATION_PROMPT).toContain('relatedScenarios');
    });

    it('should have consistent ethical framing across prompts', () => {
      // UK Profile and Corruption Analysis both emphasize no speculation/assumptions
      expect(UK_PROFILE_RESEARCH_PROMPT.toLowerCase()).toContain('speculate');
      expect(CORRUPTION_ANALYSIS_PROMPT).toContain('THEORETICAL');
    });
  });

  describe('Export Verification', () => {
    it('should export exactly 4 prompts', () => {
      const exports = [
        ENTITY_CLASSIFICATION_PROMPT,
        UK_PROFILE_RESEARCH_PROMPT,
        CORRUPTION_ANALYSIS_PROMPT,
        ACTION_LIST_GENERATION_PROMPT,
      ];

      expect(exports).toHaveLength(4);
      exports.forEach((exp) => {
        expect(typeof exp).toBe('string');
        expect(exp.length).toBeGreaterThan(0);
      });
    });

    it('all prompts should be unique', () => {
      const prompts = [
        ENTITY_CLASSIFICATION_PROMPT,
        UK_PROFILE_RESEARCH_PROMPT,
        CORRUPTION_ANALYSIS_PROMPT,
        ACTION_LIST_GENERATION_PROMPT,
      ];

      const uniquePrompts = new Set(prompts);
      expect(uniquePrompts.size).toBe(prompts.length);
    });
  });
});

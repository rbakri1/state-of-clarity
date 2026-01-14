/**
 * Reconciliation Agent Unit Tests
 *
 * Tests for the agent that reconciles Structure and Narrative outputs,
 * ensuring they are consistent with Structure as the source of truth.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueMockResponse, resetAnthropicMocks } from '../../mocks/anthropic';

// Mock Anthropic before importing the agent
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

// Import after mocks are set up
import {
  reconcileOutputs,
  ReconciliationInput,
  ReconciliationOutput,
  StructureOutput,
  NarrativeOutput,
} from '@/lib/agents/reconciliation-agent';

describe('Reconciliation Agent', () => {
  const mockStructure: StructureOutput = {
    factors: [
      {
        name: 'Economic Growth',
        description: 'Rate of GDP expansion',
        stakeholders: ['businesses', 'workers', 'government'],
        impact: 'Higher growth leads to more jobs and higher wages.',
      },
      {
        name: 'Inflation Rate',
        description: 'Rate of price increases',
        stakeholders: ['consumers', 'central bank', 'businesses'],
        impact: 'High inflation erodes purchasing power.',
      },
    ],
    policies: [
      {
        name: 'Monetary Tightening',
        description: 'Raising interest rates to combat inflation',
        proponents: ['central bank', 'savers'],
        opponents: ['borrowers', 'home buyers'],
        tradeoffs: 'Reduces inflation but may slow growth and increase unemployment.',
      },
      {
        name: 'Fiscal Stimulus',
        description: 'Government spending to boost economy',
        proponents: ['Keynesian economists', 'workers'],
        opponents: ['fiscal conservatives', 'deficit hawks'],
        tradeoffs: 'Boosts growth but may increase debt and inflation.',
      },
    ],
    timeline: [
      {
        date: '2020',
        event: 'COVID-19 pandemic begins',
        significance: 'Triggered unprecedented economic disruption.',
      },
    ],
  };

  const mockNarrative: NarrativeOutput = {
    introduction: 'This brief examines the impact of inflation on the economy.',
    mainBody: 'Economic growth and inflation are closely linked. The central bank uses monetary policy to manage these factors.',
    conclusion: 'Balancing growth and inflation remains a key challenge.',
    keyTakeaways: [
      'Inflation affects purchasing power',
      'Monetary policy is a key tool',
      'Trade-offs exist between growth and stability',
    ],
  };

  const mockReconciliationResponse = {
    isConsistent: true,
    changes: [],
    reconciledNarrative: {
      introduction: 'This brief examines the impact of inflation on the economy.',
      mainBody: 'Economic growth and inflation are closely linked. The central bank uses monetary policy to manage these factors.',
      conclusion: 'Balancing growth and inflation remains a key challenge.',
      keyTakeaways: [
        'Inflation affects purchasing power',
        'Monetary policy is a key tool',
        'Trade-offs exist between growth and stability',
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetAnthropicMocks();
  });

  describe('reconcileOutputs', () => {
    it('should return reconciled narrative', async () => {
      queueMockResponse(JSON.stringify(mockReconciliationResponse));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.reconciledNarrative).toBeDefined();
      expect(result.reconciledNarrative.introduction).toBeDefined();
      expect(result.reconciledNarrative.mainBody).toBeDefined();
      expect(result.reconciledNarrative.conclusion).toBeDefined();
    });

    it('should return isConsistent flag', async () => {
      queueMockResponse(JSON.stringify(mockReconciliationResponse));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(typeof result.isConsistent).toBe('boolean');
    });

    it('should return changes array', async () => {
      queueMockResponse(JSON.stringify(mockReconciliationResponse));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(Array.isArray(result.changes)).toBe(true);
    });

    it('should preserve keyTakeaways array', async () => {
      queueMockResponse(JSON.stringify(mockReconciliationResponse));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(Array.isArray(result.reconciledNarrative.keyTakeaways)).toBe(true);
    });
  });

  describe('Null/Undefined Handling', () => {
    it('should handle null structure gracefully', async () => {
      const input: ReconciliationInput = {
        structure: null as any,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.isConsistent).toBe(true);
      expect(result.changes).toEqual([]);
      expect(result.reconciledNarrative).toEqual(mockNarrative);
    });

    it('should handle null narrative gracefully', async () => {
      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: null as any,
      };

      const result = await reconcileOutputs(input);

      expect(result.isConsistent).toBe(true);
      expect(result.changes).toEqual([]);
      expect(result.reconciledNarrative).toEqual({
        introduction: '',
        mainBody: '',
        conclusion: '',
        keyTakeaways: [],
      });
    });

    it('should handle both null inputs', async () => {
      const input: ReconciliationInput = {
        structure: null as any,
        narrative: null as any,
      };

      const result = await reconcileOutputs(input);

      expect(result.isConsistent).toBe(true);
      expect(result.reconciledNarrative.introduction).toBe('');
      expect(result.reconciledNarrative.mainBody).toBe('');
    });
  });

  describe('Inconsistency Detection', () => {
    it('should detect and fix inconsistencies', async () => {
      const inconsistentResponse = {
        isConsistent: false,
        changes: [
          'Fixed factor name mismatch in main body',
          'Corrected policy description alignment',
        ],
        reconciledNarrative: {
          introduction: mockNarrative.introduction,
          mainBody: 'Corrected main body that now aligns with structure.',
          conclusion: mockNarrative.conclusion,
          keyTakeaways: mockNarrative.keyTakeaways,
        },
      };

      queueMockResponse(JSON.stringify(inconsistentResponse));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.isConsistent).toBe(false);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should list all changes made', async () => {
      const responseWithChanges = {
        isConsistent: false,
        changes: [
          'Added missing stakeholder mention',
          'Corrected policy tradeoff description',
          'Fixed timeline reference',
        ],
        reconciledNarrative: mockNarrative,
      };

      queueMockResponse(JSON.stringify(responseWithChanges));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.changes).toHaveLength(3);
      expect(result.changes[0]).toContain('stakeholder');
    });
  });

  describe('Consistency Checks', () => {
    it('should verify factor names appear in narrative', async () => {
      // Response indicating factors are consistent
      queueMockResponse(JSON.stringify({
        isConsistent: true,
        changes: [],
        reconciledNarrative: mockNarrative,
      }));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.isConsistent).toBe(true);
    });

    it('should verify policy names align', async () => {
      queueMockResponse(JSON.stringify({
        isConsistent: true,
        changes: [],
        reconciledNarrative: mockNarrative,
      }));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.isConsistent).toBe(true);
    });

    it('should check stakeholder representation', async () => {
      const responseWithStakeholderFix = {
        isConsistent: false,
        changes: ['Added missing stakeholder perspective'],
        reconciledNarrative: {
          ...mockNarrative,
          mainBody: mockNarrative.mainBody + ' Workers and businesses are both affected.',
        },
      };

      queueMockResponse(JSON.stringify(responseWithStakeholderFix));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.changes.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should return original narrative when JSON parsing fails', async () => {
      queueMockResponse('Invalid JSON response');

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      // Should fall back to original narrative
      expect(result.reconciledNarrative).toEqual(mockNarrative);
      expect(result.isConsistent).toBe(true);
      expect(result.changes).toEqual([]);
    });

    it('should handle empty response gracefully', async () => {
      queueMockResponse('');

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.reconciledNarrative).toEqual(mockNarrative);
    });

    it('should handle malformed JSON with partial data', async () => {
      const partialResponse = {
        isConsistent: true,
        // Missing changes and reconciledNarrative
      };

      queueMockResponse(JSON.stringify(partialResponse));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      // Should use validation to fill in missing parts
      expect(result.reconciledNarrative).toBeDefined();
      expect(result.changes).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate reconciledNarrative has all required fields', async () => {
      const incompleteResponse = {
        isConsistent: true,
        changes: [],
        reconciledNarrative: {
          introduction: 'New intro',
          // Missing mainBody, conclusion, keyTakeaways
        },
      };

      queueMockResponse(JSON.stringify(incompleteResponse));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      // Should fill in missing fields from original
      expect(result.reconciledNarrative.introduction).toBe('New intro');
      expect(result.reconciledNarrative.mainBody).toBe(mockNarrative.mainBody);
      expect(result.reconciledNarrative.conclusion).toBe(mockNarrative.conclusion);
    });

    it('should ensure keyTakeaways is always an array', async () => {
      const responseWithInvalidTakeaways = {
        isConsistent: true,
        changes: [],
        reconciledNarrative: {
          ...mockNarrative,
          keyTakeaways: 'Not an array', // Invalid
        },
      };

      queueMockResponse(JSON.stringify(responseWithInvalidTakeaways));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(Array.isArray(result.reconciledNarrative.keyTakeaways)).toBe(true);
    });

    it('should ensure changes is always an array', async () => {
      const responseWithInvalidChanges = {
        isConsistent: false,
        changes: 'Not an array', // Invalid
        reconciledNarrative: mockNarrative,
      };

      queueMockResponse(JSON.stringify(responseWithInvalidChanges));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(Array.isArray(result.changes)).toBe(true);
    });

    it('should ensure isConsistent is a boolean', async () => {
      const responseWithInvalidConsistent = {
        isConsistent: 'yes', // Invalid - should be boolean
        changes: [],
        reconciledNarrative: mockNarrative,
      };

      queueMockResponse(JSON.stringify(responseWithInvalidConsistent));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(typeof result.isConsistent).toBe('boolean');
    });
  });

  describe('Structure Variations', () => {
    it('should handle structure without timeline', async () => {
      const structureNoTimeline: StructureOutput = {
        factors: mockStructure.factors,
        policies: mockStructure.policies,
        // No timeline
      };

      queueMockResponse(JSON.stringify(mockReconciliationResponse));

      const input: ReconciliationInput = {
        structure: structureNoTimeline,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result).toBeDefined();
    });

    it('should handle structure with empty factors', async () => {
      const structureEmptyFactors: StructureOutput = {
        factors: [],
        policies: mockStructure.policies,
      };

      queueMockResponse(JSON.stringify(mockReconciliationResponse));

      const input: ReconciliationInput = {
        structure: structureEmptyFactors,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result).toBeDefined();
    });

    it('should handle structure with empty policies', async () => {
      const structureEmptyPolicies: StructureOutput = {
        factors: mockStructure.factors,
        policies: [],
      };

      queueMockResponse(JSON.stringify(mockReconciliationResponse));

      const input: ReconciliationInput = {
        structure: structureEmptyPolicies,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result).toBeDefined();
    });
  });

  describe('Narrative Variations', () => {
    it('should handle narrative with empty sections', async () => {
      const emptyNarrative: NarrativeOutput = {
        introduction: '',
        mainBody: '',
        conclusion: '',
        keyTakeaways: [],
      };

      queueMockResponse(JSON.stringify({
        isConsistent: true,
        changes: [],
        reconciledNarrative: emptyNarrative,
      }));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: emptyNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.reconciledNarrative.introduction).toBe('');
    });

    it('should handle narrative with long content', async () => {
      const longNarrative: NarrativeOutput = {
        introduction: 'A'.repeat(5000),
        mainBody: 'B'.repeat(10000),
        conclusion: 'C'.repeat(3000),
        keyTakeaways: Array(20).fill('Key takeaway'),
      };

      queueMockResponse(JSON.stringify({
        isConsistent: true,
        changes: [],
        reconciledNarrative: longNarrative,
      }));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: longNarrative,
      };

      const result = await reconcileOutputs(input);

      expect(result.reconciledNarrative).toBeDefined();
    });
  });

  describe('Minimal Changes Principle', () => {
    it('should make only necessary changes', async () => {
      const minimalChangeResponse = {
        isConsistent: false,
        changes: ['Corrected one word in main body'],
        reconciledNarrative: {
          ...mockNarrative,
          mainBody: mockNarrative.mainBody.replace('growth', 'economic growth'),
        },
      };

      queueMockResponse(JSON.stringify(minimalChangeResponse));

      const input: ReconciliationInput = {
        structure: mockStructure,
        narrative: mockNarrative,
      };

      const result = await reconcileOutputs(input);

      // Only one change should be made
      expect(result.changes).toHaveLength(1);
      // Other sections should remain unchanged
      expect(result.reconciledNarrative.introduction).toBe(mockNarrative.introduction);
      expect(result.reconciledNarrative.conclusion).toBe(mockNarrative.conclusion);
    });
  });
});

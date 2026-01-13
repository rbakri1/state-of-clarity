/**
 * Tests for lib/agents/clarity-evaluator-personas.ts
 *
 * Tests the evaluator personas used by the consensus panel.
 */

import { describe, it, expect } from "vitest";
import {
  getEvaluatorPersona,
  getAllEvaluatorPersonas,
  getPrimaryEvaluatorRoles,
  EvaluatorRole,
  EvaluatorPersona,
} from "@/lib/agents/clarity-evaluator-personas";

describe("clarity-evaluator-personas", () => {
  describe("getEvaluatorPersona", () => {
    it("returns Skeptic persona", () => {
      const persona = getEvaluatorPersona("Skeptic");
      expect(persona.name).toBe("The Skeptic");
      expect(persona.role).toBe("Skeptic");
    });

    it("returns Advocate persona", () => {
      const persona = getEvaluatorPersona("Advocate");
      expect(persona.name).toBe("The Advocate");
      expect(persona.role).toBe("Advocate");
    });

    it("returns Generalist persona", () => {
      const persona = getEvaluatorPersona("Generalist");
      expect(persona.name).toBe("The Generalist");
      expect(persona.role).toBe("Generalist");
    });

    it("returns Arbiter persona", () => {
      const persona = getEvaluatorPersona("Arbiter");
      expect(persona.name).toBe("The Arbiter");
      expect(persona.role).toBe("Arbiter");
    });

    it("throws error for unknown role", () => {
      expect(() =>
        getEvaluatorPersona("Unknown" as EvaluatorRole)
      ).toThrow("Unknown evaluator role: Unknown");
    });
  });

  describe("persona properties", () => {
    const allRoles: EvaluatorRole[] = ["Skeptic", "Advocate", "Generalist", "Arbiter"];

    allRoles.forEach((role) => {
      describe(`${role} persona`, () => {
        let persona: EvaluatorPersona;

        beforeEach(() => {
          persona = getEvaluatorPersona(role);
        });

        it("has a name", () => {
          expect(persona.name).toBeTruthy();
          expect(typeof persona.name).toBe("string");
        });

        it("has a role matching the key", () => {
          expect(persona.role).toBe(role);
        });

        it("has a system prompt", () => {
          expect(persona.systemPrompt).toBeTruthy();
          expect(typeof persona.systemPrompt).toBe("string");
          expect(persona.systemPrompt.length).toBeGreaterThan(100);
        });

        it("has focus dimensions", () => {
          expect(persona.focusDimensions).toBeTruthy();
          expect(Array.isArray(persona.focusDimensions)).toBe(true);
          expect(persona.focusDimensions.length).toBeGreaterThan(0);
        });

        it("has valid dimension names in focus dimensions", () => {
          const validDimensions = [
            "firstPrinciplesCoherence",
            "internalConsistency",
            "evidenceQuality",
            "accessibility",
            "objectivity",
            "factualAccuracy",
            "biasDetection",
          ];

          persona.focusDimensions.forEach((dim) => {
            expect(validDimensions).toContain(dim);
          });
        });
      });
    });
  });

  describe("Skeptic focus dimensions", () => {
    it("focuses on evidence-related dimensions", () => {
      const persona = getEvaluatorPersona("Skeptic");
      expect(persona.focusDimensions).toContain("evidenceQuality");
      expect(persona.focusDimensions).toContain("factualAccuracy");
      expect(persona.focusDimensions).toContain("firstPrinciplesCoherence");
    });

    it("system prompt mentions evidence and claims", () => {
      const persona = getEvaluatorPersona("Skeptic");
      expect(persona.systemPrompt.toLowerCase()).toContain("evidence");
      expect(persona.systemPrompt.toLowerCase()).toContain("claim");
    });
  });

  describe("Advocate focus dimensions", () => {
    it("focuses on objectivity-related dimensions", () => {
      const persona = getEvaluatorPersona("Advocate");
      expect(persona.focusDimensions).toContain("objectivity");
      expect(persona.focusDimensions).toContain("biasDetection");
      expect(persona.focusDimensions).toContain("internalConsistency");
    });

    it("system prompt mentions perspectives and bias", () => {
      const persona = getEvaluatorPersona("Advocate");
      expect(persona.systemPrompt.toLowerCase()).toContain("perspective");
      expect(persona.systemPrompt.toLowerCase()).toContain("bias");
    });
  });

  describe("Generalist focus dimensions", () => {
    it("focuses on accessibility-related dimensions", () => {
      const persona = getEvaluatorPersona("Generalist");
      expect(persona.focusDimensions).toContain("accessibility");
      expect(persona.focusDimensions).toContain("internalConsistency");
      expect(persona.focusDimensions).toContain("firstPrinciplesCoherence");
    });

    it("system prompt mentions jargon and clarity", () => {
      const persona = getEvaluatorPersona("Generalist");
      expect(persona.systemPrompt.toLowerCase()).toContain("jargon");
    });
  });

  describe("Arbiter focus dimensions", () => {
    it("focuses on all dimensions", () => {
      const persona = getEvaluatorPersona("Arbiter");
      expect(persona.focusDimensions.length).toBe(7);
    });

    it("system prompt mentions tiebreaker and disagreement", () => {
      const persona = getEvaluatorPersona("Arbiter");
      expect(persona.systemPrompt.toLowerCase()).toContain("tiebreaker");
      expect(persona.systemPrompt.toLowerCase()).toContain("disagree");
    });

    it("mentions 1.5x weight for disputed dimensions", () => {
      const persona = getEvaluatorPersona("Arbiter");
      expect(persona.systemPrompt).toContain("1.5x");
    });
  });

  describe("getAllEvaluatorPersonas", () => {
    it("returns array of 3 primary personas", () => {
      const personas = getAllEvaluatorPersonas();
      expect(personas).toHaveLength(3);
    });

    it("includes Skeptic, Advocate, and Generalist", () => {
      const personas = getAllEvaluatorPersonas();
      const roles = personas.map((p) => p.role);

      expect(roles).toContain("Skeptic");
      expect(roles).toContain("Advocate");
      expect(roles).toContain("Generalist");
    });

    it("does not include Arbiter", () => {
      const personas = getAllEvaluatorPersonas();
      const roles = personas.map((p) => p.role);

      expect(roles).not.toContain("Arbiter");
    });

    it("returns valid persona objects", () => {
      const personas = getAllEvaluatorPersonas();

      personas.forEach((persona) => {
        expect(persona).toHaveProperty("name");
        expect(persona).toHaveProperty("role");
        expect(persona).toHaveProperty("systemPrompt");
        expect(persona).toHaveProperty("focusDimensions");
      });
    });
  });

  describe("getPrimaryEvaluatorRoles", () => {
    it("returns array of 3 primary roles", () => {
      const roles = getPrimaryEvaluatorRoles();
      expect(roles).toHaveLength(3);
    });

    it("returns Skeptic, Advocate, and Generalist", () => {
      const roles = getPrimaryEvaluatorRoles();

      expect(roles).toContain("Skeptic");
      expect(roles).toContain("Advocate");
      expect(roles).toContain("Generalist");
    });

    it("does not return Arbiter", () => {
      const roles = getPrimaryEvaluatorRoles();
      expect(roles).not.toContain("Arbiter");
    });

    it("returns roles in consistent order", () => {
      const roles1 = getPrimaryEvaluatorRoles();
      const roles2 = getPrimaryEvaluatorRoles();

      expect(roles1).toEqual(roles2);
    });
  });

  describe("persona system prompts structure", () => {
    const primaryRoles: EvaluatorRole[] = ["Skeptic", "Advocate", "Generalist"];

    primaryRoles.forEach((role) => {
      it(`${role} prompt has output format instructions`, () => {
        const persona = getEvaluatorPersona(role);
        expect(persona.systemPrompt.toLowerCase()).toContain("output format");
      });

      it(`${role} prompt mentions scoring 0-10`, () => {
        const persona = getEvaluatorPersona(role);
        expect(persona.systemPrompt).toContain("0-10");
      });

      it(`${role} prompt mentions dimensions`, () => {
        const persona = getEvaluatorPersona(role);
        expect(persona.systemPrompt.toLowerCase()).toContain("dimension");
      });
    });
  });
});

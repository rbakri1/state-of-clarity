/**
 * Tests for lib/types/classification.ts
 *
 * Tests the classification type definitions.
 */

import { describe, it, expect } from "vitest";
import type {
  Domain,
  ControversyLevel,
  QuestionType,
  TemporalScope,
  QuestionClassification,
} from "@/lib/types/classification";

describe("classification types", () => {
  describe("Domain type", () => {
    it("allows all valid domain values", () => {
      const validDomains: Domain[] = [
        "economics",
        "healthcare",
        "climate",
        "education",
        "defense",
        "immigration",
        "housing",
        "justice",
        "technology",
        "governance",
        "other",
      ];

      validDomains.forEach((domain) => {
        const classification: Partial<QuestionClassification> = { domain };
        expect(classification.domain).toBe(domain);
      });
    });

    it("has exactly 11 valid domain values", () => {
      const validDomains: Domain[] = [
        "economics",
        "healthcare",
        "climate",
        "education",
        "defense",
        "immigration",
        "housing",
        "justice",
        "technology",
        "governance",
        "other",
      ];

      expect(validDomains.length).toBe(11);
    });

    it("includes 'other' as a catch-all domain", () => {
      const domain: Domain = "other";
      expect(domain).toBe("other");
    });
  });

  describe("ControversyLevel type", () => {
    it("allows all valid controversy levels", () => {
      const validLevels: ControversyLevel[] = ["low", "medium", "high"];

      validLevels.forEach((level) => {
        const classification: Partial<QuestionClassification> = {
          controversyLevel: level,
        };
        expect(classification.controversyLevel).toBe(level);
      });
    });

    it("has exactly 3 controversy levels", () => {
      const validLevels: ControversyLevel[] = ["low", "medium", "high"];
      expect(validLevels.length).toBe(3);
    });
  });

  describe("QuestionType type", () => {
    it("allows all valid question types", () => {
      const validTypes: QuestionType[] = [
        "factual",
        "analytical",
        "opinion",
        "comparative",
      ];

      validTypes.forEach((type) => {
        const classification: Partial<QuestionClassification> = {
          questionType: type,
        };
        expect(classification.questionType).toBe(type);
      });
    });

    it("has exactly 4 question types", () => {
      const validTypes: QuestionType[] = [
        "factual",
        "analytical",
        "opinion",
        "comparative",
      ];
      expect(validTypes.length).toBe(4);
    });
  });

  describe("TemporalScope type", () => {
    it("allows all valid temporal scopes", () => {
      const validScopes: TemporalScope[] = [
        "historical",
        "current",
        "future",
        "timeless",
      ];

      validScopes.forEach((scope) => {
        const classification: Partial<QuestionClassification> = {
          temporalScope: scope,
        };
        expect(classification.temporalScope).toBe(scope);
      });
    });

    it("has exactly 4 temporal scopes", () => {
      const validScopes: TemporalScope[] = [
        "historical",
        "current",
        "future",
        "timeless",
      ];
      expect(validScopes.length).toBe(4);
    });
  });

  describe("QuestionClassification interface", () => {
    it("can be created with all required fields", () => {
      const classification: QuestionClassification = {
        domain: "economics",
        controversyLevel: "medium",
        questionType: "analytical",
        temporalScope: "current",
      };

      expect(classification.domain).toBe("economics");
      expect(classification.controversyLevel).toBe("medium");
      expect(classification.questionType).toBe("analytical");
      expect(classification.temporalScope).toBe("current");
    });

    it("supports various valid combinations", () => {
      const classifications: QuestionClassification[] = [
        {
          domain: "healthcare",
          controversyLevel: "high",
          questionType: "opinion",
          temporalScope: "future",
        },
        {
          domain: "climate",
          controversyLevel: "low",
          questionType: "factual",
          temporalScope: "historical",
        },
        {
          domain: "technology",
          controversyLevel: "medium",
          questionType: "comparative",
          temporalScope: "timeless",
        },
      ];

      classifications.forEach((c) => {
        expect(c).toHaveProperty("domain");
        expect(c).toHaveProperty("controversyLevel");
        expect(c).toHaveProperty("questionType");
        expect(c).toHaveProperty("temporalScope");
      });
    });

    it("allows all domains with all controversy levels", () => {
      const domains: Domain[] = ["economics", "healthcare", "other"];
      const levels: ControversyLevel[] = ["low", "medium", "high"];

      domains.forEach((domain) => {
        levels.forEach((level) => {
          const c: QuestionClassification = {
            domain,
            controversyLevel: level,
            questionType: "analytical",
            temporalScope: "current",
          };
          expect(c.domain).toBe(domain);
          expect(c.controversyLevel).toBe(level);
        });
      });
    });
  });

  describe("type consistency", () => {
    it("Domain values are lowercase", () => {
      const domains: Domain[] = [
        "economics",
        "healthcare",
        "climate",
        "education",
        "defense",
        "immigration",
        "housing",
        "justice",
        "technology",
        "governance",
        "other",
      ];

      domains.forEach((domain) => {
        expect(domain).toBe(domain.toLowerCase());
      });
    });

    it("ControversyLevel values are lowercase", () => {
      const levels: ControversyLevel[] = ["low", "medium", "high"];

      levels.forEach((level) => {
        expect(level).toBe(level.toLowerCase());
      });
    });

    it("QuestionType values are lowercase", () => {
      const types: QuestionType[] = [
        "factual",
        "analytical",
        "opinion",
        "comparative",
      ];

      types.forEach((type) => {
        expect(type).toBe(type.toLowerCase());
      });
    });

    it("TemporalScope values are lowercase", () => {
      const scopes: TemporalScope[] = [
        "historical",
        "current",
        "future",
        "timeless",
      ];

      scopes.forEach((scope) => {
        expect(scope).toBe(scope.toLowerCase());
      });
    });
  });
});

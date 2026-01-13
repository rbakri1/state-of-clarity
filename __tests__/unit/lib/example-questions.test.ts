/**
 * Tests for lib/data/example-questions.ts
 *
 * Tests the example questions data and utility functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  EXAMPLE_QUESTIONS,
  getRandomQuestion,
  getShuffledQuestions,
} from "@/lib/data/example-questions";

describe("example-questions", () => {
  describe("EXAMPLE_QUESTIONS", () => {
    it("exports a non-empty array of questions", () => {
      expect(Array.isArray(EXAMPLE_QUESTIONS)).toBe(true);
      expect(EXAMPLE_QUESTIONS.length).toBeGreaterThan(0);
    });

    it("contains at least 100 questions for variety", () => {
      expect(EXAMPLE_QUESTIONS.length).toBeGreaterThanOrEqual(100);
    });

    it("all questions are non-empty strings", () => {
      EXAMPLE_QUESTIONS.forEach((question) => {
        expect(typeof question).toBe("string");
        expect(question.length).toBeGreaterThan(0);
      });
    });

    it("all questions end with a question mark", () => {
      EXAMPLE_QUESTIONS.forEach((question) => {
        expect(question.endsWith("?")).toBe(true);
      });
    });

    it("contains UK-related questions", () => {
      const ukQuestions = EXAMPLE_QUESTIONS.filter(
        (q) =>
          q.toLowerCase().includes("uk") ||
          q.toLowerCase().includes("britain") ||
          q.toLowerCase().includes("england") ||
          q.toLowerCase().includes("scotland") ||
          q.toLowerCase().includes("nhs") ||
          q.toLowerCase().includes("brexit")
      );
      expect(ukQuestions.length).toBeGreaterThan(0);
    });

    it("contains US-related questions", () => {
      const usQuestions = EXAMPLE_QUESTIONS.filter(
        (q) =>
          q.toLowerCase().includes("us ") ||
          q.toLowerCase().includes("u.s.") ||
          q.toLowerCase().includes("america") ||
          q.toLowerCase().includes("federal") ||
          q.toLowerCase().includes("electoral college")
      );
      expect(usQuestions.length).toBeGreaterThan(0);
    });

    it("contains policy-related questions", () => {
      const policyTerms = [
        "should",
        "policy",
        "tax",
        "regulation",
        "law",
        "government",
      ];
      const policyQuestions = EXAMPLE_QUESTIONS.filter((q) =>
        policyTerms.some((term) => q.toLowerCase().includes(term))
      );
      expect(policyQuestions.length).toBeGreaterThan(0);
    });

    it("no duplicate questions", () => {
      const uniqueQuestions = new Set(EXAMPLE_QUESTIONS);
      expect(uniqueQuestions.size).toBe(EXAMPLE_QUESTIONS.length);
    });

    it("questions are reasonably sized (not too short or too long)", () => {
      EXAMPLE_QUESTIONS.forEach((question) => {
        expect(question.length).toBeGreaterThan(10);
        expect(question.length).toBeLessThan(200);
      });
    });
  });

  describe("getRandomQuestion", () => {
    it("returns a string", () => {
      const result = getRandomQuestion();
      expect(typeof result).toBe("string");
    });

    it("returns a question from the EXAMPLE_QUESTIONS array", () => {
      const result = getRandomQuestion();
      expect(EXAMPLE_QUESTIONS).toContain(result);
    });

    it("returns a question ending with question mark", () => {
      const result = getRandomQuestion();
      expect(result.endsWith("?")).toBe(true);
    });

    it("can return different questions over multiple calls", () => {
      // Call multiple times and collect results
      const results = new Set<string>();
      for (let i = 0; i < 50; i++) {
        results.add(getRandomQuestion());
      }
      // Should get some variety (at least 2 different questions)
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe("getShuffledQuestions", () => {
    it("returns an array", () => {
      const result = getShuffledQuestions();
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns 10 questions by default", () => {
      const result = getShuffledQuestions();
      expect(result.length).toBe(10);
    });

    it("returns specified number of questions", () => {
      expect(getShuffledQuestions(5).length).toBe(5);
      expect(getShuffledQuestions(20).length).toBe(20);
      expect(getShuffledQuestions(1).length).toBe(1);
    });

    it("returns 0 questions when count is 0", () => {
      const result = getShuffledQuestions(0);
      expect(result.length).toBe(0);
    });

    it("returns all questions from the EXAMPLE_QUESTIONS array", () => {
      const result = getShuffledQuestions(10);
      result.forEach((question) => {
        expect(EXAMPLE_QUESTIONS).toContain(question);
      });
    });

    it("returns unique questions (no duplicates)", () => {
      const result = getShuffledQuestions(50);
      const uniqueQuestions = new Set(result);
      expect(uniqueQuestions.size).toBe(result.length);
    });

    it("returns shuffled questions (not always same order)", () => {
      // Get multiple shuffled arrays and check they're not always identical
      const shuffled1 = getShuffledQuestions(20);
      const shuffled2 = getShuffledQuestions(20);
      const shuffled3 = getShuffledQuestions(20);

      // At least one should be different from another
      const allSame =
        JSON.stringify(shuffled1) === JSON.stringify(shuffled2) &&
        JSON.stringify(shuffled2) === JSON.stringify(shuffled3);

      // This might rarely fail due to random chance, but with 20 items it's extremely unlikely
      expect(allSame).toBe(false);
    });

    it("handles request for more questions than available", () => {
      const result = getShuffledQuestions(1000);
      // Should return all available questions
      expect(result.length).toBe(EXAMPLE_QUESTIONS.length);
    });

    it("all returned questions end with question mark", () => {
      const result = getShuffledQuestions(30);
      result.forEach((question) => {
        expect(question.endsWith("?")).toBe(true);
      });
    });
  });

  describe("question content categories", () => {
    it("covers climate and environment topics", () => {
      const climateQuestions = EXAMPLE_QUESTIONS.filter(
        (q) =>
          q.toLowerCase().includes("climate") ||
          q.toLowerCase().includes("carbon") ||
          q.toLowerCase().includes("environment") ||
          q.toLowerCase().includes("green") ||
          q.toLowerCase().includes("electric vehicle")
      );
      expect(climateQuestions.length).toBeGreaterThan(0);
    });

    it("covers technology topics", () => {
      const techQuestions = EXAMPLE_QUESTIONS.filter(
        (q) =>
          q.toLowerCase().includes("ai") ||
          q.toLowerCase().includes("tech") ||
          q.toLowerCase().includes("social media") ||
          q.toLowerCase().includes("privacy") ||
          q.toLowerCase().includes("algorithm")
      );
      expect(techQuestions.length).toBeGreaterThan(0);
    });

    it("covers healthcare topics", () => {
      const healthQuestions = EXAMPLE_QUESTIONS.filter(
        (q) =>
          q.toLowerCase().includes("health") ||
          q.toLowerCase().includes("nhs") ||
          q.toLowerCase().includes("medical") ||
          q.toLowerCase().includes("drug")
      );
      expect(healthQuestions.length).toBeGreaterThan(0);
    });

    it("covers economic topics", () => {
      const econQuestions = EXAMPLE_QUESTIONS.filter(
        (q) =>
          q.toLowerCase().includes("tax") ||
          q.toLowerCase().includes("wage") ||
          q.toLowerCase().includes("economic") ||
          q.toLowerCase().includes("inflation") ||
          q.toLowerCase().includes("debt")
      );
      expect(econQuestions.length).toBeGreaterThan(0);
    });

    it("covers international topics", () => {
      const intlQuestions = EXAMPLE_QUESTIONS.filter(
        (q) =>
          q.toLowerCase().includes("nato") ||
          q.toLowerCase().includes("china") ||
          q.toLowerCase().includes("russia") ||
          q.toLowerCase().includes("eu") ||
          q.toLowerCase().includes("sanctions")
      );
      expect(intlQuestions.length).toBeGreaterThan(0);
    });
  });
});

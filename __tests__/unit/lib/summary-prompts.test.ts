/**
 * Tests for lib/agents/summary-prompts.ts
 *
 * Tests the summary prompts for different reading levels.
 */

import { describe, it, expect } from "vitest";
import {
  getSummaryPrompt,
  getAllSummaryPrompts,
  getAllReadingLevels,
  ReadingLevel,
  SummaryPrompt,
} from "@/lib/agents/summary-prompts";

describe("summary-prompts", () => {
  describe("getSummaryPrompt", () => {
    it("returns child prompt for 'child' level", () => {
      const prompt = getSummaryPrompt("child");
      expect(prompt.level).toBe("child");
      expect(prompt.name).toBe("Young Reader Summary");
    });

    it("returns teen prompt for 'teen' level", () => {
      const prompt = getSummaryPrompt("teen");
      expect(prompt.level).toBe("teen");
      expect(prompt.name).toBe("Teen Reader Summary");
    });

    it("returns undergrad prompt for 'undergrad' level", () => {
      const prompt = getSummaryPrompt("undergrad");
      expect(prompt.level).toBe("undergrad");
      expect(prompt.name).toBe("Undergraduate Summary");
    });

    it("returns postdoc prompt for 'postdoc' level", () => {
      const prompt = getSummaryPrompt("postdoc");
      expect(prompt.level).toBe("postdoc");
      expect(prompt.name).toBe("Expert Summary");
    });
  });

  describe("prompt structure", () => {
    const allLevels: ReadingLevel[] = ["child", "teen", "undergrad", "postdoc"];

    allLevels.forEach((level) => {
      describe(`${level} prompt`, () => {
        let prompt: SummaryPrompt;

        beforeEach(() => {
          prompt = getSummaryPrompt(level);
        });

        it("has required properties", () => {
          expect(prompt).toHaveProperty("level");
          expect(prompt).toHaveProperty("name");
          expect(prompt).toHaveProperty("targetAudience");
          expect(prompt).toHaveProperty("wordCount");
          expect(prompt).toHaveProperty("systemPrompt");
          expect(prompt).toHaveProperty("exampleOutput");
        });

        it("has correct level", () => {
          expect(prompt.level).toBe(level);
        });

        it("has non-empty name", () => {
          expect(prompt.name.length).toBeGreaterThan(0);
        });

        it("has non-empty target audience", () => {
          expect(prompt.targetAudience.length).toBeGreaterThan(0);
        });

        it("has valid word count range", () => {
          expect(prompt.wordCount.min).toBeGreaterThan(0);
          expect(prompt.wordCount.max).toBeGreaterThan(prompt.wordCount.min);
        });

        it("has non-empty system prompt", () => {
          expect(prompt.systemPrompt.length).toBeGreaterThan(100);
        });

        it("has non-empty example output", () => {
          expect(prompt.exampleOutput.length).toBeGreaterThan(50);
        });
      });
    });
  });

  describe("word count ranges", () => {
    it("child has 100-150 word range", () => {
      const prompt = getSummaryPrompt("child");
      expect(prompt.wordCount.min).toBe(100);
      expect(prompt.wordCount.max).toBe(150);
    });

    it("teen has 200-250 word range", () => {
      const prompt = getSummaryPrompt("teen");
      expect(prompt.wordCount.min).toBe(200);
      expect(prompt.wordCount.max).toBe(250);
    });

    it("undergrad has 350-400 word range", () => {
      const prompt = getSummaryPrompt("undergrad");
      expect(prompt.wordCount.min).toBe(350);
      expect(prompt.wordCount.max).toBe(400);
    });

    it("postdoc has 450-500 word range", () => {
      const prompt = getSummaryPrompt("postdoc");
      expect(prompt.wordCount.min).toBe(450);
      expect(prompt.wordCount.max).toBe(500);
    });

    it("word counts increase with reading level", () => {
      const prompts = getAllSummaryPrompts();

      // Sort by min word count
      const sorted = [...prompts].sort((a, b) => a.wordCount.min - b.wordCount.min);

      expect(sorted[0].level).toBe("child");
      expect(sorted[1].level).toBe("teen");
      expect(sorted[2].level).toBe("undergrad");
      expect(sorted[3].level).toBe("postdoc");
    });
  });

  describe("target audiences", () => {
    it("child targets children aged 8-12", () => {
      const prompt = getSummaryPrompt("child");
      expect(prompt.targetAudience).toContain("8-12");
    });

    it("teen targets teenagers aged 13-17", () => {
      const prompt = getSummaryPrompt("teen");
      expect(prompt.targetAudience).toContain("13-17");
    });

    it("undergrad targets university students", () => {
      const prompt = getSummaryPrompt("undergrad");
      expect(prompt.targetAudience.toLowerCase()).toContain("university");
    });

    it("postdoc targets experts", () => {
      const prompt = getSummaryPrompt("postdoc");
      expect(prompt.targetAudience.toLowerCase()).toContain("expert");
    });
  });

  describe("system prompt content", () => {
    it("child prompt mentions simple words", () => {
      const prompt = getSummaryPrompt("child");
      expect(prompt.systemPrompt.toLowerCase()).toContain("simple");
    });

    it("child prompt warns against jargon", () => {
      const prompt = getSummaryPrompt("child");
      expect(prompt.systemPrompt.toLowerCase()).toContain("jargon");
    });

    it("teen prompt mentions explaining terms", () => {
      const prompt = getSummaryPrompt("teen");
      expect(prompt.systemPrompt.toLowerCase()).toContain("explain");
    });

    it("undergrad prompt mentions sources", () => {
      const prompt = getSummaryPrompt("undergrad");
      expect(prompt.systemPrompt.toLowerCase()).toContain("source");
    });

    it("undergrad prompt mentions evidence", () => {
      const prompt = getSummaryPrompt("undergrad");
      expect(prompt.systemPrompt.toLowerCase()).toContain("evidence");
    });

    it("postdoc prompt mentions methodology", () => {
      const prompt = getSummaryPrompt("postdoc");
      expect(prompt.systemPrompt.toLowerCase()).toContain("methodolog");
    });

    it("postdoc prompt mentions technical terminology", () => {
      const prompt = getSummaryPrompt("postdoc");
      expect(prompt.systemPrompt.toLowerCase()).toContain("technical");
    });

    it("all prompts include word count instruction", () => {
      getAllSummaryPrompts().forEach((prompt) => {
        const hasWordCount =
          prompt.systemPrompt.includes(String(prompt.wordCount.min)) ||
          prompt.systemPrompt.includes(String(prompt.wordCount.max));
        expect(hasWordCount).toBe(true);
      });
    });
  });

  describe("example outputs", () => {
    it("all examples are about four-day work week", () => {
      getAllSummaryPrompts().forEach((prompt) => {
        expect(prompt.exampleOutput.toLowerCase()).toContain("four-day");
      });
    });

    it("child example uses simple language", () => {
      const prompt = getSummaryPrompt("child");
      expect(prompt.exampleOutput).toContain("grown-ups");
    });

    it("postdoc example includes academic references", () => {
      const prompt = getSummaryPrompt("postdoc");
      expect(prompt.exampleOutput).toContain("Pencavel");
    });
  });

  describe("getAllSummaryPrompts", () => {
    it("returns array of 4 prompts", () => {
      const prompts = getAllSummaryPrompts();
      expect(prompts).toHaveLength(4);
    });

    it("includes all reading levels", () => {
      const prompts = getAllSummaryPrompts();
      const levels = prompts.map((p) => p.level);

      expect(levels).toContain("child");
      expect(levels).toContain("teen");
      expect(levels).toContain("undergrad");
      expect(levels).toContain("postdoc");
    });

    it("returns valid SummaryPrompt objects", () => {
      const prompts = getAllSummaryPrompts();

      prompts.forEach((prompt) => {
        expect(prompt).toHaveProperty("level");
        expect(prompt).toHaveProperty("name");
        expect(prompt).toHaveProperty("targetAudience");
        expect(prompt).toHaveProperty("wordCount");
        expect(prompt).toHaveProperty("systemPrompt");
        expect(prompt).toHaveProperty("exampleOutput");
      });
    });
  });

  describe("getAllReadingLevels", () => {
    it("returns array of 4 levels", () => {
      const levels = getAllReadingLevels();
      expect(levels).toHaveLength(4);
    });

    it("returns levels in order from youngest to oldest", () => {
      const levels = getAllReadingLevels();
      expect(levels).toEqual(["child", "teen", "undergrad", "postdoc"]);
    });

    it("returns all valid ReadingLevel values", () => {
      const levels = getAllReadingLevels();

      levels.forEach((level) => {
        // Should be able to get a prompt for each level
        const prompt = getSummaryPrompt(level);
        expect(prompt).toBeDefined();
        expect(prompt.level).toBe(level);
      });
    });
  });

  describe("prompt consistency", () => {
    it("all prompts have unique names", () => {
      const prompts = getAllSummaryPrompts();
      const names = prompts.map((p) => p.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(prompts.length);
    });

    it("all prompts have unique levels", () => {
      const prompts = getAllSummaryPrompts();
      const levels = prompts.map((p) => p.level);
      const uniqueLevels = new Set(levels);

      expect(uniqueLevels.size).toBe(prompts.length);
    });

    it("word count ranges do not overlap", () => {
      const prompts = getAllSummaryPrompts();
      const sorted = [...prompts].sort((a, b) => a.wordCount.min - b.wordCount.min);

      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].wordCount.max).toBeLessThan(sorted[i + 1].wordCount.min);
      }
    });
  });
});

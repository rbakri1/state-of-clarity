/**
 * Tests for lib/agents/specialist-personas.ts
 *
 * Tests the specialist persona configuration for domain experts.
 */

import { describe, it, expect } from "vitest";
import {
  getSpecialistPersona,
  getAllPersonas,
  type SpecialistPersona,
} from "@/lib/agents/specialist-personas";
import type { Domain } from "@/lib/types/classification";

describe("specialist-personas", () => {
  const allDomains: Domain[] = [
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

  describe("getSpecialistPersona", () => {
    it.each(allDomains)("returns a persona for %s domain", (domain) => {
      const persona = getSpecialistPersona(domain);

      expect(persona).toBeDefined();
      expect(persona.domain).toBe(domain);
    });

    it("returns economics persona with correct properties", () => {
      const persona = getSpecialistPersona("economics");

      expect(persona.name).toBe("Economic Policy Analyst");
      expect(persona.expertise).toContain("Macroeconomics");
      expect(persona.systemPrompt).toContain("economic policy analyst");
      expect(persona.keyConsiderations.length).toBeGreaterThan(0);
      expect(persona.preferredSources.length).toBeGreaterThan(0);
    });

    it("returns healthcare persona with correct properties", () => {
      const persona = getSpecialistPersona("healthcare");

      expect(persona.name).toBe("Health Policy Specialist");
      expect(persona.expertise).toContain("NHS");
      expect(persona.systemPrompt).toContain("health policy specialist");
    });

    it("returns climate persona with correct properties", () => {
      const persona = getSpecialistPersona("climate");

      expect(persona.name).toBe("Climate and Environment Analyst");
      expect(persona.expertise).toContain("Climate science");
    });

    it("returns education persona with correct properties", () => {
      const persona = getSpecialistPersona("education");

      expect(persona.name).toBe("Education Policy Expert");
      expect(persona.expertise).toContain("Education");
    });

    it("returns defense persona with correct properties", () => {
      const persona = getSpecialistPersona("defense");

      expect(persona.name).toBe("Defence and Security Analyst");
      expect(persona.expertise).toContain("Defence policy");
    });

    it("returns immigration persona with correct properties", () => {
      const persona = getSpecialistPersona("immigration");

      expect(persona.name).toBe("Migration Policy Analyst");
      expect(persona.expertise).toContain("Immigration policy");
    });

    it("returns housing persona with correct properties", () => {
      const persona = getSpecialistPersona("housing");

      expect(persona.name).toBe("Housing Policy Specialist");
      expect(persona.expertise).toContain("Housing policy");
    });

    it("returns justice persona with correct properties", () => {
      const persona = getSpecialistPersona("justice");

      expect(persona.name).toBe("Justice and Legal Affairs Analyst");
      expect(persona.expertise).toContain("Criminal justice");
    });

    it("returns technology persona with correct properties", () => {
      const persona = getSpecialistPersona("technology");

      expect(persona.name).toBe("Technology Policy Analyst");
      expect(persona.expertise).toContain("AI");
    });

    it("returns governance persona with correct properties", () => {
      const persona = getSpecialistPersona("governance");

      expect(persona.name).toBe("Constitutional and Governance Expert");
      expect(persona.expertise).toContain("Constitutional");
    });

    it("returns other persona for general topics", () => {
      const persona = getSpecialistPersona("other");

      expect(persona.name).toBe("Policy Generalist");
      expect(persona.expertise).toContain("Cross-cutting");
    });
  });

  describe("getAllPersonas", () => {
    it("returns an array of all personas", () => {
      const personas = getAllPersonas();

      expect(Array.isArray(personas)).toBe(true);
      expect(personas.length).toBe(11);
    });

    it("includes a persona for each domain", () => {
      const personas = getAllPersonas();
      const domains = personas.map((p) => p.domain);

      allDomains.forEach((domain) => {
        expect(domains).toContain(domain);
      });
    });

    it("all personas have required properties", () => {
      const personas = getAllPersonas();

      personas.forEach((persona) => {
        expect(persona).toHaveProperty("name");
        expect(persona).toHaveProperty("domain");
        expect(persona).toHaveProperty("expertise");
        expect(persona).toHaveProperty("systemPrompt");
        expect(persona).toHaveProperty("keyConsiderations");
        expect(persona).toHaveProperty("preferredSources");
      });
    });

    it("all personas have non-empty names", () => {
      const personas = getAllPersonas();

      personas.forEach((persona) => {
        expect(typeof persona.name).toBe("string");
        expect(persona.name.length).toBeGreaterThan(0);
      });
    });

    it("all personas have non-empty expertise descriptions", () => {
      const personas = getAllPersonas();

      personas.forEach((persona) => {
        expect(typeof persona.expertise).toBe("string");
        expect(persona.expertise.length).toBeGreaterThan(10);
      });
    });

    it("all personas have substantial system prompts", () => {
      const personas = getAllPersonas();

      personas.forEach((persona) => {
        expect(typeof persona.systemPrompt).toBe("string");
        expect(persona.systemPrompt.length).toBeGreaterThan(100);
      });
    });

    it("all personas have multiple key considerations", () => {
      const personas = getAllPersonas();

      personas.forEach((persona) => {
        expect(Array.isArray(persona.keyConsiderations)).toBe(true);
        expect(persona.keyConsiderations.length).toBeGreaterThanOrEqual(3);
      });
    });

    it("all personas have multiple preferred sources", () => {
      const personas = getAllPersonas();

      personas.forEach((persona) => {
        expect(Array.isArray(persona.preferredSources)).toBe(true);
        expect(persona.preferredSources.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("persona content quality", () => {
    it("economics persona references authoritative UK sources", () => {
      const persona = getSpecialistPersona("economics");

      expect(persona.preferredSources).toContain("Office for National Statistics (ONS)");
      expect(persona.preferredSources).toContain("Bank of England");
    });

    it("healthcare persona references NHS and health bodies", () => {
      const persona = getSpecialistPersona("healthcare");

      expect(persona.preferredSources).toContain("NHS England");
      expect(persona.preferredSources.some((s) => s.includes("NICE"))).toBe(true);
    });

    it("climate persona references IPCC and climate bodies", () => {
      const persona = getSpecialistPersona("climate");

      expect(persona.preferredSources).toContain("IPCC Reports");
      expect(persona.preferredSources).toContain("UK Climate Change Committee");
    });

    it("defense persona references MOD and security institutes", () => {
      const persona = getSpecialistPersona("defense");

      expect(persona.preferredSources).toContain("Ministry of Defence");
      expect(persona.preferredSources.some((s) => s.includes("RUSI"))).toBe(true);
    });

    it("immigration persona references Home Office", () => {
      const persona = getSpecialistPersona("immigration");

      expect(persona.preferredSources).toContain("Home Office statistics");
      expect(persona.preferredSources.some((s) => s.includes("Migration"))).toBe(true);
    });

    it("persona system prompts contain guidance for analysis", () => {
      const personas = getAllPersonas();

      personas.forEach((persona) => {
        // All prompts should have substantive content
        expect(persona.systemPrompt.length).toBeGreaterThan(100);
        // All prompts should describe what the expert does or knows
        const prompt = persona.systemPrompt.toLowerCase();
        expect(
          prompt.includes("expert") ||
            prompt.includes("analyst") ||
            prompt.includes("specialist") ||
            prompt.includes("generalist") ||
            prompt.includes("policy")
        ).toBe(true);
      });
    });

    it("key considerations are policy-relevant", () => {
      const personas = getAllPersonas();

      personas.forEach((persona) => {
        persona.keyConsiderations.forEach((consideration) => {
          expect(consideration.length).toBeGreaterThan(5);
        });
      });
    });
  });

  describe("persona uniqueness", () => {
    it("all personas have unique names", () => {
      const personas = getAllPersonas();
      const names = personas.map((p) => p.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });

    it("all personas have unique domains", () => {
      const personas = getAllPersonas();
      const domains = personas.map((p) => p.domain);
      const uniqueDomains = new Set(domains);

      expect(uniqueDomains.size).toBe(domains.length);
    });
  });
});

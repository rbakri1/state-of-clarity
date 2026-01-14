import { describe, it, expect } from 'vitest';
import { getSpecialistPersona, getAllPersonas } from '@/lib/agents/specialist-personas';
import type { Domain } from '@/lib/types/classification';

describe('Specialist Personas', () => {
  const domains: Domain[] = [
    'economics',
    'healthcare',
    'climate',
    'education',
    'defense',
    'immigration',
    'housing',
    'justice',
    'technology',
    'governance',
    'other',
  ];

  describe('getSpecialistPersona', () => {
    it.each(domains)('should return persona for %s domain', (domain) => {
      const persona = getSpecialistPersona(domain);
      expect(persona).toBeDefined();
      expect(persona.domain).toBe(domain);
      expect(persona.name).toBeTruthy();
      expect(persona.expertise).toBeTruthy();
      expect(persona.systemPrompt).toBeTruthy();
      expect(persona.keyConsiderations).toBeInstanceOf(Array);
      expect(persona.preferredSources).toBeInstanceOf(Array);
    });

    it('should return economics persona with correct properties', () => {
      const persona = getSpecialistPersona('economics');
      expect(persona.name).toBe('Economic Policy Analyst');
      expect(persona.preferredSources).toContain('Office for National Statistics (ONS)');
      expect(persona.keyConsiderations).toContain('Impact on GDP, employment, and inflation');
    });

    it('should return healthcare persona with correct properties', () => {
      const persona = getSpecialistPersona('healthcare');
      expect(persona.name).toBe('Health Policy Specialist');
      expect(persona.preferredSources).toContain('NHS England');
    });

    it('should return other/generalist persona', () => {
      const persona = getSpecialistPersona('other');
      expect(persona.name).toBe('Policy Generalist');
    });
  });

  describe('getAllPersonas', () => {
    it('should return all personas', () => {
      const personas = getAllPersonas();
      expect(personas).toBeInstanceOf(Array);
      expect(personas.length).toBe(11);
    });

    it('should include all domains', () => {
      const personas = getAllPersonas();
      const domainSet = new Set(personas.map((p) => p.domain));
      domains.forEach((domain) => {
        expect(domainSet.has(domain)).toBe(true);
      });
    });

    it('should return personas with required properties', () => {
      const personas = getAllPersonas();
      personas.forEach((persona) => {
        expect(persona.name).toBeTruthy();
        expect(persona.domain).toBeTruthy();
        expect(persona.expertise).toBeTruthy();
        expect(persona.systemPrompt).toBeTruthy();
        expect(persona.keyConsiderations.length).toBeGreaterThan(0);
        expect(persona.preferredSources.length).toBeGreaterThan(0);
      });
    });
  });
});

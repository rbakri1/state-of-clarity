/**
 * Companies House API Unit Tests
 *
 * Tests for Companies House API integration: officer search, appointments, and profile fetching.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variable
vi.stubEnv('COMPANIES_HOUSE_API_KEY', 'test-api-key');

import {
  getCompaniesHouseAuthHeader,
  searchOfficers,
  getOfficerAppointments,
  fetchCompaniesHouseProfile,
} from '@/lib/services/companies-house-api';

describe('Companies House API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCompaniesHouseAuthHeader', () => {
    it('should return Basic Auth header with base64 encoded API key', () => {
      const header = getCompaniesHouseAuthHeader();
      // API key is used as username with empty password: "test-api-key:"
      const expected = `Basic ${Buffer.from('test-api-key:').toString('base64')}`;
      expect(header).toBe(expected);
    });
  });

  describe('searchOfficers', () => {
    it('should return parsed results on successful response', async () => {
      const mockResponse = {
        items: [
          {
            title: 'John Smith',
            links: { self: '/officers/abc123' },
            appointment_count: 3,
          },
          {
            title: 'Jane Doe',
            links: { self: '/officers/def456' },
            appointment_count: 1,
          },
        ],
        total_results: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await searchOfficers('Smith');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('John Smith');
      expect(result[1].title).toBe('Jane Doe');
    });

    it('should return empty array on 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await searchOfficers('NonExistentPerson');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should return empty array when items is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ total_results: 0 }),
      });

      const result = await searchOfficers('NoResults');

      expect(result).toEqual([]);
    });

    it('should throw on non-404 error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchOfficers('Test')).rejects.toThrow(
        'Companies House search failed: 500 Internal Server Error'
      );
    });
  });

  describe('getOfficerAppointments', () => {
    it('should return appointments on successful response', async () => {
      const mockResponse = {
        items: [
          {
            appointed_to: {
              company_name: 'Test Corp',
              company_number: '12345678',
              company_status: 'active',
            },
            officer_role: 'director',
            appointed_on: '2020-01-15',
          },
        ],
        total_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await getOfficerAppointments('abc123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].appointed_to?.company_name).toBe('Test Corp');
      expect(result[0].officer_role).toBe('director');
    });

    it('should return empty array on 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await getOfficerAppointments('invalid-id');

      expect(result).toEqual([]);
    });

    it('should throw on non-404 error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(getOfficerAppointments('abc123')).rejects.toThrow(
        'Companies House appointments failed: 401 Unauthorized'
      );
    });
  });

  describe('fetchCompaniesHouseProfile', () => {
    it('should map appointments to CompanyRecord[] correctly', async () => {
      // Mock searchOfficers response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              title: 'John Smith',
              links: { self: '/officers/abc123' },
            },
          ],
        }),
      });

      // Mock getOfficerAppointments response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              appointed_to: {
                company_name: 'Acme Ltd',
                company_number: '00123456',
                company_status: 'active',
              },
              officer_role: 'secretary',
              appointed_on: '2019-03-01',
              resigned_on: '2021-06-15',
            },
            {
              appointed_to: {
                company_name: 'Tech Corp',
                company_number: '00789012',
                company_status: 'dissolved',
              },
              officer_role: 'director',
              appointed_on: '2018-01-01',
            },
          ],
        }),
      });

      const result = await fetchCompaniesHouseProfile('John Smith');

      expect(result.records).toHaveLength(2);
      
      // First record
      expect(result.records[0].companyName).toBe('Acme Ltd');
      expect(result.records[0].companyNumber).toBe('00123456');
      expect(result.records[0].role).toBe('secretary');
      expect(result.records[0].appointedOn).toBe('2019-03-01');
      expect(result.records[0].resignedOn).toBe('2021-06-15');
      expect(result.records[0].companyStatus).toBe('active');

      // Second record
      expect(result.records[1].companyName).toBe('Tech Corp');
      expect(result.records[1].companyNumber).toBe('00789012');
      expect(result.records[1].role).toBe('director');
      expect(result.records[1].companyStatus).toBe('dissolved');

      // Sources
      expect(result.sources).toHaveLength(2);
      expect(result.sources[0].sourceType).toBe('companies_house');
      expect(result.sources[0].verificationStatus).toBe('verified');
      expect(result.sources[0].url).toContain('00123456');
    });

    it('should return empty arrays when no officers found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      });

      const result = await fetchCompaniesHouseProfile('Nobody');

      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it('should trigger retry logic on 500 error', async () => {
      // First two calls fail with 500
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                title: 'Test Person',
                links: { self: '/officers/retry123' },
              },
            ],
          }),
        })
        // Appointments call succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ items: [] }),
        });

      const result = await fetchCompaniesHouseProfile('Test');

      // Should have retried - 3 calls for search + 1 for appointments
      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(result.records).toEqual([]);
    });

    it('should NOT trigger retry logic on 404', async () => {
      // 404 should not retry - it returns empty array immediately
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await fetchCompaniesHouseProfile('NotFound');

      // Only 1 call - no retry for 404
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it('should throw after all retry attempts fail', async () => {
      // All 3 attempts fail with 500
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

      await expect(fetchCompaniesHouseProfile('FailAll')).rejects.toThrow(
        'Companies House search failed: 500 Internal Server Error'
      );

      // All 3 retry attempts made
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should continue fetching other officers if one appointment fetch fails', async () => {
      // Search returns 2 officers
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            { title: 'Officer One', links: { self: '/officers/off1' } },
            { title: 'Officer Two', links: { self: '/officers/off2' } },
          ],
        }),
      });

      // First officer appointments fail after retries
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

      // Second officer appointments succeed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              appointed_to: {
                company_name: 'Working Corp',
                company_number: '11111111',
                company_status: 'active',
              },
              officer_role: 'director',
              appointed_on: '2022-01-01',
            },
          ],
        }),
      });

      const result = await fetchCompaniesHouseProfile('MultiOfficer');

      // Should have records from second officer only
      expect(result.records).toHaveLength(1);
      expect(result.records[0].companyName).toBe('Working Corp');
    });
  });
});

/**
 * ProfileSection Component Tests
 *
 * Tests for the UK Public Records Profile section.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileSection from '@/components/accountability/profile-section';
import type { UKProfileData } from '@/lib/types/accountability';

const createMockProfileData = (overrides: Partial<UKProfileData> = {}): UKProfileData => ({
  fullName: 'Test Entity',
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
  ...overrides,
});

describe('ProfileSection', () => {
  describe('Section Heading', () => {
    it('should render the section heading', () => {
      render(<ProfileSection profileData={createMockProfileData()} />);

      expect(screen.getByText('UK Public Records Profile')).toBeInTheDocument();
    });
  });

  describe('Data Completeness Indicator', () => {
    it('should display 0% when no data sources have data', () => {
      render(<ProfileSection profileData={createMockProfileData()} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display correct percentage for partial data', () => {
      const profileData = createMockProfileData({
        dataCompleteness: {
          hasCompaniesHouse: true,
          hasRegisterOfInterests: true,
          hasCharityData: false,
          hasDonationsData: false,
          hasContractsData: false,
          completenessScore: 0.4,
        },
      });

      render(<ProfileSection profileData={profileData} />);

      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('should display 100% when all data sources have data', () => {
      const profileData = createMockProfileData({
        dataCompleteness: {
          hasCompaniesHouse: true,
          hasRegisterOfInterests: true,
          hasCharityData: true,
          hasDonationsData: true,
          hasContractsData: true,
          completenessScore: 1,
        },
      });

      render(<ProfileSection profileData={profileData} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should show all 5 data source indicators', () => {
      render(<ProfileSection profileData={createMockProfileData()} />);

      const indicatorLabels = ['Companies House', 'Register of Interests', 'Charity Data', 'Donations', 'Contracts'];
      indicatorLabels.forEach((label) => {
        const elements = screen.getAllByText(label);
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Expandable Cards', () => {
    it('should render all 5 expandable cards', () => {
      render(<ProfileSection profileData={createMockProfileData()} />);

      expect(screen.getAllByRole('button', { name: /companies house/i })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: /charity commission/i })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: /register of interests/i })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: /electoral commission/i })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: /contracts finder/i })).toHaveLength(1);
    });

    it('should expand card when clicked', () => {
      const profileData = createMockProfileData({
        companiesHouseEntities: [
          {
            companyNumber: '12345678',
            companyName: 'Test Company Ltd',
            role: 'Director',
            companyStatus: 'Active',
            sourceUrl: 'https://example.com',
          },
        ],
      });

      render(<ProfileSection profileData={profileData} />);

      const companiesButton = screen.getByRole('button', { name: /companies house/i });
      fireEvent.click(companiesButton);

      expect(screen.getByText('Test Company Ltd')).toBeInTheDocument();
    });
  });

  describe('Companies House Data', () => {
    it('should display company records when data exists', () => {
      const profileData = createMockProfileData({
        companiesHouseEntities: [
          {
            companyNumber: '12345678',
            companyName: 'Test Company Ltd',
            role: 'Director',
            appointedOn: '2020-01-01',
            companyStatus: 'Active',
            sourceUrl: 'https://companies-house.gov.uk/12345678',
          },
        ],
      });

      render(<ProfileSection profileData={profileData} />);

      const companiesButton = screen.getByRole('button', { name: /companies house/i });
      fireEvent.click(companiesButton);

      expect(screen.getByText('Test Company Ltd')).toBeInTheDocument();
      expect(screen.getByText(/Director/)).toBeInTheDocument();
      expect(screen.getByText(/Company No: 12345678/)).toBeInTheDocument();
      expect(screen.getByText(/Appointed: 2020-01-01/)).toBeInTheDocument();
    });

    it('should show empty state when no companies data', () => {
      render(<ProfileSection profileData={createMockProfileData()} />);

      const companiesButton = screen.getByRole('button', { name: /companies house/i });
      fireEvent.click(companiesButton);

      const emptyStateTexts = screen.getAllByText('No data found for this source');
      expect(emptyStateTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Charity Commission Data', () => {
    it('should display charity records when data exists', () => {
      const profileData = createMockProfileData({
        charityInvolvements: [
          {
            charityNumber: '1234567',
            charityName: 'Test Charity',
            role: 'Trustee',
            startDate: '2019-05-01',
            charityIncome: 50000,
            sourceUrl: 'https://charity-commission.gov.uk/1234567',
          },
        ],
      });

      render(<ProfileSection profileData={profileData} />);

      const charityButton = screen.getByRole('button', { name: /charity commission/i });
      fireEvent.click(charityButton);

      expect(screen.getByText('Test Charity')).toBeInTheDocument();
      expect(screen.getByText('Trustee')).toBeInTheDocument();
      expect(screen.getByText(/Charity No: 1234567/)).toBeInTheDocument();
      expect(screen.getByText(/Income: £50,000/)).toBeInTheDocument();
    });
  });

  describe('Register of Interests Data', () => {
    it('should display interest declarations when data exists', () => {
      const profileData = createMockProfileData({
        registerOfInterests: [
          {
            category: 'Shareholdings',
            description: 'Shares in Test Corp valued at £50,000',
            value: '£50,000',
            dateRegistered: '2021-03-15',
            sourceUrl: 'https://parliament.uk/interests',
          },
        ],
      });

      render(<ProfileSection profileData={profileData} />);

      const interestsButton = screen.getByRole('button', { name: /register of interests/i });
      fireEvent.click(interestsButton);

      expect(screen.getByText('Shareholdings')).toBeInTheDocument();
      expect(screen.getByText(/Shares in Test Corp valued at £50,000/)).toBeInTheDocument();
      expect(screen.getByText(/Value: £50,000/)).toBeInTheDocument();
    });
  });

  describe('Electoral Commission Data', () => {
    it('should display donations when data exists', () => {
      const profileData = createMockProfileData({
        politicalDonations: [
          {
            donor: 'John Donor',
            amount: 10000,
            date: '2022-06-01',
            type: 'Cash',
            sourceUrl: 'https://electoral-commission.gov.uk/donations',
          },
        ],
      });

      render(<ProfileSection profileData={profileData} />);

      const electoralButton = screen.getByRole('button', { name: /electoral commission/i });
      fireEvent.click(electoralButton);

      expect(screen.getByText('John Donor')).toBeInTheDocument();
      expect(screen.getByText('£10,000')).toBeInTheDocument();
      expect(screen.getByText('Cash')).toBeInTheDocument();
    });
  });

  describe('Contracts Finder Data', () => {
    it('should display contracts when data exists', () => {
      const profileData = createMockProfileData({
        governmentContracts: [
          {
            contractTitle: 'IT Services Contract',
            buyer: 'Government Dept',
            supplier: 'Test Supplier Ltd',
            value: 500000,
            awardDate: '2023-01-15',
            sourceUrl: 'https://contracts-finder.gov.uk/123',
          },
        ],
      });

      render(<ProfileSection profileData={profileData} />);

      const contractsButton = screen.getByRole('button', { name: /contracts finder/i });
      fireEvent.click(contractsButton);

      expect(screen.getByText('IT Services Contract')).toBeInTheDocument();
      expect(screen.getByText(/Government Dept → Test Supplier Ltd/)).toBeInTheDocument();
      expect(screen.getByText('£500,000')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show "No data" badge on cards without data', () => {
      render(<ProfileSection profileData={createMockProfileData()} />);

      const noDataBadges = screen.getAllByText('No data');
      expect(noDataBadges.length).toBe(5);
    });
  });

  describe('Source Links', () => {
    it('should display source link when data has sourceUrl', () => {
      const profileData = createMockProfileData({
        companiesHouseEntities: [
          {
            companyNumber: '12345678',
            companyName: 'Test Company Ltd',
            role: 'Director',
            companyStatus: 'Active',
            sourceUrl: 'https://companies-house.gov.uk/12345678',
          },
        ],
      });

      render(<ProfileSection profileData={profileData} />);

      const companiesButton = screen.getByRole('button', { name: /companies house/i });
      fireEvent.click(companiesButton);

      const sourceLink = screen.getByRole('link', { name: /view source/i });
      expect(sourceLink).toHaveAttribute('href', 'https://companies-house.gov.uk/12345678');
      expect(sourceLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-expanded attribute on cards', () => {
      render(<ProfileSection profileData={createMockProfileData()} />);

      const companiesButton = screen.getByRole('button', { name: /companies house/i });
      expect(companiesButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(companiesButton);
      expect(companiesButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have section labeled by heading', () => {
      render(<ProfileSection profileData={createMockProfileData()} />);

      const section = screen.getByRole('region', { name: /uk public records profile/i });
      expect(section).toBeInTheDocument();
    });
  });
});

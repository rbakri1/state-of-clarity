export type EntityType = 'individual' | 'organization';

export interface Position {
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
  description?: string;
  sourceUrl: string;
}

export interface CompanyRecord {
  companyNumber: string;
  companyName: string;
  role: string;
  appointedOn?: string;
  resignedOn?: string;
  companyStatus: string;
  sourceUrl: string;
}

export interface InterestDeclaration {
  category: string;
  description: string;
  value?: string;
  dateRegistered: string;
  sourceUrl: string;
}

export interface CharityRecord {
  charityNumber: string;
  charityName: string;
  role: string;
  startDate?: string;
  endDate?: string;
  charityIncome?: number;
  sourceUrl: string;
}

export interface Donation {
  donor?: string;
  recipient?: string;
  amount: number;
  date: string;
  type: string;
  sourceUrl: string;
}

export interface Contract {
  contractTitle: string;
  buyer: string;
  supplier: string;
  value: number;
  awardDate: string;
  sourceUrl: string;
}

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

export type ConflictType = 'financial' | 'regulatory' | 'oversight' | 'personal';

export interface ConflictOfInterest {
  description: string;
  positionA: string;
  positionB: string;
  conflictType: ConflictType;
}

export interface HistoricalCase {
  name: string;
  year: number;
  description: string;
  outcome: string;
  sourceUrl?: string;
}

export type SourceType =
  | 'companies_house'
  | 'charity_commission'
  | 'register_of_interests'
  | 'electoral_commission'
  | 'contracts_finder'
  | 'web_search'
  | 'gov_uk'
  | 'other';

export type VerificationStatus = 'verified' | 'unverified' | 'disputed';

export interface InvestigationSource {
  sourceType: SourceType;
  url: string;
  title: string;
  accessedAt: string;
  verificationStatus: VerificationStatus;
}

export interface DataCompleteness {
  hasCompaniesHouse: boolean;
  hasRegisterOfInterests: boolean;
  hasCharityData: boolean;
  hasDonationsData: boolean;
  hasContractsData: boolean;
  completenessScore: number;
}

export interface UKProfileData {
  fullName: string;
  aliases: string[];
  dateOfBirth?: string;
  currentPositions: Position[];
  pastPositions: Position[];
  companiesHouseEntities: CompanyRecord[];
  registerOfInterests: InterestDeclaration[];
  charityInvolvements: CharityRecord[];
  politicalDonations: Donation[];
  governmentContracts: Contract[];
  sources: InvestigationSource[];
  dataCompleteness: DataCompleteness;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DetectionDifficulty = 'easy' | 'moderate' | 'difficult' | 'very_difficult';

export interface CorruptionScenario {
  scenarioId: string;
  title: string;
  description: string;
  mechanism: string;
  incentiveStructure: string;
  enablingPositions: string[];
  potentialConflicts: ConflictOfInterest[];
  redFlags: string[];
  innocentExplanations: string[];
  riskLevel: RiskLevel;
  detectionDifficulty: DetectionDifficulty;
  historicalPrecedents: HistoricalCase[];
}

export type ActionPriority = 1 | 2 | 3;

export interface ActionItem {
  actionId: string;
  priority: ActionPriority;
  action: string;
  rationale: string;
  dataSource: string;
  expectedEvidence: string;
  estimatedTime?: string;
  legalConsiderations?: string[];
  relatedScenarios: string[];
}

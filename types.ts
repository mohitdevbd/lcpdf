
export enum InputMode {
  TEXT = 'TEXT',
  FILE = 'FILE'
}

export interface ProcessingResult {
  fileId: string;
  fileName?: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  data?: StructuredSummary;
  error?: string;
  generationTime?: number;
}

export interface ComplianceRule {
  ruleName: string;
  passed: boolean;
  explanation: string;
}

export interface TradeCompliance {
  isTradeDocument: boolean;
  extractedDetails: {
    exportContractDate?: string;
    proformaInvoiceDate?: string; // Date of Issue
    latestShipmentDate?: string;
    expiryDate?: string;
    draftsAt?: string;
    hasOverdueInterestClause?: boolean;
  };
  rules: ComplianceRule[];
}

export interface TradeDetails {
  lcNumber?: string;
  exportContractNumber?: string;
  proformaInvoiceNumber?: string;
  dateOfIssue?: string;
  expiryDate?: string;
  latestShipmentDate?: string;
  applicant?: string;
  beneficiary?: string;
  amountAndCurrency?: string;
  discrepancyFee?: string;
  reimbursementCharges?: string;
  clause71D?: string;
  hsCodes?: string[];
  draftsAt?: string;
  ircNumber?: string;
  ercNumber?: string;
  tinNumber?: string;
  vatNumber?: string;
  binNumber?: string;
  issuingBankBin?: string;
  bondLicenceNumber?: string;
  boiNumber?: string;
}

export interface StructuredSummary {
  documentTitle: string;
  executiveSummary: string;
  keyHighlights: string[];
  importantDates: string[];
  actionItems: string[];
  peopleOrEntities: string[];
  category: string;
  tradeCompliance?: TradeCompliance;
  tradeDetails?: TradeDetails;
}

export interface FileData {
  id: string;
  file: File;
  base64: string;
  mimeType: string;
}

export interface GenerationState {
  status: 'idle' | 'generating' | 'success' | 'error';
  error?: string;
}

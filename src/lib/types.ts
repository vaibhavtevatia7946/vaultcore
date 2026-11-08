export type AccountType = 'USER' | 'MERCHANT' | 'TREASURY';

export interface Account {
  id: string;
  name: string;
  vpa: string; // UPI ID (e.g. aarav@oksbi)
  accountNumber: string;
  bankName: string;
  type: AccountType;
  balance: number; // in INR (₹)
  currency: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';

export interface Transaction {
  id: string;
  idempotencyKey: string; // NPCI RRN / Client UUID
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAccountName: string;
  destinationAccountName: string;
  sourceVpa: string;
  destinationVpa: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  lockAcquiredOrder: string[]; // Lexicographical ordering to eliminate deadlocks
  executionTimeMs: number;
  createdAt: string;
  replayedFromCache?: boolean;
}

export type EntryType = 'DEBIT' | 'CREDIT';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  accountName: string;
  vpa: string;
  type: EntryType;
  amount: number;
  currency: string;
  balanceAfter: number;
  hash: string; // SHA-256 Merkle chain hash
  createdAt: string;
}

export interface InvariantAudit {
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  delta: number;
  totalTransactions: number;
  totalLedgerEntries: number;
  systemIntegrityStatus: 'VERIFIED' | 'COMPROMISED';
  lastAuditTime: string;
}

export interface IdempotencyRecord {
  key: string;
  status: 'IN_FLIGHT' | 'COMPLETED';
  responsePayload?: any;
  createdAt: number;
}

export interface ConcurrencySimulationResult {
  totalRequestsSent: number;
  successfulTransfers: number;
  rejectedTransfers: number;
  deadlocksAvoided: number;
  raceConditionDoubleSpendsDetected: number;
  totalExecutionTimeMs: number;
  avgLatencyMs: number;
  auditInvariantMaintained: boolean;
  logs: string[];
}

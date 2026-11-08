export type AccountType = 'USER' | 'MERCHANT' | 'TREASURY';

export interface Account {
  id: string;
  name: string;
  accountNumber: string;
  type: AccountType;
  balance: number; // in cents or currency units
  currency: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';

export interface Transaction {
  id: string;
  idempotencyKey: string;
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAccountName: string;
  destinationAccountName: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  lockAcquiredOrder: string[]; // e.g. ["acc_1", "acc_2"] to prove Resource Ordering
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
  type: EntryType;
  amount: number;
  currency: string;
  balanceAfter: number;
  hash: string; // Cryptographic SHA-256 integrity hash
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
  rejectedTransfers: number; // e.g. insufficient funds or duplicate idempotency
  deadlocksAvoided: number;
  raceConditionDoubleSpendsDetected: number;
  totalExecutionTimeMs: number;
  avgLatencyMs: number;
  auditInvariantMaintained: boolean;
  logs: string[];
}

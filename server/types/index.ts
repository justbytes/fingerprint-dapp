// server/types/index.ts

export interface Transaction {
  txHash: string;
  walletAddress: string;
  timestamp: string;
}

export interface FingerprintLog {
  id: number;
  fingerprintId: string;
  fingerprintHash: string;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  fingerprintId: string;
  walletAddress: string;
  transactionHash: string;
  hashedFingerprint: string;
  timestamp?: string;
}

export interface FingerprintLogResponse {
  id: number;
  fingerprintId: string;
  fingerprintHash: string;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export interface GetFingerprintsQuery {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'fingerprint_id' | 'wallet_address';
  sortOrder?: 'ASC' | 'DESC';
}

export interface HealthCheckResponse {
  success: boolean;
  status: string;
  timestamp: string;
  uptime: number;
}

// Database row interface (matches SQLite column names)
export interface FingerprintLogRow {
  id: number;
  fingerprint_id: string;
  fingerprint_hash: string;
  transactions: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

// Error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

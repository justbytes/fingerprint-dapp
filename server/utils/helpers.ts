// server/utils/helpers.ts
import { FingerprintLogRow, FingerprintLogResponse, Transaction } from '../types';

/**
 * Transform database row to API response format
 */
export function transformFingerprintLog(row: FingerprintLogRow): FingerprintLogResponse {
  let transactions: Transaction[] = [];

  if (row.transactions) {
    try {
      transactions = JSON.parse(row.transactions);
    } catch (e) {
      console.warn('Failed to parse transactions JSON:', e);
      transactions = [];
    }
  }

  return {
    id: row.id,
    fingerprintId: row.fingerprint_id,
    fingerprintHash: row.fingerprint_hash,
    transactions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Safely parse JSON string, return empty array if invalid
 */
export function safeJsonParse(jsonString: string): any[] {
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Validate environment variables and return typed config
 */
export function validateEnvironment() {
  const requiredVars = {
    PORT: process.env.PORT || '3001',
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    API_SECRET_KEY: process.env.API_SECRET_KEY,
  };

  // Check for missing API key
  if (!requiredVars.API_SECRET_KEY) {
    console.error('❌ Missing required environment variable: API_SECRET_KEY');
    console.log('💡 Please add API_SECRET_KEY to your .env file');
    process.exit(1);
  }

  return requiredVars;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: Error, includeDetails = false) {
  return {
    success: false,
    error: error.message,
    details: includeDetails ? error.stack : undefined,
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Calculate pagination info
 */
export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
  };
}

/**
 * Sanitize SQL ORDER BY values to prevent injection
 */
export function sanitizeSortField(sortBy: string, validFields: string[]): string {
  return validFields.includes(sortBy) ? sortBy : validFields[0];
}

/**
 * Sanitize SQL ORDER direction
 */
export function sanitizeSortOrder(sortOrder: string): 'ASC' | 'DESC' {
  const normalized = sortOrder.toUpperCase();
  return normalized === 'ASC' || normalized === 'DESC' ? normalized : 'DESC';
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(date?: Date): string {
  return (date || new Date()).toISOString();
}

/**
 * Check if string is valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if string is valid transaction hash
 */
export function isValidTransactionHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Generate a simple request ID for logging
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

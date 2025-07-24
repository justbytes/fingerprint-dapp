// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_SECRET_KEY = process.env.NEXT_PUBLIC_API_SECRET_KEY;

/**
 * Creates headers with API key authentication
 */
function createAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (API_SECRET_KEY) {
    headers['X-API-Key'] = API_SECRET_KEY;
  } else {
    console.warn('⚠️ API_SECRET_KEY not found in environment variables');
  }

  return headers;
}

/**
 * Makes an authenticated API request
 */
async function authenticatedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...createAuthHeaders(),
      ...options.headers,
    },
  };

  const response = await fetch(url, requestOptions);

  // Log authentication errors specifically
  if (response.status === 401) {
    console.error('❌ Authentication failed - check your API key');
  }

  return response;
}

/**
 * Log transaction to backend with authentication
 */
export async function logTransaction(data: {
  fingerprintId: string;
  walletAddress: string;
  transactionHash: string;
  hashedFingerprint: string;
  timestamp: string;
}) {
  return authenticatedFetch('/log', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get fingerprint data by hash with authentication
 */
export async function getFingerprintByHash(hash: string) {
  return authenticatedFetch(`/fingerprints/by-fingerprint-hash/${hash}`);
}

/**
 * Get fingerprint data by ID with authentication
 */
export async function getFingerprintById(fingerprintId: string) {
  return authenticatedFetch(`/fingerprints/by-id/${fingerprintId}`);
}

/**
 * Get all fingerprints (public endpoint, but returns more data if authenticated)
 */
export async function getAllFingerprints(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}) {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  const endpoint = `/fingerprints${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return authenticatedFetch(endpoint);
}

export { API_BASE_URL, API_SECRET_KEY };

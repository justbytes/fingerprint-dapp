import CryptoJS from 'crypto-js';

/**
 * Hash a visitor ID using SHA-256
 * @param visitorId - The visitor ID from Fingerprint.com
 * @returns Hashed visitor ID as hex string
 */
export function hashVisitorId(visitorId: string): string {
  return CryptoJS.SHA256(visitorId).toString(CryptoJS.enc.Hex);
}

/**
 * Convert hex hash to bytes32 format for smart contract
 * @param hexHash - Hash in hex format
 * @returns bytes32 formatted hash (0x prefixed)
 */
export function hexToBytes32(hexHash: string): `0x${string}` {
  // Ensure the hash is 64 characters (32 bytes) and add 0x prefix
  const cleanHash = hexHash.replace('0x', '').padStart(64, '0');
  return `0x${cleanHash}`;
}

/**
 * Get fingerprint hash ready for smart contract interaction
 * @param visitorId - The visitor ID from Fingerprint.com
 * @returns bytes32 formatted hash for smart contract
 */
export function getFingerprintHash(visitorId: string): `0x${string}` {
  const hash = hashVisitorId(visitorId);
  return hexToBytes32(hash);
}

/**
 * Validate that a fingerprint hash is properly formatted
 * @param hash - Hash to validate
 * @returns boolean indicating if hash is valid
 */
export function isValidFingerprintHash(hash: string): boolean {
  const hexPattern = /^0x[a-fA-F0-9]{64}$/;
  return hexPattern.test(hash);
}

// server/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Validates params for adding a new tx to the db
 */
export const validateCreateTransaction = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { fingerprintId, walletAddress, transactionHash, hashedFingerprint, timestamp } = req.body;

  // Validate fingerprintId
  if (!fingerprintId || typeof fingerprintId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'fingerprintId is required and must be a string',
    });
    return;
  }
  if (fingerprintId.length < 10 || fingerprintId.length > 100) {
    res.status(400).json({
      success: false,
      error: 'fingerprintId must be between 10 and 100 characters',
    });
    return;
  }

  // Validate wallet address
  if (!walletAddress || typeof walletAddress !== 'string') {
    res.status(400).json({
      success: false,
      error: 'walletAddress is required and must be a string',
    });
    return;
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    res.status(400).json({
      success: false,
      error: 'walletAddress must be a valid Ethereum address',
    });
    return;
  }

  // Validate transaction hash
  if (!transactionHash || typeof transactionHash !== 'string') {
    res.status(400).json({
      success: false,
      error: 'transactionHash is required and must be a string',
    });
    return;
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
    res.status(400).json({
      success: false,
      error: 'transactionHash must be a valid Ethereum transaction hash',
    });
    return;
  }

  // Validate hashed fingerprint
  if (!hashedFingerprint || typeof hashedFingerprint !== 'string') {
    res.status(400).json({
      success: false,
      error: 'hashedFingerprint is required and must be a string',
    });
    return;
  }
  if (!/^[a-fA-F0-9]{64}$/.test(hashedFingerprint)) {
    res.status(400).json({
      success: false,
      error: 'hashedFingerprint must be a valid SHA-256 hash (64 hex characters)',
    });
    return;
  }

  // Validate timestamp
  if (typeof timestamp === 'string') {
    // Check if it's a valid ISO date string
    if (isNaN(Date.parse(timestamp))) {
      res.status(400).json({
        success: false,
        error: 'timestamp must be a valid ISO date string',
      });
      return;
    }
  } else if (typeof timestamp === 'number') {
    // Check if it's a valid Unix timestamp
    if (timestamp < 0 || timestamp > Date.now() + 86400000) {
      // Not more than 24 hours in future
      res.status(400).json({
        success: false,
        error: 'timestamp must be a valid Unix timestamp',
      });
      return;
    }
  } else {
    res.status(400).json({
      success: false,
      error: 'timestamp must be a string (ISO date) or number (Unix timestamp)',
    });
    return;
  }
  next();
};

/**
 * Validate a fingerprint id
 */
export const validateFingerprintId = (req: Request, res: Response, next: NextFunction): void => {
  const { fingerprintId } = req.params;

  if (!fingerprintId || typeof fingerprintId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'fingerprintId is required and must be a string',
    });
    return;
  }
  if (fingerprintId.length < 10 || fingerprintId.length > 100) {
    res.status(400).json({
      success: false,
      error: 'fingerprintId must be between 10 and 100 characters',
    });
    return;
  }

  next();
};

/**
 * Validate a fingerprint hash
 */
export const validateFingerprintHash = (req: Request, res: Response, next: NextFunction): void => {
  const { hash } = req.params;

  if (!hash) {
    res.status(400).json({
      success: false,
      error: 'Fingerprint hash is required',
    });
    return;
  }

  if (!hash.match(/^0x[a-fA-F0-9]{64}$/)) {
    res.status(400).json({
      success: false,
      error: 'Invalid fingerprint hash format',
    });
    return;
  }

  next();
};

// Validate fingerprint query params
export const validateGetFingerprintsQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { page, limit } = req.query;

  // Basic pagination validation
  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    res.status(400).json({
      success: false,
      error: 'page must be a positive number',
    });
    return;
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    res.status(400).json({
      success: false,
      error: 'limit must be between 1 and 100',
    });
    return;
  }

  next();
};

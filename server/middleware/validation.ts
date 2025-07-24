// server/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

export const validateCreateTransaction = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { fingerprintId, walletAddress, transactionHash } = req.body;

  // Check required fields
  if (!fingerprintId || typeof fingerprintId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'fingerprintId is required',
    });
    return;
  }

  if (!walletAddress || typeof walletAddress !== 'string') {
    res.status(400).json({
      success: false,
      error: 'walletAddress is required',
    });
    return;
  }

  if (!transactionHash || typeof transactionHash !== 'string') {
    res.status(400).json({
      success: false,
      error: 'transactionHash is required',
    });
    return;
  }

  next();
};

export const validateFingerprintId = (req: Request, res: Response, next: NextFunction): void => {
  const { fingerprintId } = req.params;

  if (!fingerprintId) {
    res.status(400).json({
      success: false,
      error: 'Fingerprint ID is required',
    });
    return;
  }

  next();
};

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

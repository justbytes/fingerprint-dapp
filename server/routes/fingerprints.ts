// server/routes/fingerprints.ts
import { Router, Response } from 'express';
import { DatabaseService } from '../config/database';
import { validateApiKey, AuthenticatedRequest } from '../middleware/auth';
import {
  validateCreateTransaction,
  validateFingerprintId,
  validateFingerprintHash,
  validateGetFingerprintsQuery,
} from '../middleware/validation';
import {
  transformFingerprintLog,
  createErrorResponse,
  createSuccessResponse,
  calculatePagination,
  sanitizeSortField,
  sanitizeSortOrder,
  formatTimestamp,
} from '../utils/helpers';
import {
  CreateTransactionRequest,
  GetFingerprintsQuery,
  DatabaseError,
  NotFoundError,
  FingerprintLogRow,
} from '../types';

const router = Router();

/**
 * POST /log - Add transaction to fingerprint (PROTECTED ENDPOINT)
 */
router.post(
  '/log',
  validateApiKey,
  validateCreateTransaction,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const requestData = req.body as CreateTransactionRequest;
      const timestamp = requestData.timestamp || formatTimestamp();

      const recordId = await DatabaseService.addTransactionToFingerprint({
        fingerprintId: requestData.fingerprintId,
        walletAddress: requestData.walletAddress,
        transactionHash: requestData.transactionHash,
        fingerprintHash: requestData.hashedFingerprint,
        timestamp,
      });

      const updatedRecord = await DatabaseService.getFingerprintById(requestData.fingerprintId);

      if (!updatedRecord) {
        throw new DatabaseError('Failed to retrieve updated fingerprint record');
      }

      const transformedRecord = transformFingerprintLog(updatedRecord as FingerprintLogRow);

      res
        .status(201)
        .json(
          createSuccessResponse(transformedRecord, 'Transaction added to fingerprint successfully')
        );
    } catch (error) {
      console.error('Error adding transaction:', error);

      if (error instanceof DatabaseError) {
        const statusCode = error.message.includes('already exists') ? 409 : 500;
        res.status(statusCode).json(createErrorResponse(error));
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

/**
 * GET /fingerprints - Get all fingerprints
 */
router.get(
  '/fingerprints',
  validateApiKey,
  validateGetFingerprintsQuery,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const query = req.query as GetFingerprintsQuery;
      const isAuthenticated = req.isAuthenticated || false;

      const page = query.page || 1;
      const limit = query.limit || 50;
      const offset = (page - 1) * limit;

      const validSortFields = ['created_at', 'updated_at', 'fingerprint_id', 'wallet_address'];
      const sortBy = sanitizeSortField(query.sortBy || 'created_at', validSortFields);
      const sortOrder = sanitizeSortOrder(query.sortOrder || 'DESC');

      const { logs, total } = await DatabaseService.getAllFingerprints({
        limit,
        offset,
        sortBy,
        sortOrder,
      });

      const transformedLogs = logs.map((log: FingerprintLogRow) => {
        const transformed = transformFingerprintLog(log);

        // Hide sensitive data for unauthenticated requests
        if (!isAuthenticated) {
          return {
            ...transformed,
            fingerprintId: transformed.fingerprintId.slice(0, 8) + '...',
            walletAddress:
              transformed.fingerprintHash.slice(0, 6) +
              '...' +
              transformed.fingerprintHash.slice(-4),
            transactions: transformed.transactions?.map(tx => ({
              ...tx,
              txHash: tx.txHash ? tx.txHash.slice(0, 10) + '...' + tx.txHash.slice(-8) : null,
              walletAddress: tx.walletAddress
                ? tx.walletAddress.slice(0, 6) + '...' + tx.walletAddress.slice(-4)
                : null,
            })),
          };
        }

        return transformed;
      });

      const pagination = calculatePagination(page, limit, total);

      res.json({
        success: true,
        data: transformedLogs,
        pagination,
        authenticated: isAuthenticated,
      });
    } catch (error) {
      console.error('Error fetching fingerprints:', error);

      if (error instanceof DatabaseError) {
        res.status(500).json(createErrorResponse(error));
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

/**
 * GET /fingerprints/by-fingerprint-hash/:hash - Get fingerprint by hash (PROTECTED)
 */
router.get(
  '/fingerprints/by-fingerprint-hash/:hash',
  validateApiKey,
  validateFingerprintHash,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { hash } = req.params;

      const record = await DatabaseService.getFingerprintByHash(hash);

      if (!record) {
        throw new NotFoundError('No fingerprint found for this hash');
      }

      const transformedRecord = transformFingerprintLog(record as FingerprintLogRow);

      res.json(createSuccessResponse(transformedRecord));
    } catch (error) {
      console.error('Error fetching fingerprint by hash:', error);

      if (error instanceof NotFoundError) {
        res.status(404).json(createErrorResponse(error));
        return;
      }

      if (error instanceof DatabaseError) {
        res.status(500).json(createErrorResponse(error));
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

/**
 * GET /fingerprints/by-id/:fingerprintId - Get fingerprint by ID (PROTECTED)
 */
router.get(
  '/fingerprints/by-id/:fingerprintId',
  validateApiKey,
  validateFingerprintId,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { fingerprintId } = req.params;

      const record = await DatabaseService.getFingerprintById(fingerprintId);

      if (!record) {
        throw new NotFoundError('No fingerprint found with this ID');
      }

      const transformedRecord = transformFingerprintLog(record as FingerprintLogRow);

      res.json(createSuccessResponse(transformedRecord));
    } catch (error) {
      console.error('Error fetching fingerprint by ID:', error);

      if (error instanceof NotFoundError) {
        res.status(404).json(createErrorResponse(error));
        return;
      }

      if (error instanceof DatabaseError) {
        res.status(500).json(createErrorResponse(error));
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

export default router;

// sever/routes/fingerprints.ts
import { Router, Request, Response } from 'express';
import { DatabaseService } from '../config/database';
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
 * POST /log - Add transaction to fingerprint (creates new fingerprint if doesn't exist)
 */
router.post(
  '/log',
  validateCreateTransaction,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const requestData = req.body as CreateTransactionRequest;

      // Use current timestamp if not provided
      const timestamp = requestData.timestamp || formatTimestamp();

      // Add transaction to fingerprint (creates new record if needed)
      const recordId = await DatabaseService.addTransactionToFingerprint({
        fingerprintId: requestData.fingerprintId,
        walletAddress: requestData.walletAddress,
        transactionHash: requestData.transactionHash,
        fingerprintHash: requestData.hashedFingerprint,
        timestamp,
      });

      // Get the updated record
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
 * GET /fingerprints - Get all fingerprints with optional pagination
 */
router.get(
  '/fingerprints',
  validateGetFingerprintsQuery,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query as GetFingerprintsQuery;

      // Set defaults and sanitize
      const page = query.page || 1;
      const limit = Math.min(query.limit || 50, 100); // Cap at 100
      const offset = (page - 1) * limit;

      const validSortFields = ['created_at', 'updated_at', 'fingerprint_id', 'wallet_address'];
      const sortBy = sanitizeSortField(query.sortBy || 'created_at', validSortFields);
      const sortOrder = sanitizeSortOrder(query.sortOrder || 'DESC');

      // Get data from database
      const { logs, total } = await DatabaseService.getAllFingerprints({
        limit,
        offset,
        sortBy,
        sortOrder,
      });

      // Transform data
      const transformedLogs = logs.map((log: FingerprintLogRow) => transformFingerprintLog(log));

      // Calculate pagination
      const pagination = calculatePagination(page, limit, total);

      res.json({
        success: true,
        data: transformedLogs,
        pagination,
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
 * GET /fingerprints/by-fingerprint-hash/:hash - Get fingerprint by fingerprint hash
 */
router.get(
  '/fingerprints/by-fingerprint-hash/:hash',
  validateFingerprintHash, // Use the new validation middleware
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { hash } = req.params; // Get hash from params, not walletAddress

      // Get fingerprint by hash - you'll need to create this method
      const record = await DatabaseService.getFingerprintByHash(hash);

      if (!record) {
        throw new NotFoundError('No fingerprint found for this hash');
      }

      // Transform data
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
 * GET /fingerprints/by-id/:fingerprintId - Get fingerprint by fingerprint ID
 */
router.get(
  '/fingerprints/by-id/:fingerprintId',
  validateFingerprintId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { fingerprintId } = req.params;

      // Get fingerprint by ID
      const record = await DatabaseService.getFingerprintById(fingerprintId);

      if (!record) {
        throw new NotFoundError('No fingerprint found with this ID');
      }

      // Transform data
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

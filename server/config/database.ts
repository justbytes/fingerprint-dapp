// server/config/database.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { DatabaseError } from '../types';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function initializeDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  try {
    // Create database directory if it doesn't exist
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database connection
    db = await open({
      filename: path.join(dbDir, 'fingerprints.db'),
      driver: sqlite3.Database,
    });

    // Enable foreign keys and optimizations
    await db.exec('PRAGMA foreign_keys = ON;');
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA synchronous = NORMAL;');

    // Create tables
    await createTables();

    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw new DatabaseError(
      `Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function createTables(): Promise<void> {
  if (!db) throw new DatabaseError('Database not initialized');

  await db.exec(`
    -- Create fingerprint_logs table
    CREATE TABLE IF NOT EXISTS fingerprint_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fingerprint_id TEXT UNIQUE NOT NULL,
      fingerprint_hash TEXT,
      transactions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_fingerprint_id ON fingerprint_logs(fingerprint_id);
    CREATE INDEX IF NOT EXISTS idx_fingerprint_hash ON fingerprint_logs(fingerprint_hash);
  `);
}

export function getDatabase(): Database<sqlite3.Database, sqlite3.Statement> {
  if (!db) {
    throw new DatabaseError('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('🔒 Database connection closed');
  }
}

// Database utility functions
export class DatabaseService {
  private static get db() {
    return getDatabase();
  }

  static async addTransactionToFingerprint(data: {
    fingerprintId: string;
    walletAddress: string;
    transactionHash: string;
    fingerprintHash: string;
    timestamp: string;
  }) {
    try {
      const { fingerprintId, walletAddress, transactionHash, fingerprintHash, timestamp } = data;

      // First, try to find existing record
      const existingRecord = await this.db.get(
        `
        SELECT id, transactions FROM fingerprint_logs
        WHERE fingerprint_id = ? AND fingerprint_hash = ?
      `,
        [fingerprintId, fingerprintHash]
      );

      const newTransaction = {
        txHash: transactionHash,
        walletAddress: walletAddress,
        timestamp: timestamp,
      };

      if (existingRecord) {
        // Update existing record - add transaction to array
        let transactions = [];
        if (existingRecord.transactions) {
          try {
            transactions = JSON.parse(existingRecord.transactions);
          } catch (e) {
            throw Error('There was an error parsing the existing record');
          }
        }

        // Check if transaction already exists (prevent duplicates)
        const transactionExists = transactions.some((tx: any) => tx.hash === transactionHash);
        if (transactionExists) {
          throw new DatabaseError('Transaction already exists for this fingerprint');
        }

        transactions.push(newTransaction);

        await this.db.run(
          `
          UPDATE fingerprint_logs
          SET transactions = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
          [JSON.stringify(transactions), existingRecord.id]
        );

        return existingRecord.id;
      } else {
        // Create new record
        const result = await this.db.run(
          `
          INSERT INTO fingerprint_logs (fingerprint_id, fingerprint_hash, transactions)
          VALUES (?, ?, ?)
        `,
          [fingerprintId, fingerprintHash, JSON.stringify([newTransaction])]
        );

        return result.lastID;
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to add transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static async getFingerprintByHash(fingerprintHash: string) {
    try {
      return await this.db.get(
        `
        SELECT * FROM fingerprint_logs WHERE fingerprint_hash = ?
      `,
        fingerprintHash
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to get fingerprint by fingerprint hash: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  static async getFingerprintById(fingerprintId: string) {
    try {
      return await this.db.get(
        `
        SELECT * FROM fingerprint_logs WHERE fingerprint_id = ?
      `,
        fingerprintId
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to get fingerprint by ID: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  static async getAllFingerprints(options: {
    limit: number;
    offset: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    try {
      const { limit, offset, sortBy = 'created_at', sortOrder = 'DESC' } = options;

      // Get total count
      const countResult = await this.db.get(`SELECT COUNT(*) as total FROM fingerprint_logs`);
      const total = countResult?.total || 0;

      // Get paginated results
      const validSortFields = ['created_at', 'updated_at', 'fingerprint_id', 'fingerprint_hash'];
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : 'DESC';

      const logs = await this.db.all(
        `
        SELECT * FROM fingerprint_logs
        ORDER BY ${finalSortBy} ${finalSortOrder}
        LIMIT ? OFFSET ?
      `,
        [limit, offset]
      );

      return { logs, total };
    } catch (error) {
      throw new DatabaseError(
        `Failed to get fingerprints: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface DatabaseConfig {
  path: string;
  verbose?: boolean;
}

export class DatabaseService {
  private db: Database.Database;

  constructor(config: DatabaseConfig) {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(config.path, {
      verbose: config.verbose ? console.log : undefined,
    });

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Configure for better performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }

  // Health check method
  healthCheck(): { status: string; connected: boolean } {
    try {
      const result = this.db.prepare('SELECT 1 as test').get();
      return {
        status: 'healthy',
        connected: result ? true : false,
      };
    } catch (error) {
      return {
        status: 'error',
        connected: false,
      };
    }
  }

  // Transaction helper
  transaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  // Database operation methods
  run(sql: string, params?: unknown[]): Database.RunResult {
    const stmt = this.db.prepare(sql);
    return params ? stmt.run(...params) : stmt.run();
  }

  get<T = unknown>(sql: string, params?: unknown[]): T | undefined {
    const stmt = this.db.prepare(sql);
    return params ? (stmt.get(...params) as T) : (stmt.get() as T);
  }

  all<T = unknown>(sql: string, params?: unknown[]): T[] {
    const stmt = this.db.prepare(sql);
    return params ? (stmt.all(...params) as T[]) : (stmt.all() as T[]);
  }
}

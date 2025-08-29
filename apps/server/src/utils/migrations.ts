import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { DatabaseService } from '../services/database.js';

export interface MigrationResult {
  success: boolean;
  migrationsRun: string[];
  errors: string[];
}

export class MigrationRunner {
  private db: DatabaseService;
  private migrationsPath: string;

  constructor(db: DatabaseService) {
    this.db = db;
    this.migrationsPath = join(process.cwd(), 'migrations');
  }

  async runMigrations(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migrationsRun: [],
      errors: [],
    };

    try {
      // Create migrations table if it doesn't exist
      this.createMigrationsTable();

      // Get all migration files
      const migrationFiles = this.getMigrationFiles();

      // Get already run migrations
      const runMigrations = this.getRunMigrations();

      // Run pending migrations
      for (const file of migrationFiles) {
        if (!runMigrations.includes(file)) {
          try {
            console.log(`Running migration: ${file}`);
            this.runMigration(file);
            this.recordMigration(file);
            result.migrationsRun.push(file);
            console.log(`Completed migration: ${file}`);
          } catch (error) {
            const errorMsg = `Failed to run migration ${file}: ${error}`;
            result.errors.push(errorMsg);
            result.success = false;
            console.error(errorMsg);
            break; // Stop on first error
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Migration setup failed: ${error}`);
    }

    return result;
  }

  private createMigrationsTable(): void {
    const createTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.getDatabase().exec(createTable);
  }

  private getMigrationFiles(): string[] {
    try {
      return readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure migrations run in order
    } catch (error) {
      console.warn('No migrations directory found');
      return [];
    }
  }

  private getRunMigrations(): string[] {
    const stmt = this.db
      .getDatabase()
      .prepare('SELECT filename FROM migrations ORDER BY id');
    const results = stmt.all() as { filename: string }[];
    return results.map(row => row.filename);
  }

  private runMigration(filename: string): void {
    const filePath = join(this.migrationsPath, filename);
    const sql = readFileSync(filePath, 'utf8');

    // For complex SQL with triggers, execute the entire file as one statement
    // This avoids issues with semicolon splitting within triggers
    this.db.transaction(() => {
      this.db.getDatabase().exec(sql);
    });
  }

  private recordMigration(filename: string): void {
    const stmt = this.db
      .getDatabase()
      .prepare('INSERT INTO migrations (filename) VALUES (?)');
    stmt.run(filename);
  }
}

// CLI runner for migrations
if (typeof require !== 'undefined' && require.main === module) {
  const dbService = new DatabaseService({
    path: join(process.cwd(), 'data', 'video_automation.db'),
  });

  const runner = new MigrationRunner(dbService);

  runner
    .runMigrations()
    .then(result => {
      if (result.success) {
        console.log('Migrations completed successfully');
        console.log(`Migrations run: ${result.migrationsRun.join(', ')}`);
      } else {
        console.error('Migration failed');
        result.errors.forEach(error => console.error(error));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Migration runner failed:', error);
      process.exit(1);
    })
    .finally(() => {
      dbService.close();
    });
}

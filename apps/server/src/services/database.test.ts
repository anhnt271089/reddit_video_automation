import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './database.js';
import { unlinkSync, existsSync } from 'fs';

describe('DatabaseService', () => {
  let db: DatabaseService;
  const testDbPath = ':memory:'; // Use in-memory database for tests

  beforeEach(() => {
    db = new DatabaseService({
      path: testDbPath,
      verbose: false,
    });
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  describe('initialization', () => {
    it('should create database connection', () => {
      expect(db).toBeDefined();
      expect(db.getDatabase()).toBeDefined();
    });

    it('should enable foreign keys', () => {
      const result = db.getDatabase().prepare('PRAGMA foreign_keys').get() as {
        foreign_keys: number;
      };
      expect(result.foreign_keys).toBe(1);
    });
  });

  describe('health check', () => {
    it('should return healthy status', () => {
      const health = db.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.connected).toBe(true);
    });
  });

  describe('transactions', () => {
    it('should execute transaction successfully', () => {
      // Create a simple test table
      db.getDatabase().exec(
        'CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)'
      );

      const result = db.transaction(() => {
        const insert = db
          .getDatabase()
          .prepare('INSERT INTO test (name) VALUES (?)');
        const insertResult = insert.run('test item');

        const select = db
          .getDatabase()
          .prepare('SELECT * FROM test WHERE id = ?');
        const row = select.get(insertResult.lastInsertRowid);

        return row;
      });

      expect(result).toMatchObject({
        id: 1,
        name: 'test item',
      });
    });
  });
});

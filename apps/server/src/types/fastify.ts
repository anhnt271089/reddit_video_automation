import { DatabaseService } from '../services/database.js';

declare module 'fastify' {
  export interface FastifyInstance {
    db: DatabaseService;
  }
}

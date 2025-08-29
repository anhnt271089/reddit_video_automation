import { DatabaseService } from '../services/database.js';
import { WebSocketService } from '../services/websocket.js';

declare module 'fastify' {
  export interface FastifyInstance {
    db: DatabaseService;
    wsService: WebSocketService;
  }
}

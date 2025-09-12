import { logger } from '../utils/logger.js';

// WebSocket ready states constants
const WEBSOCKET_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

interface WebSocketClient {
  id: string;
  socket: any; // Use any for now to work with Fastify WebSocket
  connectedAt: Date;
}

export class WebSocketService {
  private clients: Map<string, WebSocketClient> = new Map();
  private nextClientId = 1;

  // Add a new client connection
  addClient(socket: any): string {
    const clientId = `client_${this.nextClientId++}`;
    const client: WebSocketClient = {
      id: clientId,
      socket,
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);

    logger.info(`WebSocket client connected: ${clientId}`);
    logger.info(`Total connected clients: ${this.clients.size}`);

    // Setup client event handlers
    socket.on('close', () => {
      this.removeClient(clientId);
    });

    socket.on('error', (error: any) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      this.removeClient(clientId);
    });

    return clientId;
  }

  // Remove a client connection
  removeClient(clientId: string): void {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
      logger.info(`Total connected clients: ${this.clients.size}`);
    }
  }

  // Broadcast message to all connected clients
  broadcast(message: any): void {
    const payload = JSON.stringify({
      type: 'broadcast',
      data: message,
      timestamp: new Date().toISOString(),
    });

    let successCount = 0;
    let errorCount = 0;

    this.clients.forEach((client, clientId) => {
      try {
        if (client.socket.readyState === WEBSOCKET_READY_STATE.OPEN) {
          client.socket.send(payload);
          successCount++;
        } else {
          // Clean up dead connections
          this.removeClient(clientId);
        }
      } catch (error) {
        logger.error(`Failed to send message to client ${clientId}:`, error);
        errorCount++;
        this.removeClient(clientId);
      }
    });

    logger.debug(
      `Broadcast sent to ${successCount} clients, ${errorCount} errors`
    );
  }

  // Send message to specific client
  sendToClient(clientId: string, message: any): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      logger.warn(`Client not found: ${clientId}`);
      return false;
    }

    try {
      if (client.socket.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({
          type: 'direct',
          data: message,
          timestamp: new Date().toISOString(),
        });

        client.socket.send(payload);
        return true;
      } else {
        this.removeClient(clientId);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to send message to client ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  // Get connection status
  getStatus() {
    return {
      totalClients: this.clients.size,
      clients: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        connectedAt: client.connectedAt,
        readyState: client.socket.readyState,
      })),
    };
  }

  // Broadcast specific event types for the video automation pipeline
  broadcastPostStatusUpdate(postId: string, status: string, data?: any): void {
    this.broadcast({
      event: 'post_status_update',
      postId,
      status,
      data,
    });
  }

  broadcastScriptGenerated(scriptId: string, postId: string): void {
    this.broadcast({
      event: 'script_generated',
      scriptId,
      postId,
    });
  }

  broadcastRenderProgress(
    postId: string,
    progress: number,
    status: string
  ): void {
    this.broadcast({
      event: 'render_progress',
      postId,
      progress,
      status,
    });
  }

  broadcastRenderComplete(postId: string, videoId: string): void {
    this.broadcast({
      event: 'render_complete',
      postId,
      videoId,
    });
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

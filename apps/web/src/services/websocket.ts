import type { WebSocketState as WSState, WebSocketMessage } from '../types';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isManualClose = false;

  // Event handlers
  private onStateChange: ((state: WSState) => void) | null = null;
  private onMessage: ((message: WebSocketMessage) => void) | null = null;
  private onReconnectAttempt: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  // Set event handlers
  setStateChangeHandler(handler: (state: WSState) => void) {
    this.onStateChange = handler;
  }

  setMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.onMessage = handler;
  }

  setReconnectAttemptHandler(handler: () => void) {
    this.onReconnectAttempt = handler;
  }

  // Connection management
  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.isManualClose = false;
    this.updateState('connecting');

    try {
      this.socket = new WebSocket(this.url);

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
          this.handleError(new Error('Connection timeout'));
        }
      }, 10000); // 10 second timeout

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleSocketError.bind(this);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    this.clearTimeouts();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.updateState('disconnected');
  }

  send(message: unknown): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  getConnectionState(): WSState {
    if (!this.socket) {
      return 'disconnected';
    }

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'disconnected';
    }
  }

  // Private event handlers
  private handleOpen(): void {
    console.log('WebSocket connected');

    this.clearTimeouts();
    this.reconnectAttempts = 0;
    this.updateState('connected');

    // Start ping/pong to keep connection alive
    this.startPing();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Handle ping/pong messages
      if (message.data?.event === 'ping') {
        this.send({ event: 'pong' });
        return;
      }

      // Emit message to handler
      if (this.onMessage) {
        this.onMessage(message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error, event.data);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);

    this.clearTimeouts();
    this.socket = null;
    this.updateState('disconnected');

    // Attempt reconnection if not manually closed
    if (
      !this.isManualClose &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.scheduleReconnect();
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      this.updateState('error');
    }
  }

  private handleSocketError(event: Event): void {
    console.error('WebSocket error:', event);
    this.handleError(new Error('WebSocket connection error'));
  }

  private handleError(error: Error): void {
    console.error('WebSocket service error:', error);
    this.clearTimeouts();
    this.updateState('error');

    if (
      !this.isManualClose &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    const backoffDelay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      30000
    ); // Exponential backoff, max 30s

    console.log(
      `Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${backoffDelay}ms`
    );

    this.reconnectInterval = setTimeout(() => {
      this.reconnectAttempts++;

      if (this.onReconnectAttempt) {
        this.onReconnectAttempt();
      }

      this.connect();
    }, backoffDelay);
  }

  private startPing(): void {
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ event: 'ping' });
      }
    }, 30000);
  }

  private clearTimeouts(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private updateState(state: WSState): void {
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  // Cleanup method
  destroy(): void {
    this.isManualClose = true;
    this.clearTimeouts();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.onStateChange = null;
    this.onMessage = null;
    this.onReconnectAttempt = null;
  }
}

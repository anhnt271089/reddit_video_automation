import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocketService } from './websocket';

// Mock WebSocket is already set up in test setup

describe('WebSocketService', () => {
  let wsService: WebSocketService;
  let mockStateHandler: ReturnType<typeof vi.fn>;
  let mockMessageHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    wsService = new WebSocketService('ws://localhost:3001/ws');
    mockStateHandler = vi.fn();
    mockMessageHandler = vi.fn();

    wsService.setStateChangeHandler(mockStateHandler);
    wsService.setMessageHandler(mockMessageHandler);
  });

  it('should create service with correct URL', () => {
    expect(wsService).toBeInstanceOf(WebSocketService);
  });

  it('should handle connection state changes', async () => {
    wsService.connect();

    // Wait for mock WebSocket to connect
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(mockStateHandler).toHaveBeenCalledWith('connecting');
    expect(mockStateHandler).toHaveBeenCalledWith('connected');
  });

  it('should return correct connection state', () => {
    expect(wsService.getConnectionState()).toBe('disconnected');
  });

  it('should handle disconnect', () => {
    wsService.connect();
    wsService.disconnect();

    expect(mockStateHandler).toHaveBeenCalledWith('disconnected');
  });

  it('should handle send message when connected', async () => {
    wsService.connect();

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 20));

    const result = wsService.send({ test: 'message' });
    expect(result).toBe(true);
  });

  it('should return false when sending message while disconnected', () => {
    const result = wsService.send({ test: 'message' });
    expect(result).toBe(false);
  });

  it('should cleanup properly on destroy', () => {
    wsService.connect();
    wsService.destroy();

    // Should not throw errors
    expect(() => wsService.send({ test: 'message' })).not.toThrow();
  });
});

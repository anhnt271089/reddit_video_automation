import { useEffect, useRef } from 'react';
import { WebSocketService } from '../services/websocket';
import { useAppStore } from '../stores/useAppStore';

export function useWebSocket(url: string) {
  const wsService = useRef<WebSocketService | null>(null);
  const {
    setConnectionState,
    setLastMessage,
    handleWebSocketMessage,
    incrementReconnectAttempts,
    resetReconnectAttempts,
  } = useAppStore();

  useEffect(() => {
    // Create WebSocket service
    wsService.current = new WebSocketService(url);

    // Set up event handlers
    wsService.current.setStateChangeHandler(state => {
      setConnectionState(state);

      if (state === 'connected') {
        resetReconnectAttempts();
      }
    });

    wsService.current.setMessageHandler(message => {
      setLastMessage(message);
      handleWebSocketMessage(message);
    });

    wsService.current.setReconnectAttemptHandler(() => {
      incrementReconnectAttempts();
    });

    // Connect on mount
    wsService.current.connect();

    // Cleanup on unmount
    return () => {
      if (wsService.current) {
        wsService.current.destroy();
        wsService.current = null;
      }
    };
  }, [
    url,
    setConnectionState,
    setLastMessage,
    handleWebSocketMessage,
    incrementReconnectAttempts,
    resetReconnectAttempts,
  ]);

  // Return service methods for external use
  const send = (message: unknown) => {
    return wsService.current?.send(message) || false;
  };

  const disconnect = () => {
    wsService.current?.disconnect();
  };

  const connect = () => {
    wsService.current?.connect();
  };

  return {
    send,
    disconnect,
    connect,
  };
}

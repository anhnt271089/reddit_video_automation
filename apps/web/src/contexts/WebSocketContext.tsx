import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';

// Types for the WebSocket context
interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

interface WebSocketContextValue {
  isConnected: boolean;
  send: (data: string | object) => boolean;
  disconnect: () => void;
  connect: () => void;
  subscribe: (handler: (message: MessageEvent) => void) => () => void;
  lastMessage: MessageEvent | null;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts: number;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// Provider component props
interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

// Singleton WebSocket Provider that manages a single connection
export function WebSocketProvider({
  children,
  url = 'ws://localhost:3001/ws',
}: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const messageHandlers = useRef<Set<(message: MessageEvent) => void>>(
    new Set()
  );

  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000; // 1 second

  // Subscribe to WebSocket messages
  const subscribe = useCallback((handler: (message: MessageEvent) => void) => {
    messageHandlers.current.add(handler);

    // Return unsubscribe function
    return () => {
      messageHandlers.current.delete(handler);
    };
  }, []);

  // Notify all subscribers of new messages
  const notifyHandlers = useCallback((message: MessageEvent) => {
    setLastMessage(message);
    messageHandlers.current.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('WebSocket message handler error:', error);
      }
    });
  }, []);

  // Connect to WebSocket with circuit breaker pattern
  const connect = useCallback(() => {
    if (
      !isMountedRef.current ||
      ws.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    // Clear any existing connection
    disconnect();

    try {
      setConnectionState('connecting');
      console.log(`[WebSocket] Connecting to ${url}...`);

      ws.current = new WebSocket(url);

      ws.current.onopen = event => {
        if (!isMountedRef.current) {
          return;
        }

        console.log('[WebSocket] Connected successfully');
        setIsConnected(true);
        setConnectionState('connected');
        setReconnectAttempts(0);

        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.current.onmessage = message => {
        if (!isMountedRef.current) {
          return;
        }
        notifyHandlers(message);
      };

      ws.current.onclose = event => {
        if (!isMountedRef.current) {
          return;
        }

        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionState('disconnected');

        // Auto-reconnect with exponential backoff if not a normal closure
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(
            baseReconnectDelay * Math.pow(2, reconnectAttempts),
            30000 // Max 30 seconds
          );

          console.log(
            `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setReconnectAttempts(prev => prev + 1);
              connect();
            }
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached');
          setConnectionState('error');
        }
      };

      ws.current.onerror = error => {
        if (!isMountedRef.current) {
          return;
        }

        console.error('[WebSocket] Connection error:', error);
        setIsConnected(false);
        setConnectionState('error');
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      setConnectionState('error');
      setIsConnected(false);
    }
  }, [url, reconnectAttempts, notifyHandlers]);

  // Disconnect WebSocket with proper cleanup
  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnecting...');

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket connection
    if (ws.current) {
      // Remove event listeners to prevent memory leaks
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;

      // Close if not already closed
      if (ws.current.readyState !== WebSocket.CLOSED) {
        ws.current.close(1000, 'Normal closure');
      }

      ws.current = null;
    }

    setIsConnected(false);
    setConnectionState('disconnected');
    setReconnectAttempts(0);
  }, []);

  // Send message with error handling
  const send = useCallback((data: string | object): boolean => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message: connection not open');
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      ws.current.send(message);
      console.log('[WebSocket] Message sent:', message);
      return true;
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
      return false;
    }
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Provider unmounting, cleaning up...');
      isMountedRef.current = false;
      disconnect();
      messageHandlers.current.clear();
    };
  }, [connect, disconnect]);

  // Context value with all necessary methods and state
  const contextValue: WebSocketContextValue = {
    isConnected,
    send,
    disconnect,
    connect,
    subscribe,
    lastMessage,
    connectionState,
    reconnectAttempts,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook to use the WebSocket context
export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error(
      'useWebSocketContext must be used within a WebSocketProvider'
    );
  }

  return context;
}

// Hook for subscribing to WebSocket messages with cleanup
export function useWebSocketSubscription(
  handler: (message: MessageEvent) => void
) {
  const { subscribe } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe(handler);
    return unsubscribe;
  }, [subscribe, handler]);
}

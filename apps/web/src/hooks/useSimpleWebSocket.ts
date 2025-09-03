import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseWebSocketOptions {
  onMessage?: (message: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: MessageEvent | null;
  send: (data: string | object) => boolean;
  disconnect: () => void;
  connect: () => void;
}

export function useSimpleWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  // Alias for backward compatibility
  return useWebSocket(url, options);
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isMountedRef = useRef(true);
  const maxReconnectAttempts = 5;

  // Stabilize the options object to prevent unnecessary re-renders
  const stableOptions = useMemo(
    () => options,
    [options.onMessage, options.onOpen, options.onClose, options.onError]
  );

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = event => {
        if (!isMountedRef.current) {
          return;
        }
        setIsConnected(true);
        reconnectAttempts.current = 0;
        stableOptions.onOpen?.(event);
      };

      ws.current.onmessage = message => {
        if (!isMountedRef.current) {
          return;
        }
        setLastMessage(message);
        stableOptions.onMessage?.(message);
      };

      ws.current.onclose = event => {
        if (!isMountedRef.current) {
          return;
        }
        setIsConnected(false);
        stableOptions.onClose?.(event);

        // Auto-reconnect logic - only if component is still mounted
        if (
          isMountedRef.current &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const timeout = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              reconnectAttempts.current++;
              connect();
            }
          }, timeout);
        }
      };

      ws.current.onerror = event => {
        if (!isMountedRef.current) {
          return;
        }
        setIsConnected(false);
        stableOptions.onError?.(event);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);
    }
  }, [url, stableOptions]);

  const disconnect = useCallback(() => {
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket connection if it exists
    if (ws.current) {
      // Remove event listeners to prevent memory leaks
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;

      // Close connection if not already closed
      if (ws.current.readyState !== WebSocket.CLOSED) {
        ws.current.close();
      }
      ws.current = null;
    }

    // Reset connection state
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const send = useCallback((data: string | object): boolean => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        ws.current.send(message);
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    send,
    disconnect,
    connect,
  };
}

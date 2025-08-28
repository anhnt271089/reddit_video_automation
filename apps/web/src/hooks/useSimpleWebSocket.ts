import { useState, useEffect, useRef } from 'react';

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
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = event => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        options.onOpen?.(event);
      };

      ws.current.onmessage = message => {
        setLastMessage(message);
        options.onMessage?.(message);
      };

      ws.current.onclose = event => {
        setIsConnected(false);
        options.onClose?.(event);

        // Auto-reconnect logic
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, timeout);
        }
      };

      ws.current.onerror = event => {
        setIsConnected(false);
        options.onError?.(event);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
  };

  const send = (data: string | object): boolean => {
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
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    lastMessage,
    send,
    disconnect,
    connect,
  };
}

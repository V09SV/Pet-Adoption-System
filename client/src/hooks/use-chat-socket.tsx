import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@shared/schema';

export type TypingState = {
  userId: number;
  timestamp: number;
};

type ChatSocketMessageType = 
  | 'connected' 
  | 'new_message' 
  | 'message_read' 
  | 'typing' 
  | 'stop_typing' 
  | 'pong';

interface ChatSocketMessage {
  type: ChatSocketMessageType;
  data: any;
}

interface UseChatSocketOptions {
  userId: number;
  conversationId: number;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (data: { messageIds: number[], userId: number }) => void;
  onTyping?: (userId: number) => void;
  onStopTyping?: (userId: number) => void;
}

export function useChatSocket({
  userId,
  conversationId,
  onNewMessage,
  onMessageRead,
  onTyping,
  onStopTyping
}: UseChatSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, TypingState>>({});
  
  const socket = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const pingInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Create a WebSocket connection
  const connect = useCallback(() => {
    if (!userId || !conversationId) return;
    
    try {
      // Close existing connection if any
      if (socket.current) {
        socket.current.close();
      }
      
      // Clear any existing reconnection timeouts
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      // Determine the WebSocket URL (http -> ws, https -> wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create new WebSocket connection
      const ws = new WebSocket(wsUrl);
      socket.current = ws;
      
      // Handle connection open
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsReconnecting(false);
        
        // Authenticate with the WebSocket server
        ws.send(JSON.stringify({
          type: 'auth',
          data: { userId, conversationId }
        }));
        
        // Setup ping interval to keep connection alive
        pingInterval.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };
      
      // Handle incoming messages
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ChatSocketMessage;
          
          switch (message.type) {
            case 'connected':
              console.log('WebSocket authenticated:', message.data.message);
              break;
              
            case 'new_message':
              if (onNewMessage) {
                onNewMessage(message.data);
              }
              break;
              
            case 'message_read':
              if (onMessageRead) {
                onMessageRead(message.data);
              }
              break;
              
            case 'typing':
              if (message.data.userId !== userId) {
                setTypingUsers(prev => ({
                  ...prev,
                  [message.data.userId]: {
                    userId: message.data.userId,
                    timestamp: Date.now()
                  }
                }));
                
                if (onTyping) {
                  onTyping(message.data.userId);
                }
              }
              break;
              
            case 'stop_typing':
              if (message.data.userId !== userId) {
                setTypingUsers(prev => {
                  const newState = { ...prev };
                  delete newState[message.data.userId];
                  return newState;
                });
                
                if (onStopTyping) {
                  onStopTyping(message.data.userId);
                }
              }
              break;
              
            case 'pong':
              // Keep-alive response received
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      // Handle connection close
      ws.onclose = (event) => {
        console.log(`WebSocket closed with code ${event.code}`);
        setIsConnected(false);
        
        // Clear ping interval
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }
        
        // Attempt to reconnect after a delay
        if (!event.wasClean) {
          setIsReconnecting(true);
          reconnectTimeout.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 5000); // Try to reconnect after 5 seconds
        }
      };
      
      // Handle connection errors
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection issue",
          description: "Having trouble connecting to chat. Will retry automatically.",
          variant: "destructive",
        });
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      toast({
        title: "Connection failed",
        description: "Could not establish a chat connection. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [userId, conversationId, onNewMessage, onMessageRead, onTyping, onStopTyping, toast]);
  
  // Send a typing indicator
  const sendTyping = useCallback(() => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN || !isConnected) {
      console.log('Cannot send typing: Socket not ready or not connected');
      return;
    }
    
    console.log('Sending typing signal');
    socket.current.send(JSON.stringify({
      type: 'typing',
      data: { conversationId, userId }
    }));
  }, [conversationId, userId, isConnected]);
  
  // Send a stop typing indicator
  const sendStopTyping = useCallback(() => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN || !isConnected) {
      console.log('Cannot send stop_typing: Socket not ready or not connected');
      return;
    }
    
    console.log('Sending stop_typing signal');
    socket.current.send(JSON.stringify({
      type: 'stop_typing',
      data: { conversationId, userId }
    }));
  }, [conversationId, userId, isConnected]);
  
  // Connect and clean up on mount/unmount
  useEffect(() => {
    if (userId && conversationId) {
      connect();
    }
    
    // Cleanup function
    return () => {
      if (socket.current) {
        socket.current.close();
        socket.current = null;
      }
      
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
    };
  }, [userId, conversationId, connect]);
  
  // Clean up expired typing indicators
  useEffect(() => {
    const typingTimeout = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;
      
      setTypingUsers(prev => {
        const newState = { ...prev };
        Object.entries(newState).forEach(([id, typingState]) => {
          // Remove typing indicator after 3 seconds of inactivity
          if (now - typingState.timestamp > 3000) {
            delete newState[Number(id)];
            hasChanges = true;
            
            if (onStopTyping) {
              onStopTyping(Number(id));
            }
          }
        });
        return hasChanges ? newState : prev;
      });
    }, 1000); // Check every second
    
    return () => clearInterval(typingTimeout);
  }, [onStopTyping]);
  
  return {
    isConnected,
    isReconnecting,
    typingUsers: Object.keys(typingUsers).map(id => Number(id)),
    connect,
    sendTyping,
    sendStopTyping
  };
}
import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Conversation, Message, User } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, getInitials } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChatSocket } from "@/hooks/use-chat-socket";

interface MessageThreadProps {
  conversation: Conversation;
  currentUserId: number;
}

export function MessageThread({ conversation, currentUserId }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Track users who are currently typing
  const [typingUsers, setTypingUsers] = useState<number[]>([]);

  // Query for messages in this conversation
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${conversation.id}`],
  });

  // Query for users data to get names and avatars
  const { data: users = {} } = useQuery<Record<number, User>>({
    queryKey: ["/api/users/by-id"],
  });

  // Query for pet data
  const { data: pet } = useQuery({
    queryKey: [`/api/pets/${conversation.petId}`],
  });

  // Mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", {
        conversationId: conversation.id,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${conversation.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSending(false);
    },
  });

  // Determine the other user in the conversation
  const otherUserId = currentUserId === conversation.ownerId
    ? conversation.adopterId
    : conversation.ownerId;
  
  const otherUser = users[otherUserId];
  const currentUser = users[currentUserId];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle new message via WebSocket
  const handleNewMessage = useCallback((message: Message) => {
    // Add the new message to the cache
    queryClient.setQueryData([`/api/messages/${conversation.id}`], (oldData: Message[] | undefined) => {
      if (!oldData) return [message];
      // Only add if it doesn't already exist (prevents duplicates)
      if (oldData.some(msg => msg.id === message.id)) return oldData;
      return [...oldData, message];
    });
    
    // Update conversations listing for the new last message
    queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    
    // Mark the message as read if it's from the other user
    if (message.senderId !== currentUserId) {
      apiRequest("PATCH", `/api/messages/${conversation.id}/read`, {
        messageIds: [message.id],
      });
    }
  }, [conversation.id, currentUserId]);
  
  // Handle message read status via WebSocket
  const handleMessageRead = useCallback((data: { messageIds: number[], userId: number }) => {
    // Only update messages from the current user that were read by the other user
    if (data.userId !== currentUserId) {
      queryClient.setQueryData([`/api/messages/${conversation.id}`], (oldData: Message[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(msg => {
          if (data.messageIds.includes(msg.id) && msg.senderId === currentUserId) {
            return { ...msg, isRead: true };
          }
          return msg;
        });
      });
    }
  }, [conversation.id, currentUserId]);
  
  // Handle typing indicators via WebSocket
  const handleTyping = useCallback((userId: number) => {
    if (userId !== currentUserId && !typingUsers.includes(userId)) {
      setTypingUsers(prev => [...prev, userId]);
    }
  }, [currentUserId, typingUsers]);
  
  // Handle stop typing indicators via WebSocket
  const handleStopTyping = useCallback((userId: number) => {
    if (userId !== currentUserId) {
      setTypingUsers(prev => prev.filter(id => id !== userId));
    }
  }, [currentUserId]);
  
  // Initialize WebSocket connection
  const { 
    isConnected, 
    isReconnecting, 
    sendTyping, 
    sendStopTyping 
  } = useChatSocket({
    userId: currentUserId,
    conversationId: conversation.id,
    onNewMessage: handleNewMessage,
    onMessageRead: handleMessageRead,
    onTyping: handleTyping,
    onStopTyping: handleStopTyping
  });
  
  // Mark messages as read when conversation changes or new messages arrive
  useEffect(() => {
    if (conversation && messages.length > 0) {
      // API call to mark messages as read
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.senderId !== currentUserId
      );
      
      if (unreadMessages.length > 0) {
        apiRequest("PATCH", `/api/messages/${conversation.id}/read`, {
          messageIds: unreadMessages.map((msg) => msg.id),
        });
      }
    }
  }, [conversation, messages, currentUserId]);
  
  // Handle typing indicator
  useEffect(() => {
    // Only handle typing indicators when we have a message and are connected
    if (newMessage.trim().length > 0 && !isTyping) {
      console.log('User started typing');
      setIsTyping(true);
      sendTyping();
    } else if (newMessage.trim().length === 0 && isTyping) {
      console.log('Message was cleared, stopping typing');
      setIsTyping(false);
      sendStopTyping();
    }
    
    // Reset typing timer
    if (typingTimer) {
      console.log('Clearing existing typing timer');
      clearTimeout(typingTimer);
      setTypingTimer(null);
    }
    
    // Send stop typing after 3 seconds of inactivity
    if (isTyping) {
      console.log('Setting new typing timer');
      const timer = setTimeout(() => {
        console.log('Typing timeout reached, stopping typing');
        setIsTyping(false);
        sendStopTyping();
      }, 3000);
      setTypingTimer(timer);
    }
    
    return () => {
      if (typingTimer) {
        console.log('Cleanup: Clearing typing timer');
        clearTimeout(typingTimer);
      }
    };
  }, [newMessage, isTyping, sendTyping, sendStopTyping, typingTimer]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/10">
            {otherUser?.avatar && <AvatarImage src={otherUser.avatar} alt={otherUser.name} />}
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{otherUser ? getInitials(otherUser.name) : "??"}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {otherUser?.name || otherUser?.username || "Unknown User"}
              </h3>
              <span className="ml-2 h-2 w-2 rounded-full bg-green-500" title="Online"></span>
            </div>
            <p className="text-sm text-gray-600 flex items-center">
              {pet && typeof pet === 'object' && pet !== null && 'name' in pet ? (
                <>
                  <span className="mr-1">Conversation about</span>
                  <span className="font-medium text-primary">{String(pet.name)}</span>
                  {typeof pet === 'object' && pet !== null && 'mainImage' in pet && typeof pet.mainImage === 'string' && (
                    <img 
                      src={pet.mainImage} 
                      alt={String(pet.name)} 
                      className="w-5 h-5 rounded-full ml-2 object-cover border border-gray-200" 
                    />
                  )}
                </>
              ) : conversation.title}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
            <i className="fas fa-info-circle text-gray-500"></i>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              <div className={`flex max-w-[80%] ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
                {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 mr-2" />}
                <div>
                  <Skeleton className={`h-24 w-64 rounded-lg mb-1 ${i % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"}`} />
                  <Skeleton className="h-3 w-24" />
                </div>
                {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 ml-2" />}
              </div>
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl p-8 shadow-sm">
            <div className="bg-primary/10 p-5 rounded-full mb-4">
              <i className="fas fa-comments text-primary text-3xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Start the conversation</h3>
            <p className="text-gray-600 text-center max-w-md">
              Introduce yourself and ask any questions you may have about {pet && typeof pet === 'object' && pet !== null && 'name' in pet ? String(pet.name) : "the pet"}. 
              The {currentUserId === conversation.ownerId ? "potential adopter" : "owner"} will 
              respond to your inquiry soon.
            </p>
            <Button
              className="mt-6 bg-primary hover:bg-indigo-700"
              onClick={() => setNewMessage(`Hi, I'm interested in talking about ${pet && typeof pet === 'object' && pet !== null && 'name' in pet ? String(pet.name) : "your pet"}!`)}
              variant="default"
            >
              <i className="fas fa-plus-circle mr-2"></i>
              Start with a template
            </Button>
          </div>
        ) : (
          <>
            {/* Date separator */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-3 text-xs text-gray-500 rounded-full">
                  {new Date(messages[0].createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId === currentUserId;
              const sender = users[message.senderId];
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
              const showDateSeparator = prevMessage && 
                new Date(message.createdAt).toLocaleDateString() !== 
                new Date(prevMessage.createdAt).toLocaleDateString();
              
              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="relative py-2 my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-gray-50 px-3 text-xs text-gray-500 rounded-full">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-1`}>
                    <div className={`flex max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                      {showAvatar ? (
                        <Avatar className={`h-8 w-8 flex-shrink-0 ${isCurrentUser ? "ml-2" : "mr-2"}`}>
                          {sender?.avatar && <AvatarImage src={sender.avatar} alt={sender.name} />}
                          <AvatarFallback className={isCurrentUser ? "bg-primary text-white" : "bg-gray-200"}>
                            {sender ? getInitials(sender.name) : "??"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={`w-8 flex-shrink-0 ${isCurrentUser ? "ml-2" : "mr-2"}`}></div>
                      )}
                      <div>
                        <div
                          className={`p-3 rounded-lg ${
                            isCurrentUser
                              ? "bg-primary text-white rounded-tr-none shadow-sm"
                              : "bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100"
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <div className={`flex items-center mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                          <p className="text-xs text-gray-500">{formatDateTime(message.createdAt)}</p>
                          {isCurrentUser && message.isRead && (
                            <span className="ml-1 text-xs text-primary" title="Read">
                              <i className="fas fa-check-double"></i>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start mb-2 mt-2">
            <div className="flex items-center bg-gray-100 py-2 px-4 rounded-full shadow-sm">
              <Avatar className="h-6 w-6 mr-2">
                {otherUser?.avatar && <AvatarImage src={otherUser.avatar} alt={otherUser.name} />}
                <AvatarFallback className="bg-gray-200 text-xs">
                  {otherUser ? getInitials(otherUser.name) : "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Connection status indicators */}
        {!isConnected && !isReconnecting && (
          <div className="flex justify-center mb-2">
            <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs flex items-center">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Disconnected from chat. Refresh the page to reconnect.
            </div>
          </div>
        )}

        {isReconnecting && (
          <div className="flex justify-center mb-2">
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs flex items-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Reconnecting to chat...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white shadow-md">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 text-gray-500">
              <i className="fas fa-paperclip"></i>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 text-gray-500">
              <i className="fas fa-smile"></i>
            </Button>
          </div>
          <div className="flex space-x-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[60px] focus:border-primary resize-none bg-gray-50 border-gray-200"
              disabled={isSending}
            />
            <Button
              className="self-end bg-primary hover:bg-indigo-700 rounded-full h-12 w-12 p-0 shadow-md"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <i className="fas fa-paper-plane text-lg"></i>
              )}
            </Button>
          </div>
          <div className="flex justify-between items-center px-2">
            <p className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</p>
            {newMessage.length > 500 && (
              <p className={`text-xs ${newMessage.length > 1000 ? "text-red-500" : "text-amber-500"}`}>
                {newMessage.length}/1000 characters
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

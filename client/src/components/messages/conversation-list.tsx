import { Conversation, User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading
}: ConversationListProps) {
  const { user: currentUser } = useAuth();
  
  // Query for users data to get names and avatars
  const { data: users = {} } = useQuery<Record<number, User>>({
    queryKey: ["/api/users/by-id"],
    enabled: conversations.length > 0,
  });
  
  // Query for pet data
  const { data: pets = {} } = useQuery<Record<number, { id: number; name: string; mainImage: string }>>({
    queryKey: ["/api/pets/by-id"],
    enabled: conversations.length > 0,
  });
  
  if (isLoading) {
    return (
      <div className="divide-y divide-gray-200">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <i className="fas fa-inbox text-gray-400 text-3xl"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
        <p className="text-gray-600 text-center">Your conversations will appear here</p>
      </div>
    );
  }

  // Sort conversations by last message date (newest first)
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  return (
    <div className="divide-y divide-gray-200 h-full overflow-y-auto">
      {sortedConversations.map((conversation) => {
        // Determine the other user in the conversation
        const otherUserId = currentUser?.id === conversation.ownerId
          ? conversation.adopterId
          : conversation.ownerId;
        
        const otherUser = users[otherUserId];
        const pet = pets[conversation.petId];
        
        return (
          <div
            key={conversation.id}
            className={cn(
              "p-4 hover:bg-gray-50 cursor-pointer",
              activeConversationId === conversation.id && "bg-indigo-50 hover:bg-indigo-50 border-l-4 border-primary"
            )}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                {otherUser?.avatar && <AvatarImage src={otherUser.avatar} alt={otherUser.name} />}
                <AvatarFallback>{otherUser ? getInitials(otherUser.name) : "??"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {otherUser?.name || otherUser?.username || "Unknown User"}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatDate(conversation.lastMessageAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {conversation.title || (pet ? `About ${pet.name}` : "Conversation")}
                </p>
                {/* This would show unread message count - would need to be added to the conversation schema */}
                {/* {conversation.unreadCount > 0 && (
                  <Badge className="mt-1 bg-primary text-white">
                    {conversation.unreadCount} new
                  </Badge>
                )} */}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

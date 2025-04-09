import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { searchPetsSchema, Pet, insertPetSchema, insertMessageSchema, insertConversationSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from 'ws';
import { log } from "./vite";
import adminRouter from "./routes/admin";

// Define message types for WebSocket communication
type WebSocketMessage = {
  type: 'auth' | 'new_message' | 'message_read' | 'typing' | 'stop_typing' | 'ping';
  data: any;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Mount admin routes
  app.use('/api/admin', adminRouter);

  // GET: Get featured pets (a subset of pets for homepage)
  app.get("/api/pets/featured", async (req, res) => {
    try {
      const featuredPets = await storage.getFeaturedPets();
      res.json(featuredPets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching featured pets" });
    }
  });

  // GET: Search pets with filters
  app.get("/api/pets/search", async (req, res) => {
    try {
      const query = req.query;
      const searchParams = {
        query: query.query as string,
        petType: query.petType as string,
        location: query.location as string,
        ageGroup: query.ageGroup as string,
        size: query.size as string,
        gender: query.gender as string,
        page: query.page ? parseInt(query.page as string) : 1,
        limit: query.limit ? parseInt(query.limit as string) : 12,
      };

      // Validate search params
      const validatedParams = searchPetsSchema.parse(searchParams);
      const { pets, totalCount, totalPages } = await storage.searchPets(validatedParams);
      
      res.json({ pets, totalCount, totalPages });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid search parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error searching pets" });
      }
    }
  });

  // GET: Get pet by ID
  app.get("/api/pets/:id", async (req, res) => {
    try {
      const petId = parseInt(req.params.id);
      const pet = await storage.getPet(petId);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      res.json(pet);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pet" });
    }
  });

  // GET: Get similar pets based on a pet ID
  app.get("/api/pets/similar/:id", async (req, res) => {
    try {
      const petId = parseInt(req.params.id);
      const pet = await storage.getPet(petId);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      const similarPets = await storage.getSimilarPets(pet);
      res.json(similarPets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching similar pets" });
    }
  });

  // GET: Get pets by owner (current user)
  app.get("/api/pets/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const userPets = await storage.getPetsByOwner(userId);
      res.json(userPets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user's pets" });
    }
  });

  // GET: Get pet owners lookup
  app.get("/api/users/pet-owners", async (req, res) => {
    try {
      const owners = await storage.getPetOwners();
      res.json(owners);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pet owners" });
    }
  });

  // GET: Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // GET: Get users by ID (batch)
  app.get("/api/users/by-id", async (req, res) => {
    try {
      const users = await storage.getUsersById();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // GET: Get pets by ID (batch)
  app.get("/api/pets/by-id", async (req, res) => {
    try {
      const pets = await storage.getPetsById();
      res.json(pets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pets" });
    }
  });

  // POST: Create a new pet
  app.post("/api/pets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Validate request body
      const petData = insertPetSchema.parse(req.body);
      
      // Create the pet with the current user as owner
      const newPet = await storage.createPet({
        ...petData,
        ownerId: req.user!.id,
      });
      
      res.status(201).json(newPet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid pet data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating pet" });
      }
    }
  });

  // PATCH: Update a pet
  app.patch("/api/pets/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const petId = parseInt(req.params.id);
      const pet = await storage.getPet(petId);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      // Check if user is the owner
      if (pet.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this pet" });
      }
      
      // Validate request body
      const petUpdateData = insertPetSchema.partial().parse(req.body);
      
      // Update the pet
      const updatedPet = await storage.updatePet(petId, petUpdateData);
      res.json(updatedPet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid pet data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating pet" });
      }
    }
  });

  // DELETE: Delete a pet
  app.delete("/api/pets/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const petId = parseInt(req.params.id);
      const pet = await storage.getPet(petId);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      // Check if user is the owner
      if (pet.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this pet" });
      }
      
      // Delete the pet
      await storage.deletePet(petId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting pet" });
    }
  });

  // Conversations endpoints
  // GET: Get user's conversations
  app.get("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching conversations" });
    }
  });

  // GET: Get owner's inquiry summary
  app.get("/api/conversations/owner", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const ownerId = req.user!.id;
      const inquiries = await storage.getOwnerInquiries(ownerId);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching inquiries" });
    }
  });

  // POST: Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const conversationData = insertConversationSchema.parse(req.body);
      
      // Verify the pet exists
      const pet = await storage.getPet(conversationData.petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      // Check if current user is either the adopter or owner
      const currentUserId = req.user!.id;
      if (currentUserId !== conversationData.adopterId && currentUserId !== conversationData.ownerId) {
        return res.status(403).json({ message: "Not authorized to create this conversation" });
      }

      // Check if conversation already exists
      const existingConversation = await storage.getConversationByParticipants(
        conversationData.petId,
        conversationData.adopterId,
        conversationData.ownerId
      );

      if (existingConversation) {
        return res.json(existingConversation);
      }

      // Create new conversation
      const newConversation = await storage.createConversation(conversationData);
      res.status(201).json(newConversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid conversation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating conversation" });
      }
    }
  });

  // Messages endpoints
  // GET: Get messages for a conversation
  app.get("/api/messages/:conversationId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const conversationId = parseInt(req.params.conversationId);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant
      const currentUserId = req.user!.id;
      if (currentUserId !== conversation.adopterId && currentUserId !== conversation.ownerId) {
        return res.status(403).json({ message: "Not authorized to view this conversation" });
      }
      
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  // POST: Create a new message
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const messageData = insertMessageSchema.parse(req.body);
      
      // Verify the conversation exists
      const conversation = await storage.getConversation(messageData.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant
      const currentUserId = req.user!.id;
      if (currentUserId !== conversation.adopterId && currentUserId !== conversation.ownerId) {
        return res.status(403).json({ message: "Not authorized to message in this conversation" });
      }
      
      // Create the message with the current user as sender
      const newMessage = await storage.createMessage({
        ...messageData,
        senderId: currentUserId,
      });
      
      // Update the conversation's last message timestamp
      await storage.updateConversationLastMessageTime(messageData.conversationId);
      
      // Broadcast the new message via WebSocket
      broadcastToConversation(messageData.conversationId, {
        type: 'new_message',
        data: newMessage
      });
      
      res.status(201).json(newMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating message" });
      }
    }
  });

  // PATCH: Mark messages as read
  app.patch("/api/messages/:conversationId/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const conversationId = parseInt(req.params.conversationId);
      const { messageIds } = req.body;
      
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ message: "Invalid message IDs" });
      }
      
      // Verify the conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant
      const currentUserId = req.user!.id;
      if (currentUserId !== conversation.adopterId && currentUserId !== conversation.ownerId) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }
      
      // Mark messages as read
      await storage.markMessagesAsRead(messageIds, currentUserId);
      
      // Broadcast the message read status via WebSocket
      broadcastToConversation(conversationId, {
        type: 'message_read',
        data: {
          messageIds,
          userId: currentUserId
        }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error marking messages as read" });
    }
  });

  // Create HTTP server with proper event listener limiting
  const httpServer = createServer(app);
  
  // Set maximum listeners to avoid memory leak warnings
  // Default is 10, we're setting it higher since we might need more for a complex app
  httpServer.setMaxListeners(20);
  
  // Add proper error handling for the server
  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    console.error('HTTP Server error:', error.message);
    
    // Don't crash on common errors
    if (error.code !== 'EADDRINUSE' && error.code !== 'ENOTSUP') {
      throw error;
    }
  });
  
  // Set up WebSocket server on a distinct path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true 
  });
  
  // Store active connections with user information
  const connections = new Map<WebSocket, {
    userId: number | null;
    conversationId: number | null;
  }>();
  
  // Function to broadcast messages to all users in a conversation
  function broadcastToConversation(
    conversationId: number, 
    message: WebSocketMessage, 
    excludeClient?: WebSocket
  ) {
    log(`Broadcasting to conversation ${conversationId}: ${message.type}`, 'websocket');
    
    connections.forEach((connectionInfo, client) => {
      if (
        client.readyState === WebSocket.OPEN && 
        connectionInfo.conversationId === conversationId &&
        client !== excludeClient
      ) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  // Set up WebSocket server
  wss.on('connection', (ws) => {
    log('WebSocket client connected', 'websocket');
    
    // Initialize client's connection info
    connections.set(ws, {
      userId: null,
      conversationId: null
    });
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Handle auth message to associate the connection with a user
        if (parsedMessage.type === 'auth') {
          const { userId, conversationId } = parsedMessage.data;
          
          // Update the connection's user info
          connections.set(ws, {
            userId: parseInt(userId),
            conversationId: parseInt(conversationId)
          });
          
          log(`WebSocket authenticated: User ${userId} for conversation ${conversationId}`, 'websocket');
        }
        // Handle typing indicator
        else if (parsedMessage.type === 'typing') {
          const { conversationId, userId } = parsedMessage.data;
          log(`Received typing indicator from user ${userId} in conversation ${conversationId}`, 'websocket');
          broadcastToConversation(parseInt(conversationId), {
            type: 'typing',
            data: { userId }
          }, ws); // Exclude the sender
        }
        // Handle stop typing indicator
        else if (parsedMessage.type === 'stop_typing') {
          const { conversationId, userId } = parsedMessage.data;
          log(`Received stop_typing indicator from user ${userId} in conversation ${conversationId}`, 'websocket');
          broadcastToConversation(parseInt(conversationId), {
            type: 'stop_typing',
            data: { userId }
          }, ws); // Exclude the sender
        }
        // Handle ping to keep connection alive
        else if (parsedMessage.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        log(`WebSocket error: ${(error as Error).message}`, 'websocket');
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      connections.delete(ws);
      log('WebSocket client disconnected', 'websocket');
    });
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      data: { message: 'Connected to PawMates Chat Server' }
    }));
  });

  return httpServer;
}

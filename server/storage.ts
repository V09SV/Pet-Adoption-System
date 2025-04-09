import { users, pets, messages, conversations, petTypeEnum, genderEnum, sizeEnum, ageGroupEnum } from "@shared/schema";
import { type User, type Pet, type Message, type Conversation, type InsertUser, type InsertPet, type InsertMessage, type InsertConversation, type SearchPetsParams } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";
import { eq, and, desc, sql, like, or, isNull, asc, ne } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { hashPasswordSync } from "./auth";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersById(): Promise<Record<number, User>>;
  getPetOwners(): Promise<Record<number, User>>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, data: { role: string, isAdmin?: boolean }): Promise<User | undefined>;
  getUsersCount(): Promise<number>;
  getPetsCount(): Promise<number>;
  getConversationsCount(): Promise<number>;
  getMessagesCount(): Promise<number>;

  // Pet operations
  getPet(id: number): Promise<Pet | undefined>;
  getFeaturedPets(): Promise<Pet[]>;
  searchPets(params: SearchPetsParams): Promise<{ pets: Pet[], totalCount: number, totalPages: number }>;
  getPetsByOwner(ownerId: number): Promise<Pet[]>;
  getSimilarPets(pet: Pet): Promise<Pet[]>;
  createPet(pet: InsertPet & { ownerId: number }): Promise<Pet>;
  updatePet(id: number, pet: Partial<InsertPet>): Promise<Pet>;
  deletePet(id: number): Promise<void>;
  getPetsById(): Promise<Record<number, { id: number; name: string; mainImage: string }>>;

  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getUserConversations(userId: number): Promise<Conversation[]>;
  getOwnerInquiries(ownerId: number): Promise<any[]>;
  getConversationByParticipants(petId: number, adopterId: number, ownerId: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationLastMessageTime(id: number): Promise<void>;

  // Message operations
  getConversationMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage & { senderId: number }): Promise<Message>;
  markMessagesAsRead(messageIds: number[], userId: number): Promise<void>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pets: Map<number, Pet>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  sessionStore: session.Store;
  currentUserId: number;
  currentPetId: number;
  currentConversationId: number;
  currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.pets = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.currentUserId = 1;
    this.currentPetId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;

    // Initialize with sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Create sample users
    const user1 = this.createUser({
      username: "johndoe",
      password: hashPasswordSync("password123"),
      email: "john@example.com",
      name: "John Doe",
      location: "New York, NY",
      bio: "Pet lover and owner",
      phone: "555-123-4567",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    });

    const user2 = this.createUser({
      username: "janesmith",
      password: hashPasswordSync("password123"),
      email: "jane@example.com",
      name: "Jane Smith",
      location: "Los Angeles, CA",
      bio: "Looking to adopt a loving pet",
      phone: "555-987-6543",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    });
    
    // Create admin user
    const adminUser = this.createUser({
      username: "admin",
      password: hashPasswordSync("admin123"),
      email: "admin@petadoption.com",
      name: "Admin User",
      location: "San Francisco, CA",
      bio: "System administrator",
      phone: "555-111-0000",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=256&q=80",
      role: "admin",
      isAdmin: true,
    });

    const user3 = this.createUser({
      username: "mikebrown",
      password: hashPasswordSync("password123"),
      email: "mike@example.com",
      name: "Mike Brown",
      location: "Chicago, IL",
      bio: "Animal shelter volunteer",
      phone: "555-456-7890",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    });

    // Create sample pets
    this.createPet({
      name: "Max",
      petType: "dog",
      breed: "Golden Retriever",
      gender: "male",
      age: 2,
      ageGroup: "young",
      size: "large",
      location: "New York, NY",
      description: "Max is a friendly and energetic Golden Retriever who loves to play and go for walks. He's good with children and other pets, making him the perfect addition to an active family. Max is house-trained and knows basic commands.",
      goodWithChildren: true,
      goodWithDogs: true,
      goodWithCats: false,
      mainImage: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
      additionalImages: [
        "https://images.unsplash.com/photo-1568572933382-74d440642117?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
        "https://images.unsplash.com/photo-1545212585-6d95fa9ee8e2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=386&q=80"
      ],
      statusTag: "Friendly",
      ownerId: user1.id
    });

    this.createPet({
      name: "Luna",
      petType: "dog",
      breed: "Siberian Husky",
      gender: "female",
      age: 1,
      ageGroup: "young",
      size: "medium",
      location: "Los Angeles, CA",
      description: "Luna is a beautiful Siberian Husky with striking blue eyes. She's very energetic and loves to run. Luna would be perfect for an active family with a yard where she can play. She's still young and learning commands, but she's very intelligent and eager to please.",
      goodWithChildren: true,
      goodWithDogs: true,
      goodWithCats: false,
      mainImage: "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
      additionalImages: [
        "https://images.unsplash.com/photo-1590419690008-905895e8fe0d?auto=format&fit=crop&w=870&q=80",
        "https://images.unsplash.com/photo-1590419691228-ff9f04cb4ec1?auto=format&fit=crop&w=870&q=80"
      ],
      statusTag: "Energetic",
      ownerId: user2.id
    });

    this.createPet({
      name: "Oliver",
      petType: "cat",
      breed: "Maine Coon",
      gender: "male",
      age: 3,
      ageGroup: "adult",
      size: "medium",
      location: "Chicago, IL",
      description: "Oliver is a gorgeous Maine Coon with a sweet personality. He loves to cuddle and will follow you around the house like a shadow. Oliver gets along well with other cats and is very gentle with children. He's litter-trained and well-behaved indoors.",
      goodWithChildren: true,
      goodWithDogs: false,
      goodWithCats: true,
      mainImage: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
      additionalImages: [
        "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=870&q=80"
      ],
      statusTag: "Calm",
      ownerId: user3.id
    });

    this.createPet({
      name: "Bella",
      petType: "cat",
      breed: "Siamese",
      gender: "female",
      age: 4,
      ageGroup: "adult",
      size: "small",
      location: "Boston, MA",
      description: "Bella is a beautiful Siamese cat with striking blue eyes. She's playful but also enjoys quiet time lounging in sunny spots. Bella is very vocal and will let you know when she wants attention. She's good with older children who understand how to interact with cats respectfully.",
      goodWithChildren: true,
      goodWithDogs: false,
      goodWithCats: true,
      mainImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
      additionalImages: [
        "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=870&q=80",
        "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=870&q=80"
      ],
      statusTag: "Playful",
      ownerId: user1.id
    });

    this.createPet({
      name: "Rocky",
      petType: "dog",
      breed: "Labrador Mix",
      gender: "male",
      age: 5,
      ageGroup: "adult",
      size: "large",
      location: "Portland, OR",
      description: "Rocky is a well-behaved Labrador mix who has completed basic obedience training. He's great with children and other pets, making him an ideal family dog. Rocky enjoys fetch, swimming, and long walks. He's house-trained and has excellent manners indoors and outdoors.",
      goodWithChildren: true,
      goodWithDogs: true,
      goodWithCats: true,
      mainImage: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
      additionalImages: [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=870&q=80"
      ],
      statusTag: "Trained",
      ownerId: user2.id
    });

    this.createPet({
      name: "Charlie",
      petType: "dog",
      breed: "Beagle",
      gender: "male",
      age: 2,
      ageGroup: "young",
      size: "medium",
      location: "Boston, MA",
      description: "Charlie is a friendly and energetic Beagle who loves to play and go for walks. He's good with children and other pets, making him the perfect addition to an active family. Charlie is house-trained and knows basic commands. He was rescued from a shelter and has been with his foster family for three months.",
      goodWithChildren: true,
      goodWithDogs: true,
      goodWithCats: false,
      mainImage: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
      additionalImages: [
        "https://images.unsplash.com/photo-1568572933382-74d440642117?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
        "https://images.unsplash.com/photo-1545212585-6d95fa9ee8e2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=386&q=80",
        "https://images.unsplash.com/photo-1629740067905-bd3c6797e783?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
      ],
      statusTag: "Good with kids",
      ownerId: user3.id
    });

    this.createPet({
      name: "Lucy",
      petType: "cat",
      breed: "Tabby Mix",
      gender: "female",
      age: 1,
      ageGroup: "young",
      size: "small",
      location: "Austin, TX",
      description: "Lucy is a sweet tabby cat who loves attention. She enjoys playing with toys and cuddling on the couch. Lucy is good with gentle children and gets along with other cats. She's litter-trained and would do well in most home environments.",
      goodWithChildren: true,
      goodWithDogs: false,
      goodWithCats: true,
      mainImage: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
      additionalImages: [
        "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=870&q=80"
      ],
      statusTag: "Friendly",
      ownerId: user1.id
    });

    this.createPet({
      name: "Bailey",
      petType: "dog",
      breed: "Poodle",
      gender: "female",
      age: 3,
      ageGroup: "adult",
      size: "medium",
      location: "Denver, CO",
      description: "Bailey is a sophisticated Poodle with a hypoallergenic coat, making her perfect for families with allergies. She's intelligent, easily trainable, and gets along well with children and other dogs. Bailey enjoys daily walks and playtime but is also content to relax at home.",
      goodWithChildren: true,
      goodWithDogs: true,
      goodWithCats: false,
      mainImage: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
      additionalImages: [
        "https://images.unsplash.com/photo-1594149937954-d776ee9ba58a?auto=format&fit=crop&w=870&q=80"
      ],
      statusTag: "Hypoallergenic",
      ownerId: user2.id
    });

    // Create sample conversations
    const conversation1 = this.createConversation({
      petId: 1, // Max
      adopterId: user2.id, // Jane
      ownerId: user1.id, // John
      title: "Inquiry about Max"
    });

    const conversation2 = this.createConversation({
      petId: 3, // Oliver
      adopterId: user1.id, // John
      ownerId: user3.id, // Mike
      title: "Interested in adopting Oliver"
    });

    // Create sample messages
    this.createMessage({
      conversationId: conversation1.id,
      senderId: user2.id,
      content: "Hi, I'm interested in adopting Max. Could you tell me more about his temperament with other dogs?"
    });

    this.createMessage({
      conversationId: conversation1.id,
      senderId: user1.id,
      content: "Hello Jane! Max is very friendly with other dogs. He plays well at the dog park and has lived with another dog before. Would you like to arrange a meeting to see how he interacts with your pets?"
    });

    this.createMessage({
      conversationId: conversation1.id,
      senderId: user2.id,
      content: "That sounds great! I have a Labrador at home and want to make sure they'll get along. When would be a good time to meet?"
    });

    this.createMessage({
      conversationId: conversation2.id,
      senderId: user1.id,
      content: "Hello, I saw Oliver's profile and think he would be a perfect fit for our family. We have a quiet home with lots of sunny spots for napping. Does he require any special care?"
    });

    this.createMessage({
      conversationId: conversation2.id,
      senderId: user3.id,
      content: "Hi John, thanks for your interest in Oliver! He's a very low-maintenance cat who just needs regular brushing for his long coat. He's in perfect health and up-to-date on all vaccinations. Would you like to schedule a visit to meet him?"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async getUsersById(): Promise<Record<number, User>> {
    const usersById: Record<number, User> = {};
    this.users.forEach((user) => {
      usersById[user.id] = user;
    });
    return usersById;
  }

  async getPetOwners(): Promise<Record<number, User>> {
    const petOwnerIds = new Set<number>();
    this.pets.forEach((pet) => {
      petOwnerIds.add(pet.ownerId);
    });

    const owners: Record<number, User> = {};
    petOwnerIds.forEach((ownerId) => {
      const owner = this.users.get(ownerId);
      if (owner) {
        owners[ownerId] = owner;
      }
    });

    return owners;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(id: number, data: { role: string, isAdmin?: boolean }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // Cast to proper type
    const role = data.role as "user" | "owner" | "admin";
    
    const updatedUser = {
      ...user,
      role,
      isAdmin: data.isAdmin !== undefined ? data.isAdmin : (role === "admin")
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersCount(): Promise<number> {
    return this.users.size;
  }

  async getPetsCount(): Promise<number> {
    return this.pets.size;
  }

  async getConversationsCount(): Promise<number> {
    return this.conversations.size;
  }

  async getMessagesCount(): Promise<number> {
    return this.messages.size;
  }

  // Pet operations
  async getPet(id: number): Promise<Pet | undefined> {
    return this.pets.get(id);
  }

  async getFeaturedPets(): Promise<Pet[]> {
    // Return a random subset of pets for featured display
    const allPets = Array.from(this.pets.values());
    // Shuffle the array
    for (let i = allPets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPets[i], allPets[j]] = [allPets[j], allPets[i]];
    }
    // Return up to 8 pets
    return allPets.slice(0, 8);
  }

  async searchPets(params: SearchPetsParams): Promise<{ pets: Pet[], totalCount: number, totalPages: number }> {
    let filteredPets = Array.from(this.pets.values());
    
    // Apply search filters
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredPets = filteredPets.filter(
        (pet) =>
          pet.name.toLowerCase().includes(query) ||
          pet.breed.toLowerCase().includes(query) ||
          pet.location.toLowerCase().includes(query)
      );
    }
    
    if (params.petType) {
      filteredPets = filteredPets.filter(
        (pet) => pet.petType === params.petType
      );
    }
    
    if (params.location) {
      filteredPets = filteredPets.filter(
        (pet) => pet.location.toLowerCase().includes(params.location!.toLowerCase())
      );
    }
    
    if (params.ageGroup) {
      filteredPets = filteredPets.filter(
        (pet) => pet.ageGroup === params.ageGroup
      );
    }
    
    if (params.size) {
      filteredPets = filteredPets.filter(
        (pet) => pet.size === params.size
      );
    }
    
    if (params.gender) {
      filteredPets = filteredPets.filter(
        (pet) => pet.gender === params.gender
      );
    }
    
    // Sort by newest (most recently added)
    filteredPets.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 12;
    const totalCount = filteredPets.length;
    const totalPages = Math.ceil(totalCount / limit);
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPets = filteredPets.slice(startIndex, endIndex);
    
    return {
      pets: paginatedPets,
      totalCount,
      totalPages
    };
  }

  async getPetsByOwner(ownerId: number): Promise<Pet[]> {
    return Array.from(this.pets.values()).filter(
      (pet) => pet.ownerId === ownerId
    );
  }

  async getSimilarPets(pet: Pet): Promise<Pet[]> {
    // Find pets with same type and similar characteristics
    const similarPets = Array.from(this.pets.values()).filter(
      (p) =>
        p.id !== pet.id && // Not the same pet
        p.petType === pet.petType // Same type (dog, cat, etc)
    );
    
    // Shuffle and take up to 4
    for (let i = similarPets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [similarPets[i], similarPets[j]] = [similarPets[j], similarPets[i]];
    }
    
    return similarPets.slice(0, 4);
  }

  async createPet(insertPet: InsertPet & { ownerId: number }): Promise<Pet> {
    const id = this.currentPetId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const pet: Pet = { ...insertPet, id, createdAt, updatedAt };
    this.pets.set(id, pet);
    return pet;
  }

  async updatePet(id: number, updateData: Partial<InsertPet>): Promise<Pet> {
    const pet = this.pets.get(id);
    if (!pet) {
      throw new Error("Pet not found");
    }
    
    const updatedPet = {
      ...pet,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.pets.set(id, updatedPet);
    return updatedPet;
  }

  async deletePet(id: number): Promise<void> {
    this.pets.delete(id);
    
    // Also delete associated conversations
    const conversationsToDelete: number[] = [];
    this.conversations.forEach((conversation) => {
      if (conversation.petId === id) {
        conversationsToDelete.push(conversation.id);
      }
    });
    
    conversationsToDelete.forEach((convId) => {
      this.conversations.delete(convId);
      
      // Delete associated messages
      const messagesToDelete: number[] = [];
      this.messages.forEach((message) => {
        if (message.conversationId === convId) {
          messagesToDelete.push(message.id);
        }
      });
      
      messagesToDelete.forEach((msgId) => {
        this.messages.delete(msgId);
      });
    });
  }

  async getPetsById(): Promise<Record<number, { id: number; name: string; mainImage: string }>> {
    const petsById: Record<number, { id: number; name: string; mainImage: string }> = {};
    this.pets.forEach((pet) => {
      petsById[pet.id] = {
        id: pet.id,
        name: pet.name,
        mainImage: pet.mainImage
      };
    });
    return petsById;
  }

  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getUserConversations(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conversation) =>
        conversation.adopterId === userId || conversation.ownerId === userId
    );
  }

  async getOwnerInquiries(ownerId: number): Promise<any[]> {
    const ownerConversations = Array.from(this.conversations.values()).filter(
      (conversation) => conversation.ownerId === ownerId
    );
    
    const inquiries = await Promise.all(
      ownerConversations.map(async (conversation) => {
        const pet = await this.getPet(conversation.petId);
        const adopter = await this.getUser(conversation.adopterId);
        
        // Get last message
        const conversationMessages = Array.from(this.messages.values())
          .filter((message) => message.conversationId === conversation.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const lastMessage = conversationMessages[0];
        
        // Count unread messages
        const unreadCount = conversationMessages.filter(
          (message) => !message.isRead && message.senderId !== ownerId
        ).length;
        
        return {
          conversationId: conversation.id,
          petId: pet?.id,
          petName: pet?.name || "Unknown Pet",
          adopterName: adopter?.name || adopter?.username || "Unknown User",
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageDate: lastMessage?.createdAt || conversation.lastMessageAt,
          unreadCount
        };
      })
    );
    
    // Sort by most recent message
    inquiries.sort((a, b) => {
      return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
    });
    
    return inquiries;
  }

  async getConversationByParticipants(
    petId: number,
    adopterId: number,
    ownerId: number
  ): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      (conversation) =>
        conversation.petId === petId &&
        conversation.adopterId === adopterId &&
        conversation.ownerId === ownerId
    );
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const lastMessageAt = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      lastMessageAt
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversationLastMessageTime(id: number): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.lastMessageAt = new Date();
      this.conversations.set(id, conversation);
    }
  }

  // Message operations
  async getConversationMessages(conversationId: number): Promise<Message[]> {
    const messages = Array.from(this.messages.values()).filter(
      (message) => message.conversationId === conversationId
    );
    
    // Sort by creation time (oldest first)
    return messages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async createMessage(insertMessage: InsertMessage & { senderId: number }): Promise<Message> {
    const id = this.currentMessageId++;
    const createdAt = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      isRead: false,
      createdAt
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessagesAsRead(messageIds: number[], userId: number): Promise<void> {
    messageIds.forEach((id) => {
      const message = this.messages.get(id);
      if (message && message.senderId !== userId) {
        message.isRead = true;
        this.messages.set(id, message);
      }
    });
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsersById(): Promise<Record<number, User>> {
    const allUsers = await db.select().from(users);
    return Object.fromEntries(allUsers.map(user => [user.id, user]));
  }

  async getPetOwners(): Promise<Record<number, User>> {
    try {
      // First approach - try using the ORM
      const ownerIds = await db.select({ ownerId: pets.ownerId })
        .from(pets)
        .groupBy(pets.ownerId);
      
      const petOwners: Record<number, User> = {};
      
      // Get all unique owners
      for (const { ownerId } of ownerIds) {
        const [owner] = await db.select().from(users).where(eq(users.id, ownerId));
        if (owner) {
          petOwners[ownerId] = owner;
        }
      }
      
      return petOwners;
    } catch (error) {
      console.error("Error in getPetOwners:", error);
      // Fallback to simpler approach if the above fails
      try {
        const allOwners = await db.select()
          .from(users)
          .innerJoin(pets, eq(users.id, pets.ownerId));
        
        const petOwners: Record<number, User> = {};
        for (const item of allOwners) {
          if (!petOwners[item.users.id]) {
            petOwners[item.users.id] = item.users;
          }
        }
        
        return petOwners;
      } catch (innerError) {
        console.error("Error in getPetOwners fallback:", innerError);
        return {}; // Return empty object in case of errors
      }
    }
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.id);
  }

  async updateUserRole(id: number, data: { role: string, isAdmin?: boolean }): Promise<User | undefined> {
    const role = data.role as "user" | "owner" | "admin";
    const isAdmin = data.isAdmin !== undefined ? data.isAdmin : (role === "admin");
    
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          role, 
          isAdmin,
        })
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user role:", error);
      return undefined;
    }
  }

  async getUsersCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    return Number(result.count);
  }

  async getPetsCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pets);
    return Number(result.count);
  }

  async getConversationsCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations);
    return Number(result.count);
  }

  async getMessagesCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages);
    return Number(result.count);
  }

  // Pet operations
  async getPet(id: number): Promise<Pet | undefined> {
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    return pet;
  }

  async getFeaturedPets(): Promise<Pet[]> {
    return db
      .select()
      .from(pets)
      .limit(8)
      .orderBy(sql`RANDOM()`);
  }

  async searchPets(params: SearchPetsParams): Promise<{ pets: Pet[], totalCount: number, totalPages: number }> {
    const limit = params.limit || 12;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (params.query) {
      const searchQuery = `%${params.query}%`;
      conditions.push(
        or(
          like(pets.name, searchQuery),
          like(pets.breed, searchQuery),
          like(pets.description, searchQuery)
        )
      );
    }

    if (params.petType) {
      conditions.push(eq(pets.petType, params.petType as any));
    }

    if (params.location) {
      conditions.push(like(pets.location, `%${params.location}%`));
    }

    if (params.ageGroup) {
      conditions.push(eq(pets.ageGroup, params.ageGroup as any));
    }

    if (params.size) {
      conditions.push(eq(pets.size, params.size as any));
    }

    if (params.gender) {
      conditions.push(eq(pets.gender, params.gender as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pets)
      .where(whereClause);

    // Get pets for current page
    const petsResult = await db
      .select()
      .from(pets)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(pets.createdAt));

    return {
      pets: petsResult,
      totalCount: Number(count),
      totalPages: Math.ceil(Number(count) / limit)
    };
  }

  async getPetsByOwner(ownerId: number): Promise<Pet[]> {
    return db
      .select()
      .from(pets)
      .where(eq(pets.ownerId, ownerId))
      .orderBy(desc(pets.createdAt));
  }

  async getSimilarPets(pet: Pet): Promise<Pet[]> {
    return db
      .select()
      .from(pets)
      .where(
        and(
          eq(pets.petType, pet.petType),
          ne(pets.id, pet.id),
          eq(pets.ageGroup, pet.ageGroup)
        )
      )
      .limit(4)
      .orderBy(sql`RANDOM()`);
  }

  async createPet(insertPet: InsertPet & { ownerId: number }): Promise<Pet> {
    const now = new Date();
    const [pet] = await db
      .insert(pets)
      .values({
        ...insertPet,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return pet;
  }

  async updatePet(id: number, updateData: Partial<InsertPet>): Promise<Pet> {
    const [updatedPet] = await db
      .update(pets)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(pets.id, id))
      .returning();
    return updatedPet;
  }

  async deletePet(id: number): Promise<void> {
    await db.delete(pets).where(eq(pets.id, id));
  }

  async getPetsById(): Promise<Record<number, { id: number; name: string; mainImage: string }>> {
    const allPets = await db
      .select({ id: pets.id, name: pets.name, mainImage: pets.mainImage })
      .from(pets);
    
    return Object.fromEntries(
      allPets.map(pet => [pet.id, pet])
    );
  }

  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async getUserConversations(userId: number): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.adopterId, userId),
          eq(conversations.ownerId, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getOwnerInquiries(ownerId: number): Promise<any[]> {
    const inquiries = await db
      .select({
        conversation: conversations,
        pet: {
          id: pets.id,
          name: pets.name,
          mainImage: pets.mainImage
        },
        adopter: {
          id: users.id,
          name: users.name,
          avatar: users.avatar
        }
      })
      .from(conversations)
      .innerJoin(pets, eq(conversations.petId, pets.id))
      .innerJoin(users, eq(conversations.adopterId, users.id))
      .where(eq(conversations.ownerId, ownerId))
      .orderBy(desc(conversations.lastMessageAt));

    return inquiries;
  }

  async getConversationByParticipants(petId: number, adopterId: number, ownerId: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.petId, petId),
          eq(conversations.adopterId, adopterId),
          eq(conversations.ownerId, ownerId)
        )
      );
    return conversation;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({
        ...insertConversation,
        lastMessageAt: new Date()
      })
      .returning();
    return conversation;
  }

  async updateConversationLastMessageTime(id: number): Promise<void> {
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, id));
  }

  // Message operations
  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage & { senderId: number }): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        isRead: false,
        createdAt: new Date()
      })
      .returning();
    
    // Update conversation last message time
    await this.updateConversationLastMessageTime(insertMessage.conversationId);
    
    return message;
  }

  async markMessagesAsRead(messageIds: number[], userId: number): Promise<void> {
    // Only mark messages as read if they were sent to the current user
    for (const id of messageIds) {
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id));
      
      if (message && message.senderId !== userId) {
        await db
          .update(messages)
          .set({ isRead: true })
          .where(eq(messages.id, id));
      }
    }
  }
}

// Check if running on Replit
const isReplit = !!process.env.REPL_ID;
// Check if DATABASE_URL is set
const isDatabaseConfigured = !!process.env.DATABASE_URL;

// Use in-memory storage for local development if needed
// Use database storage for Replit or when DATABASE_URL is explicitly set
export const storage = (isReplit || isDatabaseConfigured) 
  ? new DatabaseStorage() 
  : new MemStorage();

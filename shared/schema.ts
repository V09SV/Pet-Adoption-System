import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["user", "owner", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  location: text("location"),
  bio: text("bio"),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("user").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  ownedPets: many(pets),
  sentMessages: many(messages),
  ownerConversations: many(conversations, { relationName: "ownerConversations" }),
  adopterConversations: many(conversations, { relationName: "adopterConversations" }),
}));

export const petTypeEnum = pgEnum("pet_type", ["dog", "cat", "bird", "rabbit", "small_animal", "other"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const sizeEnum = pgEnum("size", ["small", "medium", "large", "xlarge"]);
export const ageGroupEnum = pgEnum("age_group", ["baby", "young", "adult", "senior"]);

export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  petType: petTypeEnum("pet_type").notNull(),
  breed: text("breed").notNull(),
  gender: genderEnum("gender").notNull(),
  age: integer("age").notNull(),
  ageGroup: ageGroupEnum("age_group").notNull(),
  size: sizeEnum("size").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  goodWithChildren: boolean("good_with_children").default(false),
  goodWithDogs: boolean("good_with_dogs").default(false),
  goodWithCats: boolean("good_with_cats").default(false),
  mainImage: text("main_image").notNull(),
  additionalImages: text("additional_images").array(),
  statusTag: text("status_tag"),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  adopted: boolean("adopted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const petsRelations = relations(pets, ({ one, many }) => ({
  owner: one(users, { fields: [pets.ownerId], references: [users.id] }),
  conversations: many(conversations),
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  senderId: integer("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }).notNull(),
  adopterId: integer("adopter_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  pet: one(pets, { fields: [conversations.petId], references: [pets.id] }),
  adopter: one(users, { fields: [conversations.adopterId], references: [users.id] }),
  owner: one(users, { fields: [conversations.ownerId], references: [users.id] }),
  messages: many(messages),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  phone: true,
  location: true,
  bio: true,
  avatar: true,
  role: true,
  isAdmin: true,
});

export const insertPetSchema = createInsertSchema(pets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  senderId: true,
  isRead: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  lastMessageAt: true,
});

export const searchPetsSchema = z.object({
  query: z.string().optional(),
  petType: z.string().optional(),
  location: z.string().optional(),
  ageGroup: z.string().optional(),
  size: z.string().optional(),
  gender: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof pets.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type SearchPetsParams = z.infer<typeof searchPetsSchema>;

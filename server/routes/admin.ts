import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth";
import { storage } from "../storage";
import { z } from "zod";
import { insertPetSchema } from "@shared/schema";

const router = Router();

// Get all users
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get user by ID
router.get("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Update user role
router.patch("/users/:id/role", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const schema = z.object({
      role: z.enum(["user", "owner", "admin"]),
      isAdmin: z.boolean().optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const updatedUser = await storage.updateUserRole(id, validatedData);
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

// Get system statistics
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const stats = {
      usersCount: await storage.getUsersCount(),
      petsCount: await storage.getPetsCount(),
      conversationsCount: await storage.getConversationsCount(),
      messagesCount: await storage.getMessagesCount(),
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch system statistics" });
  }
});

// Get all pets for admin management
router.get("/pets", requireAdmin, async (req, res) => {
  try {
    // Use the search functionality with no filters to get all pets
    const result = await storage.searchPets({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortDirection: "desc"
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching pets:", error);
    res.status(500).json({ message: "Failed to fetch pets" });
  }
});

// Update any pet (admin can bypass owner check)
router.patch("/pets/:id", requireAdmin, async (req, res) => {
  try {
    const petId = parseInt(req.params.id);
    const pet = await storage.getPet(petId);
    
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }
    
    // Validate request body
    const petUpdateData = insertPetSchema.partial().parse(req.body);
    
    // Update the pet (admin can update any pet regardless of ownership)
    const updatedPet = await storage.updatePet(petId, petUpdateData);
    
    res.json(updatedPet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid pet data", errors: error.errors });
    } else {
      console.error("Error updating pet:", error);
      res.status(500).json({ message: "Failed to update pet" });
    }
  }
});

// Toggle pet adoption status
router.patch("/pets/:id/toggle-adoption", requireAdmin, async (req, res) => {
  try {
    const petId = parseInt(req.params.id);
    const pet = await storage.getPet(petId);
    
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }
    
    // Toggle the adopted status
    const updatedPet = await storage.updatePet(petId, { 
      adopted: !pet.adopted 
    });
    
    res.json(updatedPet);
  } catch (error) {
    console.error("Error toggling pet adoption status:", error);
    res.status(500).json({ message: "Failed to update pet adoption status" });
  }
});

// Delete any pet (admin can bypass owner check)
router.delete("/pets/:id", requireAdmin, async (req, res) => {
  try {
    const petId = parseInt(req.params.id);
    const pet = await storage.getPet(petId);
    
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }
    
    // Delete the pet (admin can delete any pet regardless of ownership)
    await storage.deletePet(petId);
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting pet:", error);
    res.status(500).json({ message: "Failed to delete pet" });
  }
});

export default router;
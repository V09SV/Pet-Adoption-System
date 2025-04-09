import { db, pool } from "./db";
import { users, pets } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // Clear existing data
    await db.delete(pets);
    await db.delete(users);

    console.log("Creating sample users...");

    // Create sample users
    const [user1] = await db
      .insert(users)
      .values({
        username: "johndoe",
        password: await hashPassword("password123"),
        email: "john@example.com",
        name: "John Doe",
        location: "New York, NY",
        bio: "Pet lover and owner",
        phone: "555-123-4567",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
      })
      .returning();

    const [user2] = await db
      .insert(users)
      .values({
        username: "janesmith",
        password: await hashPassword("password123"),
        email: "jane@example.com",
        name: "Jane Smith",
        location: "Los Angeles, CA",
        bio: "Looking to adopt a loving pet",
        phone: "555-987-6543",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
      })
      .returning();

    const [user3] = await db
      .insert(users)
      .values({
        username: "mikebrown",
        password: await hashPassword("password123"),
        email: "mike@example.com",
        name: "Mike Brown",
        location: "Chicago, IL",
        bio: "Animal shelter volunteer",
        phone: "555-456-7890",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
      })
      .returning();
      
    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        username: "admin",
        password: await hashPassword("admin123"),
        email: "admin@petadoption.com",
        name: "Admin User",
        location: "San Francisco, CA",
        bio: "System administrator",
        phone: "555-111-0000",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=256&q=80",
        role: "admin",
        isAdmin: true,
      })
      .returning();

    console.log("Creating sample pets...");

    // Create sample pets
    await db
      .insert(pets)
      .values({
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

    await db
      .insert(pets)
      .values({
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

    await db
      .insert(pets)
      .values({
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

    await db
      .insert(pets)
      .values({
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

    await db
      .insert(pets)
      .values({
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

    await db
      .insert(pets)
      .values({
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

    await db
      .insert(pets)
      .values({
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

    await db
      .insert(pets)
      .values({
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

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await pool.end();
  }
}

seedDatabase();
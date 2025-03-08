import {
  type User,
  type InsertUser,
  type Ride,
  type InsertRide,
  type RidePassenger,
  type InsertRidePassenger,
  type DriverContact,
  type InsertDriverContact,
  users,
  rides,
  ridePassengers,
  driverContacts,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq } from "drizzle-orm";
import { db, pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByDiscordUsername(discordUsername: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;

  // Driver contact operations
  createDriverContact(contact: InsertDriverContact): Promise<DriverContact>;
  getDriverContact(id: number): Promise<DriverContact | undefined>;
  getActiveDriverContacts(): Promise<DriverContact[]>;

  // Ride operations
  createRide(ride: InsertRide & { creatorId: number }): Promise<Ride>;
  getRide(id: number): Promise<Ride | undefined>;
  getRides(): Promise<Ride[]>;
  updateRide(id: number, ride: Partial<Ride>): Promise<Ride>;
  deleteRide(id: number): Promise<void>;
  getUserJoinedRides(userId: number): Promise<Ride[]>;

  // Ride passenger operations
  addPassenger(passenger: InsertRidePassenger & { userId: number }): Promise<RidePassenger>;
  getPassengers(rideId: number): Promise<RidePassenger[]>;
  updatePassengerSequence(id: number, sequence: number): Promise<RidePassenger>;

  // Vendor operations
  getVendorRides(vendorId: number): Promise<Ride[]>;
  assignVendor(rideId: number, vendorId: number): Promise<Ride>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByDiscordUsername(discordUsername: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordUsername, discordUsername));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    // Only allow updating specific fields for security
    const allowedFields = ['name', 'whatsappNumber', 'malaysianNumber', 'revolutUsername'];
    const updateData: Partial<User> = {};
    
    for (const field of allowedFields) {
      if (field in userData) {
        updateData[field as keyof typeof updateData] = userData[field as keyof typeof userData];
      }
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
      
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }

  async createDriverContact(contact: InsertDriverContact): Promise<DriverContact> {
    const [newContact] = await db.insert(driverContacts).values(contact).returning();
    return newContact;
  }

  async getDriverContact(id: number): Promise<DriverContact | undefined> {
    const [contact] = await db.select().from(driverContacts).where(eq(driverContacts.id, id));
    return contact;
  }

  async getActiveDriverContacts(): Promise<DriverContact[]> {
    return await db
      .select()
      .from(driverContacts)
      .where(eq(driverContacts.isActive, true));
  }

  async createRide(ride: InsertRide & { creatorId: number }): Promise<Ride> {
    // Validate dropoff locations
    if (!ride.dropoffLocations || ride.dropoffLocations.length === 0) {
      throw new Error("At least one dropoff location is required");
    }

    // Calculate additional stops based on dropoff locations
    const additionalStops = Math.max(0, ride.dropoffLocations.length - 1);

    // Set default cost
    const cost = 80;

    const [newRide] = await db
      .insert(rides)
      .values({
        ...ride,
        currentPassengers: ride.dropoffLocations[0].passengerCount, // Set initial passengers from first location
        status: "open",
        vendorId: null,
        additionalStops,
        cost,
      } as any)
      .returning();

    // Add creator as first passenger
    await this.addPassenger({
      rideId: newRide.id,
      userId: ride.creatorId,
      dropoffLocation: ride.dropoffLocations[0].location,
      passengerCount: ride.dropoffLocations[0].passengerCount,
    });

    return newRide;
  }

  async getRide(id: number): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id));
    
    if (!ride) return undefined;
    
    // Get creator details
    const creator = await this.getUser(ride.creatorId);
    return {
      ...ride,
      creatorName: creator ? creator.name || creator.discordUsername : "Unknown"
    };
  }

  async getRides(): Promise<Ride[]> {
    const allRides = await db.select().from(rides);
    
    // Fetch creator details for each ride
    const ridesWithCreatorInfo = await Promise.all(
      allRides.map(async (ride) => {
        const creator = await this.getUser(ride.creatorId);
        return {
          ...ride,
          creatorName: creator ? creator.name || creator.discordUsername : "Unknown",
        };
      })
    );
    
    return ridesWithCreatorInfo;
  }

  async updateRide(id: number, ride: Partial<Ride>): Promise<Ride> {
    const [updatedRide] = await db
      .update(rides)
      .set(ride)
      .where(eq(rides.id, id))
      .returning();
    if (!updatedRide) throw new Error("Ride not found");
    return updatedRide;
  }
  
  async deleteRide(id: number): Promise<void> {
    // First delete passengers
    await db
      .delete(ridePassengers)
      .where(eq(ridePassengers.rideId, id));
    
    // Then delete the ride
    const result = await db
      .delete(rides)
      .where(eq(rides.id, id))
      .returning();
    
    if (result.length === 0) throw new Error("Ride not found");
  }

  async addPassenger(
    passenger: InsertRidePassenger & { userId: number }
  ): Promise<RidePassenger> {
    // Validate that dropoff location exists
    if (!passenger.dropoffLocation) {
      throw new Error("Dropoff location is required");
    }

    const [newPassenger] = await db
      .insert(ridePassengers)
      .values({ ...passenger, dropoffSequence: null })
      .returning();

    const ride = await this.getRide(passenger.rideId);
    if (ride) {
      await this.updateRide(ride.id, {
        currentPassengers: ride.currentPassengers + passenger.passengerCount,
      });
    }

    return newPassenger;
  }

  async getPassengers(rideId: number): Promise<RidePassenger[]> {
    return await db
      .select()
      .from(ridePassengers)
      .where(eq(ridePassengers.rideId, rideId));
  }

  async updatePassengerSequence(
    id: number,
    sequence: number
  ): Promise<RidePassenger> {
    const [passenger] = await db
      .update(ridePassengers)
      .set({ dropoffSequence: sequence })
      .where(eq(ridePassengers.id, id))
      .returning();
    if (!passenger) throw new Error("Passenger not found");
    return passenger;
  }

  async getVendorRides(vendorId: number): Promise<Ride[]> {
    const vendorRides = await db.select().from(rides).where(eq(rides.vendorId, vendorId));
    
    // Fetch creator details for each ride
    const ridesWithCreatorInfo = await Promise.all(
      vendorRides.map(async (ride) => {
        const creator = await this.getUser(ride.creatorId);
        return {
          ...ride,
          creatorName: creator ? creator.name || creator.discordUsername : "Unknown",
        };
      })
    );
    
    return ridesWithCreatorInfo;
  }

  async getUserJoinedRides(userId: number): Promise<Ride[]> {
    // Get all rides where the user is a passenger (but not the creator)
    const passengers = await db
      .select()
      .from(ridePassengers)
      .where(eq(ridePassengers.userId, userId));
    
    // Extract ride IDs from passenger records
    const rideIds = passengers.map(p => p.rideId);
    
    if (rideIds.length === 0) {
      return [];
    }
    
    // Get all rides with those IDs
    const joinedRides = await db
      .select()
      .from(rides)
      .where(
        // Using a more complex filter since we don't have a direct "in" operator
        rideIds.map(id => eq(rides.id, id)).reduce((acc, condition) => {
          if (!acc) return condition;
          return { type: 'or', left: acc, right: condition } as any;
        }, null as any)
      );
    
    // Filter out rides created by the user and add creator info
    const filteredRides = joinedRides.filter(ride => ride.creatorId !== userId);
    
    // Fetch creator details for each ride
    const ridesWithCreatorInfo = await Promise.all(
      filteredRides.map(async (ride) => {
        const creator = await this.getUser(ride.creatorId);
        return {
          ...ride,
          creatorName: creator ? creator.name || creator.discordUsername : "Unknown",
        };
      })
    );
    
    return ridesWithCreatorInfo;
  }

  async assignVendor(rideId: number, vendorId: number): Promise<Ride> {
    const [ride] = await db
      .update(rides)
      .set({ vendorId, status: "assigned" })
      .where(eq(rides.id, rideId))
      .returning();
    if (!ride) throw new Error("Ride not found");
    return ride;
  }
}

export const storage = new DatabaseStorage();
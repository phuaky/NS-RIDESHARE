import {
  type User,
  type InsertUser,
  type Ride,
  type InsertRide,
  type RidePassenger,
  type InsertRidePassenger,
  users,
  rides,
  ridePassengers,
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

  // Ride operations
  createRide(ride: InsertRide & { creatorId: number }): Promise<Ride>;
  getRide(id: number): Promise<Ride | undefined>;
  getRides(): Promise<Ride[]>;
  updateRide(id: number, ride: Partial<Ride>): Promise<Ride>;

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

  async createRide(ride: InsertRide & { creatorId: number }): Promise<Ride> {
    const [newRide] = await db
      .insert(rides)
      .values({
        ...ride,
        currentPassengers: 0,
        status: "open",
        vendorId: null,
      } as any) 
      .returning();
    return newRide;
  }

  async getRide(id: number): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id));
    return ride;
  }

  async getRides(): Promise<Ride[]> {
    return await db.select().from(rides);
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

  async addPassenger(
    passenger: InsertRidePassenger & { userId: number }
  ): Promise<RidePassenger> {
    const [newPassenger] = await db
      .insert(ridePassengers)
      .values({ ...passenger, dropoffSequence: null })
      .returning();

    const ride = await this.getRide(passenger.rideId);
    if (ride) {
      await this.updateRide(ride.id, {
        currentPassengers: ride.currentPassengers + (passenger.passengerCount || 1),
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
    return await db.select().from(rides).where(eq(rides.vendorId, vendorId));
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
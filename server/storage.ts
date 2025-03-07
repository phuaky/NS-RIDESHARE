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

  // Driver contact operations
  createDriverContact(contact: InsertDriverContact): Promise<DriverContact>;
  getDriverContact(id: number): Promise<DriverContact | undefined>;
  getActiveDriverContacts(): Promise<DriverContact[]>;

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
    // Calculate additional stops based on dropoff locations
    const additionalStops = Math.max(0, (ride.dropoffLocations?.length || 0) - 1);

    const [newRide] = await db
      .insert(rides)
      .values({
        ...ride,
        currentPassengers: 1, // Count creator as first passenger
        status: "open",
        vendorId: null,
        additionalStops,
      } as any)
      .returning();

    // Automatically add creator as first passenger
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
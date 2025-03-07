import {
  type User,
  type InsertUser,
  type Ride,
  type InsertRide,
  type RidePassenger,
  type InsertRidePassenger,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rides: Map<number, Ride>;
  private ridePassengers: Map<number, RidePassenger>;
  private currentUserId: number;
  private currentRideId: number;
  private currentPassengerId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.rides = new Map();
    this.ridePassengers = new Map();
    this.currentUserId = 1;
    this.currentRideId = 1;
    this.currentPassengerId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      ...insertUser,
      whatsappNumber: insertUser.whatsappNumber ?? null,
      malaysianNumber: insertUser.malaysianNumber ?? null,
      revolutUsername: insertUser.revolutUsername ?? null,
      companyName: insertUser.companyName ?? null,
      driverDetails: insertUser.driverDetails ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async createRide(ride: InsertRide & { creatorId: number }): Promise<Ride> {
    const id = this.currentRideId++;
    const newRide: Ride = {
      ...ride,
      id,
      currentPassengers: 0,
      status: "open",
      vendorId: null,
    };
    this.rides.set(id, newRide);
    return newRide;
  }

  async getRide(id: number): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async getRides(): Promise<Ride[]> {
    return Array.from(this.rides.values());
  }

  async updateRide(id: number, ride: Partial<Ride>): Promise<Ride> {
    const existingRide = await this.getRide(id);
    if (!existingRide) throw new Error("Ride not found");

    const updatedRide = { ...existingRide, ...ride };
    this.rides.set(id, updatedRide);
    return updatedRide;
  }

  async addPassenger(
    passenger: InsertRidePassenger & { userId: number },
  ): Promise<RidePassenger> {
    const id = this.currentPassengerId++;
    const newPassenger: RidePassenger = { ...passenger, id, dropoffSequence: null };
    this.ridePassengers.set(id, newPassenger);

    const ride = await this.getRide(passenger.rideId);
    if (ride) {
      await this.updateRide(ride.id, {
        currentPassengers: ride.currentPassengers + 1,
      });
    }

    return newPassenger;
  }

  async getPassengers(rideId: number): Promise<RidePassenger[]> {
    return Array.from(this.ridePassengers.values()).filter(
      (p) => p.rideId === rideId,
    );
  }

  async updatePassengerSequence(
    id: number,
    sequence: number,
  ): Promise<RidePassenger> {
    const passenger = this.ridePassengers.get(id);
    if (!passenger) throw new Error("Passenger not found");

    const updatedPassenger = { ...passenger, dropoffSequence: sequence };
    this.ridePassengers.set(id, updatedPassenger);
    return updatedPassenger;
  }

  async getVendorRides(vendorId: number): Promise<Ride[]> {
    return Array.from(this.rides.values()).filter(
      (ride) => ride.vendorId === vendorId,
    );
  }

  async assignVendor(rideId: number, vendorId: number): Promise<Ride> {
    const ride = await this.getRide(rideId);
    if (!ride) throw new Error("Ride not found");

    const updatedRide = {
      ...ride,
      vendorId,
      status: "assigned" as const,
    };
    this.rides.set(rideId, updatedRide);
    return updatedRide;
  }
}

export const storage = new MemStorage();
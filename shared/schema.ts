import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  discordUsername: text("discord_username").notNull(),
  whatsappNumber: text("whatsapp_number"),
  malaysianNumber: text("malaysian_number"),
  revolutUsername: text("revolut_username"),
  isVendor: boolean("is_vendor").notNull().default(false),
  companyName: text("company_name"),
  driverDetails: json("driver_details").$type<{
    name: string;
    contact: string;
    carNumber: string;
  }>(),
});

export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull(),
  direction: text("direction").notNull(), // SG->FC or FC->SG
  date: timestamp("date").notNull(),
  maxPassengers: integer("max_passengers").notNull(),
  currentPassengers: integer("current_passengers").notNull().default(0),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocations: json("dropoff_locations").$type<string[]>().notNull(),
  status: text("status").notNull().default("open"), // open, assigned, completed
  vendorId: integer("vendor_id"),
  cost: integer("cost").notNull(),
  additionalStops: integer("additional_stops").notNull().default(0),
});

export const ridePassengers = pgTable("ride_passengers", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").notNull(),
  userId: integer("user_id").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  dropoffSequence: integer("dropoff_sequence"),
  passengerCount: integer("passenger_count").notNull().default(1),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    fullName: true,
    discordUsername: true,
    whatsappNumber: true,
    malaysianNumber: true,
    revolutUsername: true,
    isVendor: true,
    companyName: true,
    driverDetails: true,
  })
  .extend({
    password: z.string().min(8),
    whatsappNumber: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
    malaysianNumber: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
  });

export const insertRideSchema = createInsertSchema(rides).pick({
  direction: true,
  date: true,
  maxPassengers: true,
  pickupLocation: true,
  dropoffLocations: true,
  cost: true,
  additionalStops: true,
});

export const insertRidePassengerSchema = createInsertSchema(ridePassengers)
  .pick({
    rideId: true,
    dropoffLocation: true,
  })
  .extend({
    passengerCount: z.number().min(1).max(4),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRide = z.infer<typeof insertRideSchema>;
export type InsertRidePassenger = z.infer<typeof insertRidePassengerSchema>;
export type User = typeof users.$inferSelect;
export type Ride = typeof rides.$inferSelect;
export type RidePassenger = typeof ridePassengers.$inferSelect;
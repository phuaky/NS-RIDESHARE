import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordUsername: text("discord_username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
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

export const driverContacts = pgTable("driver_contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  malaysianNumber: text("malaysian_number"),
  vehicleType: text("vehicle_type").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
});

export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull(),
  direction: text("direction").notNull(), // SG->FC or FC->SG
  date: timestamp("date").notNull(),
  maxPassengers: integer("max_passengers").notNull(),
  currentPassengers: integer("current_passengers").notNull().default(0),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocations: json("dropoff_locations").$type<{
    location: string;
    passengerCount: number;
  }[]>().notNull(),
  status: text("status").notNull().default("open"), // open, assigned, completed
  vendorId: integer("vendor_id"),
  driverContactId: integer("driver_contact_id"),
  cost: integer("cost").notNull().default(80),
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
    discordUsername: true,
    password: true,
    name: true,
    whatsappNumber: true,
    malaysianNumber: true,
    revolutUsername: true,
    isVendor: true,
    companyName: true,
    driverDetails: true,
  })
  .extend({
    password: z.string().min(8),
    name: z.string().optional(),
    whatsappNumber: z.string()
      .nullable()
      .optional()
      .transform(val => {
        if (!val || val === "") return null;
        return val;
      }),
    malaysianNumber: z.string()
      .nullable()
      .optional()
      .transform(val => {
        if (!val || val === "") return null;
        return val;
      }),
    revolutUsername: z.string()
      .nullable()
      .optional()
      .transform(val => {
        if (!val || val === "") return null;
        return val;
      }),
  });

export const insertDriverContactSchema = createInsertSchema(driverContacts)
  .pick({
    name: true,
    whatsappNumber: true,
    malaysianNumber: true,
    vehicleType: true,
    notes: true,
    isActive: true,
  });

export const insertRideSchema = createInsertSchema(rides)
  .pick({
    direction: true,
    date: true,
    maxPassengers: true,
    pickupLocation: true,
    dropoffLocations: true,
    driverContactId: true,
  })
  .extend({
    organizerPassengerCount: z.number().min(1).max(4),
    dropoffLocations: z.array(
      z.object({
        location: z.string(),
        passengerCount: z.number().min(1).max(4)
      })
    ),
    driverContactId: z.number().optional(),
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
export type InsertDriverContact = z.infer<typeof insertDriverContactSchema>;
export type InsertRide = z.infer<typeof insertRideSchema>;
export type InsertRidePassenger = z.infer<typeof insertRidePassengerSchema>;
export type User = typeof users.$inferSelect;
export type DriverContact = typeof driverContacts.$inferSelect;
export type Ride = typeof rides.$inferSelect;
export type RidePassenger = typeof ridePassengers.$inferSelect;
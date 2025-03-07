import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertRideSchema, insertRidePassengerSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Ride management routes
  app.post("/api/rides", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const rideData = insertRideSchema.parse(req.body);
      const ride = await storage.createRide({
        ...rideData,
        creatorId: req.user.id,
      });
      res.status(201).json(ride);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/rides", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const rides = await storage.getRides();
    res.json(rides);
  });

  app.get("/api/rides/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const ride = await storage.getRide(parseInt(req.params.id));
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json(ride);
  });

  // Ride passenger management
  app.post("/api/rides/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const passengerData = insertRidePassengerSchema.parse({
        ...req.body,
        rideId: parseInt(req.params.id),
      });
      
      const ride = await storage.getRide(passengerData.rideId);
      if (!ride) return res.status(404).json({ error: "Ride not found" });
      if (ride.currentPassengers >= ride.maxPassengers) {
        return res.status(400).json({ error: "Ride is full" });
      }

      const passenger = await storage.addPassenger({
        ...passengerData,
        userId: req.user.id,
      });
      res.status(201).json(passenger);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/rides/:id/passengers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const passengers = await storage.getPassengers(parseInt(req.params.id));
    res.json(passengers);
  });

  // Vendor routes
  app.post("/api/rides/:id/assign", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isVendor) {
      return res.sendStatus(401);
    }

    try {
      const rideId = parseInt(req.params.id);
      const ride = await storage.assignVendor(rideId, req.user.id);
      res.json(ride);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/vendor/rides", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isVendor) {
      return res.sendStatus(401);
    }

    const rides = await storage.getVendorRides(req.user.id);
    res.json(rides);
  });

  const httpServer = createServer(app);
  return httpServer;
}

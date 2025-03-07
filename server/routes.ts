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
      // Parse the incoming data
      const requestData = req.body;
      
      // Convert the ISO string date to a proper Date object
      if (requestData.date && typeof requestData.date === 'string') {
        requestData.date = new Date(requestData.date);
      }
      
      // Now validate with zod
      const rideData = insertRideSchema.parse(requestData);
      
      const ride = await storage.createRide({
        ...rideData,
        creatorId: req.user.id,
      });
      res.status(201).json(ride);
    } catch (error) {
      console.error("Ride creation error:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/rides", async (req, res) => {
    // Allow everyone to view rides, regardless of authentication
    const rides = await storage.getRides();
    res.json(rides);
  });

  app.get("/api/rides/:id", async (req, res) => {
    // Allow everyone to view a specific ride, regardless of authentication
    const rideId = parseInt(req.params.id);
    console.log(`Fetching ride with ID: ${rideId}`);
    
    // Check if rideId is NaN
    if (isNaN(rideId)) {
      console.log(`Invalid ride ID: ${req.params.id}`);
      return res.status(400).json({ error: "Invalid ride ID" });
    }
    
    try {
      const ride = await storage.getRide(rideId);
      if (!ride) {
        console.log(`Ride with ID ${rideId} not found in database`);
        return res.status(404).json({ error: "Ride not found" });
      }
      
      console.log(`Successfully retrieved ride with ID ${rideId}:`, ride);
      res.json(ride);
    } catch (error) {
      console.error(`Error fetching ride with ID ${rideId}:`, error);
      res.status(500).json({ error: "Server error fetching ride" });
    }
  });
  
  // Edit a ride (can only be done by the creator)
  app.patch("/api/rides/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const rideId = parseInt(req.params.id);
      const ride = await storage.getRide(rideId);
      
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }
      
      // Check if user is the creator
      if (req.user.id !== ride.creatorId) {
        return res.status(403).json({ error: "Not authorized to edit this ride" });
      }
      
      // Only allow editing certain fields
      const allowedUpdates = [
        'date', 
        'maxPassengers', 
        'pickupLocation', 
        'dropoffLocations',
        'cost',
        'additionalStops'
      ];
      
      const updates: Partial<typeof ride> = {};
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          // @ts-ignore
          updates[key] = req.body[key];
        }
      }
      
      // Handle date conversion if provided as string
      if (updates.date && typeof updates.date === 'string') {
        updates.date = new Date(updates.date);
      }
      
      // Don't allow increasing maxPassengers to less than current
      if (updates.maxPassengers !== undefined && 
          updates.maxPassengers < ride.currentPassengers) {
        return res.status(400).json({ 
          error: "Cannot decrease max passengers below current passengers count" 
        });
      }
      
      const updatedRide = await storage.updateRide(rideId, updates);
      res.json(updatedRide);
    } catch (error) {
      console.error("Ride update error:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Ride passenger management
  app.post("/api/rides/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const rideId = parseInt(req.params.id);

    // Check if rideId is NaN
    if (isNaN(rideId)) {
      console.log(`Invalid ride ID for join request: ${req.params.id}`);
      return res.status(400).json({ error: "Invalid ride ID" });
    }

    try {
      const passengerData = insertRidePassengerSchema.parse({
        ...req.body,
        rideId: rideId,
      });

      const ride = await storage.getRide(passengerData.rideId);
      if (!ride) return res.status(404).json({ error: "Ride not found" });

      // Get current total passenger count
      const passengers = await storage.getPassengers(rideId);
      const currentTotalPassengers = passengers.reduce((sum, p) => sum + (p.passengerCount || 1), 0);

      // Check if adding new passengers would exceed the limit
      if (currentTotalPassengers + (passengerData.passengerCount || 1) > ride.maxPassengers) {
        return res.status(400).json({ error: "Not enough spots available" });
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
    // Allow everyone to view passengers, regardless of authentication
    const rideId = parseInt(req.params.id);
    
    // Check if rideId is NaN
    if (isNaN(rideId)) {
      console.log(`Invalid ride ID for passengers request: ${req.params.id}`);
      return res.status(400).json({ error: "Invalid ride ID" });
    }
    
    try {
      const passengers = await storage.getPassengers(rideId);
      
      // If user is not authenticated, don't include sensitive user data
      if (!req.isAuthenticated()) {
        // Return only minimal passenger info for privacy
        const safePassengers = passengers.map(p => ({
          id: p.id,
          rideId: p.rideId,
          dropoffLocation: p.dropoffLocation,
          dropoffSequence: p.dropoffSequence,
        }));
        return res.json(safePassengers);
      }
      
      // For authenticated users, include full user details with each passenger
      const passengersWithUserDetails = await Promise.all(
        passengers.map(async (passenger) => {
          const user = await storage.getUser(passenger.userId);
          return {
            ...passenger,
            user: user ? {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              discordUsername: user.discordUsername,
              whatsappNumber: user.whatsappNumber,
              malaysianNumber: user.malaysianNumber,
              revolutUsername: user.revolutUsername,
            } : undefined,
          };
        })
      );
      
      res.json(passengersWithUserDetails);
    } catch (error) {
      console.error(`Error fetching passengers for ride ${rideId}:`, error);
      res.status(500).json({ error: "Server error fetching passengers" });
    }
  });
  
  // Update passenger sequence endpoint
  app.patch("/api/rides/:id/passengers/:passengerId/sequence", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const rideId = parseInt(req.params.id);
    const passengerId = parseInt(req.params.passengerId);
    const { sequence } = req.body;
    
    // Verify ride exists and user is creator
    const ride = await storage.getRide(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.creatorId !== req.user.id) return res.status(403).json({ error: "Not authorized" });
    
    // Only allow sequence updates for FC->SG rides
    if (ride.direction !== "FC->SG") {
      return res.status(400).json({ error: "Sequence can only be set for FC->SG rides" });
    }
    
    try {
      const passenger = await storage.updatePassengerSequence(passengerId, sequence);
      res.json(passenger);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });
  
  // Lock all passenger sequences
  app.post("/api/rides/:id/lockSequence", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const rideId = parseInt(req.params.id);
    
    // Verify ride exists and user is creator
    const ride = await storage.getRide(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.creatorId !== req.user.id) return res.status(403).json({ error: "Not authorized" });
    
    // Only allow sequence locking for FC->SG rides
    if (ride.direction !== "FC->SG") {
      return res.status(400).json({ error: "Sequence can only be locked for FC->SG rides" });
    }
    
    try {
      // Get all passengers
      const passengers = await storage.getPassengers(rideId);
      
      // Update any passengers without a sequence
      for (let i = 0; i < passengers.length; i++) {
        const passenger = passengers[i];
        if (passenger.dropoffSequence === null) {
          await storage.updatePassengerSequence(passenger.id, i + 1);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
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
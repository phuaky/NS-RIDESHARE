import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertRideSchema, insertRidePassengerSchema, insertDriverContactSchema, type User } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Driver contact routes
  app.get("/api/driver-contacts", async (req, res) => {
    const contacts = await storage.getActiveDriverContacts();
    res.json(contacts);
  });

  app.post("/api/driver-contacts", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isVendor) {
      return res.sendStatus(401);
    }

    try {
      const contactData = insertDriverContactSchema.parse(req.body);
      const contact = await storage.createDriverContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Driver contact creation error:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  });

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

      // Validate dropoffLocations format
      if (!Array.isArray(requestData.dropoffLocations)) {
        return res.status(400).json({ error: "dropoffLocations must be an array" });
      }

      // Ensure each dropoff location has the correct format
      requestData.dropoffLocations = requestData.dropoffLocations.map((loc: any) => ({
        location: typeof loc === 'string' ? loc : loc.location,
        passengerCount: typeof loc === 'string' ? 1 : (loc.passengerCount || 1)
      }));

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

  app.get("/api/stats", async (req, res) => {
    const rides = await storage.getRides();
    const users = await storage.getAllUsers();
    res.json({
      totalRides: rides.length,
      totalUsers: users.length,
      sgToFcRides: rides.filter(r => r.direction === "SG->FC").length,
      fcToSgRides: rides.filter(r => r.direction === "FC->SG").length
    });
  });

app.get("/api/rides", async (req, res) => {
    const rides = await storage.getRides();
    res.json(rides);
  });
  
  app.get("/api/rides/user/joined", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const joinedRides = await storage.getUserJoinedRides(req.user.id);
      res.json(joinedRides);
    } catch (error) {
      console.error("Error fetching user joined rides:", error);
      res.status(500).json({ error: "Server error fetching joined rides" });
    }
  });

  app.get("/api/rides/:id", async (req, res) => {
    const rideId = parseInt(req.params.id);
    console.log(`Fetching ride with ID: ${rideId}`);

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

      // Get detailed creator information
      const creator = await storage.getUser(ride.creatorId);
      
      // Add creator details to the ride object
      const rideWithCreator = {
        ...ride,
        creator: creator ? {
          id: creator.id,
          name: creator.name,
          discordUsername: creator.discordUsername,
          whatsappNumber: creator.whatsappNumber,
          malaysianNumber: creator.malaysianNumber,
          revolutUsername: creator.revolutUsername
        } : undefined
      };

      console.log(`Successfully retrieved ride with ID ${rideId}`);
      res.json(rideWithCreator);
    } catch (error) {
      console.error(`Error fetching ride with ID ${rideId}:`, error);
      res.status(500).json({ error: "Server error fetching ride" });
    }
  });

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
  
  app.delete("/api/rides/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const rideId = parseInt(req.params.id);
      const ride = await storage.getRide(rideId);

      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }

      // Check if user is the creator
      if (req.user.id !== ride.creatorId) {
        return res.status(403).json({ error: "Not authorized to delete this ride" });
      }
      
      // Get the passengers for this ride
      const passengers = await storage.getPassengers(rideId);
      
      // Check if anyone besides the creator has joined
      const nonCreatorPassengers = passengers.filter(p => p.userId !== req.user.id);
      if (nonCreatorPassengers.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete ride with other passengers. Ask them to leave first." 
        });
      }

      // Delete the ride
      await storage.deleteRide(rideId);
      res.json({ success: true, message: "Ride deleted successfully" });
    } catch (error) {
      console.error("Ride deletion error:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  });

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
    const rideId = parseInt(req.params.id);

    if (isNaN(rideId)) {
      console.log(`Invalid ride ID for passengers request: ${req.params.id}`);
      return res.status(400).json({ error: "Invalid ride ID" });
    }

    try {
      const passengers = await storage.getPassengers(rideId);

      if (!req.isAuthenticated()) {
        const safePassengers = passengers.map(p => ({
          id: p.id,
          rideId: p.rideId,
          dropoffLocation: p.dropoffLocation,
          dropoffSequence: p.dropoffSequence,
        }));
        return res.json(safePassengers);
      }

      const passengersWithUserDetails = await Promise.all(
        passengers.map(async (passenger) => {
          const user = await storage.getUser(passenger.userId);
          return {
            ...passenger,
            user: user ? {
              id: user.id,
              discordUsername: user.discordUsername,
              name: user.name, // Assuming 'name' is correct field, adjust if needed
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

  app.patch("/api/rides/:id/passengers/:passengerId/sequence", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const rideId = parseInt(req.params.id);
    const passengerId = parseInt(req.params.passengerId);
    const { sequence } = req.body;

    const ride = await storage.getRide(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.creatorId !== req.user.id) return res.status(403).json({ error: "Not authorized" });

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
  
  app.patch("/api/rides/:id/passengers/:passengerId/count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const rideId = parseInt(req.params.id);
    const passengerId = parseInt(req.params.passengerId);
    const { passengerCount } = req.body;
    
    if (!passengerCount || passengerCount < 1) {
      return res.status(400).json({ error: "Invalid passenger count" });
    }

    try {
      // Get the passenger record to check if the user is authorized
      const passenger = await storage.getPassenger(passengerId);
      
      if (!passenger) {
        return res.status(404).json({ error: "Passenger not found" });
      }
      
      if (passenger.rideId !== rideId) {
        return res.status(400).json({ error: "Passenger does not belong to this ride" });
      }
      
      // Check if the user is the ride creator or the passenger themself
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }
      
      // Only allow the creator or the passenger to edit passenger count
      if (ride.creatorId !== req.user.id && passenger.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to edit this passenger" });
      }
      
      console.log("Passenger edit authorized. User:", req.user.id, "Passenger:", passenger.userId, "Creator:", ride.creatorId);
      
      // Check if the ride has capacity
      const currentCount = passenger.passengerCount;
      const diff = passengerCount - currentCount;
      
      if (diff > 0 && ride.currentPassengers + diff > ride.maxPassengers) {
        return res.status(400).json({
          error: `Cannot add ${diff} more passengers. Ride only has ${ride.maxPassengers - ride.currentPassengers} spaces left.`
        });
      }
      
      // Update passenger count
      const updatedPassenger = await storage.updatePassengerCount(passengerId, passengerCount);
      res.json(updatedPassenger);
    } catch (error) {
      console.error("Error updating passenger count:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/rides/:id/lockSequence", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const rideId = parseInt(req.params.id);

    const ride = await storage.getRide(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.creatorId !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    if (ride.direction !== "FC->SG") {
      return res.status(400).json({ error: "Sequence can only be locked for FC->SG rides" });
    }

    try {
      const passengers = await storage.getPassengers(rideId);

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

  // New route to remove a passenger (can be used by both the passenger to leave or by the ride organizer)
  app.delete("/api/rides/:rideId/passengers/:passengerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const passengerId = parseInt(req.params.passengerId);
    const rideId = parseInt(req.params.rideId);
    
    if (isNaN(passengerId) || isNaN(rideId)) {
      return res.status(400).json({ error: "Invalid passenger or ride ID" });
    }
    
    try {
      // Get the passenger record first to check authorization
      const passenger = await storage.getPassenger(passengerId);
      if (!passenger) {
        return res.status(404).json({ error: "Passenger not found" });
      }
      
      // Get the ride to check if the current user is the organizer
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }
      
      // Authorization check: only the ride creator or the passenger themselves can remove a passenger
      if (ride.creatorId !== req.user.id && passenger.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Remove the passenger
      await storage.removePassenger(passengerId);
      
      res.status(200).json({ message: "Passenger removed successfully" });
    } catch (error) {
      console.error("Error removing passenger:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // User profile update endpoint
  app.patch("/api/users/:id", async (req, res) => {
    console.log(`Profile update request for user ID: ${req.params.id}`);
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated for profile update");
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const userId = parseInt(req.params.id);
    console.log(`Authenticated user ID: ${req.user.id}, requested user ID: ${userId}`);
    
    // User can only update their own profile
    if (req.user.id !== userId) {
      console.log("User attempted to update someone else's profile");
      return res.status(403).json({ error: "You can only update your own profile" });
    }
    
    try {
      console.log("Profile update request body:", req.body);
      
      // Fields that are allowed to be updated
      const allowedFields = ['name', 'whatsappNumber', 'malaysianNumber', 'revolutUsername'];
      const updates: Partial<User> = {};
      
      // Filter the request body to only include allowed fields
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field as keyof typeof updates] = req.body[field];
        }
      }
      
      console.log("Filtered updates to apply:", updates);
      
      const updatedUser = await storage.updateUser(userId, updates);
      console.log("User updated successfully:", updatedUser.id);
      
      // Return the updated user without sensitive information
      const safeUser = {
        id: updatedUser.id,
        discordUsername: updatedUser.discordUsername,
        name: updatedUser.name,
        whatsappNumber: updatedUser.whatsappNumber,
        malaysianNumber: updatedUser.malaysianNumber,
        revolutUsername: updatedUser.revolutUsername,
        isVendor: updatedUser.isVendor,
      };
      
      console.log("Sending updated user data");
      res.json(safeUser);
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      res.status(400).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Import storage to check the database
  const { storage } = await import('./storage');
  
  try {
    // Only perform database checks in development environment
    if (process.env.NODE_ENV !== 'production') {
      const allRides = await storage.getRides();
      console.log("Available rides in database:", JSON.stringify(allRides, null, 2));
      
      // If there are no rides, create a sample ride for testing
      if (allRides.length === 0) {
        console.log("No rides found in database. Creating a sample ride for testing...");
        const sampleRide = await storage.createRide({
          creatorId: 1, // Assuming user ID 1 exists
          direction: "SG->FC",
          date: new Date(Date.now() + 86400000), // Tomorrow
          maxPassengers: 4,
          pickupLocation: "Jurong East MRT",
          dropoffLocations: ["Forest City Mall"],
          cost: 80,
          additionalStops: 0
        });
        console.log("Created sample ride:", JSON.stringify(sampleRide, null, 2));
      }
    } else {
      log("Starting server in production mode");
    }
  } catch (error) {
    console.error("Error initializing application:", error instanceof Error ? error.message : String(error));
    // In production, continue despite database check errors
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log the error in a structured way
    console.error(`Error [${status}]: ${message}`, err.stack || '');
    
    // Send response to client
    res.status(status).json({ message });
    
    // Don't throw the error in production as it can crash the server
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { insertUserSchema, User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev_secret_key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'discordUsername',
        passwordField: 'password'
      },
      async (discordUsername, password, done) => {
        try {
          const user = await storage.getUserByDiscordUsername(discordUsername);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration request body:", req.body);

      // Remove empty strings for optional fields
      const sanitizedData = {
        ...req.body,
        whatsappNumber: req.body.whatsappNumber || null,
        malaysianNumber: req.body.malaysianNumber || null,
        revolutUsername: req.body.revolutUsername || null,
      };

      console.log("Sanitized data:", sanitizedData);

      const userData = insertUserSchema.parse(sanitizedData);
      console.log("Parsed user data:", userData);

      const existingUser = await storage.getUserByDiscordUsername(userData.discordUsername);
      if (existingUser) {
        return res.status(400).json({ error: "Discord username already exists" });
      }

      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration validation error:", error);
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Return user info without sensitive data
    const safeUser = {
      id: req.user.id,
      discordUsername: req.user.discordUsername,
      name: req.user.name,
      whatsappNumber: req.user.whatsappNumber,
      malaysianNumber: req.user.malaysianNumber,
      revolutUsername: req.user.revolutUsername,
      isVendor: req.user.isVendor,
      companyName: req.user.companyName,
      driverDetails: req.user.driverDetails,
    };
    
    res.json(safeUser);
  });
  
  // In-memory storage for reset tokens (in production, this would be in the database)
  const passwordResetTokens = new Map();
  
  // Generate a secure random token for password reset
  function generateResetToken() {
    return randomBytes(32).toString('hex');
  }
  
  // Route to request a password reset
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { discordUsername } = req.body;
      
      if (!discordUsername) {
        return res.status(400).json({ error: "Discord username is required" });
      }
      
      // Find the user
      const user = await storage.getUserByDiscordUsername(discordUsername);
      if (!user) {
        // For security reasons, don't reveal if user exists or not
        return res.status(200).json({ 
          message: "If an account with that Discord username exists, a password reset has been initiated." 
        });
      }

      // Generate a secure reset token with 1-hour expiry
      const resetToken = generateResetToken();
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1); // Token valid for 1 hour
      
      // Store the token (in memory for now, in production this would be in the database)
      passwordResetTokens.set(resetToken, {
        userId: user.id,
        discordUsername: user.discordUsername,
        expiry
      });
      
      console.log(`Password reset token generated for user ${discordUsername}: ${resetToken}`);
      
      return res.status(200).json({ 
        message: "Password reset initiated. Use the token below to reset your password.",
        resetToken
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });
  
  // Route to complete the password reset using a token
  app.post("/api/complete-password-reset", async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;
      
      if (!resetToken || !newPassword) {
        return res.status(400).json({ error: "Reset token and new password are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long" });
      }
      
      // Verify the token
      const tokenData = passwordResetTokens.get(resetToken);
      
      if (!tokenData) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      // Check if token is expired
      if (new Date() > tokenData.expiry) {
        // Clean up expired token
        passwordResetTokens.delete(resetToken);
        return res.status(400).json({ error: "Reset token has expired" });
      }
      
      // Update the password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(tokenData.userId, hashedPassword);
      
      // Clean up used token
      passwordResetTokens.delete(resetToken);
      
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset completion error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Route to reset password (requires authentication)
  app.post("/api/reset-password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "You must be logged in to reset your password" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Both current and new passwords are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long" });
      }
      
      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Update the password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Admin route to help reset a user's password
  app.post("/api/admin/reset-user-password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Check if the user is the admin (user with ID 1 and username "phuaky")
      if (req.user.id !== 1 || req.user.discordUsername !== "phuaky") {
        return res.status(403).json({ error: "Forbidden: Only admin (phuaky) can reset passwords" });
      }
      
      const { discordUsername, newPassword } = req.body;
      
      if (!discordUsername || !newPassword) {
        return res.status(400).json({ error: "Both Discord username and new password are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long" });
      }
      
      // Find the user
      const user = await storage.getUserByDiscordUsername(discordUsername);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update the password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.status(200).json({ message: "User password updated successfully" });
    } catch (error) {
      console.error("Admin password reset error:", error);
      res.status(500).json({ error: "Failed to reset user password" });
    }
  });
}
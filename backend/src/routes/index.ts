import { Express } from "express";
import authRoutes from "./auth.routes";
import vaultRoutes from "./vault.routes";
import userRoutes from "./user.routes";

export const registerRoutes = (app: Express): void => {
  app.use("/api/auth", authRoutes);
  app.use("/api/vault", vaultRoutes);
  app.use("/api/user", userRoutes);
};
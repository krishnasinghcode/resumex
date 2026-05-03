import { Express } from 'express';
import authRoutes     from './auth.routes';
import vaultRoutes    from './vault.routes';
import userRoutes     from './user.routes';
import referenceRoutes from './reference.routes';
import companyRoutes  from './company.routes';
import refidRoutes    from './refid.routes';
import extensionRoutes from './extension.routes';


export const registerRoutes = (app: Express): void => {
  app.use('/api/auth',      authRoutes);
  app.use('/api/vault',     vaultRoutes);
  app.use('/api/user',      userRoutes);
  app.use('/api/reference', referenceRoutes);
  app.use('/api/company',   companyRoutes);
  app.use('/api/refid',     refidRoutes);
  app.use('/api/extension', extensionRoutes);
};

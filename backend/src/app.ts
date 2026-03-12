import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { configurePassport } from './config/passport';
import { registerRoutes } from './routes';
import { globalErrorHandler } from './middleware/error.middleware';
import { sendSuccess } from './utils/response';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body + cookie parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

// ─── Simple request logger (dev only) ────────────────────────────────────────
if (env.isDev) {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });
}

// ─── Swagger UI (dev only) ────────────────────────────────────────────────────
// Visit: http://localhost:5000/api/docs
// Helmet's CSP blocks Swagger's inline scripts — disable it for this path only
if (env.isDev) {
  app.use(
    '/api/docs',
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'ResumeX API Docs',
      swaggerOptions: {
        persistAuthorization: true,    // keeps token filled in after page refresh
        displayRequestDuration: true,  // shows ms taken per request
        filter: true,                  // search bar to filter endpoints
        tryItOutEnabled: true,         // "Try it out" open by default
        defaultModelsExpandDepth: -1,  // hides the Schemas section at the bottom
      },
    })
  );

  // Raw JSON spec — paste this URL into Postman "Import → URL" to auto-generate collection
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// ─── Passport ─────────────────────────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
registerRoutes(app);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  sendSuccess(res, 'ResumeX API is running 🚀', {
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(globalErrorHandler);

export default app;

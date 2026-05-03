import { Router } from 'express';
import * as ExtensionController from '../controllers/extension.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Get fields needed for form auto-fill
router.post('/match-fields', ExtensionController.matchFields);

// Get minimal data snapshot for auto-fill (respects privacy)
router.get('/autofill-data', ExtensionController.getAutofillData);

export default router;
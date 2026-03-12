// src/routes/reference.routes.ts
import { Router, Request, Response } from 'express';
import { ReferenceData } from '../models/ReferenceData';

const router = Router();

// GET /api/reference?type=skill
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ success: false, message: 'type is required' });
    }

    const items = await ReferenceData
      .find({ type, isActive: true })
      .sort({ usageCount: -1, label: 1 })
      .select('value label meta');

    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import * as ExtensionService from '../services/extension.service';

// ─── POST /api/extension/match-fields ────────────────────────────────────────
// Receives form fields, returns matched vault data with confidence scores

export const matchFields = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fields } = req.body;

  if (!Array.isArray(fields) || fields.length === 0) {
    sendError(res, 'Fields array is required', 400);
    return;
  }

  const matches = await ExtensionService.matchFormFields(req.user!.userId, fields);
  sendSuccess(res, 'Fields matched', matches);
};

// ─── GET /api/extension/autofill-data ────────────────────────────────────────
// Returns flattened vault data for auto-fill (excludes private entries)

export const getAutofillData = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await ExtensionService.getAutofillData(req.user!.userId);
  sendSuccess(res, 'Autofill data retrieved', data);
};
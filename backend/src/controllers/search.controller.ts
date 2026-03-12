import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { searchVault } from '../services/search.service';

// ─── GET /api/vault/search?q=react ───────────────────────────────────────────

export const search = async (req: AuthRequest, res: Response): Promise<void> => {
  const query = (req.query.q as string).trim();
  const includePrivate = req.query.includePrivate !== 'false'; // default true

  const hits = await searchVault(req.user!.userId, query, includePrivate);

  sendSuccess(res, `Found ${hits.length} result(s) for "${query}"`, {
    query,
    count: hits.length,
    results: hits,
  });
};

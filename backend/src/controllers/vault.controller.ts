import { Response } from 'express';
import { AuthRequest, SectionKey, SINGLETON_SECTIONS } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import * as VaultService from '../services/vault.service';

// ─── GET /api/vault/meta ─────────────────────────────────────────────────────

export const getVaultMeta = async (req: AuthRequest, res: Response): Promise<void> => {
  const meta = await VaultService.getVaultMeta(req.user!.userId);
  sendSuccess(res, 'Vault meta retrieved', meta);
};

// ─── GET /api/vault/section/:sectionKey ──────────────────────────────────────

export const getSection = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sectionKey } = req.params as { sectionKey: SectionKey };
  const section = await VaultService.getSection(req.user!.userId, sectionKey);
  sendSuccess(res, `Section "${sectionKey}" retrieved`, section);
};

// ─── POST /api/vault/section/:sectionKey/entry ───────────────────────────────

export const addOrSetEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sectionKey } = req.params as { sectionKey: SectionKey };

  const section = SINGLETON_SECTIONS.includes(sectionKey)
    ? await VaultService.upsertSingleton(req.user!.userId, sectionKey, req.body)
    : await VaultService.addEntry(req.user!.userId, sectionKey, req.body);

  sendSuccess(res, 'Entry saved', section, 201);
};

// ─── PATCH /api/vault/section/:sectionKey/entry/:entryId ─────────────────────

export const updateEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sectionKey, entryId } = req.params as { sectionKey: SectionKey; entryId: string };

  const updates = { ...req.body };
  delete updates._id;       // Never allow overwriting the entry ID
  delete updates.isPrivate; // Privacy has its own dedicated endpoint

  if (Object.keys(updates).length === 0) {
    sendError(res, 'No update fields provided', 400);
    return;
  }

  const section = await VaultService.updateEntry(
    req.user!.userId, sectionKey, entryId, updates
  );

  sendSuccess(res, 'Entry updated', section);
};

// ─── DELETE /api/vault/section/:sectionKey/entry/:entryId ────────────────────

export const deleteEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sectionKey, entryId } = req.params as { sectionKey: SectionKey; entryId: string };

  if (SINGLETON_SECTIONS.includes(sectionKey)) {
    sendError(res, 'Singleton sections cannot have entries deleted. Use POST to overwrite.', 400);
    return;
  }

  const section = await VaultService.deleteEntry(req.user!.userId, sectionKey, entryId);
  sendSuccess(res, 'Entry deleted', section);
};

// ─── PATCH /api/vault/section/:sectionKey/privacy ────────────────────────────

export const toggleSectionPrivacy = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sectionKey } = req.params as { sectionKey: SectionKey };
  const { isPrivate } = req.body;

  const section = await VaultService.toggleSectionPrivacy(
    req.user!.userId, sectionKey, isPrivate
  );

  sendSuccess(res, `Section privacy set to ${isPrivate}`, section);
};

// ─── PATCH /api/vault/section/:sectionKey/entry/:entryId/privacy ─────────────

export const toggleEntryPrivacy = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sectionKey, entryId } = req.params as { sectionKey: SectionKey; entryId: string };
  const { isPrivate } = req.body;

  const section = await VaultService.toggleEntryPrivacy(
    req.user!.userId, sectionKey, entryId, isPrivate
  );

  sendSuccess(res, `Entry privacy set to ${isPrivate}`, section);
};

// ─── GET /api/vault/export ───────────────────────────────────────────────────

export const exportVault = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await VaultService.exportVault(req.user!.userId);
  sendSuccess(res, 'Vault exported', data);
};

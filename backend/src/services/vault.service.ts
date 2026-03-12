import { v4 as uuidv4 } from 'uuid';
import { VaultMetaModel } from '../models/VaultMeta';
import { VaultSectionModel } from '../models/VaultSection';
import { AppError } from '../utils/AppError';
import { ALL_SECTION_KEYS, SINGLETON_SECTIONS, SectionKey } from '../types';

// ─── Bootstrap (called once on register) ─────────────────────────────────────

export const bootstrapVault = async (userId: string): Promise<void> => {
  await VaultMetaModel.create({ userId });

  const sectionDocs = ALL_SECTION_KEYS.map((key) => ({
    userId,
    sectionKey: key,
    isPrivate: false,
    entries: [],
  }));

  await VaultSectionModel.insertMany(sectionDocs);
};

// ─── Meta (dashboard overview) ────────────────────────────────────────────────

export const getVaultMeta = async (userId: string) => {
  const meta = await VaultMetaModel.findOne({ userId });
  if (!meta) throw new AppError('Vault not found', 404);
  return meta;
};

// ─── Get a single section ─────────────────────────────────────────────────────

export const getSection = async (userId: string, sectionKey: SectionKey) => {
  const section = await VaultSectionModel.findOne({ userId, sectionKey });
  if (!section) throw new AppError(`Section "${sectionKey}" not found`, 404);
  return section;
};

// ─── Sync meta after any section change ──────────────────────────────────────

export const syncSectionMeta = async (
  userId: string,
  sectionKey: SectionKey,
  entryCount: number,
  isPrivate: boolean
): Promise<void> => {
  const isComplete = entryCount > 0;

  await VaultMetaModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        [`sections.${sectionKey}.isComplete`]:  isComplete,
        [`sections.${sectionKey}.isPrivate`]:   isPrivate,
        [`sections.${sectionKey}.entryCount`]:  entryCount,
        [`sections.${sectionKey}.completedAt`]: isComplete ? new Date() : null,
      },
    }
  );
};

// ─── Add entry (collection sections) ─────────────────────────────────────────

export const addEntry = async (
  userId: string,
  sectionKey: SectionKey,
  entryData: Record<string, any>
) => {
  const entry = { _id: uuidv4(), isPrivate: false, ...entryData };

  const section = await VaultSectionModel.findOneAndUpdate(
    { userId, sectionKey },
    { $push: { entries: entry } },
    { new: true }
  );

  if (!section) throw new AppError(`Section "${sectionKey}" not found`, 404);

  await syncSectionMeta(userId, sectionKey, section.entries.length, section.isPrivate);

  return section;
};

// ─── Update entry ─────────────────────────────────────────────────────────────

export const updateEntry = async (
  userId: string,
  sectionKey: SectionKey,
  entryId: string,
  updates: Record<string, any>
) => {
  const setFields: Record<string, any> = {};
  Object.entries(updates).forEach(([key, val]) => {
    setFields[`entries.$[elem].${key}`] = val;
  });

  const section = await VaultSectionModel.findOneAndUpdate(
    { userId, sectionKey },
    { $set: setFields },
    { new: true, arrayFilters: [{ 'elem._id': entryId }] }
  );

  if (!section) throw new AppError(`Section "${sectionKey}" not found`, 404);

  // Check that the entry actually existed
  const entryExists = section.entries.some((e: any) => e._id === entryId);
  if (!entryExists) throw new AppError(`Entry "${entryId}" not found`, 404);

  return section;
};

// ─── Delete entry ─────────────────────────────────────────────────────────────

export const deleteEntry = async (
  userId: string,
  sectionKey: SectionKey,
  entryId: string
) => {
  const section = await VaultSectionModel.findOneAndUpdate(
    { userId, sectionKey },
    { $pull: { entries: { _id: entryId } } },
    { new: true }
  );

  if (!section) throw new AppError(`Section "${sectionKey}" not found`, 404);

  await syncSectionMeta(userId, sectionKey, section.entries.length, section.isPrivate);

  return section;
};

// ─── Upsert singleton ─────────────────────────────────────────────────────────

export const upsertSingleton = async (
  userId: string,
  sectionKey: SectionKey,
  data: Record<string, any>
) => {
  const entry = { _id: uuidv4(), isPrivate: false, ...data };

  const section = await VaultSectionModel.findOneAndUpdate(
    { userId, sectionKey },
    { $set: { entries: [entry] } },
    { new: true }
  );

  if (!section) throw new AppError(`Section "${sectionKey}" not found`, 404);

  await syncSectionMeta(userId, sectionKey, 1, section.isPrivate);

  return section;
};

// ─── Privacy toggles ──────────────────────────────────────────────────────────

export const toggleSectionPrivacy = async (
  userId: string,
  sectionKey: SectionKey,
  isPrivate: boolean
) => {
  const section = await VaultSectionModel.findOneAndUpdate(
    { userId, sectionKey },
    { $set: { isPrivate } },
    { new: true }
  );

  if (!section) throw new AppError(`Section "${sectionKey}" not found`, 404);

  await syncSectionMeta(userId, sectionKey, section.entries.length, isPrivate);

  return section;
};

export const toggleEntryPrivacy = async (
  userId: string,
  sectionKey: SectionKey,
  entryId: string,
  isPrivate: boolean
) => {
  const section = await VaultSectionModel.findOneAndUpdate(
    { userId, sectionKey },
    { $set: { 'entries.$[elem].isPrivate': isPrivate } },
    { new: true, arrayFilters: [{ 'elem._id': entryId }] }
  );

  if (!section) throw new AppError(`Section "${sectionKey}" not found`, 404);

  return section;
};

// ─── Public vault (for company view — only public data) ───────────────────────

export const getPublicVault = async (userId: string) => {
  const sections = await VaultSectionModel.find({ userId, isPrivate: false });

  return sections.map((section) => ({
    sectionKey: section.sectionKey,
    entries: section.entries.filter((entry: any) => !entry.isPrivate),
  }));
};

// ─── Full JSON export ─────────────────────────────────────────────────────────

export const exportVault = async (userId: string) => {
  const [meta, sections] = await Promise.all([
    VaultMetaModel.findOne({ userId }),
    VaultSectionModel.find({ userId }),
  ]);

  const vault: Record<string, any> = {};
  sections.forEach((s) => {
    vault[s.sectionKey] = {
      isPrivate: s.isPrivate,
      entries: s.entries,
    };
  });

  return { meta, vault };
};

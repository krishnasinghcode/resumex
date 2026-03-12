import mongoose, { Document, Schema, Types } from 'mongoose';
import { ALL_SECTION_KEYS, SectionKey } from '../types';

// Per-section metadata — no actual data, just state
export interface ISectionMeta {
  isComplete: boolean;
  isPrivate: boolean;
  completedAt: Date | null;
  entryCount: number;
}

export interface IVaultMeta extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sections: Map<string, ISectionMeta>;
  createdAt: Date;
  updatedAt: Date;
}

const SectionMetaSchema = new Schema<ISectionMeta>(
  {
    isComplete: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    entryCount: { type: Number, default: 0 },
  },
  { _id: false } // No separate _id for subdocs
);

const VaultMetaSchema = new Schema<IVaultMeta>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Map<SectionKey, SectionMeta> — Mongoose Map type stores as BSON object
    sections: {
      type: Map,
      of: SectionMetaSchema,
      default: () => {
        const map = new Map<string, ISectionMeta>();
        ALL_SECTION_KEYS.forEach((key) => {
          map.set(key, {
            isComplete: false,
            isPrivate: false,
            completedAt: null,
            entryCount: 0,
          });
        });
        return map;
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const VaultMetaModel = mongoose.model<IVaultMeta>('VaultMeta', VaultMetaSchema);

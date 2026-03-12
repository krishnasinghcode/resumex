// src/models/ReferenceData.ts
import mongoose, { Schema, Document } from 'mongoose';

export type ReferenceType =
  | 'skill'
  | 'job_title'
  | 'employment_type'
  | 'social_platform'
  | 'project_category';

export interface IReferenceData extends Document {
  type:       ReferenceType;
  value:      string;
  label:      string;
  meta?:      Record<string, unknown>; // only used by social_platform for icon/urlPrefix
  isActive:   boolean;
  usageCount: number;
}

const schema = new Schema<IReferenceData>({
  type:       { type: String, required: true, index: true },
  value:      { type: String, required: true },
  label:      { type: String, required: true },
  meta:       { type: Schema.Types.Mixed, default: null },
  isActive:   { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ type: 1, value: 1 }, { unique: true });

export const ReferenceData = mongoose.model<IReferenceData>('ReferenceData', schema);
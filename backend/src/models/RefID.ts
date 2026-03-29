import mongoose, { Schema, Document, Types } from 'mongoose';
import type { RequestedField } from '../types';

export interface IRefID extends Document {
  code:            string;
  companyId:       Types.ObjectId;
  jobTitle:        string;
  requestedFields: RequestedField[];
  accessDuration:  number;  // days
  isActive:        boolean;
  createdAt:       Date;
}

const RequestedFieldSchema = new Schema(
  {
    section: {
      type:     String,
      required: true,
    },
    fields: {
      type:    [String],
      default: undefined, // absent = whole section requested
    },
  },
  { _id: false }
);

const RefIDSchema = new Schema<IRefID>(
  {
    code: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    companyId: {
      type:     Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
      index:    true,
    },
    jobTitle: {
      type:     String,
      required: true,
      trim:     true,
    },
    requestedFields: {
      type:     [RequestedFieldSchema],
      required: true,
      validate: {
        validator: (v: RequestedField[]) => v.length > 0,
        message:   'At least one field must be requested',
      },
    },
    accessDuration: {
      type:     Number,
      required: true,
      min:      1,
      max:      180,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const RefIDModel = mongoose.model<IRefID>('RefID', RefIDSchema);

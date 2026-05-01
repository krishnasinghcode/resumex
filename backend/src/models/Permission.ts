import mongoose, { Schema, Document, Types } from 'mongoose';
import type { RequestedField } from '../types';

export interface IPermission extends Document {
  userId: Types.ObjectId;
  companyId: Types.ObjectId;
  refId: Types.ObjectId;
  refIdCode: string;
  grantedFields: RequestedField[];
  scopedToken: string;   // bcrypt hash — raw token shown once only
  expiresAt: Date;
  grantedAt: Date;
  isRevoked: boolean;
  scopedTokenEncrypted: String;
}

const PermissionSchema = new Schema<IPermission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    refId: {
      type: Schema.Types.ObjectId,
      ref: 'RefID',
      required: true,
    },
    refIdCode: {
      type: String,
      required: true,
    },
    grantedFields: [
      {
        section: {
          type: String,
          required: true,
        },
        fields: {
          type: [String],
          default: undefined,
        },
      },
    ],
    scopedToken: {
      type: String,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    }
  },
  { timestamps: true }
);

// One user can only grant once per refID
PermissionSchema.index({ userId: 1, refId: 1 }, { unique: true });

export const PermissionModel = mongoose.model<IPermission>('Permission', PermissionSchema);

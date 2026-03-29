import mongoose, { Schema, Document, Types } from 'mongoose';
import type { RequestedField } from '../types';

export interface IAccessLog extends Document {
  companyId:      Types.ObjectId;
  userId:         Types.ObjectId;
  permissionId:   Types.ObjectId;
  refIdCode:      string;
  fieldsAccessed: RequestedField[];
  ip:             string;
  userAgent:      string;
  accessedAt:     Date;
}

const AccessLogSchema = new Schema<IAccessLog>(
  {
    companyId: {
      type:     Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
      index:    true,
    },
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    permissionId: {
      type:     Schema.Types.ObjectId,
      ref:      'Permission',
      required: true,
    },
    refIdCode: {
      type:     String,
      required: true,
    },
    fieldsAccessed: {
      type:     Schema.Types.Mixed,
      required: true,
    },
    ip: {
      type:     String,
      required: true,
    },
    userAgent: {
      type:    String,
      default: 'unknown',
    },
    accessedAt: {
      type:    Date,
      default: Date.now,
      index:   true,
    },
  },
  { timestamps: false } // immutable — no updatedAt needed
);

// Immutability guard — no updates allowed on access logs
AccessLogSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function () {
  throw new Error('AccessLog documents are immutable');
});

export const AccessLogModel = mongoose.model<IAccessLog>('AccessLog', AccessLogSchema);

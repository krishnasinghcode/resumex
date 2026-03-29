import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface ICompany extends Document {
  name:            string;
  email:           string;
  password:        string;
  slug:            string;       // 3-char unique code e.g. 'str' — used in RefID generation
  website?:        string;
  industry?:       string;
  refreshTokens:   string[];
  isVerified:      boolean;
  createdAt:       Date;
  comparePassword: (candidate: string) => Promise<boolean>;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:   String,
      select: false,
    },
    slug: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    refreshTokens: {
      type:    [String],
      select:  false,
      default: [],
    },
    isVerified: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

CompanySchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

CompanySchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const CompanyModel = mongoose.model<ICompany>('Company', CompanySchema);

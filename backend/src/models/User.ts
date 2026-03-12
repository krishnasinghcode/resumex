import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string;         // Optional — not set for Google OAuth users
  googleId?: string;
  displayName: string;
  avatar?: string;
  authProvider: 'local' | 'google';
  isEmailVerified: boolean;
  role: 'user' | 'company';
  refreshTokens: string[];   // Store hashed refresh tokens for rotation
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false, // Never returned in queries unless explicitly requested
    },
    googleId: {
      type: String,
      sparse: true, // Allows null but enforces uniqueness when set
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'company'],
      default: 'user',
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false, // Never leak refresh tokens in API responses
    },
  },
  {
    timestamps: true,
    // Don't expose __v in responses
    versionKey: false,
  }
);

// ─── Hash password before saving ─────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  // Only hash if password was modified (or is new)
  if (!this.isModified('password') || !this.password) return next();

  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ─── Instance method to compare passwords ────────────────────────────────────
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Remove sensitive fields from JSON output ────────────────────────────────
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.googleId;
  return obj;
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);

// import { Response, NextFunction } from 'express';
// import { PermissionModel } from '../models/Permission';
// import { sendError } from '../utils/response';
// import type { CompanyRequest } from '../types';
// import bcrypt from 'bcrypt';

// export interface ScopedRequest extends CompanyRequest {
//   permission?: InstanceType<typeof PermissionModel>;
// }

// export const scopedAccess = async (
//   req: ScopedRequest,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   // Scoped token travels in its own header — separate from the company JWT
//   const rawToken = req.headers['x-scoped-token'] as string | undefined;

//   if (!rawToken) {
//     sendError(res, 'No scoped token provided', 401);
//     return;
//   }

//   const { userId } = req.params;
//   if (!userId) {
//     sendError(res, 'userId is required', 400);
//     return;
//   }

//   try {
//     const permissions = await PermissionModel.find({
//       userId,
//       isRevoked: false,
//       expiresAt: { $gt: new Date() },
//     }).select('+scopedToken');

//     if (!permissions.length) {
//       sendError(res, 'No valid permission found', 403);
//       return;
//     }

//     let matched: InstanceType<typeof PermissionModel> | null = null;
//     for (const perm of permissions) {
//       const isMatch = await bcrypt.compare(rawToken, perm.scopedToken);
//       if (isMatch) { matched = perm; break; }
//     }

//     if (!matched) {
//       sendError(res, 'Invalid scoped token', 403);
//       return;
//     }

//     if (matched.companyId.toString() !== req.company?.userId) {
//       sendError(res, 'Token does not belong to your company', 403);
//       return;
//     }

//     req.permission = matched;
//     next();
//   } catch {
//     sendError(res, 'Token validation failed', 500);
//   }
// };


import { Response, NextFunction } from 'express';
import { PermissionModel } from '../models/Permission';
import { sendError } from '../utils/response';
import type { CompanyRequest } from '../types';
import bcrypt from 'bcrypt';

export interface ScopedRequest extends CompanyRequest {
  permission?: InstanceType<typeof PermissionModel>;
}

export const scopedAccess = async (
  req: ScopedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {

  console.log('---- Scoped Access Middleware Hit ----');

  // Scoped token travels in its own header — separate from the company JWT
  const rawToken = req.header('x-scoped-token');
  console.log('Scoped token header:', rawToken);

  if (!rawToken) {
    console.log('No scoped token provided in header');
    sendError(res, 'No scoped token provided', 401);
    return;
  }

  const { userId } = req.params;

  console.log('User ID from params:', userId);
  console.log('Company context:', req.company);

  if (!userId) {
    console.log('userId missing from request params');
    sendError(res, 'userId is required', 400);
    return;
  }

  try {
    console.log('Querying permissions for user...');

    const permissions = await PermissionModel.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).select('+scopedToken');

    console.log('Permissions found:', permissions.length);

    if (!permissions.length) {
      console.log('No valid permissions found in DB');
      sendError(res, 'No valid permission found', 403);
      return;
    }

    let matched: InstanceType<typeof PermissionModel> | null = null;

    for (const perm of permissions) {
      console.log('Checking permission:', perm._id.toString());

      const isMatch = await bcrypt.compare(rawToken, perm.scopedToken);

      console.log('bcrypt comparison result:', isMatch);

      if (isMatch) {
        matched = perm;
        break;
      }
    }

    if (!matched) {
      console.log('Scoped token did not match any stored permission token');
      sendError(res, 'Invalid scoped token', 403);
      return;
    }

    console.log('Matched permission ID:', matched._id.toString());
    console.log('Permission companyId:', matched.companyId.toString());
    console.log('Request companyId:', req.company?.userId);

    if (matched.companyId.toString() !== req.company?.userId) {
      console.log('Company mismatch detected');
      sendError(res, 'Token does not belong to your company', 403);
      return;
    }

    console.log('Scoped access granted');

    req.permission = matched;

    next();
  } catch (error) {
    console.log('Error during scoped token validation:', error);
    sendError(res, 'Token validation failed', 500);
  }
};
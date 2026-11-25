import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/queries.ts';

export interface DbUserRecord {
  id: number;
  uid: string;
  email: string;
  name: string;
  photoUrl: string | null;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: DbUserRecord;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const dbUser = await getOrCreateUser({
      uid: decodedToken.uid,
      email: decodedToken.email || `${decodedToken.uid}@agropulse.user`,
      name: decodedToken.name ?? null,
      photoUrl: decodedToken.picture ?? null,
    });
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const dbUser = await getOrCreateUser({
      uid: decodedToken.uid,
      email: decodedToken.email || `${decodedToken.uid}@agropulse.user`,
      name: decodedToken.name ?? null,
      photoUrl: decodedToken.picture ?? null,
    });
    req.dbUser = dbUser;
  } catch {
    // Allow guest fallback on optional endpoints
  }
  next();
};

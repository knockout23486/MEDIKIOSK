// ============================================================================
// MediKiosk API Security Boundary (SEC-003)
// ----------------------------------------------------------------------------
// JWT verification + role-based access control for every /api endpoint.
//
//   * `signToken`   — issues HS256 JWTs after successful login.
//   * `requireAuth` — Express middleware verifying the `Authorization: Bearer`
//                     header (or `?token=` for SSE EventSource, which cannot
//                     set headers) BEFORE any route handler runs, then
//                     enforcing the route's allowed roles.
//
// Responses: 401 UNAUTHENTICATED for missing/invalid/expired tokens,
//            403 FORBIDDEN for valid tokens lacking the required role
//            (denials are written to the PostgreSQL audit trail).
// ============================================================================
import 'dotenv/config';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/store.js';
import type { UserRole } from '../db/schema.js';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function loadJwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (secret && secret.length >= 32) return secret; // never logged, never persisted
  // SEC-008: in production a weak/missing JWT secret is a fatal boot error —
  // tokens must never be signed with a guessable default.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: AUTH_JWT_SECRET must be set to 32+ random characters in production. Refusing to start.'
    );
  }
  // SEC-013: never fall back to a constant, guessable secret. Development
  // boots get a RANDOM EPHEMERAL secret per process — unguessable even if
  // NODE_ENV is misconfigured as 'development' in a real deployment. Tokens
  // simply become invalid when the process restarts.
  console.warn(
    '[Auth] AUTH_JWT_SECRET not set (or too short) — generated RANDOM EPHEMERAL secret ' +
    '(tokens invalidate on restart; never use in production).'
  );
  return randomBytes(48).toString('base64url');
}

// Resolved lazily (memoized) so dotenv has loaded .env before first use.
let JWT_SECRET: string | null = null;
function getJwtSecret(): string {
  if (!JWT_SECRET) JWT_SECRET = loadJwtSecret();
  return JWT_SECRET;
}
export const JWT_EXPIRES_IN = '12h';
export const JWT_ISSUER = 'medikiosk-api';

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  name: string;
}

/** Issues a signed JWT for an authenticated user. */
export function signToken(user: { id: string; username: string; role: UserRole; name: string }): string {
  return jwt.sign(
    { username: user.username, role: user.role, name: user.name } satisfies Omit<JwtPayload, 'sub'>,
    getJwtSecret(),
    { subject: user.id, issuer: JWT_ISSUER, expiresIn: JWT_EXPIRES_IN }
  );
}

/** Verifies a token and returns its payload, or null when invalid/expired. */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { issuer: JWT_ISSUER });
    if (typeof decoded === 'string') return null;
    const payload = decoded as jwt.JwtPayload & JwtPayload;
    if (!payload.sub || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && /^Bearer\s+/i.test(header)) {
    return header.replace(/^Bearer\s+/i, '').trim() || null;
  }
  // EventSource (SSE) cannot set HTTP headers — allow the token as a query
  // parameter for the events stream only.
  if (req.path === '/events' && typeof req.query.token === 'string') {
    return req.query.token;
  }
  return null;
}

export function unauthorized(res: Response, message: string) {
  return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message });
}

/**
 * Route guard. Usage: `apiRouter.get('/x', requireAuth('DOCTOR','ADMIN'), handler)`.
 * With no roles, any authenticated user passes (ALL).
 */
export function requireAuth(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractToken(req);
    if (!token) {
      unauthorized(res, 'Missing Authorization: Bearer <token> header.');
      return;
    }
    const payload = verifyToken(token);
    if (!payload) {
      unauthorized(res, 'Invalid or expired token.');
      return;
    }
    req.user = { id: payload.sub, username: payload.username, role: payload.role, name: payload.name };

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      // Denials are audited (fire-and-forget — the response must not wait on it).
      void db
        .addAuditLog({
          correlationId: 'AUTHZ-DENIED',
          actorId: payload.sub,
          actorRole: payload.role,
          action: 'API_ACCESS_FORBIDDEN',
          resourceType: 'API_ENDPOINT',
          resourceId: `${req.method} ${req.originalUrl}`,
          details: { requiredRoles: allowedRoles, grantedRole: payload.role },
          ipAddress: req.ip || '127.0.0.1'
        })
        .catch(() => undefined);
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Role ${payload.role} is not permitted to access ${req.method} ${req.originalUrl}.`
      });
      return;
    }
    next();
  };
}

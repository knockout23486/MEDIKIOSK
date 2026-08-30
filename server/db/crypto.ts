// ============================================================================
// MediKiosk Application-Level PHI Encryption (SEC-004)
// ----------------------------------------------------------------------------
// Infrastructure encryption-at-rest (RDS/EBS volume encryption) protects the
// storage layer, but anyone with logical access to the PostgreSQL instance —
// a DBA, leaked connection credentials, or SQL injection — would still read
// medical records in plaintext.
//
// This module adds defense-in-depth: sensitive PHI fields (patient identity,
// clinical free text, consent purposes, FHIR payloads...) are encrypted with
// AES-256-GCM *inside the application* before they reach the database, and
// decrypted transparently when rows are read. Drizzle custom column types
// (`encryptedText`, `encryptedJson`) make this invisible to the rest of the
// codebase.
//
// Envelope format:  enc.v1.<iv>.<authTag>.<ciphertext>   (base64url segments)
//
// Notes
//   * A random 96-bit IV per value — identical plaintexts encrypt differently.
//   * The GCM auth tag detects any tampering with stored ciphertexts.
//   * Values written before this rollout (plaintext) are returned as-is by
//     `decryptField`, so migrations on existing databases are non-breaking.
//   * Encrypted columns are intentionally NOT used in WHERE/ORDER BY clauses;
//     lookup keys (ids, usernames, mrn numbers) stay unencrypted by design.
// ============================================================================
import 'dotenv/config';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { customType } from 'drizzle-orm/pg-core';

const ENVELOPE_PREFIX = 'enc.v1.';
const IV_BYTES = 12; // 96-bit IV (GCM recommended)
const TAG_BYTES = 16;

function loadKey(): Buffer {
  const hex = process.env.APP_ENCRYPTION_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(hex, 'hex');
  }
  // Dev fallback so the platform boots without configuration. NOT for
  // production — set APP_ENCRYPTION_KEY (openssl rand -hex 32).
  if (hex) {
    console.warn('[Crypto] APP_ENCRYPTION_KEY is not 64 hex chars — falling back to derived dev key.');
  } else {
    console.warn('[Crypto] APP_ENCRYPTION_KEY not set — using derived development key. Do NOT use in production.');
  }
  return scryptSync('medikiosk-dev-only-phi-key', 'medikiosk-salt-v1', 32);
}

// Resolved lazily (memoized) so dotenv has loaded .env before the key is
// read — module-level consts would capture the env BEFORE .env is parsed.
let KEY: Buffer | null = null;
function getKey(): Buffer {
  if (!KEY) KEY = loadKey();
  return KEY;
}

export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(ENVELOPE_PREFIX);
}

/** Encrypts a UTF-8 string into the enc.v1 envelope. */
export function encryptField(plain: string): string {
  if (plain === null || plain === undefined) return plain as unknown as string;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    ENVELOPE_PREFIX +
    iv.toString('base64url') + '.' +
    tag.toString('base64url') + '.' +
    ciphertext.toString('base64url')
  );
}

/**
 * Decrypts an enc.v1 envelope. Values that are not in the envelope format
 * (i.e. rows written before encryption was enabled) pass through unchanged.
 */
export function decryptField(stored: string): string {
  if (stored === null || stored === undefined) return stored as unknown as string;
  if (!isEncrypted(stored)) return stored;
  try {
    const [ivB64, tagB64, ctB64] = stored.slice(ENVELOPE_PREFIX.length).split('.');
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    throw new Error(
      'PHI decryption failed: ciphertext is tampered or APP_ENCRYPTION_KEY differs from the key used at write time.'
    );
  }
}

/** Encrypted string column (SQL type: text). */
export const encryptedText = customType<{ data: string; driverData: string }>({
  dataType: () => 'text',
  // Nulls are handled by the ORM itself; guards keep stray nulls safe at runtime.
  toDriver(value: any): any {
    return value === null || value === undefined ? value : encryptField(value);
  },
  fromDriver(value: any): any {
    return value === null || value === undefined ? value : decryptField(value);
  }
});

/** Encrypted JSON column (SQL type: text; serialized JSON inside the envelope). */
export function encryptedJson<T = Record<string, unknown>>() {
  return customType<{ data: T; driverData: string }>({
    dataType: () => 'text',
    toDriver(value: any): any {
      return value === null || value === undefined ? value : encryptField(JSON.stringify(value));
    },
    fromDriver(value: any): any {
      if (value === null || value === undefined) return value;
      return JSON.parse(isEncrypted(value) ? decryptField(value) : value) as T;
    }
  });
}

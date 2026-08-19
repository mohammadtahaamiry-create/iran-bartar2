import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { randomBytes, createHash } from 'crypto';

export const SESSION_COOKIE = 'iran_behtar_session';

// Hash a password using PBKDF2-like salted SHA-256
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + ':' + password).digest('hex');
  // 1000 rounds
  let final = hash;
  for (let i = 0; i < 999; i++) {
    final = createHash('sha256').update(final).digest('hex');
  }
  return `${salt}:${final}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  let final = createHash('sha256').update(salt + ':' + password).digest('hex');
  for (let i = 0; i < 999; i++) {
    final = createHash('sha256').update(final).digest('hex');
  }
  return final === hash;
}

// Simple session token: random hex string
export function createSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Session store using in-memory map (persists across hot reloads via global)
type SessionData = { userId: string; token: string; createdAt: number };

const sessionStore = globalThis as unknown as {
  __iran_behtar_sessions?: Map<string, SessionData>;
};

if (!sessionStore.__iran_behtar_sessions) {
  sessionStore.__iran_behtar_sessions = new Map();
}

const SESSION_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

export function saveSession(userId: string, token: string) {
  sessionStore.__iran_behtar_sessions!.set(token, {
    userId,
    token,
    createdAt: Date.now(),
  });
  // Cleanup expired
  for (const [k, v] of sessionStore.__iran_behtar_sessions!.entries()) {
    if (Date.now() - v.createdAt > SESSION_TTL) {
      sessionStore.__iran_behtar_sessions!.delete(k);
    }
  }
}

export function getSession(token?: string): SessionData | null {
  if (!token) return null;
  const data = sessionStore.__iran_behtar_sessions!.get(token);
  if (!data) return null;
  if (Date.now() - data.createdAt > SESSION_TTL) {
    sessionStore.__iran_behtar_sessions!.delete(token);
    return null;
  }
  return data;
}

export function destroySession(token?: string) {
  if (!token) return;
  sessionStore.__iran_behtar_sessions!.delete(token);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = getSession(token);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      role: true,
      onboarded: true,
      createdAt: true,
    },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

// Re-export client-safe helpers so server code can import from '@/lib/auth'.
export {
  CONTENT_ADMIN_EMAIL,
  isContentAdmin,
} from '@/lib/content-admin';
import { isContentAdmin } from '@/lib/content-admin';

export async function requireContentAdmin() {
  const user = await getCurrentUser();
  if (!isContentAdmin(user)) {
    throw new Error('Forbidden: content admin only');
  }
  return user as NonNullable<typeof user>;
}

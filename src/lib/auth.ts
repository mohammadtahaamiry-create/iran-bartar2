import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { randomBytes, createHash } from 'crypto';

export const SESSION_COOKIE = 'iran_behtar_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// ---- Password hashing (PBKDF2-like salted SHA-256, 1000 rounds) ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + ':' + password).digest('hex');
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
  // Constant-time comparison to prevent timing attacks.
  if (final.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < final.length; i++) {
    diff |= final.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

// ---- Session token ----

export function createSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// ---- DB-backed session store ----
//
// Sessions are persisted in the SQLite database (Session model) so that:
//   - Container restarts / rebuilds / `docker compose down && up` do NOT log
//     users out.
//   - Multiple replicas (future) share the same session state.
//   - We can audit / revoke sessions from the admin panel.
//
// Each session has an `expiresAt` field. Expired sessions are lazily cleaned up
// on read; a periodic cleanup can be added later.

export async function saveSession(userId: string, token: string): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.session.create({
    data: { token, userId, createdAt: now, expiresAt },
  });
  // Opportunistic cleanup: delete expired sessions for this user (cheap, bounded).
  try {
    await db.session.deleteMany({
      where: { userId, expiresAt: { lt: now } },
    });
  } catch {
    // non-fatal
  }
}

export async function getSession(token: string | undefined): Promise<{ userId: string } | null> {
  if (!token) return null;
  const row = await db.session.findUnique({ where: { token } });
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    // Expired — delete and report as not-found.
    try {
      await db.session.delete({ where: { id: row.id } });
    } catch {
      // non-fatal
    }
    return null;
  }
  return { userId: row.userId };
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  try {
    await db.session.deleteMany({ where: { token } });
  } catch {
    // non-fatal
  }
}

// ---- Current user helper ----

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await getSession(token);
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

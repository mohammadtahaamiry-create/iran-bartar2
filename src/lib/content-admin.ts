// Client-safe pure helpers for content admin checks.
// Keep this file free of any server-only imports (no 'next/headers', no 'db', etc.).

export const CONTENT_ADMIN_EMAIL = 'mohammadtahaamiri@gmial.com';

export function isContentAdmin(user: {
  email?: string | null;
  role?: string | null;
} | null): boolean {
  if (!user) return false;
  if (user.role !== 'admin') return false;
  if (!user.email) return false;
  return user.email.trim().toLowerCase() === CONTENT_ADMIN_EMAIL;
}

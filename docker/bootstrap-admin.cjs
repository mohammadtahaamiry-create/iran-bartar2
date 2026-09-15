#!/usr/bin/env node
/**
 * docker/bootstrap-admin.cjs
 * -----------------------------------------------------------------------------
 * Idempotent admin bootstrap for first deployment.
 *
 * Runs from docker-entrypoint.sh AFTER migrations, BEFORE starting Next.js.
 * Reads ADMIN_EMAIL + ADMIN_PASSWORD from the environment (injected at runtime
 * via .env.production — NEVER baked into the image).
 *
 * Behavior:
 *   - If ADMIN_EMAIL or ADMIN_PASSWORD is not set  -> exit 0 (skip silently).
 *   - If a user with ADMIN_EMAIL already exists    -> ensure role=admin,
 *     sync the password to ADMIN_PASSWORD, mark onboarded.
 *   - Otherwise                                    -> create the admin user.
 *
 * This guarantees you can always log in right after `docker compose up -d`.
 */

const { PrismaClient } = require('@prisma/client');
const { randomBytes, createHash } = require('crypto');

// Same hashing algorithm as src/lib/auth.ts (salted SHA-256, 1000 rounds).
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  let final = createHash('sha256').update(salt + ':' + password).digest('hex');
  for (let i = 0; i < 999; i++) {
    final = createHash('sha256').update(final).digest('hex');
  }
  return `${salt}:${final}`;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.log('==> [bootstrap] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin bootstrap.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.warn(`==> [bootstrap] ADMIN_EMAIL "${email}" is not a valid email — skipping.`);
    return;
  }
  if (password.length < 8) {
    console.warn('==> [bootstrap] ADMIN_PASSWORD is shorter than 8 chars — skipping for safety.');
    return;
  }

  const db = new PrismaClient();
  try {
    const passwordHash = hashPassword(password);
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      await db.user.update({
        where: { email },
        data: {
          role: 'admin',
          passwordHash,
          onboarded: true,
        },
      });
      console.log(`==> [bootstrap] Admin user updated: ${email} (role=admin, password synced from env)`);
    } else {
      await db.user.create({
        data: {
          email,
          passwordHash,
          role: 'admin',
          onboarded: true,
        },
      });
      console.log(`==> [bootstrap] Admin user created: ${email}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error('==> [bootstrap] FAILED:', err.message);
  process.exit(1);
});

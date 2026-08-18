// Seed the content admin account.
// Usage: bun run /home/z/my-project/scripts/seed-admin.ts
//
// Creates (or updates) an admin user with email mohammadtahaamiri@gmial.com
// so they can add/edit/delete CMS content.

import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';
import { CONTENT_ADMIN_EMAIL } from '../src/lib/content-admin';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mohammadtaha';

async function main() {
  const email = CONTENT_ADMIN_EMAIL;
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    const updated = await db.user.update({
      where: { email },
      data: {
        role: 'admin',
        firstName: existing.firstName || 'محمدتقا',
        name: existing.name || 'محمدتقا',
        onboarded: true,
        passwordHash: hashPassword(ADMIN_PASSWORD),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        role: true,
      },
    });
    console.log('✓ Admin user updated:', updated);
  } else {
    const created = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(ADMIN_PASSWORD),
        firstName: 'محمدتقا',
        name: 'محمدتقا',
        role: 'admin',
        onboarded: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        role: true,
      },
    });
    console.log('✓ Admin user created:', created);
  }

  console.log('\n--- Login credentials ---');
  console.log('Email:   ', email);
  console.log('Password:', ADMIN_PASSWORD);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

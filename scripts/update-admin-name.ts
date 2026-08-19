// Update the admin account's name to محمدطاها.
// Usage: npx tsx scripts/update-admin-name.ts

import { db } from '../src/lib/db';
import { CONTENT_ADMIN_EMAIL } from '../src/lib/content-admin';

const NEW_FIRST_NAME = 'محمدطاها';

async function main() {
  const email = CONTENT_ADMIN_EMAIL;

  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    console.log('ℹ No admin user found with email', email);
    console.log('  Run `ADMIN_PASSWORD=mohammadtaha npx tsx scripts/seed-admin.ts` first.');
    return;
  }

  const updated = await db.user.update({
    where: { email },
    data: {
      firstName: NEW_FIRST_NAME,
      name: NEW_FIRST_NAME,
      onboarded: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      name: true,
      role: true,
    },
  });

  console.log('✓ Admin name updated:', updated);
}

main()
  .catch((err) => {
    console.error('Update failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

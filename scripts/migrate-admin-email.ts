// Migrate the admin account from the old (typo) email to the corrected email.
// Old: mohammadtahaamiri@gmial.com
// New: mohammadtahaamiri@gmail.com
//
// Usage: npx tsx scripts/migrate-admin-email.ts

import { db } from '../src/lib/db';
import { CONTENT_ADMIN_EMAIL } from '../src/lib/content-admin';

const OLD_EMAIL = 'mohammadtahaamiri@gmial.com';
const NEW_EMAIL = CONTENT_ADMIN_EMAIL; // mohammadtahaamiri@gmail.com

async function main() {
  console.log('Old email:', OLD_EMAIL);
  console.log('New email:', NEW_EMAIL);

  // Check if the new email already exists
  const existingNew = await db.user.findUnique({ where: { email: NEW_EMAIL } });
  if (existingNew) {
    // Make sure it's an admin and onboarding is done
    const updated = await db.user.update({
      where: { email: NEW_EMAIL },
      data: {
        role: 'admin',
        onboarded: true,
      },
      select: { id: true, email: true, role: true },
    });
    console.log('✓ Admin account already exists with new email, role confirmed:', updated);

    // Delete the old admin record if it still exists
    const oldUser = await db.user.findUnique({ where: { email: OLD_EMAIL } });
    if (oldUser) {
      // Reassign any content the old admin authored to the new admin
      await db.content.updateMany({
        where: { authorId: oldUser.id },
        data: { authorId: existingNew.id },
      });
      await db.user.delete({ where: { id: oldUser.id } });
      console.log('✓ Deleted old admin record and reassigned content to new admin');
    }
    return;
  }

  // Find the old admin
  const oldUser = await db.user.findUnique({ where: { email: OLD_EMAIL } });
  if (!oldUser) {
    console.log('ℹ No existing admin found with the old email. Nothing to migrate.');
    console.log('  Run `ADMIN_PASSWORD=mohammadtaha npx tsx scripts/seed-admin.ts` to create the admin.');
    return;
  }

  // Update the admin's email to the new one
  const updated = await db.user.update({
    where: { id: oldUser.id },
    data: {
      email: NEW_EMAIL,
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
  console.log('✓ Admin email updated:', updated);
  console.log('\n--- Updated login credentials ---');
  console.log('Email:   ', NEW_EMAIL);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

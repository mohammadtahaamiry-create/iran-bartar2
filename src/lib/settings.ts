import { db } from '@/lib/db';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// ---- Encryption helpers for sensitive values (API keys, tokens) ----

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'iran-behtar-default-encryption-key-v1';
const SALT = 'iran-behtar-settings-salt';

function getKey(): Buffer {
  return scryptSync(ENCRYPTION_KEY, SALT, 32);
}

export function encryptValue(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptValue(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 3) return stored; // assume plain if not encrypted format
  const [ivHex, tagHex, encHex] = parts;
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return stored; // fallback to plain
  }
}

// ---- Settings catalog: defines all known setting keys ----

export type SettingCategory = 'api_keys' | 'models' | 'features' | 'general' | 'appearance';

export interface SettingMeta {
  key: string;
  label: string;
  description: string;
  category: SettingCategory;
  isSecret: boolean;
  type: 'text' | 'password' | 'toggle' | 'number' | 'select';
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
}

export const SETTINGS_CATALOG: SettingMeta[] = [
  // ---- API Keys ----
  {
    key: 'zai_api_key',
    label: 'کلید API هوش مصنوعی (Z.AI)',
    description: 'کلید دسترسی به سرویس‌های Z.AI برای چت، تشخیص تصویر، تبدیل صدا به متن و متن به صدا.',
    category: 'api_keys',
    isSecret: true,
    type: 'password',
    placeholder: 'کلید API را اینجا وارد کنید',
  },
  {
    key: 'zai_base_url',
    label: 'آدرس پایه API (Base URL)',
    description: 'آدرس پایه سرویس Z.AI. معمولاً نیازی به تغییر نیست.',
    category: 'api_keys',
    isSecret: false,
    type: 'text',
    defaultValue: 'https://api.z.ai/api/paas/v4',
    placeholder: 'https://api.z.ai/api/paas/v4',
  },
  // ---- Model Configuration ----
  {
    key: 'chat_model',
    label: 'مدل چت متنی',
    description: 'مدل استفاده‌شده برای پاسخ به سؤالات متنی.',
    category: 'models',
    isSecret: false,
    type: 'select',
    options: ['glm-4-flash', 'glm-4.5', 'glm-4.5-air', 'glm-4-plus', 'glm-4-air'],
    defaultValue: 'glm-4-flash',
  },
  {
    key: 'vision_model',
    label: 'مدل تحلیل تصویر',
    description: 'مدل استفاده‌شده برای تحلیل تصاویر ارسالی در چت.',
    category: 'models',
    isSecret: false,
    type: 'select',
    options: ['glm-4v-flash', 'glm-4v-plus', 'glm-4v'],
    defaultValue: 'glm-4v-flash',
  },
  {
    key: 'asr_model',
    label: 'مدل تشخیص گفتار (ASR)',
    description: 'مدل استفاده‌شده برای تبدیل صدا به متن.',
    category: 'models',
    isSecret: false,
    type: 'select',
    options: ['glm-asr-base', 'glm-asr-plus'],
    defaultValue: 'glm-asr-base',
  },
  {
    key: 'tts_model',
    label: 'مدل تبدیل متن به گفتار (TTS)',
    description: 'مدل استفاده‌شده برای تبدیل متن پاسخ به صدا.',
    category: 'models',
    isSecret: false,
    type: 'select',
    options: ['glm-tts', 'csm-tts'],
    defaultValue: 'glm-tts',
  },
  // ---- Features ----
  {
    key: 'feature_deep_thinking',
    label: 'تفکر عمیق',
    description: 'فعال بودن قابلیت تفکر عمیق (Chain of Thought) برای همه کاربران.',
    category: 'features',
    isSecret: false,
    type: 'toggle',
    defaultValue: 'true',
  },
  {
    key: 'feature_image_upload',
    label: 'ارسال تصویر در چت',
    description: 'اجازه آپلود و تحلیل تصویر در بخش گفت‌وگو.',
    category: 'features',
    isSecret: false,
    type: 'toggle',
    defaultValue: 'true',
  },
  {
    key: 'feature_voice_input',
    label: 'ورودی صوتی',
    description: 'اجازه ضبط صدا و تبدیل آن به متن در چت.',
    category: 'features',
    isSecret: false,
    type: 'toggle',
    defaultValue: 'true',
  },
  {
    key: 'feature_voice_output',
    label: 'پخش صوتی پاسخ‌ها',
    description: 'امکان پخش صوتی پاسخ‌های دستیار با TTS.',
    category: 'features',
    isSecret: false,
    type: 'toggle',
    defaultValue: 'true',
  },
  {
    key: 'feature_user_signup',
    label: 'ثبت‌نام کاربران جدید',
    description: 'اجازه ایجاد حساب کاربری جدید. در صورت غیرفعال بودن، فقط مدیر می‌تواند وارد شود.',
    category: 'features',
    isSecret: false,
    type: 'toggle',
    defaultValue: 'true',
  },
  // ---- General ----
  {
    key: 'site_title',
    label: 'عنوان سایت',
    description: 'عنوان نمایش‌داده‌شده در سایدبار و مرورگر.',
    category: 'general',
    isSecret: false,
    type: 'text',
    defaultValue: 'ایران برتر',
    placeholder: 'ایران برتر',
  },
  {
    key: 'site_subtitle',
    label: 'زیرعنوان سایت',
    description: 'زیرعنوان نمایش‌داده‌شده زیر عنوان در سایدبار.',
    category: 'general',
    isSecret: false,
    type: 'text',
    defaultValue: 'دستیار هوشمند',
    placeholder: 'دستیار هوشمند',
  },
  {
    key: 'max_message_length',
    label: 'حداکثر طول پیام',
    description: 'حداکثر تعداد کاراکترهای مجاز برای هر پیام کاربر.',
    category: 'general',
    isSecret: false,
    type: 'number',
    defaultValue: '4000',
  },
  // ---- Appearance ----
  {
    key: 'theme',
    label: 'پوسته ظاهری',
    description: 'حالت نمایش رنگی رابط کاربری.',
    category: 'appearance',
    isSecret: false,
    type: 'select',
    options: ['dark', 'light', 'system'],
    defaultValue: 'dark',
  },
];

// ---- Public API ----

/** Get a single setting value (decrypted if it was encrypted) */
export async function getSetting(key: string): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) {
    // Return default value from catalog if exists
    const meta = SETTINGS_CATALOG.find((m) => m.key === key);
    return meta?.defaultValue ?? null;
  }
  if (row.isSecret) {
    return decryptValue(row.value);
  }
  return row.value;
}

/** Get multiple settings at once */
export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const rows = await db.setting.findMany({ where: { key: { in: keys } } });
  const map: Record<string, string | null> = {};
  for (const key of keys) {
    const row = rows.find((r) => r.key === key);
    if (!row) {
      const meta = SETTINGS_CATALOG.find((m) => m.key === key);
      map[key] = meta?.defaultValue ?? null;
    } else if (row.isSecret) {
      map[key] = decryptValue(row.value);
    } else {
      map[key] = row.value;
    }
  }
  return map;
}

/** Get all settings for a category (decrypted) */
export async function getSettingsByCategory(category: SettingCategory): Promise<Record<string, string | null>> {
  const keys = SETTINGS_CATALOG.filter((m) => m.category === category).map((m) => m.key);
  return getSettings(keys);
}

/** Set a setting value (encrypted if isSecret) */
export async function setSetting(
  key: string,
  value: string,
  updatedById?: string
): Promise<void> {
  const meta = SETTINGS_CATALOG.find((m) => m.key === key);
  if (!meta) {
    throw new Error(`Setting key "${key}" is not in the catalog`);
  }
  const storedValue = meta.isSecret ? encryptValue(value) : value;
  await db.setting.upsert({
    where: { key },
    update: {
      value: storedValue,
      isSecret: meta.isSecret,
      category: meta.category,
      description: meta.description,
      updatedById,
    },
    create: {
      key,
      value: storedValue,
      isSecret: meta.isSecret,
      category: meta.category,
      description: meta.description,
      updatedById,
    },
  });
}

/** Set multiple settings at once */
export async function setSettings(
  values: Record<string, string>,
  updatedById?: string
): Promise<void> {
  // Validate all keys first
  for (const key of Object.keys(values)) {
    const meta = SETTINGS_CATALOG.find((m) => m.key === key);
    if (!meta) {
      throw new Error(`Setting key "${key}" is not in the catalog`);
    }
  }
  // Use a transaction to update all atomically
  await db.$transaction(
    Object.entries(values).map(([key, value]) => {
      const meta = SETTINGS_CATALOG.find((m) => m.key === key)!;
      const storedValue = meta.isSecret ? encryptValue(value) : value;
      return db.setting.upsert({
        where: { key },
        update: {
          value: storedValue,
          isSecret: meta.isSecret,
          category: meta.category,
          description: meta.description,
          updatedById,
        },
        create: {
          key,
          value: storedValue,
          isSecret: meta.isSecret,
          category: meta.category,
          description: meta.description,
          updatedById,
        },
      });
    })
  );
}

/** Mask a secret value for display (show only last 4 chars) */
export function maskSecret(value: string | null): string {
  if (!value) return '';
  if (value.length <= 4) return '••••';
  return '•'.repeat(Math.max(value.length - 4, 8)) + value.slice(-4);
}

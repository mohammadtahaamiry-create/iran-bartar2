import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  SETTINGS_CATALOG,
  setSettings,
  maskSecret,
  decryptValue,
  type SettingCategory,
} from '@/lib/settings';
import { isContentAdmin } from '@/lib/content-admin';

// GET — list all settings (admin only). Secret values are masked.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
    }
    if (!isContentAdmin(user)) {
      return NextResponse.json(
        { error: 'دسترسی به تنظیمات فقط برای مدیر سایت مجاز است' },
        { status: 403 }
      );
    }

    const rows = await db.setting.findMany();
    const rowMap = new Map(rows.map((r) => [r.key, r]));

    // Build the response grouped by category
    const categories: Record<string, {
      label: string;
      items: Array<{
        key: string;
        label: string;
        description: string;
        category: SettingCategory;
        isSecret: boolean;
        type: string;
        options?: string[];
        defaultValue?: string;
        placeholder?: string;
        value: string; // masked if secret
        isConfigured: boolean;
        updatedAt?: string;
      }>;
    }> = {};

    const categoryLabels: Record<SettingCategory, string> = {
      api_keys: 'کلیدهای API',
      models: 'مدل‌های هوش مصنوعی',
      features: 'قابلیت‌های اپلیکیشن',
      general: 'عمومی',
      appearance: 'ظاهر',
    };

    for (const meta of SETTINGS_CATALOG) {
      const cat = meta.category;
      if (!categories[cat]) {
        categories[cat] = { label: categoryLabels[cat], items: [] };
      }
      const row = rowMap.get(meta.key);
      const hasValue = !!row?.value;
      let displayValue = '';
      if (hasValue) {
        displayValue = meta.isSecret
          ? maskSecret(decryptValue(row!.value))
          : row!.value;
      } else if (meta.defaultValue) {
        displayValue = meta.isSecret ? '' : meta.defaultValue;
      }

      categories[cat].items.push({
        key: meta.key,
        label: meta.label,
        description: meta.description,
        category: meta.category,
        isSecret: meta.isSecret,
        type: meta.type,
        options: meta.options,
        defaultValue: meta.defaultValue,
        placeholder: meta.placeholder,
        value: displayValue,
        isConfigured: hasValue,
        updatedAt: row?.updatedAt?.toISOString(),
      });
    }

    // Sort categories in a sensible order
    const order: SettingCategory[] = ['api_keys', 'models', 'features', 'general', 'appearance'];
    const sorted: typeof categories = {};
    for (const c of order) {
      if (categories[c]) sorted[c] = categories[c];
    }

    return NextResponse.json({
      categories: sorted,
      admin: { id: user.id, firstName: user.firstName, role: user.role },
    });
  } catch (err: any) {
    console.error('Settings GET error:', err);
    return NextResponse.json(
      { error: `خطا در دریافت تنظیمات: ${err?.message || 'نامشخص'}` },
      { status: 500 }
    );
  }
}

// PUT — update multiple settings (admin only)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
    }
    if (!isContentAdmin(user)) {
      return NextResponse.json(
        { error: 'دسترسی به تنظیمات فقط برای مدیر سایت مجاز است' },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { values: Record<string, string> };
    const { values } = body;
    if (!values || typeof values !== 'object') {
      return NextResponse.json({ error: 'فرمت درخواست نامعتبر است' }, { status: 400 });
    }

    // Filter out empty secret values (don't overwrite existing secrets with empty strings)
    const filtered: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      const meta = SETTINGS_CATALOG.find((m) => m.key === key);
      if (!meta) continue; // ignore unknown keys
      if (meta.isSecret && !value) continue; // skip empty secret updates
      filtered[key] = value;
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ ok: true, message: 'تغییری اعمال نشد' });
    }

    await setSettings(filtered, user.id);
    return NextResponse.json({ ok: true, updated: Object.keys(filtered) });
  } catch (err: any) {
    console.error('Settings PUT error:', err);
    return NextResponse.json(
      { error: `خطا در ذخیره تنظیمات: ${err?.message || 'نامشخص'}` },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isContentAdmin } from '@/lib/content-admin';
import { getSetting } from '@/lib/settings';
import { buildAiClient } from '@/lib/ai-client';

export const maxDuration = 15;

// POST — fetch available models from the API using the configured key
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
    }
    if (!isContentAdmin(user)) {
      return NextResponse.json(
        { error: 'دسترسی فقط برای مدیر سایت مجاز است' },
        { status: 403 }
      );
    }

    const apiKey = await getSetting('ai_api_key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'کلید API تنظیم نشده است. ابتدا کلید را وارد و ذخیره کنید.' },
        { status: 400 }
      );
    }

    const { client } = await buildAiClient();

    // List models from the API (OpenRouter/OpenAI compatible)
    const response = await client.models.list();

    let models: string[] = [];
    if (Array.isArray(response?.data)) {
      models = response.data
        .map((m: any) => m.id || m.name || '')
        .filter((id: string) => id.length > 0);
    } else if (Array.isArray(response)) {
      models = response
        .map((m: any) => m.id || m.name || '')
        .filter((id: string) => id.length > 0);
    }

    // Sort alphabetically
    models.sort();

    return NextResponse.json({ models });
  } catch (err: any) {
    console.error('Fetch models error:', err);
    return NextResponse.json(
      { error: `خطا در دریافت مدل‌ها: ${err?.message || 'نامشخص'}` },
      { status: 500 }
    );
  }
}

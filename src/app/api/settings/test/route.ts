import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isContentAdmin } from '@/lib/content-admin';
import { getSetting } from '@/lib/settings';
import { buildAiClient, getModel } from '@/lib/ai-client';

export const maxDuration = 30;

// POST — test the configured API key with a minimal request
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
    }
    if (!isContentAdmin(user)) {
      return NextResponse.json(
        { error: 'دسترسی به این بخش فقط برای مدیر سایت مجاز است' },
        { status: 403 }
      );
    }

    const apiKey = await getSetting('ai_api_key');
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'کلید API تنظیم نشده است. ابتدا کلید را وارد و ذخیره کنید.' },
        { status: 400 }
      );
    }

    const t0 = Date.now();
    const { client } = await buildAiClient();
    const chatModel = await getModel('chat');

    const payload: Record<string, unknown> = {
      messages: [
        { role: 'system', content: 'You are a test assistant. Reply with only the word ok.' },
        { role: 'user', content: 'test' },
      ],
      max_tokens: 10,
    };
    if (chatModel) payload.model = chatModel;

    const result = await client.chat.completions.create(payload as any);
    const elapsed = Date.now() - t0;

    const reply = result?.choices?.[0]?.message?.content || '';
    if (!reply) {
      return NextResponse.json(
        { ok: false, error: 'پاسخی از سرور دریافت نشد. کلید ممکن است نامعتبر باشد.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      reply: reply.slice(0, 100),
      elapsedMs: elapsed,
      model: chatModel || 'default',
    });
  } catch (err: any) {
    console.error('Settings test error:', err);
    return NextResponse.json(
      { ok: false, error: `کلید کار نمی‌کند: ${err?.message || 'نامشخص'}` },
      { status: 500 }
    );
  }
}

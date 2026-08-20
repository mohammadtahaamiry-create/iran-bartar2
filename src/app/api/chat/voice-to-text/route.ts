import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 30;

interface VoiceToTextBody {
  audioBase64: string; // base64 encoded webm/ogg audio
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'برای استفاده از دستیار صوتی ابتدا وارد شوید' },
        { status: 401 }
      );
    }

    const body = (await req.json()) as VoiceToTextBody;
    const { audioBase64 } = body;

    if (!audioBase64) {
      return NextResponse.json(
        { error: 'فایل صوتی ارسال نشده است' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const result = await zai.audio.asr.create({
      file_base64: audioBase64,
    });

    // The SDK returns the transcription
    const text = result?.text || result?.result || (typeof result === 'string' ? result : '');

    if (!text || typeof text !== 'string') {
      // If the result structure is unknown, try JSON stringify for debugging
      console.error('ASR unexpected result:', JSON.stringify(result).slice(0, 500));
      return NextResponse.json(
        { error: 'خطا در تشخیص گفتار. لطفاً دوباره تلاش کنید.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('ASR error:', err);
    return NextResponse.json(
      { error: `خطا در پردازش صدا: ${err?.message || 'نامشخص'}` },
      { status: 500 }
    );
  }
}

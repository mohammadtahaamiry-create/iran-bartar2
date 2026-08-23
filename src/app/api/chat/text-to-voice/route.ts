import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createZai } from '@/lib/zai';

export const maxDuration = 30;

interface TextToVoiceBody {
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'ابتدا وارد شوید' },
        { status: 401 }
      );
    }

    const body = (await req.json()) as TextToVoiceBody;
    const { text } = body;

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'متن خالی است' },
        { status: 400 }
      );
    }

    const zai = await createZai();

    const result = await zai.audio.tts.create({
      input: text.trim().slice(0, 2000), // Limit to avoid long generation
      response_format: 'mp3',
    });

    // SDK returns base64 audio data
    const audioData = result?.data || result?.audio || result?.base64 || '';

    if (!audioData) {
      console.error('TTS unexpected result:', JSON.stringify(result).slice(0, 500));
      return NextResponse.json(
        { error: 'خطا در تولید صدا' },
        { status: 500 }
      );
    }

    // If it's already a data URL, return as-is
    const audioUrl = audioData.startsWith('data:')
      ? audioData
      : `data:audio/mp3;base64,${audioData}`;

    return NextResponse.json({ audioUrl });
  } catch (err: any) {
    console.error('TTS error:', err);
    return NextResponse.json(
      { error: `خطا در تولید صدا: ${err?.message || 'نامشخص'}` },
      { status: 500 }
    );
  }
}

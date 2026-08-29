import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { buildAiClient, getModel } from '@/lib/ai-client';

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

    const { client } = await buildAiClient();
    const ttsModel = (await getModel('tts')) || 'openai/tts-1';

    const result = await client.audio.speech.create({
      model: ttsModel,
      input: text.trim().slice(0, 2000),
      voice: 'alloy',
      response_format: 'mp3',
    });

    // OpenAI SDK returns binary audio as a Response object with arrayBuffer()
    const arrayBuffer = await (result as any).arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const audioUrl = `data:audio/mp3;base64,${base64}`;

    return NextResponse.json({ audioUrl });
  } catch (err: any) {
    console.error('TTS error:', err);
    return NextResponse.json(
      { error: `خطا در تولید صدا: ${err?.message || 'نامشخص'}` },
      { status: 500 }
    );
  }
}

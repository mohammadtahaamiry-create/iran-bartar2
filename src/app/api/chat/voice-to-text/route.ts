import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';
import { execFile } from 'child_process';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

export const maxDuration = 30;

interface VoiceToTextBody {
  audioBase64: string; // base64 encoded audio (any format)
}

/** Convert any audio file to 16kHz mono WAV using ffmpeg */
function convertToWav(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      'ffmpeg',
      [
        '-y',
        '-i', inputPath,
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        outputPath,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export async function POST(req: NextRequest) {
  const tmpDir = os.tmpdir();
  let inputPath = '';
  let wavPath = '';

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

    // Write the received base64 audio to a temp file
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    inputPath = path.join(tmpDir, `asr_input_${Date.now()}.webm`);
    wavPath = path.join(tmpDir, `asr_output_${Date.now()}.wav`);
    await writeFile(inputPath, audioBuffer);

    // Convert to 16kHz mono WAV (best for ASR)
    await convertToWav(inputPath, wavPath);

    // Read the WAV file as base64
    const wavBuffer = await readFile(wavPath);
    const wavBase64 = wavBuffer.toString('base64');

    const zai = await ZAI.create();
    const result = await zai.audio.asr.create({
      file_base64: wavBase64,
    });

    // Log full result for debugging
    console.log('ASR raw result:', JSON.stringify(result).slice(0, 1000));

    // Extract text from response - handle various possible structures
    const text =
      result?.text ||
      result?.result ||
      result?.data?.text ||
      result?.data?.result ||
      (typeof result === 'string' ? result : '');

    if (!text || typeof text !== 'string' || !text.trim()) {
      console.error('ASR empty/unexpected result:', JSON.stringify(result).slice(0, 500));
      return NextResponse.json(
        { error: 'خطا در تشخیص گفتار. لطفاً واضح‌تر صحبت کنید.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err: any) {
    console.error('ASR error:', err?.message || err);
    return NextResponse.json(
      { error: `خطا در پردازش صدا: ${err?.message || 'نامشخص'}` },
      { status: 500 }
    );
  } finally {
    // Cleanup temp files
    try {
      if (inputPath) await unlink(inputPath).catch(() => {});
      if (wavPath) await unlink(wavPath).catch(() => {});
    } catch {}
  }
}

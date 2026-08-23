import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

// GET — public (non-secret) settings, accessible to all logged-in users
export async function GET() {
  try {
    const values = await getSettings([
      'site_title',
      'site_subtitle',
      'theme',
      'feature_deep_thinking',
      'feature_image_upload',
      'feature_voice_input',
      'feature_voice_output',
      'feature_user_signup',
      'max_message_length',
    ]);
    return NextResponse.json({ settings: values });
  } catch (err: any) {
    console.error('Public settings error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

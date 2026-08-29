import OpenAI from 'openai';
import { getSetting } from '@/lib/settings';

/**
 * AI Client — uses OpenAI SDK pointed at OpenRouter (or any OpenAI-compatible API).
 *
 * Settings used:
 * - ai_provider: 'openrouter' | 'openai' | 'zai' | 'custom'
 * - ai_api_key: the API key
 * - ai_base_url: the base URL (e.g. https://openrouter.ai/api/v1)
 * - chat_model: model used for text chat
 * - vision_model: model used for image analysis
 * - asr_model: model used for speech-to-text
 * - tts_model: model used for text-to-speech
 */

export async function buildAiClient(): Promise<{ client: OpenAI; baseUrl: string }> {
  const [apiKey, baseUrl] = await Promise.all([
    getSetting('ai_api_key'),
    getSetting('ai_base_url'),
  ]);

  if (!apiKey) {
    throw new Error('کلید API تنظیم نشده است. ابتدا کلید را در بخش تنظیمات وارد و ذخیره کنید.');
  }

  // Validate that the API key looks reasonable (ASCII, no Persian text)
  // A common mistake is accidentally pasting an error message instead of the real key.
  const isAscii = /^[\x00-\x7F]+$/.test(apiKey);
  if (!isAscii) {
    throw new Error(
      'کلید API نامعتبر است — مقدار فعلی حاوی کاراکترهای غیرانگلیسی است. لطفاً کلید واقعی OpenRouter (شروع‌شده با sk-or-v1-) را در فیلد کلید وارد و ذخیره کنید.'
    );
  }
  // Basic format check (OpenRouter keys start with sk-or- ; OpenAI keys with sk-)
  const trimmed = apiKey.trim();
  if (trimmed.length < 20) {
    throw new Error(
      'کلید API بسیار کوتاه است. لطفاً کلید کامل را از حساب OpenRouter خود کپی کنید.'
    );
  }

  const url = baseUrl || 'https://openrouter.ai/api/v1';

  const client = new OpenAI({
    apiKey: trimmed,
    baseURL: url,
    // OpenRouter requires these headers for proper routing.
    // NOTE: HTTP headers must be ASCII — Persian/Unicode chars are rejected.
    defaultHeaders: {
      'HTTP-Referer': 'https://iran-behtar.app',
      'X-Title': 'Iran Behtar AI Assistant',
    },
  });

  return { client, baseUrl: url };
}

/** Get the configured model name for a given capability, with fallback. */
export async function getModel(kind: 'chat' | 'vision' | 'asr' | 'tts'): Promise<string> {
  const map: Record<typeof kind, string> = {
    chat: 'chat_model',
    vision: 'vision_model',
    asr: 'asr_model',
    tts: 'tts_model',
  };
  const v = await getSetting(map[kind]);
  return v || '';
}

/** Backward-compat alias. */
export const createZai = buildAiClient;

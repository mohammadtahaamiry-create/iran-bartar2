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

  const url = baseUrl || 'https://openrouter.ai/api/v1';

  const client = new OpenAI({
    apiKey,
    baseURL: url,
    // OpenRouter requires these headers for proper routing
    defaultHeaders: {
      'HTTP-Referer': 'https://iran-behtar.app',
      'X-Title': 'ایران برتر',
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

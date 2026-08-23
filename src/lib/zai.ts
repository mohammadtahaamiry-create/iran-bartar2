import ZAI, { type ZAIConfig } from 'z-ai-web-dev-sdk';
import { getSetting } from '@/lib/settings';

/**
 * Build a ZAIConfig from the database settings.
 * Falls back to the SDK's default config file mechanism if no API key is configured.
 */
export async function buildZaiConfig(): Promise<Partial<ZAIConfig>> {
  const [apiKey, baseUrl] = await Promise.all([
    getSetting('zai_api_key'),
    getSetting('zai_base_url'),
  ]);

  const config: Partial<ZAIConfig> = {};
  if (apiKey) config.apiKey = apiKey;
  if (baseUrl) config.baseUrl = baseUrl;
  return config;
}

/**
 * Create a ZAI instance using the configured API key/base URL from the database.
 *
 * The official SDK's `ZAI.create()` reads from `.z-ai-config` file and does not accept
 * parameters. To use admin-configured credentials at runtime, we instantiate ZAI
 * directly via the (still exported) constructor with our own config object.
 */
export async function createZai(): Promise<ZAI> {
  const config = await buildZaiConfig();

  // The SDK's `loadConfig()` throws if no .z-ai-config file exists. We bypass it
  // by calling the constructor directly when we have a config from the DB.
  if (config.apiKey && config.baseUrl) {
    // `new ZAI(config)` is intentionally not typed in the SDK's d.ts but the
    // constructor accepts a ZAIConfig. Cast to any to avoid type friction.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (ZAI as any)(config);
  }

  // Fallback: try the default config mechanism (reads .z-ai-config)
  return ZAI.create();
}

/** Get the configured model name for a given capability, with catalog default fallback. */
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

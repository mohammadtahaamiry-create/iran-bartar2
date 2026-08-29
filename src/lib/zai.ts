/**
 * @deprecated Use `src/lib/ai-client.ts` instead.
 *
 * This file is kept only as a backward-compatibility shim.
 * It re-exports the new AI client that uses the OpenAI SDK pointed at
 * OpenRouter (or any OpenAI-compatible API).
 */
export { buildAiClient as buildZaiConfig, buildAiClient as createZai, getModel } from '@/lib/ai-client';

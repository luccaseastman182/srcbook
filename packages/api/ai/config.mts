import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { getConfig } from '../config.mjs';
import type { LanguageModel } from 'ai';
import { getDefaultModel, type AiProviderType } from '@srcbook/shared';

let requestCache = new Map();
let requestCount = 0;
const MAX_REQUESTS = 5;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Get the correct client and model configuration.
 * Throws an error if the given API key is not set in the settings.
 */
export async function getModel(): Promise<LanguageModel> {
  const config = await getConfig();
  const { aiModel, aiProvider, aiBaseUrl, glhfKey } = config;
  const model = aiModel || getDefaultModel(aiProvider as AiProviderType);

  // API rate limit monitoring and request throttling
  if (requestCount >= MAX_REQUESTS) {
    throw new Error('API rate limit exceeded');
  }
  requestCount++;

  // Implement caching for frequent requests
  const cacheKey = `${aiProvider}-${model}`;
  if (requestCache.has(cacheKey)) {
    const cachedResponse = requestCache.get(cacheKey);
    if (Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
      return cachedResponse.data;
    }
    requestCache.delete(cacheKey);
  }

  try {
    let response;
    switch (aiProvider as AiProviderType) {
      case 'openai':
        if (!config.openaiKey) {
          throw new Error('OpenAI API key is not set');
        }
        const openai = createOpenAI({
          compatibility: 'strict', // strict mode, enabled when using the OpenAI API
          apiKey: config.openaiKey,
        });
        response = await openai(model);
        break;

      case 'anthropic':
        if (!config.anthropicKey) {
          throw new Error('Anthropic API key is not set');
        }
        const anthropic = createAnthropic({ apiKey: config.anthropicKey });
        response = await anthropic(model);
        break;

      case 'Xai':
        if (!config.xaiKey) {
          throw new Error('Xai API key is not set');
        }
        const xai = createOpenAI({
          compatibility: 'compatible',
          baseURL: 'https://api.x.ai/v1',
          apiKey: config.xaiKey,
        });
        response = await xai(model);
        break;

      case 'custom':
        if (typeof aiBaseUrl !== 'string') {
          throw new Error('Local AI base URL is not set');
        }
        const openaiCompatible = createOpenAI({
          compatibility: 'compatible',
          apiKey: 'bogus', // required but unused
          baseURL: aiBaseUrl,
        });
        response = await openaiCompatible(model);
        break;

      case 'glhf':
        if (!glhfKey) {
          throw new Error('glhf.chat API key is not set');
        }
        const glhf = createOpenAI({
          compatibility: 'compatible',
          baseURL: 'https://glhf.chat/api/openai/v1',
          apiKey: glhfKey,
        });
        response = await glhf(model);
        break;
    }

    // Cache the response
    requestCache.set(cacheKey, { data: response, timestamp: Date.now() });
    return response;

  } catch (error) {
    // Handle rate limit errors gracefully
    if (error.message.includes('rate limit')) {
      throw new Error('Rate limit exceeded, please try again later');
    }
    throw error;
  } finally {
    requestCount--;
  }
}

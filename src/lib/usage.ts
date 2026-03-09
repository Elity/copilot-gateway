import type { AnthropicResponse } from "./anthropic-types.ts";

interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

export const mapOpenAIUsage = (
  usage?: OpenAIUsage,
): AnthropicResponse["usage"] => {
  const cachedTokens = usage?.prompt_tokens_details?.cached_tokens;
  return {
    input_tokens: (usage?.prompt_tokens ?? 0) - (cachedTokens ?? 0),
    output_tokens: usage?.completion_tokens ?? 0,
    ...(cachedTokens !== undefined && {
      cache_read_input_tokens: cachedTokens,
    }),
  };
};

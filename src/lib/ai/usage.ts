import type Anthropic from "@anthropic-ai/sdk";

// AI usage accounting — server-only. Turns an Anthropic response's `usage` into a
// running token total and a USD cost, so we can track how much the advisor chat
// and insights generation cost us per user (see lib/db/ai-usage + /dev/usage).

// Per-1M-token USD prices, from the Claude API pricing reference:
//   Sonnet 4.5 / 4.6 → $3 in / $15 out ; Haiku 4.5 → $1 in / $5 out
// Cache reads bill ~0.1× input and 5-minute cache writes ~1.25× input. Nothing
// in the app sets cache_control today, so those token fields are 0 — but we
// price them anyway so the numbers stay correct if caching is ever turned on.
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

export function emptyUsage(): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, cacheReadInputTokens: 0, cacheCreationInputTokens: 0 };
}

/**
 * Fold one response's `usage` into an accumulator. A single advisor turn makes
 * 1–6 tool-loop calls plus a forced-final, so usage must be summed across them
 * rather than read once. Mutates and returns `acc` for convenient chaining.
 */
export function addUsage(acc: TokenUsage, u: Anthropic.Usage | null | undefined): TokenUsage {
  if (!u) return acc;
  acc.inputTokens += u.input_tokens ?? 0;
  acc.outputTokens += u.output_tokens ?? 0;
  acc.cacheReadInputTokens += u.cache_read_input_tokens ?? 0;
  acc.cacheCreationInputTokens += u.cache_creation_input_tokens ?? 0;
  return acc;
}

/** USD cost of a usage total for a model. Unknown models cost 0 (and should be added above). */
export function costUsd(model: string, u: TokenUsage): number {
  const p = PRICING[model];
  if (!p) return 0;
  const per = (rate: number) => rate / 1_000_000;
  return (
    u.inputTokens * per(p.input) +
    u.outputTokens * per(p.output) +
    u.cacheReadInputTokens * per(p.input * 0.1) +
    u.cacheCreationInputTokens * per(p.input * 1.25)
  );
}

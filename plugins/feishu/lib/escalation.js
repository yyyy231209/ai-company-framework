/**
 * ai-company-framework — important-event escalation with per-rule dedupe window
 * (收编自 dsh-feishu-bridge@0.3.1).
 *
 * Only a compact rule payload reaches the boss mirror group; conversation text
 * stays in the per-company log and the employee transcript.
 */
const DEDUPE_WINDOW_MS = 600_000;

export function createEscalationState() {
  return { last: new Map(), counters: {} };
}

/**
 * @param state - escalation state from createEscalationState()
 * @param event - { rule, level?, text? }
 * @returns a deduped action { rule, level, text, at } or null when suppressed
 */
export function maybeEscalate(state, event) {
  const now = Date.now();
  const last = state.last.get(event.rule);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return null;
  state.last.set(event.rule, now);
  state.counters[event.rule] = (state.counters[event.rule] ?? 0) + 1;
  return {
    rule: event.rule,
    level: event.level ?? 'warn',
    text: event.text ?? event.rule,
    at: now,
  };
}

/**
 * ai-company-framework — Feishu message routing (收编自 dsh-feishu-bridge@0.3.1).
 *
 * Deterministic, never falls back to "newest team". Order:
 *   1. group message with an explicit group binding → that binding's target
 *   2. staff bot p2p → its bound member
 *   3. boss bot p2p → its company captain
 *   4. unknown bot / unbound → null (dropped + logged)
 */

export function resolveRoute(registry, botId, chatId, chatType) {
  const bot = registry.bots[botId];
  if (!bot) return null;

  const group = chatType === 'group' ? registry.groups[chatId] : undefined;
  if (group) {
    return {
      kind: group.target?.kind,
      companyKey: group.target?.companyKey ?? bot.companyKey,
      staffMemberId: group.target?.staffMemberId ?? null,
      via: 'group-binding',
      botId,
      chatId,
      chatType,
    };
  }

  if (bot.kind === 'staff' && bot.staffMemberId) {
    return {
      kind: 'staff',
      companyKey: bot.companyKey,
      staffMemberId: bot.staffMemberId,
      via: 'staff-p2p',
      botId,
      chatId,
      chatType,
    };
  }

  if (bot.kind === 'boss') {
    return {
      kind: 'boss',
      companyKey: bot.companyKey,
      staffMemberId: null,
      via: 'boss-p2p',
      botId,
      chatId,
      chatType,
    };
  }

  return null;
}

/**
 * Resolve the reply channel for an inbound message: group replies go to the
 * group (chat_id), p2p replies go back to the sender's open_id.
 */
export function replyTarget(route, senderOpenId) {
  if (route.chatType === 'group') {
    return { receiveId: route.chatId, receiveIdType: 'chat_id' };
  }
  return { receiveId: senderOpenId, receiveIdType: 'open_id' };
}

/** Allow-list check for one inbound message. */
export function isAllowed(route, registry, senderOpenId) {
  const group = route.chatType === 'group' ? registry.groups[route.chatId] : null;
  const allowUsers = group?.allowUsers ?? [];
  if (!Array.isArray(allowUsers) || allowUsers.length === 0) return true;
  return Boolean(senderOpenId) && allowUsers.includes(senderOpenId);
}

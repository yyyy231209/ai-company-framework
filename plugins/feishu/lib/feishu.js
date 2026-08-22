/**
 * ai-company-framework — Feishu transport layer (official @larksuiteoapi/node-sdk,
 * 收编自 dsh-feishu-bridge@0.3.1).
 *
 * - Long-connection mode (WebSocket): receives `im.message.receive_v1` events
 *   WITHOUT a public IP / callback URL — perfect for a local desktop harness.
 * - Sends: app bot messages (`client.im.message.create`), custom-bot group
 *   webhook for the mirror/notification channel.
 * - One transport instance per bot (each owns its own Client + WSClient), so
 *   N active bots = N independent long connections.
 */
import * as lark from '@larksuiteoapi/node-sdk';

/** Extract readable text from an im.message.receive_v1 event; null when unusable. */
export function normalizeReceiveEvent(data) {
  try {
    const message = data?.message;
    if (!message || typeof message.message_type !== 'string') return null;
    const senderId = data?.sender?.sender_id ?? {};
    let text = '';
    if (message.message_type === 'text') {
      try {
        text = JSON.parse(message.content ?? '{}')?.text ?? '';
      } catch {
        text = message.content ?? '';
      }
    } else if (message.message_type === 'post') {
      try {
        const post = JSON.parse(message.content ?? '{}');
        const lines = (post?.content ?? []).flatMap((node) => node.map((item) => item.text ?? ''));
        text = [post?.title ?? '', ...lines].filter(Boolean).join('\n');
      } catch {
        text = '';
      }
    }
    if (typeof text !== 'string') text = '';
    // Strip @_user_1 style mentions inside group texts.
    text = text.replace(/@_user_\d+/g, '').trim();
    const mentioned = Array.isArray(message.mentions) && message.mentions.length > 0;
    return {
      eventId: data?.event_id ?? data?.header?.event_id ?? null,
      chatId: message.chat_id,
      chatType: message.chat_type === 'p2p' ? 'p2p' : 'group',
      messageType: message.message_type,
      text,
      senderOpenId: senderId.open_id ?? null,
      senderType: data?.sender?.sender_type ?? '',
      mentioned,
    };
  } catch {
    return null;
  }
}

/**
 * Build a Feishu transport bound to one self-built app.
 * @returns {{ configured, mirrorConfigured, sendText, sendWebhook, getState, close, client, rawClient }}
 */
export function createFeishuTransport({ appId, appSecret, mirrorWebhook, logger, onMessage }) {
  let client = null;
  let ws = null;
  let state = 'idle';
  let lastError = null;

  const log = (level, text) => {
    if (!logger) return;
    try {
      logger[level]?.(`ai-company-feishu: ${text}`);
    } catch {
      /* logger shape varies */
    }
  };

  if (appId && appSecret) {
    try {
      client = new lark.Client({
        appId,
        appSecret,
        appType: lark.AppType.SelfBuild,
        domain: lark.Domain.Feishu,
        loggerLevel: lark.LoggerLevel.warn,
      });
      const dispatcher = new lark.EventDispatcher({}).register({
        'im.message.receive_v1': (data) => {
          const normalized = normalizeReceiveEvent(data);
          if (normalized === null) return;
          Promise.resolve()
            .then(() => onMessage(normalized))
            .catch((error) => log('warn', `message handler failed: ${String(error)}`));
        },
      });
      ws = new lark.WSClient({
        appId,
        appSecret,
        domain: lark.Domain.Feishu,
        loggerLevel: lark.LoggerLevel.warn,
        autoReconnect: true,
        handshakeTimeoutMs: 30000,
        onReady: () => {
          state = 'connected';
          lastError = null;
          log('info', 'Feishu long connection ready');
        },
        onReconnecting: () => {
          state = 'reconnecting';
          log('warn', 'Feishu long connection reconnecting');
        },
        onReconnected: () => {
          state = 'connected';
          log('info', 'Feishu long connection reconnected');
        },
        onError: (error) => {
          state = 'failed';
          lastError = String(error?.message ?? error);
          log('error', `long connection failed: ${lastError}`);
        },
      });
      ws.start({ eventDispatcher: dispatcher }).catch((error) => {
        state = 'failed';
        lastError = String(error?.message ?? error);
        log('error', `long connection start failed: ${lastError}`);
      });
    } catch (error) {
      state = 'failed';
      lastError = String(error?.message ?? error);
      log('error', `transport init failed: ${lastError}`);
    }
  }

  async function sendText(receiveId, receiveIdType, text) {
    if (client === null) throw new Error('ai-company-feishu: not configured (appId/appSecret missing)');
    const result = await client.im.message.create({
      params: { receive_id_type: receiveIdType },
      data: {
        receive_id: receiveId,
        msg_type: 'text',
        content: JSON.stringify({ text }),
      },
    });
    if (result?.code !== 0) {
      throw new Error(`feishu send failed: code ${result?.code} ${result?.msg ?? ''}`);
    }
    return result;
  }

  async function sendWebhook(text) {
    if (!mirrorWebhook) throw new Error('ai-company-feishu: mirrorWebhook not configured');
    const response = await fetch(mirrorWebhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ msg_type: 'text', content: { text } }),
    });
    const body = await response.json().catch(() => ({}));
    if (body?.code !== 0) {
      throw new Error(`feishu webhook failed: HTTP ${response.status} code ${body?.code ?? '?'} ${body?.msg ?? ''}`);
    }
    return body;
  }

  return {
    configured: Boolean(appId && appSecret),
    mirrorConfigured: Boolean(mirrorWebhook),
    sendText,
    sendWebhook,
    getState: () => ({ state, lastError }),
    rawClient: () => client,
    close: () => {
      try {
        ws?.close({ force: true });
      } catch {
        /* already closed */
      }
      ws = null;
      client = null;
      state = 'idle';
    },
  };
}

/** Validate app credentials by requesting a tenant_access_token (code 0 = valid). */
export async function validateCredentials(appId, appSecret) {
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const body = await response.json().catch(() => ({}));
  if (body?.code === 0) return { ok: true };
  return { ok: false, code: body?.code, message: body?.msg ?? `HTTP ${response.status}` };
}

/** List chats the bot is in. */
export async function listChats(transport) {
  const client = transport.rawClient();
  if (!client) throw new Error('transport not configured');
  const result = await client.im.chat.list({ params: { page_size: 100 } });
  if (result?.code !== 0) throw new Error(`list chats failed: ${result?.code} ${result?.msg ?? ''}`);
  return (result?.data?.items ?? []).map((item) => ({
    chat_id: item.chat_id,
    name: item.name ?? item.chat_id,
  }));
}

/** Create a group (as the app). */
export async function createChat(transport, name) {
  const client = transport.rawClient();
  if (!client) throw new Error('transport not configured');
  const result = await client.im.chat.create({ data: { name } });
  if (result?.code !== 0) throw new Error(`create chat failed: ${result?.code} ${result?.msg ?? ''}`);
  return result?.data?.chat_id ?? null;
}

/** Add members/bots to a group. member_id_type: 'app_id' | 'open_id' | 'user_id' | 'union_id'. */
export async function addChatMembers(transport, chatId, idList, memberIdType = 'open_id') {
  const client = transport.rawClient();
  if (!client) throw new Error('transport not configured');
  const result = await client.im.chat.members.create({
    params: { chat_id: chatId, member_id_type: memberIdType },
    data: { id_list: idList },
  });
  if (result?.code !== 0) throw new Error(`add chat members failed: ${result?.code} ${result?.msg ?? ''}`);
  return result?.data ?? null;
}

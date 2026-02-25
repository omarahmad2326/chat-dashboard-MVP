import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizeMessages, getConversationById } from '@/lib/normalizer';
import { normalizeConversations } from '@/lib/normalizer';
import { addMessage } from '@/lib/data-store';
import cache from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { ApiResponse, ApiError, ConversationDetail, Message } from '@/lib/types';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ConversationDetail | Message> | ApiError>
) {
  const startTime = Date.now();

  if (req.method === 'GET') {
    return handleGet(req, res, startTime);
  } else if (req.method === 'POST') {
    return handlePost(req, res, startTime);
  } else {
    const duration = Date.now() - startTime;
    logRequest(req.method!, req.url!, 405, { duration });
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    });
  }
}

function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ConversationDetail> | ApiError>,
  startTime: number
) {
  try {
    const { id } = req.query;
    const conversationId = typeof id === 'string' ? id : '';

    const cacheKey = `messages:${conversationId}`;
    const cached = cache.get<ConversationDetail>(cacheKey);

    if (cached) {
      const duration = Date.now() - startTime;
      logRequest(req.method || 'GET', req.url || '', 200, { count: cached.messages.length, cached: true, duration });
      return res.status(200).json({
        success: true,
        data: cached,
        meta: { count: cached.messages.length, cached: true },
      });
    }

    const rawConv = getConversationById(conversationId);
    if (!rawConv) {
      const duration = Date.now() - startTime;
      logRequest(req.method || 'GET', req.url || '', 404, { duration });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Conversation ${conversationId} not found` },
      });
    }

    const conversations = normalizeConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) {
      const duration = Date.now() - startTime;
      logRequest(req.method || 'GET', req.url || '', 404, { duration });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Conversation ${conversationId} not found` },
      });
    }

    const messages = normalizeMessages(conversationId);

    const detail: ConversationDetail = {
      conversationId,
      fan: {
        id: conversation.fan.id,
        name: conversation.fan.name,
        avatar: conversation.fan.avatar,
      },
      messages,
    };

    cache.set(cacheKey, detail);

    const duration = Date.now() - startTime;
    logRequest(req.method || 'GET', req.url || '', 200, { count: messages.length, cached: false, duration });

    res.status(200).json({
      success: true,
      data: detail,
      meta: { count: messages.length, cached: false },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logRequest(req.method || 'GET', req.url || '', 500, { duration });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
}

function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Message> | ApiError>,
  startTime: number
) {
  try {
    const { id } = req.query;
    const conversationId = typeof id === 'string' ? id : '';
    const { body, from } = req.body;

    if (!body || typeof body !== 'string') {
      const duration = Date.now() - startTime;
      logRequest(req.method!, req.url!, 400, { duration });
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Message body is required' },
      });
    }

    if (!from || (from !== 'creator' && from !== 'fan')) {
      const duration = Date.now() - startTime;
      logRequest(req.method!, req.url!, 400, { duration });
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Valid from field is required (creator or fan)' },
      });
    }

    const rawConv = getConversationById(conversationId);
    if (!rawConv) {
      const duration = Date.now() - startTime;
      logRequest(req.method!, req.url!, 404, { duration });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Conversation ${conversationId} not found` },
      });
    }

    const newMessage = {
      msg_id: `msg_${Date.now()}`,
      body,
      from,
      sent_at: new Date().toISOString(),
      attachments: [],
    };

    addMessage(conversationId, newMessage);

    // Invalidate caches
    cache.del(`messages:${conversationId}`);
    cache.flushAll(); // Clear all conversation list caches

    const duration = Date.now() - startTime;
    logRequest(req.method || 'POST', req.url || '', 201, { duration });

    res.status(201).json({
      success: true,
      data: {
        id: newMessage.msg_id,
        body: newMessage.body,
        from: newMessage.from as 'creator' | 'fan',
        sentAt: newMessage.sent_at,
        attachments: [],
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logRequest(req.method || 'POST', req.url || '', 500, { duration });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
}

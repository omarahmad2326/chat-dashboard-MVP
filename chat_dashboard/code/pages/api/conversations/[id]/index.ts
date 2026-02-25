import type { NextApiRequest, NextApiResponse } from 'next';
import { updateConversationTags } from '@/lib/data-store';
import { normalizeConversations } from '@/lib/normalizer';
import cache from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { ApiResponse, ApiError } from '@/lib/types';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any> | ApiError>
) {
  const startTime = Date.now();

  if (req.method !== 'PATCH') {
    const duration = Date.now() - startTime;
    logRequest(req.method!, req.url!, 405, { duration });
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    });
  }

  try {
    const { id } = req.query;
    const conversationId = typeof id === 'string' ? id : '';
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      const duration = Date.now() - startTime;
      logRequest(req.method, req.url!, 400, { duration });
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Tags array is required' },
      });
    }

    const updated = updateConversationTags(conversationId, tags);

    if (!updated) {
      const duration = Date.now() - startTime;
      logRequest(req.method, req.url!, 404, { duration });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Conversation ${conversationId} not found` },
      });
    }

    // Invalidate all conversation list caches
    cache.flushAll();

    const conversations = normalizeConversations();
    const conversation = conversations.find(c => c.id === conversationId);

    const duration = Date.now() - startTime;
    logRequest(req.method, req.url!, 200, { duration });

    res.status(200).json({
      success: true,
      data: {
        id: conversation!.id,
        fan: {
          id: conversation!.fan.id,
          name: conversation!.fan.name,
          tags: conversation!.fan.tags,
        },
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logRequest(req.method!, req.url!, 500, { duration });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizeConversations } from '@/lib/normalizer';
import cache from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { ApiResponse, ApiError, Conversation } from '@/lib/types';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Conversation[]> | ApiError>
) {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    const duration = Date.now() - startTime;
    logRequest(req.method!, req.url!, 405, { duration });
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    });
  }

  try {
    const { status, search, sort } = req.query;
    const statusFilter = typeof status === 'string' ? status : undefined;
    const searchQuery = typeof search === 'string' ? search : undefined;
    const sortBy = typeof sort === 'string' ? sort : 'recent';
    
    const cacheKey = `conversations:${statusFilter || 'all'}:${searchQuery || 'none'}:${sortBy}`;
    const cached = cache.get<Conversation[]>(cacheKey);

    if (cached) {
      const duration = Date.now() - startTime;
      logRequest(req.method, req.url!, 200, { count: cached.length, cached: true, duration });
      return res.status(200).json({
        success: true,
        data: cached,
        meta: { count: cached.length, cached: true },
      });
    }

    const conversations = normalizeConversations(statusFilter, searchQuery, sortBy);
    cache.set(cacheKey, conversations);

    const duration = Date.now() - startTime;
    logRequest(req.method, req.url!, 200, { count: conversations.length, cached: false, duration });

    res.status(200).json({
      success: true,
      data: conversations,
      meta: { count: conversations.length, cached: false },
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

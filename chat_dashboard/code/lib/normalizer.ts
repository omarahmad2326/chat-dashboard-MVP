import { Conversation, Message, Fan } from './types';
import { getConversationsData, getReferencedMessagesData } from './data-store';

// Normalize various timestamp formats to ISO 8601
function normalizeTimestamp(timestamp: any): string {
  if (typeof timestamp === 'number') {
    return new Date(timestamp * 1000).toISOString();
  }
  
  if (typeof timestamp === 'string') {
    // Already ISO format
    if (timestamp.match(/^\d{4}-\d{2}-\d{2}T/)) {
      return timestamp;
    }
    
    // Try parsing other formats
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  
  return new Date().toISOString();
}

function generateAvatarFallback(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.toLowerCase().replace(/\s+/g, '')}`;
}

export function normalizeConversations(statusFilter?: string, searchQuery?: string, sortBy?: string): Conversation[] {
  const rawConversations = getConversationsData();
  let conversations = rawConversations.map((conv: any) => {
    const fan: Fan = {
      id: conv.fan_data.fanId,
      name: conv.fan_data.Name || conv.fan_data.name,
      avatar: conv.fan_data.avatar || generateAvatarFallback(conv.fan_data.Name || conv.fan_data.name),
      totalSpent: conv.fan_data.TotalSpent ?? conv.fan_data.total_spent ?? 0,
      subscriptionTier: (conv.fan_data.subscription_tier || 'Free') as "Free" | "Basic" | "VIP",
      memberSince: normalizeTimestamp(conv.fan_data.member_since),
      tags: conv.fan_data.tags || [],
      isOnline: conv.fan_data.is_online ?? false,
    };

    let lastMessage: Message | null = null;
    if (conv.last_message) {
      lastMessage = {
        id: conv.last_message.msg_id,
        body: conv.last_message.body,
        from: conv.last_message.from,
        sentAt: normalizeTimestamp(conv.last_message.sent_at),
        attachments: conv.last_message.attachments || [],
      };
    }

    const status = (conv.Status || 'active').toLowerCase() as "active" | "expired";

    return {
      id: conv.conversation_id,
      fan,
      lastMessage,
      unreadCount: conv.unread || 0,
      totalMessages: conv.total_messages || 0,
      status,
    };
  });

  // Apply filters
  if (statusFilter && statusFilter !== 'all') {
    conversations = conversations.filter((c: Conversation) => c.status === statusFilter);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    conversations = conversations.filter((c: Conversation) => 
      c.fan.name.toLowerCase().includes(query) ||
      (c.lastMessage?.body.toLowerCase().includes(query))
    );
  }

  // Apply sorting
  if (sortBy === 'revenue') {
    conversations.sort((a: Conversation, b: Conversation) => b.fan.totalSpent - a.fan.totalSpent);
  } else if (sortBy === 'unread') {
    conversations.sort((a: Conversation, b: Conversation) => b.unreadCount - a.unreadCount);
  } else {
    // Default: most recent
    conversations.sort((a: Conversation, b: Conversation) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  return conversations;
}

export function normalizeMessages(conversationId: string): Message[] {
  const rawConversations = getConversationsData();
  const referencedMessages = getReferencedMessagesData();
  
  const conv = rawConversations.find(
    (c: any) => c.conversation_id === conversationId
  );

  if (!conv) {
    return [];
  }

  let messages: any[] = [];

  // Messages can be stored inline or referenced
  if (conv.inline_messages) {
    messages = conv.inline_messages;
  } else if (conv.message_refs && referencedMessages[conversationId]) {
    messages = referencedMessages[conversationId];
  }

  return messages
    .map((msg: any) => ({
      id: msg.msg_id,
      body: msg.body,
      from: msg.from,
      sentAt: normalizeTimestamp(msg.sent_at),
      attachments: msg.attachments || [],
    }))
    .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}

export function getConversationById(conversationId: string) {
  const rawConversations = getConversationsData();
  return rawConversations.find(
    (c: any) => c.conversation_id === conversationId
  );
}

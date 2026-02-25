import rawData from '../raw-mock-data.json';

// In-memory store for mutations (resets on server restart)
let conversationsData = JSON.parse(JSON.stringify(rawData.raw_conversations));
let referencedMessagesData = JSON.parse(JSON.stringify(rawData.referenced_messages));

export function getConversationsData() {
  return conversationsData;
}

export function getReferencedMessagesData() {
  return referencedMessagesData;
}

export function addMessage(conversationId: string, message: any) {
  const conv = conversationsData.find((c: any) => c.conversation_id === conversationId);
  
  if (!conv) {
    return null;
  }

  // Add to appropriate storage
  if (conv.inline_messages) {
    conv.inline_messages.push(message);
  } else if (conv.message_refs) {
    if (!referencedMessagesData[conversationId]) {
      referencedMessagesData[conversationId] = [];
    }
    referencedMessagesData[conversationId].push(message);
  }

  // Update last message and count
  conv.last_message = {
    msg_id: message.msg_id,
    body: message.body,
    from: message.from,
    sent_at: message.sent_at,
  };

  conv.total_messages = (conv.total_messages || 0) + 1;

  return message;
}

export function updateConversationTags(conversationId: string, tags: string[]) {
  const conv = conversationsData.find((c: any) => c.conversation_id === conversationId);
  
  if (!conv) {
    return null;
  }

  conv.fan_data.tags = tags;
  return conv;
}

export function resetData() {
  conversationsData = JSON.parse(JSON.stringify(rawData.raw_conversations));
  referencedMessagesData = JSON.parse(JSON.stringify(rawData.referenced_messages));
}

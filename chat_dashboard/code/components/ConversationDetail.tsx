import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ConversationDetail as ConversationDetailType } from '@/lib/types';

interface Props {
  conversationId: string | null;
  onMessageSent?: () => void;
}

async function fetchMessages(id: string): Promise<ConversationDetailType> {
  const res = await fetch(`/api/conversations/${id}/messages`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

async function sendMessage(conversationId: string, body: string, from: 'creator' | 'fan') {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, from }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

async function updateTags(conversationId: string, tags: string[]) {
  const res = await fetch(`/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export default function ConversationDetail({ conversationId, onMessageSent }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState('');
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
  });

  const sendMutation = useMutation({
    mutationFn: ({ body, from }: { body: string; from: 'creator' | 'fan' }) =>
      sendMessage(conversationId!, body, from),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      onMessageSent?.();
      setReplyText('');
    },
  });

  const tagMutation = useMutation({
    mutationFn: (tags: string[]) => updateTags(conversationId!, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      setShowTagEditor(false);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    sendMutation.mutate({ body: replyText, from: 'creator' });
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || !data) return;
    
    const currentTags = getCurrentTags();
    if (!currentTags.includes(tagInput.trim())) {
      tagMutation.mutate([...currentTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = getCurrentTags();
    tagMutation.mutate(currentTags.filter(t => t !== tagToRemove));
  };

  const getCurrentTags = (): string[] => {
    // Try to get tags from cache
    const conversationsData = queryClient.getQueryData<any>(['conversations']);
    if (conversationsData) {
      const conv = conversationsData.find((c: any) => c.id === conversationId);
      return conv?.fan?.tags || [];
    }
    return [];
  };

  useEffect(() => {
    if (data?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.messages]);

  if (!conversationId) {
    return (
      <div className="conversation-detail">
        <div className="empty-detail">
          <div className="empty-icon">💬</div>
          <p>Select a conversation to view messages</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="conversation-detail">
        <div className="loading-detail">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversation-detail">
        <div className="error-detail">Failed to load messages</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="conversation-detail">
        <div className="empty-detail">No messages found</div>
      </div>
    );
  }

  return (
    <div className="conversation-detail">
      <div className="detail-header">
        <div className="header-avatar">
          <img src={data.fan.avatar} alt={data.fan.name} />
        </div>
        <div className="header-info">
          <h2>{data.fan.name}</h2>
          <div className="tags-container">
            {getCurrentTags().map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <button 
                  onClick={() => handleRemoveTag(tag)}
                  className="tag-remove"
                  title="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}
            <button 
              onClick={() => setShowTagEditor(!showTagEditor)}
              className="tag-add-btn"
              title="Add tag"
            >
              + Tag
            </button>
          </div>
          {showTagEditor && (
            <div className="tag-editor">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Enter tag name"
                className="tag-input"
              />
              <button onClick={handleAddTag} className="tag-save-btn">Add</button>
            </div>
          )}
        </div>
      </div>
      <div className="messages-container">
        {data.messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.from === 'creator' ? 'message-creator' : 'message-fan'}`}
          >
            <div className="message-bubble">
              <div className="message-body">{message.body}</div>
              {message.attachments.length > 0 && (
                <div className="message-attachments">
                  {message.attachments.map((att, idx) => (
                    <div key={idx} className="attachment">
                      {att.type === 'tip' && (
                        <span className="attachment-tip">💰 ${att.amount} tip</span>
                      )}
                      {att.type === 'ppv' && (
                        <span className="attachment-ppv">🔒 ${att.price} — {att.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="message-time">
                {format(new Date(message.sentAt), 'MMM d, h:mm a')}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="reply-container">
        <form onSubmit={handleSendMessage} className="reply-form">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type a message..."
            className="reply-input"
            disabled={sendMutation.isPending}
          />
          <button 
            type="submit" 
            className="reply-send-btn"
            disabled={!replyText.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

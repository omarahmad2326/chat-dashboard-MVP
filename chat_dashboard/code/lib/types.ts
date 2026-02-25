export interface Conversation {
  id: string;
  fan: Fan;
  lastMessage: Message | null;
  unreadCount: number;
  totalMessages: number;
  status: "active" | "expired";
}

export interface Fan {
  id: string;
  name: string;
  avatar: string;
  totalSpent: number;
  subscriptionTier: "Free" | "Basic" | "VIP";
  memberSince: string;
  tags: string[];
  isOnline: boolean;
}

export interface Message {
  id: string;
  body: string;
  from: "creator" | "fan";
  sentAt: string;
  attachments: Attachment[];
}

export type Attachment =
  | { type: "tip"; amount: number }
  | { type: "ppv"; price: number; label: string };

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: { count?: number; cached?: boolean };
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export interface ConversationDetail {
  conversationId: string;
  fan: {
    id: string;
    name: string;
    avatar: string;
  };
  messages: Message[];
}

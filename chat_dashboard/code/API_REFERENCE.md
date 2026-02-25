# Chatter CRM — API Reference

> This documents the **expected API** that candidates should build as their middleware layer.
> These are the clean, normalised response shapes — not the raw mock data.

---

## Base URL

```
http://localhost:3000/api
```

## Response Envelope

All endpoints return a consistent envelope:

```typescript
// Success
{
  success: true,
  data: T,
  meta?: {
    count?: number,
    cached?: boolean
  }
}

// Error
{
  success: false,
  error: {
    code: string,    // e.g. "NOT_FOUND", "BAD_REQUEST", "INTERNAL_ERROR"
    message: string
  }
}
```

---

## Endpoints

### `GET /api/conversations`

Returns all conversations, normalised and sorted by most recent activity.

**Query Parameters**

| Param    | Type   | Description                                      |
|----------|--------|--------------------------------------------------|
| `status` | string | Filter by status: `active`, `expired`, `all`     |
| `search` | string | Search fan name or last message body (Tier 2)    |
| `sort`   | string | Sort field: `recent` (default), `revenue`, `unread` (Tier 2) |

**Response — `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": "conv_001",
      "fan": {
        "id": "fan_001",
        "name": "Marcus Johnson",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
        "totalSpent": 487.50,
        "subscriptionTier": "VIP",
        "memberSince": "2024-08-15T00:00:00Z",
        "tags": ["High spender", "Regular tipper"],
        "isOnline": true
      },
      "lastMessage": {
        "id": "msg_015",
        "body": "Just unlocked the new set, absolutely incredible work 🔥",
        "from": "fan",
        "sentAt": "2026-02-19T09:32:00Z"
      },
      "unreadCount": 2,
      "totalMessages": 15,
      "status": "active"
    }
  ],
  "meta": {
    "count": 12,
    "cached": false
  }
}
```

**Key normalisation rules:**

- All field names in `camelCase`
- All timestamps in ISO 8601 (UTC)
- `status` always lowercase
- `fan.tags` defaults to `[]` if null/missing
- `fan.avatar` returns a fallback string (e.g. initials URL) if null
- `fan.isOnline` defaults to `false` if missing
- `lastMessage` can be `null` (e.g. `conv_012`) — handle gracefully

---

### `GET /api/conversations/:id/messages`

Returns the full message thread for a conversation, sorted chronologically.

**Response — `200 OK`**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv_001",
    "fan": {
      "id": "fan_001",
      "name": "Marcus Johnson",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus"
    },
    "messages": [
      {
        "id": "msg_001",
        "body": "Hey Marcus! Thanks for subscribing 💕",
        "from": "creator",
        "sentAt": "2024-08-15T12:00:00Z",
        "attachments": []
      },
      {
        "id": "msg_002",
        "body": "Thanks! Been following you on IG for a while",
        "from": "fan",
        "sentAt": "2024-08-15T12:05:00Z",
        "attachments": []
      },
      {
        "id": "msg_006",
        "body": "Just sent a $25 tip for the custom set request!",
        "from": "fan",
        "sentAt": "2024-08-17T14:20:00Z",
        "attachments": [
          { "type": "tip", "amount": 25.00 }
        ]
      },
      {
        "id": "msg_008",
        "body": "Here's your custom set! Hope you love it 💜",
        "from": "creator",
        "sentAt": "2024-08-18T16:00:00Z",
        "attachments": [
          { "type": "ppv", "price": 15.00, "label": "Custom Set — Marcus" }
        ]
      }
    ]
  },
  "meta": {
    "count": 15,
    "cached": true
  }
}
```

**Key normalisation rules:**

- Messages sourced from `inline_messages` OR `referenced_messages` (never both — merge into single array)
- Sorted ascending by `sentAt`
- `attachments` defaults to `[]` if null/missing
- All timestamps normalised to ISO 8601

**Response — `404 Not Found`**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Conversation conv_999 not found"
  }
}
```

---

### `POST /api/conversations/:id/messages` *(Tier 2)*

Send a reply in a conversation. Should invalidate the cached conversation list and message thread.

**Request Body**

```json
{
  "body": "Thanks for the love! New content dropping tomorrow 🔥",
  "from": "creator"
}
```

**Response — `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "msg_016",
    "body": "Thanks for the love! New content dropping tomorrow 🔥",
    "from": "creator",
    "sentAt": "2026-02-19T10:15:00Z",
    "attachments": []
  }
}
```

**Response — `400 Bad Request`**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Message body is required"
  }
}
```

---

### `PATCH /api/conversations/:id` *(Tier 2)*

Update conversation metadata (e.g. fan tags).

**Request Body**

```json
{
  "tags": ["High spender", "Regular tipper", "Custom buyer"]
}
```

**Response — `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "conv_001",
    "fan": {
      "id": "fan_001",
      "name": "Marcus Johnson",
      "tags": ["High spender", "Regular tipper", "Custom buyer"]
    }
  }
}
```

---

## TypeScript Types

For reference — candidates may use these or define their own.

```typescript
interface Conversation {
  id: string;
  fan: Fan;
  lastMessage: Message | null;
  unreadCount: number;
  totalMessages: number;
  status: "active" | "expired";
}

interface Fan {
  id: string;
  name: string;
  avatar: string;
  totalSpent: number;
  subscriptionTier: "Free" | "Basic" | "VIP";
  memberSince: string; // ISO 8601
  tags: string[];
  isOnline: boolean;
}

interface Message {
  id: string;
  body: string;
  from: "creator" | "fan";
  sentAt: string; // ISO 8601
  attachments: Attachment[];
}

type Attachment =
  | { type: "tip"; amount: number }
  | { type: "ppv"; price: number; label: string };

interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: { count?: number; cached?: boolean };
}

interface ApiError {
  success: false;
  error: { code: string; message: string };
}
```

---

## Status Codes

| Code | Usage |
|------|-------|
| `200` | Successful GET, PATCH |
| `201` | Successful POST (message created) |
| `400` | Bad request (missing body, invalid params) |
| `404` | Conversation not found |
| `500` | Unexpected server error |

---

## Logging

Every request should produce a structured console log:

```
[2026-02-19T09:32:00Z] GET /api/conversations — 200 (12 results, cached: false, 8ms)
[2026-02-19T09:32:01Z] GET /api/conversations/conv_001/messages — 200 (15 messages, cached: true, 2ms)
[2026-02-19T09:32:05Z] GET /api/conversations/conv_999/messages — 404 (0ms)
[2026-02-19T09:33:00Z] POST /api/conversations/conv_001/messages — 201 (cache invalidated, 5ms)
```

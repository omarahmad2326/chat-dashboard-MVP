# Setup Guide

## Installation

```bash
cd code
npm install
npm run dev
```

Visit http://localhost:3000

## Features to Try

- Search conversations by name or content
- Sort by recent, revenue, or unread
- Click conversations to view messages
- Send messages using the reply box
- Add/remove tags by clicking "+ Tag"
- Use arrow keys to navigate (↑/↓)
- Press Esc to deselect

## API Testing

```bash
# Get conversations
curl http://localhost:3000/api/conversations

# Search
curl "http://localhost:3000/api/conversations?search=marcus"

# Send message
curl -X POST http://localhost:3000/api/conversations/conv_001/messages \
  -H "Content-Type: application/json" \
  -d '{"body":"Test","from":"creator"}'
```

## Troubleshooting

- Ensure you're in the `code` directory
- Check Node.js version: `node --version` (need 18+)
- If port 3000 is busy: `PORT=3001 npm run dev`

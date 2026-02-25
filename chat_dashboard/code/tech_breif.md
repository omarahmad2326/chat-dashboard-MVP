# Senior Fullstack Engineer Challenge — Creator Chat Dashboard (2-Hour Sprint)

## 🔍 Scenario

You're joining the Rize team as a contractor. The team is building a **Chatter CRM** — a dashboard that helps creators and their agencies manage fan conversations, which are the primary revenue driver on the platform. You'll ship a constrained vertical slice that proves you can reason across the API layer, data normalisation, and UI within a tight two-hour window.

---

## 🎯 Core Objectives

1. **API Middleware Layer**
   Build a backend that ingests messy raw data, normalises it, and serves clean endpoints your frontend consumes. Your frontend should never touch the raw data directly.

2. **Product-Quality Frontend**
   Ship a conversation list + detail view that feels like a real product, not a code exercise.

3. **Engineering Hygiene**
   Demonstrate consistent error envelopes, structured logging, caching, and typed code across the stack.

4. **LLM Usage Disclosure**
   Use of LLMs (ChatGPT, Copilot, Claude, Cursor) is **allowed and encouraged**, but **all prompts must be included** as an appendix. Clearly indicate AI-assisted code. You'll be asked about it in the follow-up.

---

## 🛠️ Requirements

### Stack

- **Frontend:** React + TypeScript (Next.js or Vite)
- **Backend:** Node.js + TypeScript (Next.js API routes or Express)
- Any component library, CSS framework, or utility library is fine

### 1. API Layer (Node.js/TypeScript)

The provided `raw-mock-data.json` is **deliberately messy** — inconsistent field casing, mixed timestamp formats, nullable fields, and messages split across two storage patterns. Your API must normalise this.

**Required endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/conversations` | Normalised conversation list with fan metadata, last message preview, unread count. Support `?status=` filter |
| `GET` | `/api/conversations/:id/messages` | Full message thread, normalised and sorted chronologically |

**Expectations:**
- Consistent JSON response envelopes (success and error shapes). Proper HTTP status codes — not everything is 200.
- Structured console logging per request (method, path, status, duration).
- Basic in-memory caching (`Map`, `node-cache`, or similar). Cache list and threads separately.
- Describe (in README) how you'd secure/authenticate routes and evolve toward real Fanvue OAuth.

### 2. Frontend (React + TypeScript)

- **Conversation List** — Scrollable sidebar: fan name + avatar (fallback to initials), last message preview (~80 chars), relative timestamp, unread badge, active selection state. Sorted by most recent.
- **Conversation Detail** — Chat-style layout: creator messages right-aligned, fan messages left-aligned. Timestamps per message. Auto-scroll to most recent. Media indicators for attachments (e.g., "📎 1 attachment", tip/PPV badge). Empty state when nothing is selected.
- **State & UX** — React Query (or equivalent) for fetching. Handle loading, error, and empty states for all views.

### 3. If Time Allows (Pick 2–3)

- `POST /api/conversations/:id/messages` — Quick reply with cache invalidation
- `PATCH /api/conversations/:id` — Fan tagging (add/remove tags)
- Revenue sorting & filtering on conversation list
- Server-side search across conversations
- Responsive layout (desktop → tablet → mobile)
- Schema file or API documentation (OpenAPI spec, TypeScript types, or markdown)
- Mock auth token handling (Bearer token pattern, 401 on missing/invalid)

### 4. Bonus

- Keyboard shortcuts (↑/↓ to navigate conversations, Enter to open, Esc to deselect)
- Optimistic UI updates on reply/tag mutations

---

## 📦 Data Source — Your Choice

1. **Provided `raw-mock-data.json` (recommended)** — Messy JSON requiring normalisation. Fastest path.
2. **Live Fanvue API** — We'll provide test account credentials. Your API acts as a proxy/transformation layer. Docs: `https://api.fanvue.com/docs` · Starter: `https://github.com/fanvue/fanvue-app-starter`. Your frontend must still consume your own endpoints, not the Fanvue API directly.

Either path is equally valid.

---

## ✅ Deliverables

1. **Source code** — GitHub repo or ZIP (monorepo with API + frontend).
2. **README** containing:
   - Setup instructions (`npm install && npm run dev` or equivalent)
   - API design decisions (normalisation strategy, caching, error handling)
   - Known shortcuts/limitations + what you'd do with more time
   - How you'd evolve mock auth to real Fanvue OAuth
   - AI usage disclosure (tools used, prompts, which code was AI-assisted)
   - **Do not AI-generate the README.** We want your actual thought process.
3. **Working local dev server** — Full stack runs without errors.

---

## ⏰ Time Guidance

Expect ~2 focused hours. You **will not** finish everything — that's by design.

- Ship an end-to-end working solution (API → Frontend) first, then layer on depth.
- Document **why** you chose to prioritise or deprioritise specific requirements.
- Favour pragmatic solutions over theoretical completeness.
- A working core with documented trade-offs beats a half-finished attempt at everything.

---

Good luck — we're excited to see how you approach building tools for creators at scale.

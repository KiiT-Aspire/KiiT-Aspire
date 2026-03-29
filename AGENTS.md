# AGENTS.md — KiiT-Aspire (EchoGrade)

> AI-powered autonomous interview platform for faculty and students, built with Next.js 15, Cloudflare RealtimeKit, and Google Gemini AI.

---

## Project Overview

**KiiT-Aspire** (branded **EchoGrade**) is a full-stack interview management platform where faculty create interviews with AI-generated questions, students answer them via audio recording with live video proctoring, and answers are evaluated in real-time by Google Gemini AI.

### Core Flow

1. **Faculty** creates an interview → adds questions (manual or AI-generated) → shares link
2. **Student** opens the link → enters name/email → starts the interview session
3. Student records audio answers via push-to-talk → audio is sent to Google Gemini for real-time evaluation
4. Gemini evaluates each answer, decides whether to ask a follow-up or move to the next question
5. Student's camera feed streams via Cloudflare RealtimeKit → faculty can monitor all students live (view-only)
6. On completion, student sees their score; faculty sees all results with detailed breakdowns

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.4 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS v4, tw-animate-css, Framer Motion |
| UI Primitives | Radix UI (Dialog, Select, Label, Slot) |
| Auth | better-auth (email/password, Drizzle adapter) |
| Database | PostgreSQL (Supabase Pooler, port 6543) |
| ORM | Drizzle ORM with `postgres` driver (`prepare: false` for PgBouncer) |
| AI | Google Gemini (`@google/genai`) for question generation + answer evaluation |
| Video | Cloudflare RealtimeKit (`@cloudflare/realtimekit` + `@cloudflare/realtimekit-react`) |
| Audio Storage | Vercel Blob (`@vercel/blob`) |
| Icons | Lucide React, React Icons |
| Toasts | react-hot-toast |

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (Outfit font, dark mode, "EchoGrade" metadata)
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind v4 theme variables
│   │
│   ├── (dashboard)/            # Faculty route group
│   │   ├── layout.tsx          # Fixed sidebar + content area ("KIITAspire | Faculty Dashboard")
│   │   ├── interview/
│   │   │   ├── page.tsx        # Interview CRUD, AI question generation, link sharing
│   │   │   └── [id]/
│   │   │       └── results/
│   │   │           ├── page.tsx          # Candidate list with scores + live monitoring
│   │   │           └── [responseId]/
│   │   │               └── page.tsx      # Individual response detail view
│   │   ├── analytics/page.tsx  # Analytics dashboard
│   │   └── settings/page.tsx   # Settings page
│   │
│   ├── (students)/             # Student route group (no sidebar)
│   │   ├── layout.tsx          # Minimal layout for students
│   │   └── interviewee/
│   │       └── [...id]/
│   │           └── page.tsx    # Full interview UI (registration → questions → recording → results)
│   │
│   └── api/
│       ├── interviews/
│       │   ├── route.ts                    # GET (list) / POST (create) interviews
│       │   ├── ai-questions/route.ts       # POST: Gemini generates questions from subject
│       │   └── [id]/
│       │       ├── route.ts                # GET / PUT single interview
│       │       ├── start/route.ts          # POST: start interview session → returns responseId
│       │       └── responses/
│       │           ├── route.ts            # GET: list responses with pagination + stats
│       │           └── [responseId]/
│       │               ├── route.ts        # GET: detailed response with answers
│       │               ├── answer/route.ts # POST: submit audio → Gemini evaluates → next question logic
│       │               └── complete/route.ts # POST: finalize interview with score
│       ├── audio-upload/route.ts           # POST: upload audio → Vercel Blob + Gemini processing
│       ├── cloudflarerealtime/token/route.ts # POST: get RealtimeKit session token
│       └── ephemeral-token/route.ts        # POST: alternative token endpoint
│
├── components/
│   ├── sidebar.tsx             # Collapsible faculty sidebar (Overview, Interviews, Analytics)
│   ├── video/
│   │   └── VideoRTCWidget.tsx  # Cloudflare RealtimeKit video — student self-view + teacher grid
│   └── ui/                     # Radix-based UI primitives
│       ├── badge.tsx, button.tsx, card.tsx, dialog.tsx
│       ├── input.tsx, label.tsx, select.tsx, textarea.tsx
│
├── db/
│   ├── drizzle.ts              # DB connection (postgres driver, prepare: false)
│   └── schema.ts               # Full schema: user, session, account, verification,
│                                #   interviews, interview_questions, interview_responses, question_answers
├── lib/
│   ├── auth.ts                 # better-auth server config (email/password, Drizzle adapter)
│   ├── auth-client.ts          # better-auth React client
│   └── utils.ts                # cn() — clsx + tailwind-merge
│
└── server/
    └── user.ts                 # signIn, signUp, signOut server wrappers
```

---

## Database Schema (Drizzle ORM)

### Auth Tables (managed by better-auth)
- **user** — `id`, `name`, `email` (unique), `role` (default `"user"`), `org` (default `"vyomchara"`), `emailVerified`, `image`, timestamps
- **session** — `id`, `token` (unique), `expiresAt`, `userId` (FK → user, CASCADE), `ipAddress`, `userAgent`
- **account** — `id`, `accountId`, `providerId`, `userId` (FK), tokens, timestamps
- **verification** — `id`, `identifier`, `value`, `expiresAt`

### Interview Tables
- **interviews** — `id` (UUID), `createdBy` (text), `name`, `subject`, `timeLimit` (default 30), `isActive` (default true), timestamps
- **interview_questions** — `id` (UUID), `interviewId` (FK, CASCADE), `text`, `subject`, `order`, `createdAt`
- **interview_responses** — `id` (UUID), `interviewId` (FK, CASCADE), `studentId` (FK → user, SET NULL), `studentName`, `studentEmail`, `startedAt`, `completedAt`, `score`, `evaluation`, `status` (in_progress | completed | abandoned)
- **question_answers** — `id` (UUID), `responseId` (FK, CASCADE), `questionText`, `audioUrl`, `audioTranscript`, `audioDuration` (seconds), `answeredAt`, `questionOrder`

All tables have Drizzle relations defined with proper cascading deletes.

---

## API Patterns

All API routes follow this response format:
```ts
// Success
{ success: true, data: {...}, status?: number }

// Error
{ success: false, error: "message", status?: number }

// List endpoints include pagination
{ success: true, data: [...], pagination: { page, limit, total, totalPages }, statistics?: {...} }
```

### Interview Answer Flow (key logic)
The `POST /api/interviews/[id]/responses/[responseId]/answer` endpoint implements adaptive questioning:
- Tracks `currentQuestionIndex` and `isRetryAttempt`
- If answer is **poor** and NOT a retry → generates a guided follow-up question (retry)
- If answer is **poor** and IS a retry → moves to next question
- If answer is **good** → moves to next question
- All teacher-defined questions must be covered before final evaluation

---

## Cloudflare RealtimeKit Integration

### Architecture
- **Students** join a RealtimeKit room and publish their camera video track
- **Faculty** joins the same room in view-only mode (no camera, only subscribes to remote tracks)
- Room is identified by the `responseId` (interview session ID)
- Token is obtained from `POST /api/cloudflarerealtime/token` with `{ meetingId, participantName }`

### Component: `VideoRTCWidget.tsx`
- Uses `@cloudflare/realtimekit-react` hooks (`useRealtimeKitClient`, `useRealtimeKitSelector`, `RealtimeKitProvider`)
- **Student mode**: Shows `LocalVideoFeed` — small self-view overlay (top-right, 200px wide, mirrored)
- **Teacher mode**: Shows `RemoteVideoTile` grid — all student camera feeds in a responsive grid layout, view-only (no camera publishing)
- Must be loaded with `dynamic(() => import(...), { ssr: false })` to avoid SSR crashes with WebRTC APIs

### SSR Safety
Cloudflare RealtimeKit packages are in `serverExternalPackages` in `next.config.ts` and all video components use `dynamic` import with `ssr: false`.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase Pooler, port 6543) |
| `GOOGLE_GENAI_API_KEY` | Google Gemini API key for question generation + answer evaluation |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token for audio uploads |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID for RealtimeKit |
| `CLOUDFLARE_APP_ID` | Cloudflare RealtimeKit app ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (prefixed `cfat_`) |
| `BETTER_AUTH_URL` | Base URL for better-auth redirects |

---

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (DB GUI)
```

---

## Key Conventions

- **Path alias**: `@/` maps to `./src/`
- **Dark mode**: Always enabled (`html.className = "dark"`)
- **Font**: Outfit (Google Fonts, weights 300–900)
- **UI pattern**: Radix UI primitives + Tailwind + Framer Motion animations
- **Auth roles**: `user.role` field — currently `"user"` (default); faculty/student distinction is by route group
- **Route groups**: `(dashboard)` = faculty views with sidebar; `(students)` = student views without sidebar
- **Build config**: TypeScript errors and ESLint warnings are ignored during builds (`ignoreBuildErrors: true`, `ignoreDuringBuilds: true`)
- **Database**: Uses PgBouncer-compatible settings (`prepare: false`); Supabase Pooler on port 6543
- **Dynamic imports**: All browser-only components (RealtimeKit, MediaRecorder) use `dynamic(() => import(...), { ssr: false })`
- **Toast notifications**: `react-hot-toast` used throughout for user feedback
- **Animation**: Framer Motion `fadeUp` and `stagger` variants used consistently across pages

---

## Common Pitfalls

1. **Cloudflare RealtimeKit SSR**: Never import RealtimeKit components at the top level — always use `dynamic` with `ssr: false`
2. **Database `prepare: false`**: Required for Supabase Pooler / PgBouncer — without this, queries fail silently
3. **Audio formats**: The `audio-upload` route accepts specific MIME types: `wav`, `webm`, `webm;codecs=opus`, `mp4`, `mp4;codecs=mp4a.40.2`, `ogg;codecs=opus`, `mp3`
4. **UUID primary keys**: All interview tables use `uuid().defaultRandom()` — don't pass IDs manually on insert
5. **Cascading deletes**: Deleting an interview cascades to questions, responses, and answers — be careful with DELETE operations
6. **RealtimeKit token flow**: Token must be fetched from the API route (which calls Cloudflare's REST API) before connecting to a room — the client never calls Cloudflare directly

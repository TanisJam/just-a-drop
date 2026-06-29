# just-a-drop

> Ephemeral audio message drops — record a voice note, share a short link, it vanishes after one listen.

## What it does

1. **Record** — tap the button in your browser, speak, tap again.
2. **Upload** — the audio is chunked and streamed to Cloudflare R2 via presigned multipart upload.
3. **Share** — you get a short link (`/a/<id>`). Send it to anyone.
4. **Listen once** — the recipient presses play; the audio streams chunk-by-chunk directly from R2. After playback the drop is marked consumed and scheduled for deletion.
5. **Auto-expire** — a Vercel cron runs hourly to delete expired and consumed drops from both R2 and Redis.

## Key features

- Browser-native `MediaRecorder` — no native app, no install.
- Chunked streaming upload via the Chunks API — no large single-file POST.
- One-listen enforcement tracked in Upstash Redis with a 24-hour TTL.
- Session token model for chunk streaming — playback cannot begin without a signed session from the server.
- Automatic cleanup: Redis TTL expiry + hourly cron scrubs orphaned R2 objects.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Storage | Cloudflare R2 (S3-compatible, via `@aws-sdk/client-s3`) |
| State / TTL | Upstash Redis (`@upstash/redis`) |
| Hosting | Vercel (serverless functions + cron) |
| ID generation | `nanoid` |
| Validation | `zod` |

## Architecture notes

- **Chunked upload**: `lib/chunker.ts` slices the recorded `Blob` into fixed-duration segments (`NEXT_PUBLIC_CHUNK_DURATION_MS`, default 2 500 ms). Each chunk is POSTed to `/api/audio/[id]/chunks` and written to R2 under the key `<id>/<n>`. The server enforces an upload token (`INTERNAL_CLEANUP_SECRET` scope) so only the recording client can upload.
- **Redis record**: `/api/audio` creates a Redis hash at `audio:<id>` tracking `status`, `chunk_count`, `chunks_uploaded`, and `expires_at`. A parallel set `cleanup:prefix-index` holds all live audio IDs so the cron can sweep them without a Redis SCAN.
- **Playback session**: `POST /api/audio/[id]/play` transitions status to `consumed`, issues a short-lived session token, and schedules deletion with `waitUntil`. Chunks are streamed back via `/api/audio/[id]/chunk/[n]` — each request validates the session token.
- **Cron cleanup**: `vercel.json` schedules `POST /api/cron/cleanup` every hour (authorized via `CRON_SECRET`). It iterates `cleanup:prefix-index`, removes consumed or TTL-expired drops, and deletes the corresponding R2 objects.

## Getting started

### Prerequisites

- Node.js 20+
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket with an API token
- An [Upstash Redis](https://upstash.com/) database (REST API)

### Install

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

See `.env.example` for descriptions of every variable.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Deploy

This project is designed for Vercel.

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. Add all environment variables from `.env.example` in the Vercel project settings.
3. Deploy — the `vercel.json` cron is picked up automatically.

> The cron endpoint (`/api/cron/cleanup`) requires Vercel's cron feature, available on the Hobby plan and above.

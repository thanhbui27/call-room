# Private Line

Private Line is a production-ready private 1-on-1 video calling application. One person opens a cryptographically unguessable room, shares the invitation URL with one friend, and both people can use live camera, microphone, screen sharing, ephemeral chat, emoji reactions, and in-call device switching.

The interface uses a custom retro desktop/webcam visual system with hard borders, tactile controls, terminal typography, status lights, CRT scanlines, responsive call controls, a desktop chat drawer, and a mobile full-screen chat view.

## Architecture

```text
Browser A/B ── WebRTC + realtime data ── LiveKit Cloud / LiveKit Server
     │
     └── HTTPS ── Next.js on Vercel
                   ├── POST /api/rooms
                   ├── GET  /api/rooms?roomId=...
                   └── POST /api/livekit-token
```

- Next.js creates rooms, validates invitation URLs, checks current occupancy, and signs short-lived participant tokens.
- LiveKit carries camera, microphone, screen-share video/audio, participant state, chat packets, and reaction packets.
- Video/audio never passes through Next.js or Vercel.
- Chat and reactions are session-only. No database is required for V1.
- `LIVEKIT_API_SECRET` is imported only from `server-only` code and is never included in the browser bundle.

### Two-person enforcement

The participant limit is enforced twice:

1. Every room is created by the server with `maxParticipants: 2`.
2. The token route checks the server-side LiveKit participant list and refuses to issue a token when two people are already present.

The LiveKit room limit is authoritative and protects against concurrent token-request races; a third connection cannot enter the media room even if requests overlap.

The token endpoint stores a random participant identity in an HTTP-only, same-site cookie. A browser refresh can reclaim the same seat instead of being mistaken for a third participant; another browser still cannot bypass the capacity check.

## Tech stack

- Next.js 16 App Router
- React 19 and strict TypeScript
- Tailwind CSS 4 plus a reusable custom token/style layer
- `livekit-client`
- `@livekit/components-react`
- `livekit-server-sdk`
- Lucide React icons
- pnpm
- Vercel-compatible Node.js route handlers

## Local setup

Requirements:

- Node.js 20.9 or newer (Node 24 is supported)
- pnpm 11
- A LiveKit Cloud project or a reachable self-hosted LiveKit server

Install dependencies:

```bash
pnpm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill in `.env.local`:

```dotenv
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

Never prefix the API key or secret with `NEXT_PUBLIC_`. Never commit `.env.local`.

## LiveKit setup

1. Create a LiveKit Cloud project, or start a self-hosted LiveKit deployment.
2. Copy its WebSocket URL into `NEXT_PUBLIC_LIVEKIT_URL` (normally `wss://...`).
3. Create/copy a project API key and secret.
4. Put the credentials in `.env.local` for development and in the Vercel project environment for deployment.

Rooms are created on demand by `POST /api/rooms`; there is no need to create them manually in the LiveKit dashboard.

## Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Production checks:

```bash
pnpm lint
pnpm build
pnpm start
```

Camera, microphone, clipboard, screen sharing, and speaker selection require a secure context. Browsers treat `localhost` as secure; a non-local deployment must use HTTPS.

## Test with two browsers/devices

1. Open the app in Browser A and enter a display name.
2. Create a private room and allow camera/microphone access.
3. Copy the invitation link from the waiting screen.
4. Open the link in Browser B, preferably on a second device or in a separate browser profile.
5. Join with a different display name.
6. Verify camera, microphone mute, camera off/on, both screen-share directions, screen-share termination from browser chrome, chat, reactions, device switching, fullscreen, and leaving.
7. Open the same link in Browser C while A and B are connected. Browser C must see the Room Full state and must not enter the LiveKit room.
8. Refresh Browser B and confirm Browser A stays connected and shows the waiting/disconnected state while B reconnects.

When testing audio on one computer, use headphones to avoid feedback.

## Responsive behavior

The interface has dedicated layout adaptations for:

- 375–390 px phones: scrollable landing/pre-join pages, compact call controls, More menu, floating local video, full-screen chat
- 768 px tablets: stacked landing/pre-join layout, full-screen chat, compact call chrome
- 1024 px laptops/tablets: compact secondary controls and fixed call stage
- 1440 px desktop: split landing/pre-join layout and side chat panel

## Browser limitations

- Screen/tab/window choices are controlled by the browser's native picker; the app cannot select a source for the user.
- System/screen-share audio availability differs by browser and operating system. The call subscribes to it when LiveKit receives it.
- Safari support for speaker/output selection is limited. The setting is hidden or explained when `setSinkId` is unavailable.
- iOS browsers can restrict camera changes, background media, fullscreen, and screen sharing according to current WebKit policy.
- Browser permission denial cannot be bypassed. The pre-join view disables unavailable media and allows a user to join with the remaining devices.
- Clipboard access may be blocked outside a secure context or by browser policy; the UI reports copy failure.

## Vercel deployment

1. Push this project to a Git provider supported by Vercel.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep Framework Preset as **Next.js** and Install Command as `pnpm install`.
4. Add these Production and Preview environment variables:
   - `NEXT_PUBLIC_LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
5. Deploy.
6. After deployment, open the HTTPS URL and run the two-browser test above.

The project needs no Vercel WebSocket server, background worker, or database. LiveKit owns the realtime connection.

## Project structure

```text
app/
  api/
    livekit-token/route.ts   # input validation, capacity check, token signing
    rooms/route.ts           # room creation and invitation validation
  room/[roomId]/page.tsx
  globals.css                # tokens, components, responsive design
  layout.tsx
  page.tsx
components/
  call/                      # call stage, tracks, controls, settings, waiting state
  chat/                      # realtime message panel and composer
  home/                      # landing/create/join experience
  reactions/                 # picker and floating animations
  room/                      # pre-join and room state orchestration
  ui/                        # retro window/button/status/toast primitives
hooks/
  useMediaDevices.ts
  useRealtime.ts
lib/
  constants.ts
  livekit-server.ts
  types.ts
  validation.ts
```

## Security notes

- Room IDs must be RFC 4122 version-4 UUIDs.
- Display names and request bodies are normalized and validated server-side.
- Tokens have a two-hour TTL and grants only for joining, publishing, subscribing, and data messages in the requested room.
- Messages are parsed as a strict data shape and rendered as React text, never injected HTML.
- Credentials are excluded by `.gitignore`, with only `.env.example` committed.
- A UUID invitation URL is a bearer invitation: share it only with the intended person.

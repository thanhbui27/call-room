import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

import { getRoomService, isLiveKitAuthError } from "@/lib/livekit-server";
import { isValidRoomId, normalizeName } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON.", code: "INVALID_REQUEST" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Missing room or participant details.", code: "INVALID_REQUEST" }, { status: 400 });
  }

  const { roomName, participantName } = body as Record<string, unknown>;
  const name = normalizeName(participantName);
  if (!isValidRoomId(roomName) || !name) {
    return NextResponse.json({ error: "The room address or display name is invalid.", code: "INVALID_REQUEST" }, { status: 400 });
  }

  try {
    const { client, config } = getRoomService();
    const rooms = await client.listRooms([roomName]);
    if (rooms.length === 0) {
      return NextResponse.json({ error: "This private room no longer exists.", code: "INVALID_ROOM" }, { status: 404 });
    }

    const participants = await client.listParticipants(roomName);
    const cookieIdentity = request.cookies.get("private-line-participant")?.value;
    const identity = isValidRoomId(cookieIdentity) ? cookieIdentity : crypto.randomUUID();
    const isReturningParticipant = participants.some((participant) => participant.identity === identity);
    if (participants.length >= 2 && !isReturningParticipant) {
      return NextResponse.json({ error: "This private room is full.", code: "ROOM_FULL" }, { status: 409 });
    }

    const accessToken = new AccessToken(config.apiKey, config.apiSecret, {
      identity,
      name,
      ttl: "2h",
      metadata: JSON.stringify({ joinedFrom: "private-line-web" }),
    });

    accessToken.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const response = NextResponse.json({ token: await accessToken.toJwt(), serverUrl: config.serverUrl });
    response.cookies.set("private-line-participant", identity, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    if (isLiveKitAuthError(error)) {
      console.error("Token API authentication failed: LiveKit rejected the configured API credentials.");
      return NextResponse.json(
        {
          error: "LiveKit rejected the server credentials. Verify that the API key and secret belong to this LiveKit project, then restart the app.",
          code: "LIVEKIT_AUTH_ERROR",
        },
        { status: 502 },
      );
    }

    console.error("Token API error", error);
    const misconfigured = error instanceof Error && error.message.includes("environment variables");
    return NextResponse.json(
      {
        error: misconfigured
          ? "The call server has not been configured yet."
          : "Could not prepare your secure connection.",
        code: misconfigured ? "CONFIGURATION_ERROR" : "SERVER_ERROR",
      },
      { status: misconfigured ? 503 : 500 },
    );
  }
}

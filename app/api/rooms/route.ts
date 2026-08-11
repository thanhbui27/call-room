import { NextRequest, NextResponse } from "next/server";

import { getRoomService, isLiveKitAuthError } from "@/lib/livekit-server";
import { isValidRoomId } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serverError(error: unknown) {
  if (isLiveKitAuthError(error)) {
    console.error("Room API authentication failed: LiveKit rejected the configured API credentials.");
    return NextResponse.json(
      {
        error: "LiveKit rejected the server credentials. Verify that the API key and secret belong to this LiveKit project, then restart the app.",
        code: "LIVEKIT_AUTH_ERROR",
      },
      { status: 502 },
    );
  }

  console.error("Room API error", error);
  const misconfigured = error instanceof Error && error.message.includes("environment variables");
  return NextResponse.json(
    {
      error: misconfigured
        ? "The call server has not been configured yet."
        : "The room service is temporarily unavailable.",
      code: misconfigured ? "CONFIGURATION_ERROR" : "SERVER_ERROR",
    },
    { status: misconfigured ? 503 : 500 },
  );
}

export async function POST() {
  try {
    const roomId = crypto.randomUUID();
    const { client } = getRoomService();

    await client.createRoom({
      name: roomId,
      maxParticipants: 2,
      emptyTimeout: 10 * 60,
      departureTimeout: 60,
      metadata: JSON.stringify({ product: "private-line", version: 1 }),
    });

    return NextResponse.json({ roomId }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!isValidRoomId(roomId)) {
    return NextResponse.json({ exists: false, error: "Invalid room address.", code: "INVALID_ROOM" }, { status: 400 });
  }

  try {
    const { client } = getRoomService();
    const rooms = await client.listRooms([roomId]);
    if (rooms.length === 0) return NextResponse.json({ exists: false, isFull: false });
    const participants = await client.listParticipants(roomId);
    const returningIdentity = request.cookies.get("private-line-participant")?.value;
    const returningParticipant = isValidRoomId(returningIdentity) && participants.some((participant) => participant.identity === returningIdentity);
    return NextResponse.json({ exists: true, isFull: participants.length >= 2 && !returningParticipant });
  } catch (error) {
    return serverError(error);
  }
}

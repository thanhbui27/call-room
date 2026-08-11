import "server-only";

import { RoomServiceClient } from "livekit-server-sdk";

export interface LiveKitServerConfig {
  apiKey: string;
  apiSecret: string;
  serverUrl: string;
  httpUrl: string;
}

export function getLiveKitServerConfig(): LiveKitServerConfig {
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

  if (!serverUrl || !apiKey || !apiSecret) {
    throw new Error("LiveKit environment variables are not configured.");
  }

  const httpUrl = serverUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  return { serverUrl, apiKey, apiSecret, httpUrl };
}

export function getRoomService(): { client: RoomServiceClient; config: LiveKitServerConfig } {
  const config = getLiveKitServerConfig();
  return {
    client: new RoomServiceClient(config.httpUrl, config.apiKey, config.apiSecret),
    config,
  };
}

export function isLiveKitAuthError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: unknown }).status === 401,
  );
}

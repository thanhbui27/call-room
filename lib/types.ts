export type ApiErrorCode =
  | "CONFIGURATION_ERROR"
  | "LIVEKIT_AUTH_ERROR"
  | "INVALID_REQUEST"
  | "INVALID_ROOM"
  | "ROOM_FULL"
  | "SERVER_ERROR";

export interface ApiError {
  error: string;
  code: ApiErrorCode;
}

export interface ChatMessagePayload {
  type: "chat";
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface ReactionPayload {
  type: "reaction";
  id: string;
  emoji: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export type RealtimePayload = ChatMessagePayload | ReactionPayload;

export interface TokenResponse {
  token: string;
  serverUrl: string;
}

export type PreJoinErrorKind =
  | "permission"
  | "no-camera"
  | "no-microphone"
  | "unsupported"
  | "unknown";

export interface MediaDeviceState {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
}

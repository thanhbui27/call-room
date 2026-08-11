"use client";

import { LiveKitRoom } from "@livekit/components-react";
import { useCallback, useEffect, useState } from "react";

import { CallRoom } from "@/components/call/CallRoom";
import { PreJoin } from "@/components/room/PreJoin";
import type { JoinSettings } from "@/components/room/room-types";
import { StateScreen } from "@/components/room/StateScreen";
import { ROOM_ID_PATTERN } from "@/lib/constants";
import type { ApiError, TokenResponse } from "@/lib/types";

type ScreenState = "checking" | "prejoin" | "connecting" | "call" | "full" | "invalid" | "error" | "ended";

export function RoomExperience({ roomId }: { roomId: string }) {
  const [screen, setScreen] = useState<ScreenState>("checking");
  const [initialName, setInitialName] = useState("");
  const [joinSettings, setJoinSettings] = useState<JoinSettings | null>(null);
  const [connection, setConnection] = useState<TokenResponse | null>(null);
  const [error, setError] = useState("");

  const validateRoom = useCallback(async () => {
    if (!ROOM_ID_PATTERN.test(roomId)) {
      setScreen("invalid");
      return;
    }
    setScreen("checking");
    setError("");
    try {
      const response = await fetch(`/api/rooms?roomId=${encodeURIComponent(roomId)}`, { cache: "no-store" });
      const data = (await response.json()) as { exists?: boolean; isFull?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "Could not verify this invitation.");
      if (!data.exists) {
        setScreen("invalid");
        return;
      }
      if (data.isFull) {
        setScreen("full");
        return;
      }
      setInitialName(sessionStorage.getItem("private-line-display-name") ?? "");
      setScreen("prejoin");
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Could not verify this invitation.");
      setScreen("error");
    }
  }, [roomId]);

  useEffect(() => {
    const task = window.setTimeout(() => void validateRoom(), 0);
    return () => window.clearTimeout(task);
  }, [validateRoom]);

  const join = async (settings: JoinSettings) => {
    setJoinSettings(settings);
    setScreen("connecting");
    setError("");
    try {
      const response = await fetch("/api/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: roomId, participantName: settings.name }),
      });
      const data = (await response.json()) as TokenResponse & Partial<ApiError>;
      if (!response.ok) {
        if (data.code === "ROOM_FULL") {
          setScreen("full");
          return;
        }
        if (data.code === "INVALID_ROOM") {
          setScreen("invalid");
          return;
        }
        throw new Error(data.error || "Could not connect to the private room.");
      }
      setConnection({ token: data.token, serverUrl: data.serverUrl });
      setScreen("call");
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Could not connect to the private room.");
      setScreen("prejoin");
    }
  };

  if (screen === "checking") return <StateScreen kind="checking" />;
  if (screen === "invalid") return <StateScreen kind="invalid" />;
  if (screen === "full") return <StateScreen kind="full" />;
  if (screen === "error") return <StateScreen kind="error" detail={error} onRetry={validateRoom} />;
  if (screen === "ended") return <StateScreen kind="ended" />;

  if ((screen === "prejoin" || screen === "connecting") && !connection) {
    return <PreJoin initialName={initialName} joining={screen === "connecting"} error={error} onJoin={join} />;
  }

  if (!connection || !joinSettings) return <StateScreen kind="error" />;

  return (
    <LiveKitRoom
      token={connection.token}
      serverUrl={connection.serverUrl}
      connect
      audio={joinSettings.microphoneEnabled}
      video={joinSettings.cameraEnabled}
      options={{
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: joinSettings.microphoneId ? { deviceId: joinSettings.microphoneId } : undefined,
        videoCaptureDefaults: joinSettings.cameraId ? { deviceId: joinSettings.cameraId } : undefined,
      }}
      onError={(liveKitError) => {
        const message = liveKitError.message.toLowerCase();
        if (message.includes("max participants") || message.includes("room is full")) setScreen("full");
        else {
          setError(liveKitError.message);
          setScreen("error");
        }
      }}
      onDisconnected={() => {
        if (screen === "call") setScreen("ended");
      }}
    >
      <CallRoom roomId={roomId} preferredSpeakerId={joinSettings.speakerId} onLeave={() => setScreen("ended")} />
    </LiveKitRoom>
  );
}

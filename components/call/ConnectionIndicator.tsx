"use client";

import { useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";

const LABELS: Record<ConnectionState, string> = {
  [ConnectionState.Connected]: "CONNECTED",
  [ConnectionState.Connecting]: "CONNECTING",
  [ConnectionState.Reconnecting]: "RECONNECTING...",
  [ConnectionState.SignalReconnecting]: "RECONNECTING...",
  [ConnectionState.Disconnected]: "DISCONNECTED",
};

export function ConnectionIndicator() {
  const connection = useConnectionState();
  const tone = connection === ConnectionState.Connected ? "green" : connection === ConnectionState.Disconnected ? "red" : "amber";
  return <span className={`call-connection call-connection--${tone}`}><i />{LABELS[connection]}</span>;
}
